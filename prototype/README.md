# Sistem Peminjaman Ruangan IDB Bali — Panduan Lokal

Aplikasi lokal untuk alur peminjam dan Bagian Kemahasiswaan. Halaman memakai HTML/CSS/JavaScript yang sudah ada, sedangkan autentikasi, sesi, data pengajuan, keputusan, dan surat diproses oleh `serve.py`.

Data tidak lagi disimpan di `localStorage`. Data pengajuan disimpan di `../data/bookings.json`, akun di `../data/accounts.json`, dan sesi aktif hanya di memori server. Karena itu data tetap tersedia setelah halaman dimuat ulang atau server dijalankan kembali.

## Menjalankan

Dari folder `prototype`:

```powershell
& "C:\Users\DINA\.local\opencode-venv\Scripts\python.exe" serve.py
```

`python serve.py` juga bekerja karena server hanya memakai pustaka standar Python. Buka <http://127.0.0.1:8080>.

Jika port 8080 dipakai proses lain, hentikan proses tersebut terlebih dahulu atau ubah `PORT` di `serve.py`.

## Akun lokal

Akun berikut dibuat untuk demonstrasi lokal, bukan akun resmi kampus. Ganti akun dan kata sandi sebelum sistem digunakan di luar demonstrasi.

| ID pengguna | Kata sandi | Peran | Nama tampilan | Unit |
|---|---|---|---|---|
| `peminjam01` | `Peminjam1#2026` | peminjam | Raka Wijaya | HIMA DKV |
| `peminjam02` | `Peminjam2#2026` | peminjam | Nadia Sari | Prodi Arsitektur |
| `peminjam03` | `Peminjam3#2026` | peminjam | Fajar Nugraha | Prodi Manajemen |
| `petugas01` | `Petugas#2026` | petugas | Petugas Kemahasiswaan | Bagian Kemahasiswaan |

Kata sandi tidak disimpan sebagai teks biasa. `data/accounts.json` hanya berisi salt dan hash PBKDF2-HMAC-SHA256. Peran akun tetap ditentukan server. Pilihan Peminjam/Petugas Kemahasiswaan di halaman masuk harus cocok dengan peran akun; jika tidak cocok, server menolak login sebelum membuat sesi. Permintaan login tanpa peran juga ditolak.

## Alur demonstrasi

1. Buka halaman **Masuk**, pilih **Peminjam**, lalu gunakan `peminjam01` / `Peminjam1#2026`.
2. Peminjam diarahkan ke **Pengajuan Saya** dan hanya melihat pengajuan miliknya.
3. Buka **Ajukan Peminjaman**, isi data, lalu kirim. Pengajuan tersimpan dengan status **Menunggu Pemeriksaan** dan nomor baru.
4. Keluar, lalu masuk dengan `petugas01` / `Petugas#2026` dan pilih **Petugas Kemahasiswaan**.
5. Petugas melihat antrean seluruh pengajuan, membuka detail, memeriksa jadwal, lalu menyetujui atau menolak.
6. Keluar dan masuk kembali sebagai peminjam. Status terbaru tampil di **Pengajuan Saya**.
7. Untuk pengajuan yang disetujui, tombol **Unduh surat PDF** tersedia di panel surat pada halaman detail.
8. Untuk akun dengan pengajuan yang sudah disetujui, `peminjam02` dapat langsung membuka `IDB-2026-0038` dan mengunduh surat.

Uji juga:
- Login dengan kata sandi salah.
- Memilih **Peminjam** lalu memakai akun `petugas01`, atau sebaliknya; login ditolak, kata sandi dikosongkan, dan tidak ada sesi yang dibuat.
- Berganti pilihan peran; ID pengguna dan kata sandi kosong, placeholder serta info form menyesuaikan peran.
- Membuka `petugas.html` sebagai peminjam; server mengalihkan ke halaman tidak berizin.
- Mengirim tanggal Minggu; validasi klien dan server menolak.
- Mengirim waktu selesai yang tidak lebih akhir dari waktu mulai.
- Membuat jadwal bentrok, lalu mencoba menyetujui pengajuan yang bertabrakan dengan jadwal yang sudah disetujui.
- Meminta surat untuk pengajuan yang masih menunggu; server menolak dengan status 409.

## Data contoh

- 19 pengajuan awal, ID `IDB-2026-0031`–`0049`, mengikuti tanggal server saat data pertama kali dibuat.
- Saat server dimulai pada hari lain, tanggal 19 data contoh diselaraskan ke hari itu agar papan jadwal tetap terisi. Status, alasan, surat, dan waktu keputusan dipertahankan; pengajuan baru di luar rentang `0031`–`0049` tidak diubah.
- Jika server dibiarkan berjalan melewati tengah malam tanpa restart, data contoh tidak bergeser sampai server dijalankan kembali.
- Beberapa pengajuan awal memiliki pemilik akun: `0047` (peminjam01), `0038` (peminjam02), `0033` dan `0048` (peminjam03). Pengajuan lain hanya terlihat oleh petugas.
- Pengajuan baru melanjutkan nomor terakhir, misalnya `IDB-2026-0050`.
- Keputusan yang sudah tersimpan tidak diubah saat server dimulai ulang.
- `IDB-2026-0045` sengaja dibuat bertabrakan dengan `IDB-2026-0036` (Lab 2C) untuk menguji pemeriksaan jadwal.

