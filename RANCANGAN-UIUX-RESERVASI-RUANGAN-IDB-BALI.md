# RANCANGAN UI/UX — Sistem Reservasi & Peminjaman Ruangan IDB Bali

**Versi** 1.0 · 24 Oktober 2026 · **Status** Draf untuk ditinjau
**Dasar** PRD Sistem Reservasi dan Peminjaman Ruangan IDB Bali v1.5 (21 Oktober 2026)
**Sifat dokumen** Rancangan tampilan dan alur. Belum ada kode, belum ada data final kampus.

---

## Cara membaca dokumen ini

Setiap keputusan desain diberi penanda sumber:

| Penanda | Arti |
|---|---|
| `[PRD §x]` / `[ID]` | Bersumber dari PRD v1.5, bagian atau ID kebutuhan tertentu |
| **(terverifikasi)** | Diambil langsung dari aset/situs resmi IDB Bali, bukan perkiraan |
| **(turunan)** | Nilai baru yang saya hitung dari warna terverifikasi; **bukan** warna resmi kampus |
| **(usulan)** | Keputusan desain saya; boleh diubah kampus tanpa melanggar PRD |
| **(PERLU KONFIRMASI)** | PRD menyatakan hal ini belum ditetapkan; desain memakai placeholder |

Semua teks pesan sistem di dokumen ini dikutip dari PRD §9.1 dan §11.2 — tidak ada pesan karangan.

---

## 0. Ringkasan keputusan

| Area | Keputusan | Dasar |
|---|---|---|
| Arah visual | **"Studio Kampus"** — editorial, bergaris rambut, berskala besar, tanpa dekorasi | Usulan; mengacu karakter kampus desain & bisnis |
| Warna inti | `#024D71` (primary), `#F17711` (accent), `#1F1F1F` (teks) | Token resmi situs IDB Bali (terverifikasi) |
| Tipografi | Montserrat 400/600/700 + monospace sistem untuk ID & waktu | Montserrat = satu-satunya font situs resmi (terverifikasi) |
| Radius | 4px (mayoritas situs), 8px hanya untuk modal/sheet | Pola situs resmi (terverifikasi) |
| Logo | Crest + wordmark tidak dipisah; clear space = tinggi huruf "A" | Panduan logo resmi (terverifikasi) |
| Layar inti | 4 layar peminjam + 6 fungsi petugas (diringkas jadi 3 halaman + modal), persis §5.2 & §5.3 | PRD §5.2, §5.3 |
| Prioritas | 4 gelombang mengikuti tahap A–G PRD | PRD §15.1 |
| Pembatalan | **Tidak ditampilkan** sampai kebijakan ditetapkan | PB-01, §3.4 |
| Notifikasi keluar | **Tidak dijanjikan** (tanpa WhatsApp/email otomatis) | §3.4, INT-05 |

**Yang sengaja tidak saya putuskan sendiri** (karena PRD menyatakannya belum ditetapkan): metode masuk, jam operasional, daftar ruangan final, format surat resmi, kebijakan pembatalan, pihak pemelihara jadwal, masa simpan data. Rinciannya di **§11**.

---

# 1. Analisis kebutuhan

## 1.1 Masalah yang diselesaikan

| Masalah `[PRD §2.2]` | Dampak | Konsekuensi desain |
|---|---|---|
| Ketersediaan ruangan harus ditanyakan dulu | Peminjam kehilangan waktu | Jadwal harus bisa dilihat **sebelum** mengisi formulir |
| Konfirmasi lewat WhatsApp | Pengajuan tertunda | Status harus bisa dipantau mandiri, tanpa menunggu balasan |
| Formulir dan konfirmasi terpisah | Perpindahan proses | Satu alur: pilih waktu → ajukan → status → surat |
| Status tidak langsung diketahui | Peminjam bertanya berulang | Badge status + riwayat waktu keputusan di setiap layar pengajuan |
| Surat dikirim manual | Menunggu sebelum cetak | Unduh PDF langsung setelah disetujui `[SR-07]` |

## 1.2 Tujuan produk → indikator desain

`[PRD §2.3]`

| Tujuan | Yang harus terlihat di UI |
|---|---|
| Memudahkan pencarian ruangan | Daftar + papan jadwal, filter tanggal/gedung, tanpa scroll horizontal |
| Menyatukan proses pengajuan | Satu formulir, satu tombol kirim, tanpa pindah aplikasi |
| Mempermudah pemeriksaan | Layar petugas: data + jadwal + keputusan dalam satu tampilan |
| Memperjelas status | Status selalu terbaca (teks + warna + posisi), riwayat keputusan |
| Mempercepat pembuatan surat | Kartu surat dengan status jelas: belum tersedia / diproses / gagal / siap |
| Mengurangi komunikasi berulang | Semua jawaban ada di layar detail pengajuan |

## 1.3 Pengguna, pekerjaan, dan hak akses

`[PRD §3.1, §11.1]`

| Peran | Pekerjaan utama | Batas kewenangan | Layar |
|---|---|---|---|
| Peminjam (mahasiswa/ORMAWA/Prodi) | Lihat ruangan, ajukan, pantau status, unduh surat | Tidak bisa menyetujui; tidak bisa melihat pengajuan orang lain | Beranda, Ruangan & Jadwal, Formulir, Pengajuan Saya, Detail |
| Bagian Kemahasiswaan | Periksa data & jadwal, putuskan | Hanya lewat akses petugas berwenang | Daftar Pengajuan, Detail, Pemeriksaan Jadwal, Keputusan, Riwayat |
| Bagian Akademik, IT, Operasional, Security | Menerima informasi peminjaman | **Hak akses belum ditetapkan** `[§11.1]` | Tidak dibuat sampai ditetapkan |
| Pengelola Sistem | Perbarui data ruangan & pengaturan | Sesuai izin | Kelola Ruangan **(provisional)** |

**Matriks izin ringkas** `[§11.1]`:

| Tindakan | Peminjam | Kemahasiswaan | Pengelola |
|---|---|---|---|
| Lihat daftar ruangan | Ya | Ya | Ya |
| Ajukan peminjaman | Ya | Sesuai kebijakan | Sesuai izin |
| Lihat pengajuan sendiri | Ya | Sesuai tugas | Sesuai izin |
| Lihat seluruh pengajuan | **Tidak** | Ya | Sesuai izin |
| Setujui / tolak | **Tidak** | Ya | **Tidak otomatis** |
| Unduh surat | Milik sendiri | Sesuai kebutuhan | Sesuai izin |
| Ubah daftar ruangan | Tidak | Sesuai penetapan | Sesuai izin |
| Kelola pengaturan | Tidak | Tidak otomatis | Ya |

> **Konsekuensi desain:** tombol "Setujui" tidak pernah dirender untuk peminjam, dan tetap ditolak di sisi pemrosesan `[AK-06, §11.3.5]`. Menyembunyikan tombol saja tidak cukup.

## 1.4 Fitur rilis inti → layar

`[PRD §3.3]`

| Fitur inti | Layar / komponen |
|---|---|
| Daftar ruangan | Ruangan & Jadwal |
| Informasi jadwal | Papan Jadwal + daftar |
| Formulir pengajuan | Formulir Peminjaman |
| Pemeriksaan data | Validasi inline + ringkasan kesalahan |
| Persetujuan petugas | Detail Pengajuan (petugas) |
| Status pengajuan | Badge + timeline |
| Surat PDF | Kartu Surat di Detail |
| Riwayat pengajuan | Pengajuan Saya + Riwayat (petugas) |
| Tampilan responsif | Semua layar, 360px–1440px |
| Pengaturan akses | Gerbang sesi + halaman izin |

## 1.5 Aturan bisnis yang mengikat tampilan

| Aturan | ID | Wujud di UI |
|---|---|---|
| Tidak boleh hari Minggu | AT-01, AJ-04 | Hari Minggu dinonaktifkan di pemilih tanggal + pesan PRD |
| Tanggal wajib diisi | AT-02 | Kolom wajib, bintang + legenda |
| Waktu jelas, WITA | AT-03, AT-04 | Label "WITA" permanen di kolom waktu |
| Selesai > mulai | AT-05, AJ-05 | Validasi + durasi terhitung |
| Jam operasional | AT-06 | **Belum ada** → sumbu waktu dari konfigurasi, bukan hardcode |
| Ruangan hanya setelah disetujui | AT-07 | Tidak ada klaim "tersedia"; hanya "tercatat" |
| Ruangan tak terdaftar ≠ tersedia | RG-07 | Opsi khusus "belum terdaftar" → ditandai untuk petugas |
| Bentrok dicek saat ajukan & sebelum setujui | JD-01, JD-02 | Peringatan di formulir + panel jadwal petugas |
| Bentrok tidak boleh sama-sama disetujui | JD-03 | Keputusan kedua diblokir sampai ada penyelesaian |
| Surat hanya setelah persetujuan tersimpan | SR-01, SR-08 | Kartu surat terkunci sampai status disetujui |
| Alat kosong ditulis "-" | SR-04 | Data surat, bukan input pengguna |
| Tidak mengarang pejabat/tanda tangan | SR-06 | Template resmi wajib dari kampus |

## 1.6 Perjalanan pengguna (ringkas)

`[PRD §4.1, §4.2]`

``
Lihat ruangan → pilih ruangan & waktu → isi formulir → sistem periksa
→ Menunggu Pemeriksaan → petugas periksa data + jadwal → keputusan
   ├─ Disetujui → surat PDF dibuat → unduh → cetak 3 salinan
   └─ Ditolak   → lihat alasan → pertimbangkan pengajuan baru
``

Kendala yang wajib punya tampilan `[§4.3]`: data belum lengkap, tanggal Minggu, jadwal bertabrakan, gagal menyimpan, pengajuan ditolak.

## 1.7 Tujuh konsekuensi desain yang paling menentukan

1. **Jangan pernah menulis "Tersedia".** Data hanya mencerminkan peminjaman yang tercatat `[JD-05]`. Label yang dipakai: "Belum ada jadwal tercatat" / "Ada peminjaman" / "Perlu diperiksa".
2. **Status bukan sekadar warna.** Badge = teks + titik + posisi; pemakai buta warna tetap terbaca `[MB-06]`.
3. **Formulir tidak boleh terasa seperti ujian.** Satu kolom per baris di ponsel, bantuan di bawah label, kesalahan di dekat kolom `[MB-05]`.
4. **Kegagalan tidak boleh menyamar jadi keberhasilan.** Tidak ada redirect "berhasil" sebelum simpan sukses `[AJ-09, §9.2]`.
5. **Petugas butuh bukti, bukan ringkasan.** Panel jadwal menampilkan pengajuan lain pada ruang/waktu yang sama, termasuk yang masih menunggu `[§7.2]`.
6. **Surat adalah dokumen hukum kampus.** UI hanya menampilkan status dan tombol; tata letak surat mengikuti template resmi yang belum tersedia `[SR-05, §17.3]`.
7. **Tidak menjanjikan yang belum ada.** Tanpa notifikasi WhatsApp, tanpa statistik, tanpa foto ruangan karangan `[§3.4, INT-05]`.

---

# 2. Struktur website

## 2.1 Peta halaman

| Rute (usulan) | Layar | Peran | PRD | Gelombang |
|---|---|---|---|---|
| `/` | Beranda | Publik | §5.2 | 1 |
| `/ruangan` | Ruangan & Jadwal (papan + daftar) | Publik | §5.2, RG-01..05 | 1 |
| `/ruangan?tanggal=&gedung=` | Filter jadwal (state URL) | Publik | RG-04 | 1 |
| `/ajukan` | Formulir Peminjaman | Peminjam | §5.2, AJ-01..10 | 1 |
| `/ajukan?ruang=&tanggal=&mulai=&selesai=` | Formulir terisi awal dari papan jadwal | Peminjam | RG-04 | 1 |
| `/masuk` | Masuk | Petugas (+ peminjam, tergantung keputusan) | §5.3, AK-07 | 1–2 |
| `/pengajuan` | Pengajuan Saya | Peminjam | ST-01 | 1 |
| `/pengajuan/[id]` | Detail & Status + Surat | Peminjam (pemilik) | ST-02..05, IN-01..06 | 1–3 |
| `/petugas` | Daftar Pengajuan | Petugas | PT-01..04 | 2 |
| `/petugas/[id]` | Detail + Pemeriksaan Jadwal + Keputusan | Petugas | AP-01..08, PT-05/06 | 2 |
| `/petugas/riwayat` | Riwayat Keputusan | Petugas | PT-07 | 2 |
| `/petugas/ruangan` | Kelola Ruangan **(provisional)** | Pengelola | RG-08, NF-07 | 2b |
| `/tidak-berizin` | 403 | Semua | AK-01, §11.2 | 2 |

