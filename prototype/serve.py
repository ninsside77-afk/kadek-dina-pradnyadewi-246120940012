"""Server lokal Sistem Peminjaman Ruangan IDB Bali.

Server ini melayani berkas statis dan API lokal untuk autentikasi, data
pengajuan, keputusan petugas, serta surat PDF. Data disimpan di luar folder
yang dilayani agar tidak dapat diunduh sebagai berkas statis.

Jalankan dari folder prototype:
    python serve.py
"""

from __future__ import annotations

import hashlib
import hmac
import http.cookies
import http.server
import json
import os
import re
import secrets
import shutil
import socketserver
import tempfile
import threading
import time
import urllib.parse
from datetime import date, datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")
ACCOUNTS_FILE = os.path.join(DATA_DIR, "accounts.json")
BOOKINGS_FILE = os.path.join(DATA_DIR, "bookings.json")

HOST = "127.0.0.1"
PORT = 8080
SESSION_COOKIE = "idb_session"
SESSION_TTL = 8 * 3600
MAX_BODY = 16 * 1024
MAX_FAILED_ATTEMPTS = 5
FAILED_WINDOW = 10 * 60
MAX_IP_ATTEMPTS = 20

ROOMS = {
    "studio-pola": ("Studio Pola", "Gedung A"),
    "lecture-1a": ("Lecture 1A", "Gedung A"),
    "lab-1c": ("Lab 1C", "Gedung A"),
    "studio-foto": ("Studio Fotografi & Videografi", "Gedung A"),
    "lab-2b": ("Lab 2B", "Gedung A"),
    "lab-2c": ("Lab 2C", "Gedung A"),
    "lecture-2d": ("Lecture 2D", "Gedung A"),
    "uks": ("UKS", "Gedung A"),
    "aula": ("Aula", "Gedung A"),
    "lab-imac": ("Lab iMac", "Gedung B / Rektorat"),
    "ruang-inbis": ("Ruang Inbis", "Gedung B / Rektorat"),
    "studio-3": ("Studio 3", "Gedung B / Rektorat"),
    "lab-fashion": ("Lab Fashion", "Gedung B / Rektorat"),
    "inter-1": ("Inter 1", "Gedung B / Rektorat"),
    "ruang-magister": ("Ruang Magister", "Gedung B / Rektorat"),
    "perpustakaan": ("Perpustakaan", "Gedung B / Rektorat"),
    "ruang-asistensi": ("Ruang Asistensi", "Gedung B / Rektorat"),
    "lab-1a-c": ("Lab 1A", "Gedung C / NMC"),
    "lab-sti": ("Lab STI", "Gedung C / NMC"),
    "ruang-1b": ("1B", "Gedung C / NMC"),
    "lecture-2a": ("Lecture 2A", "Gedung C / NMC"),
    "lecture-2b": ("Lecture 2B", "Gedung C / NMC"),
    "studio-2c": ("Studio 2C", "Gedung C / NMC"),
    "studio-3a": ("Studio 3A", "Gedung C / NMC"),
    "studio-3b": ("Studio 3B", "Gedung C / NMC"),
    "studio-3c": ("Studio 3C", "Gedung C / NMC"),
    "rooftop": ("Rooftop", "Area tambahan"),
    "halaman": ("Halaman gedung", "Area tambahan"),
    "gsg": ("Gedung serba guna", "Area tambahan"),
}
ROOM_NAMES = {key: value[0] for key, value in ROOMS.items()}

OWNER_BY_NAME = {
    "Raka Wijaya": "peminjam01",
    "Nadia Sari": "peminjam02",
    "Fajar Nugraha": "peminjam03",
}

SEED_ID_MIN = 31
SEED_ID_MAX = 49

ADMIN_PAGES = {"/petugas.html", "/petugas-detail.html", "/petugas-riwayat.html"}
BORROWER_PAGES = {"/ajukan.html"}
AUTH_PAGES = {"/pengajuan-saya.html", "/pengajuan-detail.html"}

DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
MONTH_NAMES = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
]