### Mengembalikan data contoh

Hentikan server, hapus `../data/bookings.json`, lalu jalankan `serve.py` lagi. Server akan membuat ulang 19 pengajuan contoh. Jangan hapus `accounts.json` kecuali akun juga ingin dibuat ulang.

## Penyimpanan dan keamanan lokal

- `../data/bookings.json` — data pengajuan dan keputusan.
- `../data/accounts.json` — akun, salt, hash, dan peran.
- Sesi disimpan di memori server, cookie `idb_session` bersifat `HttpOnly` dan `SameSite=Lax`, berlaku 8 jam. Restart server mengakhiri semua sesi.
- Setiap permintaan data dan keputusan diperiksa di server. Peminjam hanya menerima pengajuannya sendiri; halaman dan API petugas menolak akun peminjam.
- Login dibatasi setelah beberapa percobaan gagal. Permintaan yang mengubah data juga memeriksa origin.
- Data dan akun berada di luar folder yang dilayani sehingga tidak dapat diunduh sebagai berkas statis.
- Ini server HTTP lokal, bukan konfigurasi produksi. Untuk penggunaan nyata, gunakan HTTPS, akun kampus resmi, pencadangan, dan pengelolaan rahasia yang sesuai.

## Surat PDF

Surat dibuat server setelah pengajuan disetujui dan hanya dapat diunduh oleh pemilik pengajuan atau petugas yang berwenang. Isinya memakai data pengajuan: nama, ORMAWA/Prodi, nomor HP, keperluan, ruangan, jumlah peserta, tanggal, waktu, dan alat (tanda `-` bila kosong).

Karena format surat resmi kampus (SR-05) belum ditetapkan, PDF adalah dokumen peminjaman berbasis data, bukan surat resmi bertanda tangan. PDF tidak memuat nama pejabat, tanda tangan, atau daftar penerima yang dikarang. Format resmi dan pengesahan tetap mengikuti ketentuan kampus.

## Yang belum ditetapkan kampus

- Metode autentikasi resmi (AK-07) dan akun kampus.
- Daftar ruangan final (RG-01); daftar 29 ruangan saat ini masih awal.
- Jam operasional dan aturan hari Minggu secara rinci (RG-04/RG-11); saat ini Minggu ditolak.
- Format surat resmi, pejabat, tanda tangan, dan pihak penerima (SR-05).
- Kebijakan pembatalan oleh peminjam dan pengelolaan ruangan oleh pengelola sistem.

## Peta halaman

| Berkas | Isi |
|---|---|
| `index.html` | Pengalihan awal ke halaman masuk atau dasbor sesuai sesi |
| `ruangan.html` | Ruangan & Jadwal |
| `ajukan.html` | Formulir pengajuan (khusus peminjam) |
| `masuk.html` | Halaman masuk: pilihan peran, ID pengguna, kata sandi |
| `pengajuan-saya.html` | Pengajuan milik pengguna |
| `pengajuan-detail.html?id=` | Detail, status, dan unduhan surat |
| `petugas.html` | Antrean petugas |
| `petugas-detail.html?id=` | Pemeriksaan dan keputusan |
| `petugas-riwayat.html` | Riwayat keputusan |
| `tidak-berizin.html` | Halaman akses ditolak |

## Warna

Aksen identitas diambil dari logo resmi: teal `#007C91` dan oranye `#F7921D`. Aksi, teks, dan status memakai token kontras `#024D71` / `#F17711`; oranye CTA selalu berteks gelap. Footer memakai hitam tinta `#1F1F1F` dengan teks putih 70–76%; logo memakai varian putih resmi `logo-idb-white.png`.

## Halaman masuk

Halaman masuk memakai Plus Jakarta Sans dengan palet navy `#102C54`, blue `#174A78`, orange `#F28C28`, off-white `#F7F8FA`, dan charcoal `#252B35`. Foto panel kanan adalah dokumentasi resmi IDB Bali dari `idbbali.ac.id` (`assets/campus-activity-1.jpg`). Pilihan peran mengatur placeholder dan info form. Untuk mempercepat pengujian lokal, mengklik kartu peran mengisi otomatis akun uji `peminjam01` atau `petugas01`; kata sandi tetap tersembunyi dan dapat ditampilkan lewat tombol. Auto-fill ini hanya bantuan pengujian, bukan pengganti autentikasi. Login hanya berhasil jika peran yang dipilih cocok dengan peran akun yang diverifikasi server; ketidakcocokan ditolak tanpa membuat sesi. Hapus auto-fill sebelum penggunaan nyata.