Catatan: PRD §5.2/§5.3 mencantumkan 10 layar (4 peminjam + 6 petugas). Rute di atas hanya memecahnya menjadi URL; **tidak ada layar baru** kecuali "Kelola Ruangan" yang memang diwajibkan RG-08/NF-07 tetapi tidak muncul di daftar layar petugas — konfirmasi cakupannya di §11. Prototipe statis pada Lampiran D menjalankan rute ini sebagai berkas datar (mis. `pengajuan-detail.html?id=...`); rute di tabel tetap menjadi usulan produksi.

## 2.2 Navigasi

**Peminjam — header putih, 1px `#EAEAEA`, sticky** `(terverifikasi: pola header situs)`

``
[LOGO IDB]   Beranda   Ruangan & Jadwal   Pengajuan Saya        [Masuk]   [Ajukan Peminjaman]
``

- Tinggi 76px desktop / 64px mobile; logo 50px (desktop) / 40px (mobile), mengikuti aturan header situs IDB.
- "Ajukan Peminjaman" selalu tersedia sebagai aksi utama `[§5.4.1]`: di header pada desktop/tablet, dan sebagai tombol penuh di konten pada ponsel agar header menyisakan ruang untuk Masuk/Keluar dan menu.
- Mobile: logo + tombol "Ajukan"; sisanya di sheet menu. Tab bar bawah **tidak** dipakai agar tidak bersaing dengan tombol utama.

**Petugas — rail kiri 240px, tanpa logo besar** (agar beda jelas dari area publik)

``
IDB · PETUGAS
Daftar Pengajuan   (n)
Riwayat
Ruangan            ← hanya jika izin RG-08 ada
─────────────
Nama petugas · Keluar
``

## 2.3 Hubungan antar halaman

``
                       ┌──────────────┐
                       │   BERANDA    │
                       └──────┬───────┘
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
      ┌──────────────┐  ┌───────────┐   ┌──────────────┐
      │  RUANGAN &   │─▶│  FORMULIR │──▶│  PENGAJUAN   │
      │   JADWAL     │◀─│           │   │     SAYA     │
      └──────────────┘  └───────────┘   └──────┬───────┘
              ▲                                ▼
              │                        ┌──────────────┐
              │                        │ DETAIL +     │
              │                        │ STATUS+ SURAT│
              │                        └──────┬───────┘
              │                               │
              │        ┌──────────────────────┘
              │        ▼ (keputusan petugas)
      ┌───────┴─────────────┐   ┌──────────────────┐
      │  MASUK (petugas)    │──▶│ DAFTAR PENGAJUAN │
      └─────────────────────┘   └────────┬─────────┘
                                         ▼
                                ┌──────────────────┐
                                │ DETAIL + JADWAL  │
                                │   + KEPUTUSAN    │
                                └──────────────────┘
``

## 2.4 Alur peminjam (dengan cabang kegagalan)

``
GOAL: pengajuan terkirim dan statusnya jelas

Masuk Beranda
 ├─ Lihat jadwal ───▶ /ruangan (tanggal default hari ini)
 │     ├─ pilih slot kosong ──▶ /ajukan?ruang&tanggal&mulai&selesai
 │     ├─ slot berisi ────────▶ detail jadwal (tidak bisa dipilih)
 │     └─ data ruangan kosong ▶ "Daftar ruangan belum tersedia" (empty state)
 │
Isi formulir (4 bagian)
 ├─ kolom wajib kosong ──▶ ringkasan kesalahan + fokus ke kolom pertama
 ├─ tanggal Minggu ──────▶ hari dinonaktifkan; pesan PRD
 ├─ selesai ≤ mulai ─────▶ pesan PRD di kolom waktu
 ├─ bentrok jadwal ──────▶ peringatan + konfirmasi "tetap ajukan untuk diperiksa"
 └─ ruangan tak terdaftar ▶ catatan "akan diperiksa petugas"

Kirim
 ├─ gagal simpan ──▶ banner error, isian dipertahankan, tombol ulang, TIDAK ada status
 └─ sukses ───────▶ /pengajuan/[id] · badge Menunggu Pemeriksaan · ID tampil

Detail
 ├─ Menunggu ──▶ "Pengajuan sedang menunggu pemeriksaan Bagian Kemahasiswaan."
 ├─ Ditolak ───▶ alasan (jika ada) + CTA "Ajukan lagi"
 └─ Disetujui ─▶ surat: belum tersedia / diproses / gagal / siap → Unduh PDF
``

Detail cabang bentrok: PRD tidak memerintahkan pemblokiran. Pesan resminya menawarkan dua jalan — "pilih waktu berbeda atau tunggu pemeriksaan petugas" `[§9.1]` — sementara pengajuan pada slot tanpa jadwal memang boleh dilanjutkan untuk diperiksa `[§7.2]`. Karena itu desain memakai **peringatan + konfirmasi eksplisit**, bukan blokir total. **(usulan)**

## 2.5 Alur petugas

``
Masuk → Daftar Pengajuan (default: Menunggu, urut terlama)
 ├─ cari nama / tanggal / ID
 ├─ buka detail
 │    ├─ baca data peminjam, keperluan, peserta, alat
 │    ├─ panel Pemeriksaan Jadwal: disetujui + menunggu pada ruang/tanggal itu
 │    ├─ bentrok? ──▶ label "Perlu diperiksa" + tautan papan jadwal
 │    └─ putuskan
 │         ├─ Setujui ──▶ modal ringkasan + centang "jadwal sudah diperiksa"
 │         │              ──▶ simpan ──▶ status Disetujui ──▶ surat dibuat
 │         │                   └─ gagal ──▶ error, status tetap Menunggu
 │         └─ Tolak ────▶ modal + alasan (opsional, dianjurkan)
 │                        ──▶ status Ditolak + alasan tampil ke peminjam
 └─ sudah diputuskan? ──▶ tombol keputusan nonaktif + alasan "sudah diputuskan"
``

Keputusan ganda dicegah `[AP-08]`. Setiap keputusan menyimpan waktu + identitas petugas `[AP-07]`.

## 2.6 Aturan navigasi & penjagaan akses

| Situasi | Perilaku UI | Dasar |
|---|---|---|
| Belum masuk, buka `/petugas` | Arahkan ke `/masuk` + pesan PRD | AK-01, AK-02 |
| Sudah masuk, bukan petugas | `/tidak-berizin` + pesan PRD | §11.2 |
| Buka pengajuan milik orang lain | "Pengajuan tidak ditemukan atau Anda tidak memiliki izin untuk melihatnya." | AK-03 |
| Sesi habis saat mengirim | Banner "Sesi Anda telah berakhir..." + kembali ke formulir dengan isian utuh | AK-05, §9.2 |
| Selesai kirim | Redirect ke detail, bukan modal yang bisa ditutup tanpa jejak | §5.4.2 |
| Surat belum siap | Tombol unduh tidak dirender; alasan ditampilkan | IN-03, IN-04 |

---

# 3. Design brief

## 3.1 Brief (8 baris)

1. **Arah** — "Studio Kampus": lembar kerja studio desain, bukan dashboard perusahaan.
2. **Palet** — putih, tinta `#1F1F1F`, biru tua `#024D71`, oranye `#F17711` hanya untuk perhatian dan aksi utama.
3. **Tipografi** — Montserrat 400/600/700; monospace hanya untuk ID, jam, dan angka tabel.
4. **Layout** — grid 12 kolom, konten 1200px, garis rambut `#EAEAEA` sebagai pemisah, tanpa kartu bertumpuk.
5. **Bentuk** — radius 4px, tanpa shadow di permukaan datar, satu garis 1px menggantikan kotak.
6. **Gerak** — 120/220/420ms, hanya untuk umpan balik dan panel; tanpa animasi dekoratif.
7. **Suara** — bahasa Indonesia formal, "Anda", tombol = kata kerja, pesan menyebut langkah berikutnya.
8. **Momen yang diingat** — Papan Jadwal: ruangan sebagai baris, waktu sebagai sumbu, blok disetujui biru pekat, menunggu garis putus-putus oranye.

## 3.2 Lima prinsip

1. **Data jujur.** Tampilkan yang tercatat, bukan yang diharapkan.
2. **Satu aksi utama per layar.** Tombol oranye tidak pernah dua dalam satu pandangan.
3. **Status selalu kelihatan.** Badge hadir di daftar, detail, dan kartu surat.
4. **Garis, bukan kotak.** Pemisah 1px dan ruang kosong, bukan bayangan dan kapsul.
5. **Tidak berjanji lebih dari sistem.** Tanpa notifikasi otomatis, tanpa statistik, tanpa foto karangan.

## 3.3 Anti-pola yang dilarang

Gradien ungu/biru, glassmorphism, ilustrasi 3D, emoji sebagai ikon, kartu bertumpuk dengan shadow, istilah "dashboard/tiket/submit", tabel yang mengharuskan scroll horizontal, status hanya warna, carousel otomatis, foto stok orang, angka statistik tanpa sumber.

## 3.4 Nada bahasa

| Konteks | Contoh |
|---|---|
| Tombol | "Ajukan Peminjaman", "Lihat Status", "Unduh Surat" `[§5.4.1]` |
| Judul halaman | "Ruangan & Jadwal", "Pengajuan Saya" |
| Bantuan | "Waktu menggunakan WITA." `[AT-04]` |
| Peringatan | "Waktu yang dipilih bertabrakan dengan jadwal lain..." `[§9.1]` |
| Kosong | "Belum ada pengajuan." + tindakan berikutnya |

---

# 4. Sistem desain (token)

## 4.1 Token CSS

``css
:root {
  /* ── Warna: terverifikasi dari situs resmi IDB Bali (Elementor kit) ── */
  --c-ink:            #1F1F1F;   /* teks utama */
  --c-ink-2:          #54595F;   /* teks sekunder */
  --c-ink-3:          #959595;   /* HANYA dekoratif/disabled — 3.00:1 */
  --c-line:           #EAEAEA;   /* garis rambut, bukan batas kontrol */
  --c-surface:        #FFFFFF;
  --c-surface-2:      #F4F6F7;   /* turunan */
  --c-primary:        #024D71;
  --c-primary-hover:  #013A56;   /* turunan */
  --c-primary-soft:   #E6F1F6;   /* turunan */
  --c-accent:         #F17711;
  --c-accent-soft:    #FFF1DC;   /* turunan */
  --c-accent-ink:     #7A4300;   /* turunan */

  /* Aksen merek dari logotype resmi: teal & oranye logo.
     Dipakai untuk bidang identitas (hero, kartu gedung, garis footer),
     bukan untuk teks kecil di atas putih. */
  --c-brand:          #007C91;   /* putih di atasnya 4.89:1 */
  --c-brand-soft:     #E9F3F5;   /* turunan */
  --c-brand-orange:   #F7921D;   /* teks besar di #024D71: 3.95:1 */
  --c-brand-orange-soft: #FFF4E5;/* turunan */

  /* Status — semua ≥ 7:1 pada latarnya */
  --c-pending-bg:     #FFF1DC;  --c-pending-ink:  #7A4300;
  --c-success-bg:     #E4F2F0;  --c-success-ink:  #0B5450;
  --c-danger-bg:      #FBE9E9;  --c-danger-ink:   #8E1B1B;
  --c-neutral-bg:     #ECEEF0;  --c-neutral-ink:  #4A4F55;

  /* Batas kontrol: 4.13:1 di putih, 3.81:1 di surface-2 (memenuhi 3:1) */
  --c-border-strong:  #767E84;
  --c-focus:          #024D71;
  --c-focus-on-dark:  #F7921D;   /* warna logo, 3.95:1 di #024D71 */

  /* ── Tipografi ── */
  --font-sans: "Montserrat", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "Cascadia Mono", "SF Mono", Consolas, monospace;

  --fs-display: clamp(2.5rem, 1.3rem + 3.9vw, 4.25rem); /* hero beranda */
  --fs-h1: 1.75rem;   --fs-h2: 1.375rem;  --fs-h3: 1.125rem;
  --fs-body: 1rem;    --fs-sm: 0.875rem;  --fs-xs: 0.8125rem;
  --fs-micro: 0.75rem;

  --lh-tight: 1.15; --lh-snug: 1.35; --lh-body: 1.6;
  --tracking-label: 0.08em;

  /* ── Spasi (basis 4px) ── */
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px;

  /* ── Bentuk ── */
  --r-1: 4px;       /* default, mengikuti pola situs */
  --r-2: 8px;       /* modal, bottom sheet, dan kartu beranda */
  --r-full: 999px;  /* hanya titik status */

  --shadow-overlay: 0 8px 24px rgba(31,31,31,.12), 0 1px 2px rgba(31,31,31,.08);

  /* ── Gerak ── */
  --dur-1: 120ms; --dur-2: 220ms; --dur-3: 420ms;
  --ease: cubic-bezier(.2,.6,.2,1);

  /* ── Layout & kontrol ── */
  --w-content: 1200px;  --w-wide: 1360px;
  --h-control-sm: 32px; --h-control-md: 40px; --h-control-lg: 48px;
  --target-min: 44px;
}
``