class ApiError(Exception):
    def __init__(self, status, code, message, details=None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = details or {}

    def payload(self):
        data = {"ok": False, "code": self.code, "message": self.message}
        data.update(self.details)
        return data


def now_iso():
    return datetime.now().replace(microsecond=0).isoformat()


def to_date(value):
    return datetime.strptime(str(value), "%Y-%m-%d").date()


def seed_base_date():
    # Data contoh tidak pernah diletakkan pada hari Minggu (AT-01).
    current = date.today()
    if current.weekday() == 6:
        current += timedelta(days=1)
    return current


def next_workday(offset, base=None):
    current = base or seed_base_date()
    added = 0
    while added < offset:
        current += timedelta(days=1)
        if current.weekday() != 6:
            added += 1
    return current


def past_workday(days_ago, base=None):
    current = base or seed_base_date()
    added = 0
    while added < days_ago:
        current -= timedelta(days=1)
        if current.weekday() != 6:
            added += 1
    return current


def stamp(days_ago, hour, minute):
    value = datetime.now() - timedelta(days=days_ago)
    return value.replace(hour=hour, minute=minute, second=0, microsecond=0).isoformat()


def minutes(value):
    parts = re.split(r"[.:]", str(value))
    return int(parts[0]) * 60 + int(parts[1] or 0)


def fmt_long_date(value):
    parsed = to_date(value)
    return "%s, %d %s %d" % (
        DAY_NAMES[parsed.weekday()],
        parsed.day,
        MONTH_NAMES[parsed.month - 1],
        parsed.year,
    )


def fmt_time_range(start, end):
    return "%s-%s WITA" % (start, end)


def seed_records():
    base = seed_base_date()
    today = base.isoformat()
    d1 = next_workday(1, base).isoformat()
    d2 = next_workday(2, base).isoformat()

    raw = [
        # Hari ini
        {
            "ormawa": "UKM Fotografi", "nama": "Ayu Pramesti", "hp": "0812 0000 0011",
            "purpose": "Dokumentasi kegiatan UKM Fotografi", "peserta": 40, "alat": ["Proyektor", "Mikrofon"],
            "roomId": "aula", "date": today, "start": "08.00", "end": "11.00", "status": "approved",
            "createdAgo": 6, "decidedAgo": 5,
        },
        {
            "ormawa": "HIMA DKV", "nama": "Raka Wijaya", "hp": "0812 0000 0012",
            "purpose": "Rapat kerja pengurus HIMA DKV", "peserta": 40, "alat": ["Proyektor", "Mikrofon"],
            "roomId": "aula", "date": today, "start": "13.00", "end": "15.00", "status": "pending",
            "createdAgo": 1,
        },
        {
            "ormawa": "Prodi Arsitektur", "nama": "Nadia Sari", "hp": "0812 0000 0013",
            "purpose": "Review desain studio", "peserta": 25, "alat": ["Proyektor"],
            "roomId": "studio-pola", "date": today, "start": "14.00", "end": "16.00", "status": "approved",
            "createdAgo": 7, "decidedAgo": 6,
        },
        {
            "ormawa": "Kelas Inter 1", "nama": "Bagus Mahendra", "hp": "0812 0000 0014",
            "purpose": "Kelas tambahan Inter 1", "peserta": 30, "alat": [],
            "roomId": "lab-1c", "date": today, "start": "10.00", "end": "12.00", "status": "pending",
            "createdAgo": 2,
        },
        {
            "ormawa": "BEM", "nama": "Citra Lestari", "hp": "0812 0000 0015",
            "purpose": "Rapat koordinasi BEM", "peserta": 20, "alat": ["Mikrofon"],
            "roomId": "lecture-1a", "date": today, "start": "09.00", "end": "10.00", "status": "approved",
            "createdAgo": 5, "decidedAgo": 4,
        },
        {
            "ormawa": "Lab iMac", "nama": "Dimas Saputra", "hp": "0812 0000 0016",
            "purpose": "Praktikum Lab iMac", "peserta": 24, "alat": [],
            "roomId": "lab-imac", "date": today, "start": "08.00", "end": "09.00", "status": "approved",
            "createdAgo": 8, "decidedAgo": 7,
        },
        {
            "ormawa": "Komunitas Baca", "nama": "Intan Permata", "hp": "0812 0000 0017",
            "purpose": "Diskusi Komunitas Baca", "peserta": 15, "alat": [],
            "roomId": "perpustakaan", "date": today, "start": "12.00", "end": "14.00", "status": "pending",
            "createdAgo": 3,
        },
        {
            "ormawa": "Ruang Inbis", "nama": "Yoga Pratama", "hp": "0812 0000 0018",
            "purpose": "Kegiatan Ruang Inbis", "peserta": 12, "alat": [],
            "roomId": "studio-3", "date": today, "start": "15.00", "end": "17.00", "status": "approved",
            "createdAgo": 4, "decidedAgo": 3,
        },
        {
            "ormawa": "Prodi DKV", "nama": "Sinta Maharani", "hp": "0812 0000 0019",
            "purpose": "Kuliah tamu Prodi DKV", "peserta": 60, "alat": ["Proyektor", "Mikrofon"],
            "roomId": "lab-1a-c", "date": today, "start": "13.00", "end": "16.00", "status": "approved",
            "createdAgo": 9, "decidedAgo": 8,
        },
        {
            "ormawa": "Prodi Manajemen", "nama": "Fajar Nugraha", "hp": "0812 0000 0020",
            "purpose": "Seminar Prodi Manajemen", "peserta": 60, "alat": ["Proyektor"],
            "roomId": "lecture-2a", "date": today, "start": "09.00", "end": "11.00", "status": "pending",
            "createdAgo": 1,
        },
        # Hari kerja berikutnya
        {
            "ormawa": "Prodi DKV", "nama": "Sinta Maharani", "hp": "0812 0000 0019",
            "purpose": "Praktikum Prodi DKV", "peserta": 30, "alat": [],
            "roomId": "lab-2c", "date": d1, "start": "08.00", "end": "10.00", "status": "approved",
            "createdAgo": 8, "decidedAgo": 7,
        },
        {
            "ormawa": "UKM Seni", "nama": "Bagas Wirawan", "hp": "0812 0000 0021",
            "purpose": "Latihan UKM Seni", "peserta": 20, "alat": ["Mikrofon"],
            "roomId": "lab-2c", "date": d1, "start": "09.00", "end": "11.00", "status": "pending",
            "createdAgo": 2,
        },
        {
            "ormawa": "BEM", "nama": "Citra Lestari", "hp": "0812 0000 0015",
            "purpose": "Rapat kerja BEM", "peserta": 80, "alat": ["Proyektor", "Mikrofon"],
            "roomId": "aula", "date": d1, "start": "10.00", "end": "12.00", "status": "pending",
            "createdAgo": 2,
        },
        {
            "ormawa": "Prodi Desain Interior", "nama": "Maya Anggraini", "hp": "0812 0000 0022",
            "purpose": "Kuliah Prodi Desain Interior", "peserta": 35, "alat": [],
            "roomId": "studio-3b", "date": d1, "start": "13.00", "end": "15.00", "status": "approved",
            "createdAgo": 6, "decidedAgo": 5,
        },
        # Dua hari kerja berikutnya
        {
            "ormawa": "Rektorat", "nama": "Made Surya", "hp": "0812 0000 0023",
            "purpose": "Rapat Rektorat", "peserta": 45, "alat": ["Proyektor", "Mikrofon"],
            "roomId": "aula", "date": d2, "start": "09.00", "end": "12.00", "status": "approved",
            "createdAgo": 10, "decidedAgo": 9,
        },
        {
            "ormawa": "Prodi Fashion", "nama": "Kadek Ayu", "hp": "0812 0000 0024",
            "purpose": "Praktikum Prodi Fashion", "peserta": 28, "alat": [],
            "roomId": "lab-fashion", "date": d2, "start": "10.00", "end": "13.00", "status": "approved",
            "createdAgo": 8, "decidedAgo": 7,
        },
        {
            "ormawa": "Prodi Desain Interior", "nama": "Maya Anggraini", "hp": "0812 0000 0022",
            "purpose": "Asistensi Prodi Desain Interior", "peserta": 18, "alat": [],
            "roomId": "inter-1", "date": d2, "start": "14.00", "end": "16.00", "status": "pending",
            "createdAgo": 1,
        },
        # Riwayat keputusan
        {
            "ormawa": "Prodi Manajemen", "nama": "Fajar Nugraha", "hp": "0812 0000 0020",
            "purpose": "Seminar Prodi Manajemen", "peserta": 35, "alat": ["Proyektor"],
            "roomId": "studio-3a", "date": past_workday(7, base).isoformat(), "start": "09.00", "end": "11.00",
            "status": "rejected", "createdAgo": 10, "decidedAgo": 9,
            "reason": "Ruangan sudah digunakan untuk kegiatan akademik pada waktu tersebut.",
        },
        {
            "ormawa": "BEM", "nama": "Citra Lestari", "hp": "0812 0000 0015",
            "purpose": "Rapat BEM", "peserta": 50, "alat": ["Mikrofon"],
            "roomId": "lecture-2b", "date": past_workday(10, base).isoformat(), "start": "13.00", "end": "15.00",
            "status": "approved", "createdAgo": 13, "decidedAgo": 12,
        },
    ]

    items = []
    for source in raw:
        status = source["status"]
        items.append(
            {
                "ormawa": source["ormawa"],
                "nama": source["nama"],
                "hp": source["hp"],
                "purpose": source["purpose"],
                "peserta": source["peserta"],
                "alat": list(source.get("alat") or []),
                "roomId": source["roomId"],
                "roomName": ROOM_NAMES.get(source["roomId"], ""),
                "date": source["date"],
                "start": source["start"],
                "end": source["end"],
                "status": status,
                "createdAt": stamp(source["createdAgo"], 9, 15),
                "decidedAt": None if source.get("decidedAgo") is None else stamp(source["decidedAgo"], 13, 40),
                "decidedBy": None if status == "pending" else "Petugas Kemahasiswaan",
                "reason": source.get("reason", ""),
                "letter": "ready" if status == "approved" else "none",
                "ownerId": OWNER_BY_NAME.get(source["nama"]),
                "seed": True,
            }
        )

    items.sort(key=lambda item: str(item.get("createdAt", "")))
    for index, item in enumerate(items):
        item["id"] = "IDB-2026-%04d" % (31 + index)
    return items


class Store:
    def __init__(self):
        self.lock = threading.RLock()
        self.accounts = {}
        self.default_iterations = 260000
        self.bookings = []
        self.sessions = {}
        self.failed = {}
        self.ip_failed = {}
        os.makedirs(DATA_DIR, exist_ok=True)
        self.load_accounts()
        self.load_bookings()

    def load_accounts(self):
        if not os.path.exists(ACCOUNTS_FILE):
            raise SystemExit(
                "Berkas akun tidak ditemukan: %s\n"
                "Buat data/accounts.json terlebih dahulu atau gunakan berkas akun yang disertakan."
                % ACCOUNTS_FILE
            )
        with open(ACCOUNTS_FILE, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        users = data.get("users") if isinstance(data, dict) else None
        if not isinstance(users, list) or not users:
            raise SystemExit("Berkas akun tidak berisi daftar pengguna yang valid.")
        for user in users:
            user_id = str(user.get("id", "")).strip().lower()
            if not user_id or not user.get("salt") or not user.get("hash"):
                continue
            user["id"] = user_id
            user["role"] = "petugas" if user.get("role") == "petugas" else "peminjam"
            self.accounts[user_id] = user
        if not self.accounts:
            raise SystemExit("Tidak ada akun aktif di berkas akun.")
        self.default_iterations = int(data.get("iterations") or self.default_iterations)

    def load_bookings(self):
        if not os.path.exists(BOOKINGS_FILE):
            with self.lock:
                self.bookings = seed_records()
                self.save_locked()
            return
        try:
            with open(BOOKINGS_FILE, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            if not isinstance(data, list) or not data:
                raise ValueError("Daftar pengajuan kosong atau tidak valid.")
            for record in data:
                if not isinstance(record, dict) or not record.get("id"):
                    raise ValueError("Ada catatan pengajuan yang tidak valid.")
            self.bookings = data
        except Exception as error:
            backup = BOOKINGS_FILE + ".rusak-" + datetime.now().strftime("%Y%m%d-%H%M%S")
            try:
                shutil.copy2(BOOKINGS_FILE, backup)
            except OSError:
                pass
            print("Data pengajuan tidak dapat dibaca (%s). Cadangan: %s" % (error, backup))
            with self.lock:
                self.bookings = seed_records()
                self.save_locked()
                return
        with self.lock:
            try:
                self._refresh_seed_locked()
            except Exception as error:
                print("Data contoh tidak dapat diselaraskan: %s" % error)

    @staticmethod
    def _seed_number(record):
        match = re.search(r"(\d+)$", str(record.get("id", "")))
        if not match:
            return None
        number = int(match.group(1))
        return number if SEED_ID_MIN <= number <= SEED_ID_MAX else None

    @staticmethod
    def _shift_stamp(value, days):
        if not value or not days:
            return value
        try:
            parsed = datetime.fromisoformat(str(value))
            return (parsed + timedelta(days=days)).replace(microsecond=0).isoformat()
        except ValueError:
            return value

    def _refresh_seed_locked(self):
        old_seed = {
            record["id"]: record
            for record in self.bookings
            if self._seed_number(record) is not None
        }
        if not old_seed:
            return False
        dates = [record.get("date") for record in old_seed.values() if record.get("date")]
        if not dates:
            return False
        counts = {}
        for value in dates:
            counts[value] = counts.get(value, 0) + 1
        anchor = max(counts, key=counts.get)
        try:
            anchor_date = to_date(anchor)
        except ValueError:
            return False
        delta = (seed_base_date() - anchor_date).days
        if delta == 0:
            return False

        fresh = seed_records()
        fresh_by_id = {record["id"]: record for record in fresh}
        for seed_id, old in old_seed.items():
            new = fresh_by_id.get(seed_id)
            if not new:
                continue
            changed = (
                old.get("status") != new.get("status")
                or old.get("letter") != new.get("letter")
                or old.get("reason") != new.get("reason")
                or old.get("decidedBy") != new.get("decidedBy")
            )
            if not changed:
                continue

            status = old.get("status") or new.get("status")
            new["status"] = status
            new["reason"] = old.get("reason") or ""
            new["decidedBy"] = old.get("decidedBy") or new.get("decidedBy")
            new["decidedAt"] = (
                self._shift_stamp(old.get("decidedAt"), delta)
                if old.get("decidedAt")
                else new.get("decidedAt")
            )
            if status == "pending":
                new["decidedAt"] = None
                new["decidedBy"] = None
                new["reason"] = ""
                new["letter"] = "none"
            elif status == "approved":
                new["letter"] = "ready"
                new["decidedAt"] = new.get("decidedAt") or now_iso()
                new["decidedBy"] = new.get("decidedBy") or "Petugas Kemahasiswaan"
            else:
                new["letter"] = "none"
                new["decidedAt"] = new.get("decidedAt") or now_iso()
                new["decidedBy"] = new.get("decidedBy") or "Petugas Kemahasiswaan"

        users = [
            record
            for record in self.bookings
            if self._seed_number(record) is None
        ]
        combined = fresh + users
        combined.sort(key=lambda record: str(record.get("createdAt", "")))
        self.bookings = combined
        self.save_locked()
        return True

    def save_locked(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        fd, temporary = tempfile.mkstemp(prefix="bookings-", suffix=".json", dir=DATA_DIR)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(self.bookings, handle, ensure_ascii=False, indent=2)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, BOOKINGS_FILE)
        except Exception:
            try:
                os.unlink(temporary)
            except OSError:
                pass
            raise

    def public_user(self, account):
        return {
            "id": account.get("id"),
            "name": account.get("name") or account.get("id"),
            "role": account.get("role") or "peminjam",
            "unit": account.get("unit") or "",
        }

    def _rate_key(self, ip, user_id):
        return (ip, user_id.lower())

    def _prune_attempts(self, now):
        for key, values in list(self.failed.items()):
            kept = [value for value in values if now - value < FAILED_WINDOW]
            if kept:
                self.failed[key] = kept
            else:
                del self.failed[key]
        for ip, values in list(self.ip_failed.items()):
            kept = [value for value in values if now - value < FAILED_WINDOW]
            if kept:
                self.ip_failed[ip] = kept
            else:
                del self.ip_failed[ip]

    def _check_rate(self, ip, user_id):
        now = time.time()
        with self.lock:
            self._prune_attempts(now)
            key = self._rate_key(ip, user_id)
            if len(self.failed.get(key, [])) >= MAX_FAILED_ATTEMPTS:
                raise ApiError(
                    429,
                    "rate_limited",
                    "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.",
                )
            if len(self.ip_failed.get(ip, [])) >= MAX_IP_ATTEMPTS:
                raise ApiError(
                    429,
                    "rate_limited",
                    "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit.",
                )

    def _record_failure(self, ip, user_id):
        now = time.time()
        with self.lock:
            key = self._rate_key(ip, user_id)
            self.failed.setdefault(key, []).append(now)
            self.ip_failed.setdefault(ip, []).append(now)

    def login(self, user_id, password, ip, expected_role=""):
        user_id = str(user_id or "").strip().lower()
        expected_role = str(expected_role or "").strip().lower()
        if not user_id or not isinstance(password, str) or not password:
            raise ApiError(400, "validation", "ID pengguna dan kata sandi wajib diisi.")
        if len(user_id) > 64 or len(password) > 200:
            raise ApiError(400, "validation", "ID pengguna atau kata sandi tidak valid.")
        if not expected_role:
            raise ApiError(400, "validation", "Pilih peran Peminjam atau Petugas Kemahasiswaan.")
        if expected_role not in ("peminjam", "petugas"):
            raise ApiError(400, "validation", "Peran yang dipilih tidak valid.")

        self._check_rate(ip, user_id)
        account = self.accounts.get(user_id)
        salt = bytes.fromhex(account["salt"]) if account else b"\x00" * 16
        iterations = int(account.get("iterations") or self.default_iterations) if account else self.default_iterations
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations).hex()
        valid = bool(account and account.get("active", True) and hmac.compare_digest(digest, account.get("hash", "")))
        if not valid:
            self._record_failure(ip, user_id)
            raise ApiError(401, "invalid_credentials", "ID pengguna atau kata sandi tidak sesuai.")

        actual_role = account.get("role") or "peminjam"
        if expected_role and actual_role != expected_role:
            with self.lock:
                self.failed.pop(self._rate_key(ip, user_id), None)
            actual_label = "Petugas Kemahasiswaan" if actual_role == "petugas" else "Peminjam"
            expected_label = "Petugas Kemahasiswaan" if expected_role == "petugas" else "Peminjam"
            raise ApiError(
                403,
                "role_mismatch",
                "Akun ini terdaftar sebagai %s, bukan %s. Pilih peran %s atau gunakan akun %s."
                % (actual_label, expected_label, actual_label, expected_label),
                {"role": actual_role},
            )

        with self.lock:
            self.failed.pop(self._rate_key(ip, user_id), None)
            self._prune_sessions_locked()
            token = secrets.token_urlsafe(32)
            self.sessions[token] = {
                "userId": account["id"],
                "expiresAt": time.time() + SESSION_TTL,
            }
        return self.public_user(account), token

    def logout(self, token):
        if not token:
            return
        with self.lock:
            self.sessions.pop(token, None)

    def _prune_sessions_locked(self):
        now = time.time()
        for token, session in list(self.sessions.items()):
            if session.get("expiresAt", 0) <= now:
                del self.sessions[token]

    def get_session(self, token):
        if not token:
            return None
        with self.lock:
            self._prune_sessions_locked()
            session = self.sessions.get(token)
            if not session:
                return None
            account = self.accounts.get(session.get("userId", ""))
            if not account or not account.get("active", True):
                self.sessions.pop(token, None)
                return None
            return self.public_user(account)

    def _with_mine(self, record, user):
        item = dict(record)
        item["mine"] = bool(user and item.get("ownerId") == user.get("id"))
        return item

    def bookings_for(self, user):
        with self.lock:
            if user.get("role") == "petugas":
                items = list(self.bookings)
            else:
                items = [record for record in self.bookings if record.get("ownerId") == user.get("id")]
            items = sorted(items, key=lambda record: str(record.get("createdAt", "")))
            return [self._with_mine(record, user) for record in items]

    def get_booking(self, booking_id, user):
        with self.lock:
            record = next((item for item in self.bookings if item.get("id") == booking_id), None)
            if not record:
                return None
            if user.get("role") != "petugas" and record.get("ownerId") != user.get("id"):
                return None
            return self._with_mine(record, user)

    def public_schedule(self):
        with self.lock:
            items = [
                {
                    "id": record.get("id"),
                    "roomId": record.get("roomId"),
                    "roomName": record.get("roomName") or ROOM_NAMES.get(record.get("roomId"), ""),
                    "date": record.get("date"),
                    "start": record.get("start"),
                    "end": record.get("end"),
                    "status": record.get("status"),
                    "ormawa": record.get("ormawa"),
                    "purpose": record.get("purpose"),
                }
                for record in self.bookings
                if record.get("status") in ("approved", "pending")
            ]
            items.sort(key=lambda item: (str(item.get("date", "")), minutes(item.get("start", "00.00"))))
            return items

    def _next_id_locked(self):
        maximum = 30
        for record in self.bookings:
            match = re.search(r"(\d+)$", str(record.get("id", "")))
            if match:
                maximum = max(maximum, int(match.group(1)))
        return "IDB-2026-%04d" % (maximum + 1)

    def _conflicts_locked(self, record):
        result = {"approved": [], "pending": []}
        if record.get("roomId") not in ROOM_NAMES:
            return result
        start = minutes(record.get("start", "00.00"))
        end = minutes(record.get("end", "00.00"))
        for other in self.bookings:
            if other.get("id") == record.get("id"):
                continue
            if other.get("roomId") != record.get("roomId") or other.get("date") != record.get("date"):
                continue
            if other.get("status") not in ("approved", "pending"):
                continue
            other_start = minutes(other.get("start", "00.00"))
            other_end = minutes(other.get("end", "00.00"))
            if start < other_end and other_start < end:
                compact = {
                    "id": other.get("id"),
                    "status": other.get("status"),
                    "start": other.get("start"),
                    "end": other.get("end"),
                    "ormawa": other.get("ormawa"),
                    "roomName": other.get("roomName") or ROOM_NAMES.get(other.get("roomId"), ""),
                }
                result[other.get("status")].append(compact)
        return result

    def validate_booking(self, payload):
        errors = []

        def text_field(name, label, minimum=1, maximum=500):
            value = str(payload.get(name, "") or "").strip()
            if len(value) < minimum:
                errors.append((name, "%s wajib diisi." % label))
            elif len(value) > maximum:
                errors.append((name, "%s terlalu panjang." % label))
            return value

        ormawa = text_field("ormawa", "Nama ORMAWA/Prodi", 1, 120)
        nama = text_field("nama", "Nama mahasiswa", 1, 120)
        hp = text_field("hp", "Nomor HP", 1, 40)
        purpose = text_field("purpose", "Keperluan", 10, 500)
        digits = re.sub(r"\D", "", hp)
        if hp and not (9 <= len(digits) <= 15):
            errors.append(("hp", "Masukkan nomor HP yang dapat dihubungi."))

        date_value = str(payload.get("date", "") or "").strip()
        try:
            parsed_date = to_date(date_value)
            if parsed_date.weekday() == 6:
                errors.append(("tanggal", "Peminjaman ruangan tidak dapat dilakukan pada hari Minggu."))
        except ValueError:
            errors.append(("tanggal", "Hari/tanggal peminjaman wajib diisi."))

        start = str(payload.get("start", "") or "").strip()
        end = str(payload.get("end", "") or "").strip()
        time_pattern = re.compile(r"^(?:[01]?\d|2[0-3])[.:][0-5]\d$")
        if not time_pattern.match(start):
            errors.append(("mulai", "Waktu mulai wajib diisi."))
        if not time_pattern.match(end):
            errors.append(("selesai", "Waktu selesai wajib diisi."))
        if time_pattern.match(start) and time_pattern.match(end):
            start_minutes = minutes(start)
            end_minutes = minutes(end)
            if end_minutes <= start_minutes:
                errors.append(("selesai", "Waktu selesai harus lebih akhir daripada waktu mulai."))
            start = start.replace(":", ".")
            end = end.replace(":", ".")

        room_id = str(payload.get("roomId", "") or "").strip()
        room_name = str(payload.get("roomName", "") or "").strip()
        if not room_id:
            errors.append(("ruangan", "Nama ruangan wajib dipilih."))
        elif room_id == "lain":
            if not room_name:
                errors.append(("ruangan-lain", "Sebutkan nama ruangan yang belum terdaftar."))
            elif len(room_name) > 120:
                errors.append(("ruangan-lain", "Nama ruangan terlalu panjang."))
        elif room_id not in ROOM_NAMES:
            errors.append(("ruangan", "Ruangan yang dipilih tidak terdaftar."))
        else:
            room_name = ROOM_NAMES[room_id]

        try:
            peserta = int(payload.get("peserta"))
            if peserta < 1:
                raise ValueError
        except (TypeError, ValueError):
            errors.append(("peserta", "Jumlah peserta minimal 1 orang."))
            peserta = 1

        alat = payload.get("alat") or []
        if not isinstance(alat, list):
            alat = []
        clean_alat = []
        for item in alat[:10]:
            value = str(item or "").strip()
            if value and len(value) <= 100:
                clean_alat.append(value)

        if errors:
            raise ApiError(
                422,
                "validation",
                "Periksa kembali data pengajuan.",
                {"errors": [{"field": field, "message": message} for field, message in errors]},
            )

        return {
            "ormawa": ormawa,
            "nama": nama,
            "hp": hp,
            "purpose": purpose,
            "peserta": peserta,
            "alat": clean_alat,
            "roomId": room_id,
            "roomName": room_name,
            "date": date_value,
            "start": start,
            "end": end,
        }

    def create_booking(self, user, payload):
        if user.get("role") != "peminjam":
            raise ApiError(403, "forbidden", "Hanya peminjam yang dapat mengirim pengajuan.")
        clean = self.validate_booking(payload)
        with self.lock:
            record = dict(clean)
            record.update(
                {
                    "id": self._next_id_locked(),
                    "status": "pending",
                    "createdAt": now_iso(),
                    "decidedAt": None,
                    "decidedBy": None,
                    "reason": "",
                    "letter": "none",
                    "ownerId": user.get("id"),
                    "seed": False,
                }
            )
            self.bookings.append(record)
            try:
                self.save_locked()
            except Exception as error:
                self.bookings.remove(record)
                raise ApiError(
                    500,
                    "save_failed",
                    "Pengajuan belum berhasil disimpan. Silakan coba kembali.",
                ) from error
            conflicts = self._conflicts_locked(record)
            return self._with_mine(record, user), conflicts

    def decide_booking(self, user, booking_id, action, reason):
        if user.get("role") != "petugas":
            raise ApiError(403, "forbidden", "Hanya petugas berwenang yang dapat memberi keputusan.")
        if action not in ("approve", "reject"):
            raise ApiError(400, "validation", "Keputusan tidak valid.")
        reason = str(reason or "").strip()
        if len(reason) > 300:
            raise ApiError(400, "validation", "Alasan penolakan terlalu panjang.")

        with self.lock:
            record = next((item for item in self.bookings if item.get("id") == booking_id), None)
            if not record:
                raise ApiError(404, "not_found", "Pengajuan tidak ditemukan.")
            if record.get("status") != "pending":
                raise ApiError(409, "already_decided", "Pengajuan ini sudah diputuskan.")
            if action == "approve":
                conflicts = self._conflicts_locked(record)
                if conflicts["approved"]:
                    raise ApiError(
                        409,
                        "conflict",
                        "Jadwal bertabrakan dengan pengajuan yang sudah disetujui.",
                        {"conflicts": conflicts},
                    )
            original = dict(record)
            record["status"] = "approved" if action == "approve" else "rejected"
            record["decidedAt"] = now_iso()
            record["decidedBy"] = user.get("name") or "Petugas Kemahasiswaan"
            record["reason"] = reason if action == "reject" else ""
            record["letter"] = "ready" if action == "approve" else "none"
            try:
                self.save_locked()
            except Exception as error:
                record.clear()
                record.update(original)
                raise ApiError(
                    500,
                    "save_failed",
                    "Keputusan belum berhasil disimpan. Silakan coba kembali.",
                ) from error
            return self._with_mine(record, user)


# ---------- Surat PDF ----------

INK = (31 / 255, 31 / 255, 31 / 255)
MUTED = (84 / 255, 89 / 255, 95 / 255)
LINE = (234 / 255, 234 / 255, 234 / 255)
PRIMARY = (2 / 255, 77 / 255, 113 / 255)
ACCENT = (241 / 255, 119 / 255, 17 / 255)
SOFT = (244 / 255, 246 / 255, 247 / 255)


class PdfBuilder:
    def __init__(self):
        self.operations = []

    @staticmethod
    def _escape(value):
        value = str(value)
        replacements = {
            "\\": "\\\\",
            "(": "\\(",
            ")": "\\)",
            "\u2013": "-",
            "\u2014": "-",
            "\u2026": "...",
            "\u2018": "'",
            "\u2019": "'",
            "\u201c": '"',
            "\u201d": '"',
        }
        for old, new in replacements.items():
            value = value.replace(old, new)
        return value.encode("latin-1", "replace").decode("latin-1")

    def text(self, x, y, value, size=10, bold=False, color=INK):
        font = "F2" if bold else "F1"
        self.operations.append(
            "BT /%s %.2f Tf %.3f %.3f %.3f rg 1 0 0 1 %.2f %.2f Tm (%s) Tj ET"
            % (font, size, color[0], color[1], color[2], x, y, self._escape(value))
        )

    def rect(self, x, y, width, height, fill):
        self.operations.append(
            "%.3f %.3f %.3f rg %.2f %.2f %.2f %.2f re f"
            % (fill[0], fill[1], fill[2], x, y, width, height)
        )

    def line(self, x1, y1, x2, y2, color=LINE, width=0.6):
        self.operations.append(
            "%.3f %.3f %.3f RG %.2f w %.2f %.2f m %.2f %.2f l S"
            % (color[0], color[1], color[2], width, x1, y1, x2, y2)
        )

    def build(self):
        content = "\n".join(self.operations).encode("latin-1", "replace")
        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",
            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
            b"<< /Length " + str(len(content)).encode("ascii") + b" >>\nstream\n" + content + b"\nendstream",
        ]
        document = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for number, obj in enumerate(objects, 1):
            offsets.append(len(document))
            document += ("%d 0 obj\n" % number).encode("ascii") + obj + b"\nendobj\n"
        xref = len(document)
        document += ("xref\n0 %d\n" % (len(objects) + 1)).encode("ascii")
        document += b"0000000000 65535 f \n"
        for offset in offsets[1:]:
            document += ("%010d 00000 n \n" % offset).encode("ascii")
        document += (
            "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n"
            % (len(objects) + 1, xref)
        ).encode("ascii")
        return bytes(document)


def wrap_text(value, width=58):
    words = str(value or "").split()
    if not words:
        return [""]
    lines = []
    current = ""
    for word in words:
        if not current:
            current = word
        elif len(current) + 1 + len(word) <= width:
            current += " " + word
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def build_letter_pdf(record):
    pdf = PdfBuilder()
    width = 595
    left = 54
    right = width - 54

    # Kop dokumen
    pdf.rect(0, 742, width, 100, PRIMARY)
    pdf.text(left, 806, "INSTITUT DESAIN DAN BISNIS BALI", 13, True, (1, 1, 1))
    pdf.text(left, 787, "Sistem Peminjaman Ruangan", 9, False, (1, 1, 1))
    pdf.text(left, 770, "Denpasar, Bali", 9, False, (1, 1, 1))
    pdf.text(right - 155, 806, "Dokumen peminjaman", 9, False, (1, 1, 1))
    pdf.rect(0, 738, width, 4, ACCENT)

    # Judul
    pdf.text(left, 700, "SURAT PEMINJAMAN RUANGAN", 18, True, INK)
    pdf.text(left, 680, "Dokumen peminjaman ruangan yang telah disetujui", 10, False, MUTED)
    pdf.text(left, 646, "Nomor pengajuan", 9, True, MUTED)
    pdf.text(left + 95, 646, record.get("id", "-"), 10, True, INK)
    pdf.text(right - 125, 646, "Status", 9, True, MUTED)
    pdf.text(right - 85, 646, "Disetujui", 10, True, (11 / 255, 84 / 255, 80 / 255))
    pdf.line(left, 632, right, 632)

    pdf.text(left, 610, "DATA PEMINJAMAN", 11, True, PRIMARY)
    rows = [
        ("Nama peminjam", record.get("nama", "-")),
        ("ORMAWA/Prodi", record.get("ormawa", "-")),
        ("Nomor HP", record.get("hp", "-")),
        ("Keperluan", record.get("purpose", "-")),
        ("Ruangan", record.get("roomName") or ROOM_NAMES.get(record.get("roomId"), "Ruangan belum terdaftar")),
        ("Jumlah peserta", "%s orang" % record.get("peserta", "-")),
        ("Tanggal", fmt_long_date(record.get("date"))),
        ("Waktu", fmt_time_range(record.get("start", "-"), record.get("end", "-"))),
        (
            "Alat yang dipinjam",
            ", ".join(record.get("alat") or []) if record.get("alat") else "-",
        ),
    ]

    top = 586
    label_width = 140
    value_x = left + label_width + 16
    value_width = right - value_x
    y = top
    for index, (label, value) in enumerate(rows):
        lines = wrap_text(value, 58)
        height = max(28, len(lines) * 15 + 13)
        if index % 2 == 0:
            pdf.rect(left - 6, y - height + 7, right - left + 12, height, SOFT)
        pdf.text(left, y, label, 9, True, MUTED)
        for line_index, line in enumerate(lines):
            pdf.text(value_x, y - line_index * 15, line, 10, False, INK)
        pdf.line(left, y - height + 6, right, y - height + 6)
        y -= height

    # Catatan
    y -= 18
    note = (
        "Dokumen ini dihasilkan dari data pengajuan yang telah disetujui. "
        "Format surat resmi dan pengesahan mengikuti ketentuan kampus."
    )
    note_lines = wrap_text(note, 82)
    note_height = 24 + len(note_lines) * 13
    pdf.rect(left - 6, y - note_height, right - left + 12, note_height, SOFT)
    pdf.rect(left - 6, y - note_height, 4, note_height, ACCENT)
    pdf.text(left + 8, y - 14, "Catatan", 9, True, PRIMARY)
    for index, line in enumerate(note_lines):
        pdf.text(left + 8, y - 28 - index * 13, line, 9, False, MUTED)

    # Kaki dokumen
    pdf.line(left, 62, right, 62)
    pdf.text(left, 46, "Sistem Peminjaman Ruangan IDB Bali", 8, False, MUTED)
    pdf.text(right - 190, 46, "Dihasilkan %s" % datetime.now().strftime("%d-%m-%Y %H.%M"), 8, False, MUTED)
    pdf.text(left, 32, "Dokumen tidak memuat tanda tangan atau nama pejabat yang belum ditetapkan.", 8, False, MUTED)

    return pdf.build()


# ---------- Handler ----------

class Handler(http.server.SimpleHTTPRequestHandler):
    store = None
    protocol_version = "HTTP/1.0"

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; "
            "script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; "
            "base-uri 'self'; form-action 'self'",
        )
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(404, "Not found")
        return None

    def do_GET(self):
        try:
            if self.path.startswith("/api/"):
                self.handle_api_get()
            else:
                self.handle_static_get()
        except ApiError as error:
            try:
                self.send_json(error.status, error.payload())
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                pass
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            pass
        except Exception as error:
            self.log_error("GET gagal: %s", error)
            if self.path.startswith("/api/"):
                try:
                    self.send_json(500, {"ok": False, "code": "server_error", "message": "Terjadi kendala pada server."})
                except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                    pass
            else:
                try:
                    self.send_error(500, "Terjadi kendala pada server.")
                except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                    pass

    def do_POST(self):
        try:
            if not self.path.startswith("/api/"):
                self.send_error(404, "Not found")
                return
            self.handle_api_post()
        except ApiError as error:
            try:
                self.send_json(error.status, error.payload())
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                pass
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            pass
        except Exception as error:
            self.log_error("POST gagal: %s", error)
            try:
                self.send_json(500, {"ok": False, "code": "server_error", "message": "Terjadi kendala pada server."})
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                pass

    # ---------- Cookie & sesi ----------

    def cookie_token(self):
        header = self.headers.get("Cookie", "")
        if not header:
            return None
        cookies = http.cookies.SimpleCookie()
        try:
            cookies.load(header)
        except Exception:
            return None
        morsel = cookies.get(SESSION_COOKIE)
        return morsel.value if morsel else None

    def current_user(self):
        return self.store.get_session(self.cookie_token())

    def require_user(self):
        user = self.current_user()
        if not user:
            raise ApiError(401, "auth", "Sesi Anda tidak ditemukan atau telah berakhir.")
        return user

    def require_role(self, role):
        user = self.require_user()
        if user.get("role") != role:
            raise ApiError(403, "forbidden", "Akun ini tidak memiliki akses untuk tindakan tersebut.")
        return user

    def session_cookie(self, token, clear=False):
        if clear:
            return "%s=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" % SESSION_COOKIE
        return "%s=%s; Path=/; HttpOnly; SameSite=Lax; Max-Age=%d" % (SESSION_COOKIE, token, SESSION_TTL)

    # ---------- Respons ----------

    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for key, value in (headers or []):
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def send_redirect(self, location):
        self.send_response(302)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_pdf(self, booking_id, pdf):
        filename = "Surat-Peminjaman-%s.pdf" % re.sub(r"[^A-Za-z0-9-]", "-", str(booking_id))
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", 'attachment; filename="%s"' % filename)
        self.send_header("Content-Length", str(len(pdf)))
        self.end_headers()
        self.wfile.write(pdf)

    # ---------- API ----------

    def discard_body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return
        if 0 < length <= MAX_BODY:
            self.rfile.read(length)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ApiError(400, "invalid_request", "Permintaan tidak valid.")
        if length <= 0 or length > MAX_BODY:
            raise ApiError(400, "invalid_request", "Permintaan tidak valid.")
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception as error:
            raise ApiError(400, "invalid_request", "Permintaan tidak valid.") from error
        if not isinstance(data, dict):
            raise ApiError(400, "invalid_request", "Permintaan tidak valid.")
        return data

    def check_origin(self):
        origin = self.headers.get("Origin")
        if origin:
            port = self.server.server_address[1]
            allowed = {"http://127.0.0.1:%d" % port, "http://localhost:%d" % port}
            if origin not in allowed:
                raise ApiError(403, "forbidden", "Permintaan ditolak.")
        fetch_site = self.headers.get("Sec-Fetch-Site")
        if fetch_site and fetch_site not in ("same-origin", "none"):
            raise ApiError(403, "forbidden", "Permintaan ditolak.")

    def handle_api_get(self):
        parsed = urllib.parse.urlsplit(self.path)
        path = urllib.parse.unquote(parsed.path)

        if path == "/api/session":
            user = self.current_user()
            self.send_json(200, {"ok": True, "authenticated": bool(user), "user": user})
            return

        if path == "/api/schedule":
            self.send_json(200, {"ok": True, "bookings": self.store.public_schedule()})
            return

        if path == "/api/bookings":
            user = self.require_user()
            self.send_json(200, {"ok": True, "bookings": self.store.bookings_for(user)})
            return

        letter_match = re.fullmatch(r"/api/bookings/([A-Za-z0-9-]+)/letter", path)
        if letter_match:
            user = self.require_user()
            record = self.store.get_booking(letter_match.group(1), user)
            if not record:
                raise ApiError(404, "not_found", "Pengajuan tidak ditemukan.")
            if record.get("status") != "approved":
                raise ApiError(
                    409,
                    "not_approved",
                    "Surat hanya tersedia untuk pengajuan yang telah disetujui.",
                )
            self.send_pdf(record.get("id"), build_letter_pdf(record))
            return

        detail_match = re.fullmatch(r"/api/bookings/([A-Za-z0-9-]+)", path)
        if detail_match:
            user = self.require_user()
            record = self.store.get_booking(detail_match.group(1), user)
            if not record:
                raise ApiError(404, "not_found", "Pengajuan tidak ditemukan.")
            self.send_json(200, {"ok": True, "booking": record})
            return

        raise ApiError(404, "not_found", "Permintaan tidak ditemukan.")

    def handle_api_post(self):
        self.check_origin()
        parsed = urllib.parse.urlsplit(self.path)
        path = urllib.parse.unquote(parsed.path)

        if path == "/api/login":
            data = self.read_json()
            user, token = self.store.login(
                data.get("userId", ""),
                data.get("password", ""),
                self.client_address[0],
                data.get("role", ""),
            )
            self.send_json(
                200,
                {"ok": True, "user": user},
                [("Set-Cookie", self.session_cookie(token))],
            )
            return

        if path == "/api/logout":
            self.discard_body()
            self.store.logout(self.cookie_token())
            self.send_json(
                200,
                {"ok": True},
                [("Set-Cookie", self.session_cookie("", clear=True))],
            )
            return

        if path == "/api/bookings":
            user = self.require_role("peminjam")
            data = self.read_json()
            record, conflicts = self.store.create_booking(user, data)
            self.send_json(201, {"ok": True, "booking": record, "conflicts": conflicts})
            return

        decision_match = re.fullmatch(r"/api/bookings/([A-Za-z0-9-]+)/decision", path)
        if decision_match:
            user = self.require_role("petugas")
            data = self.read_json()
            record = self.store.decide_booking(
                user,
                decision_match.group(1),
                str(data.get("action", "")),
                data.get("reason", ""),
            )
            self.send_json(200, {"ok": True, "booking": record})
            return

        raise ApiError(404, "not_found", "Permintaan tidak ditemukan.")

    # ---------- Halaman statis ----------

    def handle_static_get(self):
        parsed = urllib.parse.urlsplit(self.path)
        path = urllib.parse.unquote(parsed.path)
        if path == "/":
            path = "/index.html"

        if (
            path.startswith("/data/")
            or path in ("/serve.py", "/README.md")
            or path.endswith((".py", ".json", ".md"))
        ):
            self.send_error(404, "Not found")
            return

        user = self.current_user()

        if path in ADMIN_PAGES:
            if not user:
                self.login_redirect(path, parsed.query)
                return
            if user.get("role") != "petugas":
                self.send_redirect("/tidak-berizin.html")
                return

        if path in BORROWER_PAGES:
            if not user:
                self.login_redirect(path, parsed.query)
                return
            if user.get("role") != "peminjam":
                self.send_redirect("/petugas.html")
                return

        if path in AUTH_PAGES and not user:
            self.login_redirect(path, parsed.query)
            return

        super().do_GET()

    def login_redirect(self, path, query):
        target = path + (("?" + query) if query else "")
        location = "/masuk.html?next=%s&alasan=masuk" % urllib.parse.quote(target, safe="")
        self.send_redirect(location)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = 64


def main():
    os.chdir(BASE_DIR)
    store = Store()
    Handler.store = store
    with Server((HOST, PORT), Handler) as httpd:
        print("Sistem Peminjaman Ruangan IDB Bali berjalan di http://%s:%d" % (HOST, PORT))
        print("Data: %s" % BOOKINGS_FILE)
        print("Akun: %s" % ACCOUNTS_FILE)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer dihentikan.")


if __name__ == "__main__":
    main()