## 4.2 Palet dan kontras terukur

Rasio dihitung dengan rumus WCAG 2.1 (bukan perkiraan).

| Pasangan | Rasio | Aman untuk |
|---|---|---|
| `#1F1F1F` di putih | **16.48:1** | Semua teks |
| `#54595F` di putih | **7.07:1** | Teks sekunder |
| `#959595` di putih | 3.00:1 | **Hanya** dekorasi/disabled |
| `#024D71` di putih | **9.12:1** | Teks, tombol |
| Putih di `#024D71` | **9.12:1** | Tombol primary |
| Putih di `#007C91` (teal logo) | 4.89:1 | Teks besar/tombol sekunder |
| `#F17711` di putih | 2.84:1 | **Bukan** untuk teks |
| `#1F1F1F` di `#F17711` | **5.80:1** | CTA oranye |
| `#7A4300` di `#FFF1DC` | **7.17:1** | Badge menunggu |
| `#0B5450` di `#E4F2F0` | **7.61:1** | Badge disetujui |
| `#8E1B1B` di `#FBE9E9` | **7.72:1** | Badge ditolak, error |
| `#4A4F55` di `#ECEEF0` | **7.11:1** | Badge dibatalkan |
| `#F7921D` di `#024D71` | 3.95:1 | Focus ring di permukaan gelap |
| `#767E84` di putih | 4.13:1 | Batas input (butuh ≥3:1) |

**Keputusan penting:**

- Tombol oranye memakai **teks gelap** `#1F1F1F` (5.80:1). Teks putih di oranye **gagal** (2.84:1) — jangan dipakai.
- `#959595` (token resmi situs) tidak dipakai untuk teks apa pun; hanya garis bantu dan teks nonaktif.
- `#EAEAEA` tidak dipakai sebagai batas input (1.39:1). Batas input memakai `#767E84`.
- **Aksen merek**: teal `#007C91` dan oranye logo `#F7921D` dipakai sebagai bidang identitas — sorotan judul hero (teks besar), kartu gedung, garis footer, dan cincin dekoratif. Oranye logo tidak dipakai untuk teks kecil.
- **Footer hitam**: footer memakai hitam tinta `#1F1F1F` dengan teks putih 70–76% (≥8.6:1). Logo memakai **varian putih resmi** `idb-bali-logo-w.png` langsung di atas hitam — tanpa plat atau latar tambahan. Logo full color tetap dipakai di header putih. Garis merek di atas footer: teal → oranye → putih.
- **Bentuk beranda**: kartu gedung, panel jadwal, dan CTA memakai radius 8px mengikuti pola kartu situs kampus; kontrol, input, dan badge tetap 4px agar konsisten dengan komponen formulir.

## 4.3 Tipografi

| Peran | Ukuran / line-height | Berat | Catatan |
|---|---|---|---|
| Display (Beranda) | `clamp(40→68)px` / 1.02 | 700 | Maks 2 baris; satu baris disorot oranye logo |
| H1 layar | 28px / 1.2 | 700 | Satu per halaman |
| H2 bagian | 22px / 1.35 | 600 | |
| H3 / judul kartu | 18px / 1.4 | 600 | |
| Body | 16px / 1.6 | 400 | Maks 68 karakter per baris |
| Body kecil / tabel | 14px / 1.5 | 400–500 | |
| Label form | 13px / 1.4 | 600 | |
| Eyebrow / label | 12px / 1.3 | 700 | Uppercase, tracking 0.08em |
| ID, jam, angka tabel | 13px / 1.5 | 400 | `font-family: var(--font-mono)` |

Aturan: maksimum 3 berat. Situs resmi memakai empat berat (400/500/600/700); aplikasi membatasi ke 400/600/700 agar hierarki tegas. Tanpa italic dekoratif. Angka dalam tabel memakai `font-variant-numeric: tabular-nums`.

## 4.4 Grid, spasi, bentuk

| Properti | Desktop ≥1024 | Tablet 768–1023 | Mobile <768 |
|---|---|---|---|
| Grid | 12 kolom | 8 kolom | 4 kolom |
| Gutter | 32px | 24px | 16px |
| Margin tepi | 40px | 24px | 16px |
| Konten | 1200px | 100% | 100% |
| Tabel petugas | 1280px | kartu | kartu |

Spasi hanya dari skala 4/8/12/16/24/32/48/64/96. Jarak antar bagian 56–64px di beranda, 32–48px di halaman kerja, dan 40px pada mobile; jarak label–input 6–8px; jarak input–pesan 6px.

## 4.5 Ikonografi

Ikon garis inline SVG, stroke 1.5px, ukuran 20px (dalam teks) atau 24px (navigasi). Ikon **selalu** berpasangan dengan teks, kecuali tombol tutup (dengan `aria-label`). Tanpa icon font, tanpa emoji.

## 4.6 Aksesibilitas minimum

- Target sentuh ≥ 44×44px `[MB-02]`.
- Focus ring 2px `#024D71` + offset 2px; di permukaan biru memakai `#F7921D`.
- Urutan tab mengikuti urutan visual; modal memerangkap fokus dan mengembalikannya saat ditutup.
- Kesalahan diumumkan (`role="alert"`), kolom ditautkan lewat `aria-describedby`.
- Status diumumkan dengan `aria-live="polite"` setelah simpan/keputusan.
- `prefers-reduced-motion` mematikan transisi panel.
- Tidak ada informasi yang hanya dibedakan warna `[MB-06]`.
- Halaman tetap terbaca pada zoom 200% dan lebar 320px.

---

# 5. Komponen

## 5.1 Tombol

| Varian | Latar | Teks | Batas | Dipakai untuk |
|---|---|---|---|---|
| Primary | `#024D71` | putih | – | Kirim, Setujui |
| Accent | `#F17711` | `#1F1F1F` | – | Satu CTA utama (Beranda, Ajukan) |
| Secondary | putih | `#1F1F1F` | 1px `#767E84` | Lihat jadwal, Batal |
| Ghost | transparan | `#024D71` | – | Tautan dalam teks, "Buka papan jadwal" |
| On-dark | transparan | putih | 1px putih 42% | Pasangan CTA di hero/band gelap |
| Danger | putih | `#8E1B1B` | 1px `#8E1B1B` | Tolak pengajuan |

Ukuran: 32px (dalam tabel), 40px (desktop), 44–48px (mobile, penuh lebar).

**Lima keadaan wajib** untuk setiap tombol: default, hover (gelap 8%), focus-visible (ring), active (tekan 1px), disabled (latar `#ECEEF0`, teks `#4A4F55`, kursor `not-allowed`), plus **loading** (spinner 16px + label "Mengirim…", tombol nonaktif, `aria-busy`).

Aturan: satu tombol primary/accent per pandangan. Tombol tidak pernah berisi dua aksi. Label memakai kata kerja `[§5.4.1]`.

## 5.2 Formulir

**Anatomi kolom**

``
Label *                         ← 13px/600
┌─────────────────────────────┐
│ Nilai / placeholder         │ ← tinggi 44px (mobile) / 40px (desktop)
└─────────────────────────────┘ ← batas 1px #767E84, radius 4px
Bantuan kecil                   ← 13px #54595F
Pesan kesalahan                 ← 13px #8E1B1B + ikon, di bawah kolom
``

**Aturan validasi**

| Waktu | Perilaku |
|---|---|
| Saat blur | Periksa kolom itu saja |
| Saat submit | Periksa semua; tampilkan ringkasan di atas + fokus ke kolom pertama yang salah |
| Setelah submit gagal | Pesan tetap sampai diperbaiki; isian tidak hilang |
| Saat mengetik ulang | Hapus kesalahan kolom setelah valid |

**Kolom dan perilakunya**

| Kolom | Jenis | Aturan UI | Dasar |
|---|---|---|---|
| Nama ORMAWA/Prodi | Teks | Wajib, maks 100 | AJ-02 |
| Nama mahasiswa | Teks | Wajib, maks 100 | AJ-02 |
| Nomor HP | Tel | Wajib, hanya angka/+/-/spasi, 8–15 digit | AJ-02 |
| Keperluan | Textarea | Wajib, 10–500 karakter, penghitung | AJ-02 |
| Ruangan | Select berkelompok per gedung | Wajib; opsi "Belum ada di daftar" terpisah dengan catatan | RG-06, RG-07 |
| Jumlah peserta | Number | Wajib, bilangan bulat ≥ 1; bantuan "Sesuaikan dengan kapasitas ruangan" | AJ-02 |
| Tanggal | Date | Wajib; **Minggu tidak bisa dipilih** | AT-01, AJ-04 |
| Waktu mulai / selesai | Time | Wajib; label "WITA"; selesai > mulai; tampilkan durasi | AT-03..05 |
| Kebutuhan alat | Checkbox + "Alat lain" | Opsional; catatan "tidak menjamin ketersediaan" | §7.1 |

**Urutan bagian (satu halaman, empat blok)**

1. **Peminjam** — ORMAWA/Prodi, nama, HP.
2. **Waktu & ruangan** — tanggal, mulai, selesai, ruangan, peserta.
3. **Keperluan** — keperluan, alat.
4. **Kirim** — ringkasan + pernyataan singkat + tombol.

Desktop: formulir 7 kolom + ringkasan sticky 4 kolom di kanan. Mobile: ringkasan dilipat di atas tombol kirim.

**Perilaku khusus**

- Tanggal Minggu: tanggal tetap terlihat tetapi nonaktif, dengan keterangan "Peminjaman ruangan tidak dapat dilakukan pada hari Minggu." `[§9.1]`
- Bentrok: banner `--c-pending-bg` di atas tombol kirim, berisi pesan PRD + kotak centang "Saya memahami jadwal akan diperiksa petugas" sebelum tombol aktif. **(usulan)**
- Ruangan tak terdaftar: catatan oranye "Pengajuan perlu diperiksa oleh petugas." `[§9.1]` dan **tidak** menampilkan klaim ketersediaan.
- Kirim: tombol nonaktif + spinner; permintaan diberi kunci idempotensi untuk mencegah pengajuan ganda `[AJ-10]`.
- Gagal: banner merah di atas, fokus ke banner, isian utuh, tombol "Coba kirim lagi" `[AJ-09]`.

## 5.3 Kartu ruangan

``
┌──────────────────────────────────────────────┐
│ AULA                            Gedung A     │  ← H3 + label gedung
│ ──────────────────────────────────────────── │
│ Hari ini · 3 peminjaman tercatat             │
│ 08.00–11.00  ██ Disetujui                    │
│ 13.00–15.00  ░░ Menunggu pemeriksaan         │
│ ──────────────────────────────────────────── │
│ [ Lihat jadwal ]        [ Ajukan di sini ]   │
└──────────────────────────────────────────────┘
``

Tanpa foto. Tanpa kapasitas (data belum ada). Tanpa label "Tersedia".

## 5.4 Tabel pengajuan (petugas)

Kolom: **ID · Peminjam · ORMAWA/Prodi · Ruangan · Tanggal · Waktu · Peserta · Status · Aksi**

- Header sticky, tinggi baris 56px, garis 1px antar baris (tanpa zebra).
- ID dan waktu memakai monospace agar rata.
- Status memakai badge, bukan teks polos.
- Baris dapat diklik; "Periksa" tetap ada untuk keyboard.
- Badge Menunggu menampilkan umur pengajuan (mis. "2 hari") sebagai alat pantau risiko keterlambatan `[§17.1]`. **(usulan)**
- Mobile: kartu dengan pasangan label–nilai; filter status menjadi chip; tanpa scroll horizontal `[MB-07]`.

## 5.5 Badge status

| Status | Latar | Teks | Titik |
|---|---|---|---|
| Menunggu Pemeriksaan | `#FFF1DC` | `#7A4300` | `#F17711` |
| Disetujui | `#E4F2F0` | `#0B5450` | `#0B5450` |
| Ditolak | `#FBE9E9` | `#8E1B1B` | `#8E1B1B` |
| Dibatalkan | `#ECEEF0` | `#4A4F55` | `#4A4F55` |

Bentuk: radius 4px, padding 4×8, teks 12px/700, uppercase tracking 0.06em, titik 6px. **Dibatalkan hanya dirender jika kebijakan pembatalan sudah ditetapkan** `[PB-01]`.

## 5.6 Papan Jadwal (komponen tanda tangan)

``
┌───────────────────────────────────────────────────────────────┐
│ Ruangan & Jadwal     [24 Okt 2026 ▾]  [Semua gedung ▾]  [cari]│
│ [ Papan ]  [ Daftar ]                                         │
├──────────────┬────────────────────────────────────────────────┤
│              │ 07   08   09   10   11   12   13   14   15   16 │
│ Gedung A     │                                                │
│ Aula         │      █████████████       ░░░░░░░░              │
│ Studio Pola  │                                     ██████     │
│ Lab 2C       │ ░░░░                                           │
├──────────────┴────────────────────────────────────────────────┤
│ █ Disetujui   ░ Menunggu   ▨ Bentrok                          │
│ Belum ada jadwal tercatat bukan berarti ruangan otomatis      │
│ tersedia.                                                     │
└───────────────────────────────────────────────────────────────┘
``

- Sumbu waktu dibaca dari konfigurasi jam operasional — **jangan hardcode 07–21** `[AT-06]`.
- Blok disetujui: `#024D71`, teks putih, radius 4px.
- Blok menunggu: `#FFF1DC`, garis putus 1.5px `#F17711`, teks `#7A4300`.
- Bentrok: dua blok bertumpuk + pola garis miring + label "Bentrok" `[JD-03]`.
- Garis "sekarang": 1px `#F17711` + titik, hanya untuk tanggal hari ini.
- Di luar jam operasional: pola garis tipis, tidak dapat diklik.
- Mobile: komponen berubah menjadi **agenda vertikal per ruangan**; pemilih tanggal sticky di atas.

## 5.7 Notifikasi dan pesan

**Empat wujud, empat fungsi**

| Wujud | Dipakai untuk | Perilaku |
|---|---|---|
| Toast | Konfirmasi singkat (berhasil kirim, berhasil putuskan) | 4 detik, dapat ditutup, `aria-live` |
| Banner | Kondisi yang mengubah alur (bentrok, sesi habis, gagal simpan) | Tetap sampai diperbaiki/ditutup |
| Inline | Kesalahan kolom | Menetap sampai diperbaiki `[MB-05]` |
| Modal | Keputusan dan konfirmasi merusak | Fokus terperangkap, Esc menutup, aksi sekunder di kiri |

**Peta pesan (teks persis PRD §9.1 / §11.2)**

| Kondisi | Pesan | Wujud | Aksi |
|---|---|---|---|
| Berhasil kirim | "Pengajuan berhasil dikirim dan sedang menunggu pemeriksaan." | Toast + detail | Lihat pengajuan |
| Data belum lengkap | "Mohon lengkapi kolom yang wajib diisi sebelum mengirim pengajuan." | Banner + inline | Fokus kolom pertama |
| Hari Minggu | "Peminjaman ruangan tidak dapat dilakukan pada hari Minggu." | Inline tanggal | – |
| Waktu salah | "Waktu selesai harus lebih akhir daripada waktu mulai. Silakan periksa kembali." | Inline waktu | – |
| Bentrok | "Waktu yang dipilih bertabrakan dengan jadwal lain. Silakan pilih waktu berbeda atau tunggu pemeriksaan petugas." | Banner | Ganti waktu / lanjut |
| Ruangan belum terdaftar | "Ruangan ini belum tercantum dalam daftar. Pengajuan perlu diperiksa oleh petugas." | Inline ruangan | – |
| Menunggu | "Pengajuan sedang menunggu pemeriksaan Bagian Kemahasiswaan." | Panel status | – |
| Disetujui | "Pengajuan peminjaman ruangan Anda telah disetujui." | Panel status | Unduh surat |
| Ditolak | "Pengajuan peminjaman ruangan Anda ditolak. Silakan periksa alasan yang diberikan." | Panel status | Lihat alasan |
| Surat belum ada | "Surat belum tersedia karena pengajuan belum disetujui atau surat masih diproses." | Kartu surat | – |
| Surat siap | "Surat peminjaman telah tersedia dan dapat diunduh." | Toast + kartu | Unduh PDF |
| Gagal simpan | "Pengajuan belum berhasil disimpan. Silakan coba kembali." | Banner | Coba lagi |
| Gagal buat surat | "Surat belum berhasil dibuat. Silakan coba kembali atau hubungi petugas." | Kartu surat | Coba lagi |
| Sesi habis | "Sesi Anda telah berakhir. Silakan masuk kembali." | Banner | Masuk |
| Gangguan | "Terjadi kendala saat memproses permintaan. Silakan coba kembali beberapa saat lagi." | Banner halaman | Coba lagi |
| Belum masuk | "Silakan masuk untuk melanjutkan." | Halaman masuk | – |
| Kredensial salah | "Informasi masuk tidak sesuai. Silakan periksa kembali." | Inline | – |
| Tidak berizin | "Anda tidak memiliki izin untuk membuka halaman ini." | Halaman 403 | Kembali |
| Bukan miliknya | "Pengajuan tidak ditemukan atau Anda tidak memiliki izin untuk melihatnya." | Halaman 404 | Kembali |

Aturan: pesan gagal **tidak** boleh menampilkan detail sistem atau data pribadi `[§9.2]`; pesan berhasil hanya muncul setelah server mengonfirmasi.

## 5.8 Modal keputusan (petugas)

``
┌──────────────────────────────────────────────┐
│ Setujui pengajuan?                     [×]   │
│ ──────────────────────────────────────────── │
│ Aula · 24 Okt 2026 · 08.00–11.00 WITA        │
│ UKM Fotografi · 40 peserta                   │
│                                              │
│ ☐ Saya sudah memeriksa jadwal ruangan ini.   │
│                                              │
│ Jadwal lain pada waktu ini: 1 menunggu       │
│                                              │
│                    [Batal]  [Setujui]        │
└──────────────────────────────────────────────┘
``

Tombol Setujui nonaktif sampai centang diisi — cara memaksa AP-04 secara jujur, bukan sekadar mengingatkan. **(usulan)**

Untuk penolakan: textarea alasan (opsional, dianjurkan), penghitung 0/300, tombol "Tolak Pengajuan" berwarna danger.

## 5.9 Kartu surat

| Status | Isi kartu | Aksi |
|---|---|---|
| Menunggu | "Surat belum tersedia karena pengajuan belum disetujui..." | – |
| Ditolak | "Pengajuan ditolak, surat tidak dibuat." | – |
| Disetujui, diproses | "Surat sedang dibuat." + indikator | Muat ulang |
| Gagal | Pesan gagal + penjelasan | Coba lagi |
| Siap | Nama berkas + ukuran + waktu dibuat | **Unduh Surat (PDF)** |

Setelah unduh: catatan "Cetak tiga salinan untuk Bagian Akademik, Bagian IT, dan Security." `[§6.5]`

Tata letak surat **tidak** dirancang di sini — mengikuti template resmi `[SR-05]`, dan wajib menyertakan "-" bila tidak ada alat `[SR-04]`.

## 5.10 Matriks keadaan

| Komponen | Kosong | Memuat | Gagal | Sebagian | Sukses |
|---|---|---|---|---|---|
| Daftar ruangan | "Daftar ruangan belum tersedia." | 6 kartu skeleton | Banner + coba lagi | Sebagian ruangan tanpa jadwal | Daftar + jadwal |
| Papan jadwal | "Belum ada jadwal tercatat pada tanggal ini." | Sumbu + baris skeleton | Banner + coba lagi | Sebagian ruangan dimuat | Blok jadwal |
| Formulir | – | Tombol spinner | Banner, isian utuh | Ruangan belum terdaftar | Redirect detail |
| Pengajuan Saya | "Belum ada pengajuan." + CTA | 4 baris skeleton | Banner + coba lagi | – | Daftar + badge |
| Detail | – | Skeleton judul + isi | Halaman error | Surat belum siap | Detail + surat |
| Daftar petugas | "Tidak ada pengajuan pada filter ini." | 8 baris skeleton | Banner + coba lagi | – | Tabel |
| Detail petugas | – | Skeleton | Halaman error | Jadwal belum termuat | Data + panel jadwal |
| Surat | Belum tersedia | "Surat sedang dibuat." | Gagal + coba lagi | – | Unduh |

## 5.11 Anggaran umpan balik

| Durasi | Yang terlihat |
|---|---|
| 0–100ms | Tombol berubah state (tekan), tidak ada spinner |
| 100ms–1s | Skeleton untuk daftar; spinner hanya untuk aksi tombol |
| 1–10s | Spinner + label tindakan ("Mengirim…", "Menyimpan…") |
| >10s (pembuatan surat) | Status pekerjaan + tombol muat ulang; **tanpa** estimasi waktu karangan |

---

# 6. Identitas IDB Bali

## 6.1 Metode dan sumber

| Fakta | Sumber |
|---|---|
| Warna UI `#024D71`, `#F17711`, `#1F1F1F`, `#54595F`, `#EAEAEA`, `#959595` | Token Elementor pada CSS situs resmi `idbbali.ac.id` **(terverifikasi)** |
| Font Montserrat (semua varian tipografi), berat 400/500/600/700 | Token tipografi situs resmi **(terverifikasi)** |
| Header putih, garis bawah 1px `#EAEAEA`, konten 1200px | CSS situs resmi **(terverifikasi)** |
| Radius dominan 4px | Sebaran `border-radius` pada CSS situs (102 kemunculan) **(terverifikasi)** |
| Warna mark: teal `#007C91`, oranye `#F7921D`, wordmark `#3A3A3C` | Sampling piksel pada logo PNG resmi **(terverifikasi)** |
| Aturan logo: crest + wordmark, clear space, ukuran minimum, 3 konfigurasi warna, format PNG/SVG | Halaman `idbbali.ac.id/logo/` **(terverifikasi)** |

Catatan metode: halaman situs tidak dapat dirender otomatis dari mesin ini (Cloudflare menolak akses non-peramban). Karena itu identitas dinilai dari **berkas logo resmi + CSS publik + halaman panduan logo**, bukan dari tangkapan layar. Tidak ada warna atau font yang saya tebak.

## 6.2 Logo

**Yang sudah pasti dari panduan resmi:**

- Logo terdiri atas **Logo Primer** dan **Logo Sekunder**; masing-masing memuat **Crest** (logogram) dan **Word Marque** (penanda tulisan). Pada Logo Primer, keduanya **tidak boleh dipisahkan**.
- **Clear space** = ruang kosong di sekeliling logo seukuran huruf "A" pada *word crest*.
- Tersedia **tiga konfigurasi warna**: Full Color, Flat Color, Black & White.
- Format: **PNG** untuk layar (latar transparan, tidak dapat diperbesar melebihi ukuran asli) dan **SVG** untuk cetak resolusi tinggi (berbasis vektor). Catatan: teks panduan menyebut ".PNG dan .EPS", sedangkan keterangan format dan berkas unduhan memakai **.SVG** — perlu dikonfirmasi mana yang berlaku untuk cetak.
- Ukuran minimum ditetapkan pada **gambar** panduan; angka pastinya tidak tertulis di teks halaman, jadi harus diverifikasi dari berkas panduan sebelum rilis.

**Aturan pakai di aplikasi (usulan):**

| Tempat | Ukuran | Konfigurasi |
|---|---|---|
| Header publik | tinggi 32px (desktop), 28px (mobile) | Full color |
| Footer | 28px | Full color |
| Halaman masuk petugas | 32px | Full color |
| Favicon | dari aset favicon resmi | – |
| Di atas warna gelap | varian putih resmi `idb-bali-logo-w.png`; jangan membalik/memfilter logo | Putih transparan |
| Footer hitam | tinggi 56px | Varian putih resmi, tanpa plat |

Dilarang: memisahkan crest dari wordmark, meregangkan/memiringkan, mengubah warna, menaruh di atas foto, atau menambahkan efek.

## 6.3 Warna: merek vs token antarmuka

Ada dua keluarga warna yang **berbeda** di sumber resmi:

| Peran | Warna merek (logo) | Token UI (situs) |
|---|---|---|
| Teal/biru | `#007C91` | `#024D71` |
| Oranye | `#F7921D` | `#F17711` |
| Abu wordmark | `#3A3A3C` | `#1F1F1F` |

Rekomendasi: **jangan pernah mewarnai ulang logo**. Untuk antarmuka, pakai token situs (`#024D71`, `#F17711`) karena kontrasnya sudah terukur dan konsisten dengan halaman kampus. Selisih nuansa ini perlu diputuskan kampus: apakah oranye UI harus mengikuti logo (`#F7921D`) atau tetap token situs (`#F17711`). **(PERLU KONFIRMASI)**

## 6.4 Tipografi kampus

Montserrat adalah satu-satunya keluarga font di situs resmi. Karena itu aplikasi memakai Montserrat, bukan font tren. Monospace hanya untuk data teknis (ID pengajuan, jam pada tabel/papan) agar kolom rata — bukan untuk teks atau tombol.

## 6.5 Karakter visual yang dipertahankan

| Diambil dari kampus | Wujud di aplikasi |
|---|---|
| Kampus desain & bisnis | Grid editorial, tipografi besar, penomoran 01/02/03 |
| Logo dua warna | Biru tua sebagai struktur, oranye sebagai aksen tunggal |
| Header putih bergaris | Header 1px `#EAEAEA`, tanpa bayangan |
| Sudut kecil (4px) | Semua permukaan dan kontrol |
| Bahasa Indonesia formal | Semua label, pesan, dan tombol |

## 6.6 Aset yang belum ada — jangan dibuat-buat

| Aset | Status | Sementara |
|---|---|---|
| Foto ruangan | Tidak ada di PRD | Kartu tipografis tanpa foto |
| Kode ruangan | Belum ditetapkan `[RG-06]` | Tampilkan nama + gedung saja |
| Kapasitas ruangan | Tidak ada di PRD | Tidak ditampilkan; hanya saran teks |
| Template surat resmi | Belum diberikan `[§17.3]` | Surat ditahan sampai template disetujui |
| Maskot/ilustrasi | Belum terverifikasi | Tidak dipakai |

---

# 7. Rancangan responsif

## 7.1 Titik henti

| Nama | Lebar | Perilaku kunci |
|---|---|---|
| Compact | < 480px | 1 kolom, tombol penuh, sheet |
| Mobile | 480–767px | 1 kolom, ringkasan dilipat |
| Tablet | 768–1023px | 8 kolom, rail petugas menyempit jadi ikon+label |
| Desktop | 1024–1279px | 12 kolom, formulir 7+4 |
| Wide | ≥ 1280px | Konten 1200px, tabel petugas 1280px |

## 7.2 Per layar

| Layar | Desktop | Tablet | Mobile |
|---|---|---|---|
| Beranda | Bilah merek + hero gelap 2 kolom + papan pratinjau; 4 kartu gedung; jadwal hari ini 2 kolom | Hero 1 kolom, papan di bawah, kartu gedung 2 kolom | Bilah merek ringkas, CTA penuh lebar, kartu 1 kolom, jadwal menumpuk |
| Ruangan & Jadwal | Papan + filter horizontal | Papan, filter 2 baris | Agenda vertikal + chip tanggal, filter di sheet |
| Formulir | 7 kolom + ringkasan sticky | 8 kolom, ringkasan di bawah | 1 kolom, ringkasan dilipat, tombol sticky |
| Pengajuan Saya | Kartu 2 kolom | 2 kolom | 1 kolom |
| Detail | Dua kolom (data + surat) | 1 kolom | 1 kolom, aksi di bawah |
| Daftar petugas | Tabel penuh | Tabel ringkas (kolom prioritas) | Kartu + chip filter |
| Detail petugas | Data + panel jadwal | Panel jadwal di bawah data | Panel jadwal sebagai bagian kedua, aksi sticky |
| Surat | Kartu + pratinjau | Kartu | Kartu, tombol penuh |

Pada layar pendek (tinggi ≤ 820px, lebar ≥ 1024px), hero dirapatkan — judul, jarak, dan padding diperkecil — agar seluruh isi hero termasuk ringkasan tetap terlihat tanpa terpotong lipatan. Tinggi ≤ 680px (umumnya laptop dengan skala 125–150%) memakai kerapatan tambahan. Tidak ada isi yang disembunyikan.

## 7.3 Pola adaptasi

- **Tabel → kartu**: setiap sel menjadi pasangan label–nilai; kolom kunci (ID, status, waktu) di atas.
- **Panel → bottom sheet**: filter, ringkasan, dan keputusan petugas di mobile.
- **Aksi utama → sticky bar** di bawah, dengan `padding-bottom: env(safe-area-inset-bottom)`.
- **Tanpa scroll horizontal** di semua layar `[MB-07]`.
- **Papan jadwal tidak diperkecil**; ia berubah bentuk, bukan mengecil.

## 7.4 Sentuh dan papan ketik

- Target ≥44px, jarak antar target ≥8px `[MB-02]`.
- Keyboard mobile: kolom aktif digulir ke tengah, tombol kirim tidak tertutup.
- Pemilih tanggal mendukung navigasi panah dan Esc.
- Semua aksi punya jalur keyboard; tidak ada klik-only.

---

# 8. Prioritas pengerjaan

## 8.1 Prinsip

Mengikuti tahapan PRD §15.1 (A–G). Desain berjalan **satu tahap di depan** pengembangan, tidak lebih, agar keputusan kampus tidak terlanjur dikunci di mockup.

## 8.2 Gelombang 0 — Persiapan (blocker)

`[PRD §15.1 A, §17.2, §17.3]`

| Harus ada sebelum desain final | Dipakai untuk | ID |
|---|---|---|
| Daftar ruangan + kode resmi | Nama, filter, pemilih ruangan | RG-06, INT-02 |
| Jam operasional | Sumbu papan jadwal, validasi waktu | AT-06 |
| Format surat resmi + pejabat | Surat PDF | SR-05, SR-06 |
| Metode masuk & masa sesi | Gerbang akses, identitas peminjam | AK-07 |
| Kebijakan pembatalan/perubahan | Tombol & status "Dibatalkan" | PB-01 |
| Pihak pemelihara jadwal | Sumber data jadwal, label "perlu diperiksa" | JD-06 |
| Kapasitas ruangan | Bantuan jumlah peserta | AJ-02 |

Selama menunggu, desain memakai placeholder yang **jelas ditandai**, bukan data karangan.

## 8.3 Gelombang 1 — Fitur utama (P0)

`[§15.1 B]`

| Fitur | Layar | ID | Selesai bila |
|---|---|---|---|
| Fondasi visual + navigasi | Semua | – | Token, tombol, form, badge siap; 360px & 1440px lolos |
| Beranda | `/` | §5.2 | CTA ke ruangan & formulir; tanpa klaim palsu |
| Ruangan & Jadwal | `/ruangan` | RG-01..05, RG-07 | Papan + daftar; label "belum ada jadwal tercatat"; filter tanggal/gedung |
| Formulir + validasi | `/ajukan` | AJ-01..10, AT-01..05, MB-01..08 | 4 gerbang validasi bekerja; tidak ada sukses palsu; anti pengajuan ganda |
| Simpan + ID + status awal | `/ajukan` → detail | AJ-06..09, ST-01..03 | ID tampil; status Menunggu; isian bertahan saat gagal |
| Pengajuan Saya | `/pengajuan` | ST-01, ST-07, IN-05 | Hanya milik sendiri; kosong/loading/gagal ada |

## 8.4 Gelombang 2 — Pemeriksaan (P1)

`[§15.1 C]`

| Fitur | Layar | ID | Selesai bila |
|---|---|---|---|
| Gerbang akses petugas | `/masuk`, `/tidak-berizin` | AK-01..06, SEC-01..03 | URL langsung ditolak; pesan PRD tampil |
| Daftar pengajuan | `/petugas` | AP-01, PT-01..04 | Filter status + cari; umur pengajuan terlihat |
| Detail + pemeriksaan jadwal | `/petugas/[id]` | AP-02..04, PT-05/06, JD-01..02, JD-06 | Pengajuan lain pada slot sama terlihat |
| Keputusan | modal | AP-05..08 | Alasan, audit, larangan keputusan ganda |
| Status & riwayat | detail + `/petugas/riwayat` | ST-02..06, PT-07 | Timeline + alasan tampil |
| Kelola ruangan **(provisional)** | `/petugas/ruangan` | RG-08, NF-07 | Perlu keputusan cakupan (§11) |

## 8.5 Gelombang 3 — Surat (P1)

`[§15.1 D]`

| Fitur | ID | Selesai bila |
|---|---|---|
| Kartu surat & status | IN-03, IN-04 | Alasan "belum tersedia" spesifik |
| Pembuatan PDF | SR-01..03, SR-07, SR-09 | Hanya setelah disetujui; data sesuai |
| Alat kosong "-" | SR-04 | Sesuai contoh surat kampus |
| Gagal & coba lagi | SR, §9.1 | Tidak ada surat setengah jadi |
| Larangan surat dini | SR-08 | Menunggu/ditolak tidak punya tombol unduh |

## 8.6 Gelombang 4 — Uji & rilis (P1)

`[§15.1 E–G]`

Uji 15 skenario §14.1, audit aksesibilitas (kontras, fokus, 200% zoom), uji cetak PDF, uji perangkat nyata 360px, uji coba 5 peminjam + 2 petugas, perbaikan, rilis.

## 8.7 Definition of done untuk lima area kritis

**Validasi formulir**
- Wajib, Minggu, dan selesai > mulai bekerja di klien **dan** server.
- Pesan memakai teks PRD; kesalahan muncul di dekat kolom `[MB-05]`.
- Simpan gagal tidak pernah memunculkan status atau toast sukses `[AJ-09]`.
- Klik ganda tidak menghasilkan dua pengajuan `[AJ-10]`.

**Bentrok jadwal**
- Formulir memperingatkan sebelum kirim dan menyebut konsekuensinya.
- Petugas melihat semua pengajuan pada slot yang sama, termasuk yang menunggu.
- Persetujuan kedua pada slot bentrok diblokir sampai ada penyelesaian `[JD-03]`.
- Jadwal berubah setelah persetujuan hanya lewat pihak berwenang dan tercatat `[§7.2]`.

**Status pengajuan**
- Empat status dengan teks + warna + titik; tidak dapat diubah peminjam `[ST-06]`.
- Riwayat menyimpan perubahan penting + waktu `[ST-05]`.
- Tampilan diperbarui setelah simpan berhasil `[NF-03]`, bukan optimistis.

**Hak akses**
- Pemeriksaan di sisi pemrosesan, bukan hanya sembunyikan tombol `[AK-06]`.
- Peminjam tidak dapat membuka pengajuan lain, termasuk lewat URL `[AK-03]`.
- Pesan 401/403/404 memakai teks PRD, tanpa membocorkan keberadaan data.

**Surat PDF**
- Tidak ada surat sebelum persetujuan tersimpan `[SR-01, SR-08]`.
- Semua kolom wajib ada; alat kosong ditulis "-" `[SR-03, SR-04]`.
- Format mengikuti template resmi; tidak ada pejabat/tanda tangan karangan `[SR-06]`.
- Gagal membuat surat menampilkan pesan + cara mencoba lagi `[§6.5]`.

## 8.8 Sengaja belum dikerjakan

| Hal | Alasan |
|---|---|
| Pembatalan mandiri & perubahan pengajuan | Bukan wajib rilis inti; menunggu kebijakan `[§6.8]` |
| Persetujuan otomatis | Ditolak PRD `[§3.4]` |
| Notifikasi WhatsApp/email otomatis | Belum ada akses & mekanisme `[INT-05]` |
| Integrasi akun/akademik | Belum disetujui `[INT-06]` |
| Tanda tangan digital | Belum ditetapkan `[§3.4]` |
| Inventaris alat lengkap | Di luar cakupan `[§3.4]` |
| Dashboard statistik | Tidak ada kebutuhan di PRD |

---

# 9. Kriteria penerimaan desain

Mengacu pada 15 pengujian `[PRD §14.1]`, ditambah pemeriksaan desain.

| # | Pengujian PRD | Pemeriksaan desain |
|---|---|---|
| 1 | Buka daftar ruangan | Hanya ruangan terkonfirmasi tampil; kosong punya penjelasan |
| 2 | Periksa jadwal | Label "tercatat", bukan "tersedia"; legenda ada |
| 3 | Kirim formulir lengkap | Status Menunggu + ID terlihat, bukan "disetujui" |
| 4 | Kirim tidak lengkap | Ringkasan + inline + fokus otomatis |
| 5 | Pilih hari Minggu | Tanggal nonaktif + pesan PRD |
| 6 | Waktu tidak sesuai | Pesan PRD + durasi tidak dihitung |
| 7 | Jadwal bertabrakan | Peringatan + penanda di papan + panel petugas |
| 8 | Buka sebagai peminjam | Hanya milik sendiri; URL lain → pesan PRD |
| 9 | Beri keputusan | Modal + konfirmasi jadwal + audit |
| 10 | Status terbaru | Badge & timeline konsisten di daftar dan detail |
| 11 | Unduh sebelum disetujui | Tombol tidak ada; alasan jelas |
| 12 | Unduh setelah disetujui | Nama berkas, ukuran, waktu; panduan cetak 3 salinan |
| 13 | Akses petugas tanpa izin | 403 dengan pesan PRD |
| 14 | Gunakan di ponsel | 360px: tanpa scroll horizontal, target 44px, formulir selesai |
| 15 | Kegagalan simpan | Banner, isian utuh, tanpa status sukses |

**Tambahan pemeriksaan desain**

- Semua pasangan teks ≥4.5:1; batas kontrol ≥3:1.
- Fokus terlihat di semua kontrol, termasuk tombol ikon.
- Status tidak pernah hanya warna.
- Setiap daftar punya keadaan kosong, memuat, gagal, sebagian.
- Zoom 200% tidak memotong informasi atau tombol.
- Tidak ada teks Inggris di antarmuka ("submit", "dashboard", "ticket").
- Tidak ada janji fitur yang belum ada.

---

# 10. Risiko desain dan mitigasi

| Risiko `[§17.1]` | Gejala di UI | Mitigasi desain |
|---|---|---|
| Nama ruangan berbeda antar sumber | Peminjam salah pilih | Satu sumber nama; tanpa alias; kode menyusul |
| Jadwal tidak diperbarui | Papan terlihat kosong padahal terpakai | Label "tercatat", tanggal data, ajakan verifikasi petugas |
| Petugas lambat | Pengajuan menua | Urutan terlama + penanda umur di daftar |
| Format surat tidak sesuai | Surat tidak dapat dipakai | Surat ditahan sampai template disetujui |
| Hak akses belum jelas | Data pribadi terbuka | Halaman 403, tanpa data di shell, pemeriksaan server |
| Data hilang | Riwayat hilang | Status gagal eksplisit, tanpa klaim sukses |
| Peminjam belum paham | Formulir salah isi | 3 langkah di Beranda + bantuan inline + pesan spesifik |
| Integrasi belum ada | Pengguna menunggu notifikasi | Tidak ada janji notifikasi di UI |

---

# 11. Hal yang perlu dikonfirmasi (blocking)

`[PRD §17.3 + turunan]`

| # | Pertanyaan | Dampak ke desain | Placeholder saat ini |
|---|---|---|---|
| 1 | Metode masuk: akun kampus atau cara lain? | Isi halaman masuk, identitas "Pengajuan Saya" | Shell masuk tanpa field final |
| 2 | Siapa memperbarui jadwal? | Sumber data papan, label "perlu diperiksa" | Data dianggap dari petugas |
| 3 | Jam operasional? | Sumbu waktu, validasi di luar jam | Dari konfigurasi, bukan hardcode |
| 4 | Aturan pembatalan & perubahan? | Status "Dibatalkan", tombol batal | Tidak ditampilkan |
| 5 | Format surat resmi? | Tata letak PDF, daftar penerima, pejabat | Surat ditahan |
| 6 | Semua ruangan masih dapat diajukan? | Isi daftar & pemilih | Daftar awal PRD, ditandai belum final |
| 7 | Notifikasi WhatsApp pada rilis pertama? | Apakah ada preferensi notifikasi | Tidak ada |
| 8 | Masa simpan data? | Teks kebijakan, arsip | Tidak ditampilkan |
| 9 | Prosedur saat sistem mati? | Banner gangguan + kontak | Pesan umum |
| 10 | Warna oranye UI: `#F17711` atau `#F7921D`? | Token aksen | `#F17711` (token situs) |
| 11 | Kapasitas per ruangan? | Validasi jumlah peserta | Tidak ada batas, hanya saran |
| 12 | Apakah "Kelola Ruangan" masuk rilis inti? | Layar tambahan RG-08 | Provisional, belum dihitung P0 |

**Rekomendasi urutan keputusan:** 1 → 6 → 3 → 5 → 4 → 2 → 7–12. Empat pertama menentukan apakah Gelombang 1 bisa dibangun tanpa rework.

---

# Lampiran A — Wireframe

## A.1 Beranda (desktop)

``
┌────────────────────────────────────────────────────────────────────────┐
│ ▪ IDB BALI / Denpasar, Bali         Sab, 24 Okt 2026 · WITA · Situs ↗  │
├────────────────────────────────────────────────────────────────────────┤
│ [LOGO]  Beranda  Ruangan & Jadwal  Pengajuan Saya   [Masuk]  [Ajukan]  │
├────────────────────────────────────────────────────────────────────────┤
│ SISTEM PEMINJAMAN RUANGAN · IDB BALI      ┌──────────────────────────┐ │
│                                            │ PAPAN JADWAL   HARI INI │ │
│ Ruang kampus,                              │ Sab, 24 Okt 2026        │ │
│ satu alur.            ← oranye logo        │     08  10  12  14  16  │ │
│                                            │ Aula ███     ░░        │ │
│ Lihat jadwal yang sudah tercatat, kirim    │ Lab  ██                │ │
│ pengajuan, lalu pantau keputusan Bagian    │ Lect.   ██             │ │
│ Kemahasiswaan dalam satu tempat.           └──────────────────────────┘ │
│                                                                        │
│ [Ajukan Peminjaman]  [Lihat ruangan & jadwal →]                        │
│ Jam contoh 07.00–18.00 WITA · Minggu tidak menerima · Data contoh      │
├────────────────────────────────────────────────────────────────────────┤
│ 29 Ruangan · 20 Pengajuan tercatat · 11 Disetujui · 8 Menunggu         │
├────────────────────────────────────────────────────────────────────────┤
│ JELAJAHI RUANGAN                          Buka semua ruangan →         │
│ Satu kampus, empat area.                                               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│ │ 9        │ │ 8        │ │ 9        │ │ 3        │  bidang: biru,     │
│ │ Gedung A │ │ Rektorat │ │ NMC      │ │ Tambahan │  teal, oranye, ink │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
├────────────────────────────────────────────────────────────────────────┤
│ JADWAL HARI INI                     ┌────────────────────────────────┐ │
│ Yang tercatat untuk hari ini.       │ 08.00–09.00 Lab iMac  [Disetujui]│ │
│                                     │ 08.00–11.00 Aula      [Disetujui]│ │
│ ● Disetujui   ◌ Menunggu            │ 09.00–10.00 Lecture 1A[Disetujui]│ │
│ [Buka papan jadwal →]               │ 09.00–11.00 Lecture 2A[Menunggu] │ │
│                                     └────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ ALUR PENGAJUAN — Tiga langkah, satu keputusan.                         │
│ 01 Pilih ruangan ── 02 Ajukan & tunggu ── 03 Gunakan setelah disetujui │
├────────────────────────────────────────────────────────────────────────┤
│ ╔════════════════════════════════════════════════════════════════════╗ │
│ ║ Siap mengajukan ruangan?        [Mulai pengajuan] [Baca catatan]   ║ │
│ ╚════════════════════════════════════════════════════════════════════╝ │
├────────────────────────────────────────────────────────────────────────┤
│ SEBELUM MENGAJUKAN — empat catatan (2×2)                               │
├────────────────────────────────────────────────────────────────────────┤
│ ▬▬▬ teal ▬▬▬ oranye ▬▬▬ putih — garis merek (footer hitam #1F1F1F)    │
│ [LOGO putih] Institut...  SISTEM   PANDUAN   KAMPUS                   │
│ Jl. Tukad Batanghari   Beranda     Alur         Situs resmi ↗          │
│ No. 29 Panjer          Ruangan     Sebelum      Fasilitas ↗            │
│ Denpasar — Bali 80225  Ajukan      Masuk petugas Kalender ↗            │
│ © 2026 IDB Bali        Prototipe desain — data contoh                  │
└────────────────────────────────────────────────────────────────────────┘
``

## A.2 Formulir (mobile 360px)

``
┌────────────────────────────────────┐
│ ←  Ajukan Peminjaman               │
│ ● Peminjam   2 Waktu   3 Kirim     │
├────────────────────────────────────┤
│ Nama ORMAWA/Prodi *                │
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ └────────────────────────────────┘ │
│ Nama mahasiswa *                   │
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ └────────────────────────────────┘ │
│ Nomor HP *                         │
│ ┌────────────────────────────────┐ │
│ │ 08                             │ │
│ └────────────────────────────────┘ │
│                                    │
│ Tanggal *                          │
│ ┌────────────────────────────────┐ │
│ │ 24/10/2026                 [▦] │ │
│ └────────────────────────────────┘ │
│ ⓘ Minggu tidak dapat dipilih.      │
│                                    │
│ Waktu *                      WITA  │
│ ┌──────────┐  ┌──────────────────┐ │
│ │ 08.00 ▾  │– │ 11.00 ▾          │ │
│ └──────────┘  └──────────────────┘ │
│ ⓘ Durasi 3 jam.                    │
│                                    │
│ ┌ Ringkasan · Aula, 24 Okt ─────┐  │
│ └───────────────────────────────┘  │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │        Kirim Pengajuan         │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
``

## A.3 Detail petugas (desktop)

``
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Daftar Pengajuan      IDB-2026-0042        [MENUNGGU PEMERIKSAAN]      │
├─────────────────────────────────────────────┬────────────────────────────┤
│ PEMINJAM                                    │ PEMERIKSAAN JADWAL         │
│ ORMAWA/Prodi   UKM Fotografi                │ Aula · 24 Okt 2026         │
│ Nama           Ni Kadek A.                  │ 07 ─────────────────────── │
│ Nomor HP       0812 3456 7890               │ 08 ██████ disetujui        │
│                                             │ 10 ░░░░░░ menunggu         │
│ PENGGUNAAN                                  │ 11 ─────────────────────── │
│ Ruangan        Aula · Gedung A              │ ⚠ 1 pengajuan menunggu     │
│ Tanggal        24 Okt 2026                  │   pada waktu yang sama     │
│ Waktu          08.00–11.00 WITA · 3 jam     │ [Buka papan jadwal]        │
│ Peserta        40                           │                            │
│ Alat           Mikrofon, proyektor          │ RIWAYAT                    │
│ Keperluan      Dokumentasi kegiatan...      │ 24 Okt 09.12  Dikirim      │
├─────────────────────────────────────────────┴────────────────────────────┤
│                                        [Tolak]   [Setujui Pengajuan]     │
└──────────────────────────────────────────────────────────────────────────┘
``

## A.4 Papan jadwal (tablet, agenda)

``
┌──────────────────────────────────────┐
│ Ruangan & Jadwal                     │
│ [24 Okt 2026 ▾]   [Semua gedung ▾]   │
├──────────────────────────────────────┤
│ AULA · Gedung A                      │
│ 08.00–11.00  ██ Disetujui            │
│ 13.00–15.00  ░░ Menunggu             │
│                                      │
│ LAB 1C · Gedung A                    │
│ Belum ada jadwal tercatat.           │
│                                      │
│ STUDIO POLA · Gedung A               │
│ 14.00–16.00  ██ Disetujui            │
├──────────────────────────────────────┤
│ █ Disetujui  ░ Menunggu              │
└──────────────────────────────────────┘
``

---

# Lampiran B — Daftar ruangan awal (belum final)

`[PRD §6.2]` — **bukan daftar final**; nama, kode, lokasi, dan status harus dikonfirmasi `[RG-06, INT-02]`.

| Gedung/Lokasi | Contoh ruangan |
|---|---|
| Gedung A | Studio Pola, Lecture 1A, Lab 1C, Studio Fotografi & Videografi, Lab 2B, Lab 2C, Lecture 2D, UKS, Aula |
| Gedung B / Rektorat | Lab iMac, Ruang Inbis, Studio 3, Lab Fashion, Inter 1, Ruang Magister, Perpustakaan, Ruang Asistensi |
| Gedung C / NMC | Lab 1A, Lab STI, 1B, Lecture 2A, Lecture 2B, Studio 2C, Studio 3A, Studio 3B, Studio 3C |
| Area tambahan | Rooftop, halaman gedung, gedung serba guna, dan area lain pada formulir resmi |

---

# Lampiran C — Yang tidak dirancang di dokumen ini

- Kode produksi, komponen implementasi, dan pemilihan framework.
- Skema basis data dan API.
- Tata letak surat resmi (menunggu template kampus).
- Halaman untuk Bagian Akademik/IT/Security (hak akses belum ditetapkan).
- Notifikasi WhatsApp/email.
- Alur pembatalan dan perubahan pengajuan.

---

# Lampiran D — Prototipe fungsional (HTML/CSS/JS)

Prototipe ini memakai token §4.1 dan tata letak Lampiran A. Berkasnya statis, tetapi alur utamanya **berjalan**: pengajuan tersimpan, Papan Jadwal berubah, petugas dapat memutuskan, dan status peminjam mengikuti keputusan itu. Data disimpan di peramban, bukan server; prototipe ini bukan aplikasi produksi.

## D.1 Halaman dan rute

| Berkas | Rute produksi (usulan §2.1) | Isi | Akses |
|---|---|---|---|
| `index.html` | `/` | Beranda: bilah merek, hero + papan pratinjau, ringkasan, kartu gedung, jadwal hari ini, alur, CTA, catatan, footer lengkap | Publik |
| `ruangan.html` | `/ruangan?tanggal=&gedung=` | Papan Jadwal, agenda mobile, tampilan Daftar | Publik |
| `ajukan.html` | `/ajukan?ruang=&tanggal=&mulai=&selesai=` | Formulir, bentrok, status berhasil | Publik |
| `masuk.html` | `/masuk?next=&alasan=` | Pemilih peran + nama petugas | Publik |
| `pengajuan-saya.html` | `/pengajuan` | Daftar pengajuan milik sesi | Peminjam |
| `pengajuan-detail.html?id=` | `/pengajuan/[id]` | Status, rincian, jadwal, surat | Peminjam (pemilik) |
| `petugas.html` | `/petugas` | Antrean, statistik, tab, pencarian | Petugas |
| `petugas-detail.html?id=` | `/petugas/[id]` | Pemeriksaan jadwal + keputusan | Petugas |
| `petugas-riwayat.html` | `/petugas/riwayat` | Riwayat keputusan | Petugas |
| `tidak-berizin.html` | `/tidak-berizin` | 403 | Semua |

Prototipe memakai berkas datar dan query string (`pengajuan-detail.html?id=...`), bukan rute bersarang `/pengajuan/[id]` pada §2.1. Pemetaan ini hanya cara menjalankan prototipe statis; rute produksi tetap seperti dokumen.

## D.2 Berkas pendukung

| Berkas | Isi |
|---|---|
| `assets/tokens.css` | Token warna (termasuk aksen merek teal/oranye logo), tipografi, spasi, radius, gerak |
| `assets/app.css` | Bilah merek, hero, kartu gedung, jadwal beranda, footer; komponen publik, formulir, papan; titik henti 420/599/767/899/1023px |
| `assets/pages.css` | Halaman sekunder: masuk, daftar, detail, status, surat, keadaan kosong |
| `assets/staff.css` | Rail petugas, statistik, tab, tabel→kartu, dialog keputusan |
| `assets/store.js` | Sumber data tunggal: 19 contoh, localStorage, ID, keputusan, bentrok, sesi |
| `assets/ui.js` | Navigasi, penjagaan sesi, toast, dialog, slot masuk/keluar, tanggal bilah merek |
| `assets/home.js` | Angka ringkasan, kartu gedung, jadwal hari ini, pratinjau papan dari store |
| `assets/app.js` | Papan, filter, pemilih tanggal, validasi, bentrok, ringkasan, kirim |
| `assets/masuk.js`, `saya.js`, `detail.js` | Alur masuk, Pengajuan Saya, detail peminjam |
| `assets/petugas.js`, `petugas-detail.js`, `riwayat.js` | Antrean, keputusan, riwayat |
| `assets/logo-idb.png` | Logo resmi full color (813×532) dari idbbali.ac.id |
| `assets/logo-idb-white.png` | Varian putih resmi (813×532, transparan) dari `idb-bali-logo-w.png` situs kampus; dipakai di footer hitam |
| `assets/fonts/` | Montserrat variable (latin) disimpan lokal |
| `serve.py` | Server statis dengan `Cache-Control: no-store` |

## D.3 Data contoh dan penyimpanan

- **19 pengajuan contoh**, ID `IDB-2026-0031`–`0049`: 10 pada Sabtu 24 Okt 2026, 4 pada Senin 26 Okt, 3 pada Selasa 27 Okt, dan 2 riwayat (13 dan 16 Okt). Status: 11 disetujui, 7 menunggu, 1 ditolak.
- Tiga di antaranya milik sesi peminjam contoh: `0047` (Aula, menunggu), `0038` (Studio Pola, disetujui), `0033` (Studio 3A, ditolak).
- Bentrok yang disengaja: Lab 2C, 26 Okt, pengajuan menunggu 09.00–11.00 beririsan dengan yang disetujui 08.00–10.00. Ini menguji dua hal berbeda: peringatan saat mengajukan, dan **pemblokiran persetujuan** saat jadwal yang sudah disetujui bertabrakan.
- Nomor baru melanjutkan `maks + 1`; pengujian membuat `IDB-2026-0050`, tetapi data itu hanya ada di peramban penguji.
- Data disimpan di `localStorage` dengan kunci `idb.booking.data.v1`; sesi di `idb.booking.session.v1`, berlaku 8 jam. Tidak ada sinkronisasi server.
- `IDB.reset()` di konsol menghapus data contoh dan mengembalikan 19 pengajuan awal. Menghapus data peramban juga mengakhiri sesi.
- Daftar ruangan pada Lampiran B dipakai apa adanya, termasuk ketidakpastiannya.

## D.4 Perilaku yang berjalan

**Beranda**

- Bilah merek menampilkan tanggal perangkat, WITA, dan tautan situs kampus; di bawah 600px nama kampus disingkat "IDB Bali" agar tidak meluap.
- Hero memakai bidang biru–teal dengan sorotan oranye logo, satu CTA oranye, dan papan pratinjau hari ini. Ringkasan angka (ruangan, pengajuan, disetujui, menunggu) dihitung dari store, bukan ditulis tetap.
- Kartu empat gedung menghitung jumlah dan contoh ruangan dari daftar yang sama; tautannya meneruskan `?gedung=` sehingga papan langsung tersaring.
- "Jadwal hari ini" menampilkan empat jadwal terdekat (disetujui + menunggu) dengan badge; bila tidak ada, muncul keadaan kosong, bukan klaim ketersediaan.
- Pratinjau papan memakai lajur terpisah bila dua jadwal di ruangan yang sama bertumpuk, sama seperti papan penuh, sehingga batang tidak saling menutup.
- Tanggal pada bilah merek dan papan mengikuti jam perangkat. Angka statis di HTML hanya cadangan bila JavaScript mati.
- Footer berlatar hitam tinta `#1F1F1F`, dengan garis merek teal–oranye–putih, teks putih 70–76%, dan varian putih resmi logo langsung di atas hitam (tanpa plat). Footer memuat alamat kampus dan tautan sosial resmi yang terverifikasi; tidak ada nomor telepon, surel, atau pejabat yang dikarang.

**Peminjam**

- Filter tanggal/gedung dan pencarian ruangan; keadaan filter tersimpan di URL (`?tanggal=&gedung=`).
- Papan Jadwal desktop (bar disetujui, garis putus-putus menunggu, garis silang bentrok), agenda per ruangan di mobile, dan tampilan Daftar untuk papan ketik.
- Formulir terisi awal dari papan (`?ruang=&tanggal=&mulai=&selesai=`), validasi per bidang + ringkasan galat, hari Minggu dinonaktifkan, pemilih tanggal dapat dioperasikan dengan panah/Home/End/PageUp/PageDown, serta peringatan bentrok dengan konfirmasi wajib.
- Pengajuan tersimpan dengan ID sebenarnya; keadaan berhasil menautkan ke detail. Jika penyimpanan peramban gagal, muncul banner + tombol "Coba lagi", bukan klaim berhasil.
- Masuk memilih peran; sesi peminjam membuka "Pengajuan Saya", detail miliknya, status, dan surat. Detail milik orang lain → 404; halaman petugas → 403.

**Petugas**

- Antrean dengan statistik, tab Menunggu/Disetujui/Ditolak/Semua, pencarian, dan tabel yang berubah menjadi kartu di mobile.
- Detail menampilkan data peminjam, jadwal ruangan pada tanggal itu, riwayat, serta panel keputusan.
- Setujui/tolak mencatat nama petugas dan waktu. Penolakan boleh tanpa alasan (AP-06). Persetujuan **diblokir** jika ada jadwal disetujui yang bertabrakan (JD-03); jika yang bertabrakan masih menunggu, persetujuan memerlukan konfirmasi.
- Keputusan langsung memperbarui badge, Papan Jadwal, jumlah antrean di rail, dan Riwayat Keputusan.
- Surat: menunggu → belum dapat dibuat; ditolak → tidak dibuat; disetujui → "Surat sedang dibuat". Tidak ada PDF atau templat resmi yang dikarang (SR-05).

**Penjagaan akses**

- Halaman peminjam memerlukan sesi; halaman petugas memerlukan peran `petugas`.
- Tanpa sesi → `masuk.html?next=...&alasan=masuk`; peminjam yang membuka halaman petugas → `tidak-berizin.html`.
- `next` hanya menerima nama berkas lokal yang sah, untuk menghindari pengalihan ke luar situs.
- Keluar menghapus sesi dan kembali ke beranda. Sesi kedaluwarsa setelah 8 jam.

## D.5 Yang sengaja tidak dibuat

- **Surat resmi/PDF**: format, kop, pejabat, dan tanda tangan belum ada di PRD. Yang disimulasikan hanya status surat.
- **Autentikasi nyata**: pemilih peran adalah alat demo. AK-06/AK-07 belum diputuskan; pemeriksaan sesi di produksi harus di server.
- **Pembatalan oleh peminjam**: PB-01 tidak ada di PRD, jadi tidak ada tombol batal.
- **WhatsApp/email, unggahan berkas, kelola ruangan (RG-08), basis data produksi**: di luar lingkup prototipe.
- Tidak ada kapasitas ruangan, kode ruangan, foto, kontak, atau dokumen resmi yang dikarang.

## D.6 Batasan teknis

- Data dan sesi bersifat lokal per peramban/profil. Dua tab dapat berbeda sampai halaman dimuat ulang; tidak ada concurrency.
- Sesi disimpan di sisi klien dan **bukan** kontrol keamanan. Jangan pakai prototipe ini dengan data nyata.
- Kepemilikan pengajuan disimulasikan dengan penanda `mine`, bukan ID pengguna; semua pengajuan baru dianggap milik sesi peminjam.
- Halaman memakai berkas datar; tautan harus relatif dan dijalankan dari folder `prototype/`.
- Bar Papan Jadwal dapat diklik dengan tetikus/sentuh untuk melihat ringkasan; area kosong membuka formulir. Pengguna papan ketik memakai tampilan Daftar.
- Jam 07.00–18.00 dan larangan Minggu adalah konfigurasi contoh (RG-04/RG-11).
- Tanggal contoh mengikuti 24 Okt 2026; bila dibuka jauh setelah itu, "hari ini" dan garis waktu mengikuti jam sistem, sedangkan data contoh tetap pada tanggalnya.

## D.7 Menjalankan dan skrip demo

1. Jalankan `python prototype/serve.py`, lalu buka `http://127.0.0.1:8080`. Membuka `index.html` langsung juga bisa, tetapi server menghindari cache.
2. **Petugas:** Masuk → pilih Petugas → isi nama → Daftar Pengajuan. Buka `IDB-2026-0047`, centang konfirmasi, setujui. Perhatikan badge, papan, dan jumlah antrean berubah. Buka `IDB-2026-0045`: tombol setujui nonaktif karena bentrok disetujui (JD-03).
3. **Peminjam:** Masuk → pilih Peminjam → Pengajuan Saya. Buka `0038` (disetujui, surat "sedang dibuat") dan `0033` (ditolak). Lalu Ajukan Peminjaman, isi formulir, dan kirim; ID baru muncul dan dapat dibuka dari tautan status.
4. **Bentrok:** `ajukan.html?ruang=lab-2c&tanggal=2026-10-26&mulai=09.00&selesai=11.00` — banner bentrok dan konfirmasi wajib.
5. **Mobile 390px:** papan berganti agenda, tab petugas menjadi kisi label+hitungan, ringkasan pindah ke `<details>`, tombol kirim menempel di atas toast.

## D.8 Uji yang sudah dijalankan

- Uji ujung-ke-ujung dengan Chrome: masuk petugas, setujui `0047`, blokir `0045`, tolak dengan/tanpa alasan, cari/filter riwayat, kirim pengajuan baru (`0050`), buka detail dan Papan Jadwal, serta penjagaan akses (tanpa sesi, peran salah).
- Desktop 1440px, tablet 820px, dan mobile 390px: tidak ada luapan horizontal; tabel berubah menjadi kartu; dialog dan toast tidak menutup tombol kirim.
- Beranda diuji pada 1440/820/390/320px: bilah merek, hero, papan, kartu gedung, jadwal, CTA, catatan, dan footer tidak meluap; kartu gedung menjadi 2 kolom di tablet dan 1 kolom di bawah 600px.
- Hero diuji pada 1536×864, 1440×900, 1366×768, 1280×720, 1366×614, dan 1024×614: seluruh isi hero (termasuk empat angka ringkasan) berada di dalam kotak hero, memiliki padding bawah, dan tidak terpotong lipatan layar pada lebar ≥ 1024px.
- Perapatan layout 26 Okt 2026: konten 1200px, section beranda 64px, halaman kerja 32–48px, dan footer 40/28px. Diuji pada 1440/820/390/320px tanpa luapan horizontal; hero tetap utuh, target sentuh tidak berubah, dan rail petugas tidak lagi memaksa lebar 348px pada 320px.
- Pratinjau papan dan daftar "Jadwal hari ini" diuji terhadap store: menampilkan jadwal hari ini, mengikuti pengajuan baru setelah halaman dimuat ulang, dan tetap kosong dengan pesan jujur bila tidak ada jadwal.
- Pemeriksaan statis: tidak ada ID ganda, semua `aria-*`/`for`/`href="#..."` merujuk elemen yang ada, dan tidak ada klaim "ruangan tersedia".
- Perbaikan dari audit antarmuka: lajur bentrok tidak lagi saling menutup, sumbu cuplikan beranda sejajar dengan bar, tautan galat memfokuskan bidang di bawah header, kontras "Belum diisi" naik, pemilih tanggal dapat dioperasikan dengan papan ketik, menu mobile dapat ditutup dengan Escape/klik luar, dan fokus di permukaan gelap memakai cincin oranye.
- Uji ini membuktikan alur prototipe, bukan jaminan aksesibilitas atau keamanan penuh untuk produksi.

## D.9 Blocker yang masih berlaku

Empat hal di §11 belum dapat diselesaikan tanpa keputusan kampus: metode masuk (AK-07), daftar ruangan final (RG-01), jam operasional (RG-04/RG-11), dan format surat resmi (SR-05).

Perbedaan warna merek vs token antarmuka (§6.3) sebagian sudah dijembatani: teal `#007C91` dan oranye logo `#F7921D` kini dipakai sebagai aksen identitas, sementara aksi dan teks tetap memakai token kontras `#024D71`/`#F17711`. Keputusan resmi apakah warna merek akan menggantikan token antarmuka masih menunggu kampus.

---

**Ringkasan satu paragraf.** Sistem ini adalah alur administrasi, bukan katalog. Keberhasilannya ditentukan oleh tiga hal: peminjam tahu kapan ruangan benar-benar terpakai, petugas bisa memutuskan dengan bukti jadwal di depan mata, dan surat hanya lahir dari persetujuan yang tersimpan. Arah visual "Studio Kampus" — Montserrat, biru tua `#024D71`, teal `#007C91` dan oranye logo `#F7921D` yang dipakai hemat, garis rambut, radius 4px untuk kontrol dan 8px untuk kartu beranda — menjaga aplikasi terasa bagian dari IDB Bali, bukan templat dashboard generik. Beranda mengikuti irama situs kampus (bilah utilitas, hero lebar, kartu area, jadwal, CTA, footer berkolom) tanpa meminjam foto atau klaim yang tidak terverifikasi.


---

## D.10 Pembaruan implementasi lokal — 28 Oktober 2026

Bagian D di atas mendokumentasikan prototipe statis sebelumnya. Build lokal terbaru mempertahankan tampilan dan alur, tetapi memindahkan hal-hal berikut ke server:

- **Masuk:** satu halaman split-screen dengan pilihan peran Peminjam/Petugas Kemahasiswaan, ID pengguna, dan kata sandi. Peran yang dipilih harus cocok dengan peran akun yang diverifikasi server; ketidakcocokan ditolak sebelum sesi dibuat. Kata sandi disimpan sebagai hash PBKDF2-HMAC-SHA256 dengan salt.
- **Sesi:** cookie `idb_session` bersifat `HttpOnly` dan `SameSite=Lax`, berlaku 8 jam, dan disimpan di memori server. Restart server mengakhiri sesi, tetapi data pengajuan tetap tersimpan.
- **Data:** `data/bookings.json` di luar folder yang dilayani; akun di `data/accounts.json`. Tidak ada lagi `localStorage`, `idb.booking.data.v1`, `IDB.reset()`, atau sesi di sisi klien.
- **Hak akses:** halaman petugas dan API keputusan diperiksa server. Peminjam hanya menerima pengajuannya sendiri; permintaan ke pengajuan orang lain menghasilkan 404. Halaman `ajukan.html` khusus peminjam.
- **Surat:** PDF dibuat server hanya untuk pengajuan berstatus disetujui. Isinya memakai data pengajuan dan tanda `-` untuk alat kosong. Karena format resmi (SR-05) belum ditetapkan, PDF bukan surat resmi bertanda tangan dan tidak memuat pejabat, tanda tangan, atau penerima yang dikarang.
- **Data contoh:** 19 pengajuan `IDB-2026-0031`–`0049` dibuat saat server pertama kali dijalankan. `0045` tetap menjadi contoh bentrok dengan `0036`.
- **Uji lokal:** login salah/benar, logout, pengajuan baru `0050`, keputusan setujui/tolak, status peminjam, unduhan PDF, penolakan surat untuk pengajuan yang belum disetujui, penolakan hari Minggu, bentrok, akses tanpa sesi/peran salah, serta responsif 320/390/1366 px tanpa luapan horizontal.

Empat blocker di §D.9 tetap berlaku: metode masuk resmi (AK-07), daftar ruangan final (RG-01), jam operasional (RG-04/RG-11), dan format surat resmi (SR-05). Akun di `data/accounts.json` adalah akun lokal demonstrasi, bukan akun resmi kampus.

---

## D.11 Penyegaran halaman masuk - 8 November 2026

- **Halaman pertama:** beranda publik dihapus dari alur. index.html hanya mengalihkan pengunjung tanpa sesi ke masuk.html; pengguna yang sudah masuk diarahkan ke dasbor sesuai peran. Keluar dari sesi kembali ke halaman masuk.
- **Komposisi:** split-screen 45% form dan 55% foto. Form dibatasi 420 px, tinggi laptop 720-768 px tetap utuh tanpa gulir, dan panel foto disembunyikan di bawah 980 px agar ponsel fokus ke form.
- **Identitas:** Plus Jakarta Sans (lokal), navy #102C54, blue #174A78, orange #F28C28, off-white #F7F8FA, charcoal #252B35. Logo resmi dipakai di panel form dan varian putih di panel foto.
- **Foto:** dokumentasi resmi IDB Bali dari idbbali.ac.id (assets/campus-activity-1.jpg), bukan foto buatan AI. Alt text menjelaskan aktivitas kampus.
- **Komponen:** dua kartu peran dengan selected state, input berikon, tombol tampilkan/sembunyikan kata sandi, tombol navy dengan hover dan spinner, pesan galat, serta panel sesi aktif. Mengklik kartu peran mengisi otomatis akun uji `peminjam01` atau `petugas01` untuk pengujian lokal, menutup password, menghapus galat, serta menyesuaikan placeholder dan info form. Auto-fill bukan pengganti autentikasi dan harus dihapus sebelum penggunaan nyata.
- **Validasi peran:** server menerima peran yang dipilih, memverifikasi kredensial, lalu menolak dengan `403 role_mismatch` bila peran akun berbeda. Tidak ada cookie sesi, tidak ada pengalihan, kata sandi dikosongkan, dan akun tidak dibuat atau diubah. Pilihan peran di klien bukan sumber otoritas.
- **Uji:** Chrome pada 1920x1080, 1440x900, 1366x768, 1280x720, 1024x768, 820x1180, 390x844, 360x640, dan 320x568. Tidak ada luapan horizontal; form dan galat role mismatch tetap muat tanpa gulir pada 1280x720, 1366x768, dan 1024x768. Login Peminjam, login Petugas, pengisian otomatis akun uji saat kartu peran diklik, kedua arah ketidakcocokan, dan penjagaan akses diuji di Chrome.
