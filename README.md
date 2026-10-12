# SIKAMOS (STIP International Kadet Mobility System)
### Sekolah Tinggi Ilmu Pelayaran (STIP) INDONESIA
*Badan Pengembangan Sumber Daya Manusia Perhubungan (BPSDM)*

Platform digitalisasi tata kelola pertukaran kadet (mobilitas studi internasional) dari pendekatan kegiatan mandiri (*activity*) menjadi sistem tata kelola digital terpadu (*system*) dengan standar maritim internasional.

---

## ⚓ 1. Arsitektur & Tech Stack

* **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS (*STIP Deep Navy* `#0A2540` & *Gold Accent* `#D4AF37`), Lucide Icons.
* **Backend:** Next.js Route Handlers & Server-Side Enforcement (Node.js).
* **Database & ORM:** SQLite standalone zero-config (`prisma/dev.db`) dengan Prisma ORM 5 (kompatibel penuh dengan PostgreSQL untuk deployment skala industri).
* **Authentication & RBAC:** NextAuth.js (JWT Strategy) dengan proteksi rute ketat (*Zero Route Leakage* via `middleware.ts`).
* **Audit Trail Engine:** Pencatatan otomatis setiap riwayat masuk (*LoginHistory*) lengkap dengan stempel waktu, IP address, user-agent, dan alasan penolakan.
* **Client-Side Image Compressor:** `browser-image-compression` (menjamin ukuran file foto bukti kegiatan **wajib < 1MB** sebelum diunggah ke storage).
* **Watermark & Timestamp:** HTML5 Canvas generator cap waktu dan identitas kadet otomatis di atas foto jurnal.
* **E-Signature:** HTML5 Canvas Signature Pad untuk pengesahan berita acara berjenjang.

---

## 🛡️ 2. Keamanan Ketat & Zero Route Leakage (Anti-Bocor)

Sistem menerapkan prinsip **Zero Route Leakage**:
1. **Middleware Interceptor (`middleware.ts`):** Mengunci seluruh rute dashboard (`/`, `/dashboard/*`, `/admin/*`, `/kadet/*`, `/mitra/*`, `/imigrasi/*`, `/monitoring/*`, `/laporan-akhir/*`). Permintaan tanpa sesi valid langsung dialihkan ke `/login?callbackUrl=...` (HTTP 307).
2. **Server-Side API Guard:** Seluruh endpoint API internal memverifikasi sesi aktif via `getServerSession(authOptions)`.
3. **Akun Ditangguhkan (Suspended):** Akun dengan status `isActive: false` otomatis diblokir saat login dan dialihkan ke layar notifikasi penangguhan.
4. **Halaman Khusus HTTP 403 Forbidden (`/403`):** Pengguna yang mencoba mengakses modul di luar hierarki perannya langsung diarahkan ke halaman 403.

---

## 👥 3. Lima Tingkatan Peran Pengguna (RBAC 5-Tier)

1. **`SUPER_ADMIN` (Admin Utama BPSDM / STIP INDONESIA):**
   * Hak akses penuh atas konfigurasi sistem.
   * Modul Manajemen Pengguna & Peran (`/admin/users`): Mengubah peran pengguna dan mengaktifkan/menangguhkan (*suspend*) akun.
   * Modul Audit Log & Login History (`/admin/login-history`): Memantau seluruh riwayat masuk ke sistem.
2. **`ADMIN` (Admin Operasional Mobilitas STIP):**
   * Pengelolaan basis data kadet, master data negara, dan universitas mitra maritim internasional.
3. **`DOSEN_STIP` (Dosen Pembimbing Internal STIP):**
   * Memonitoring progres jurnal harian kadet, memberikan tanggapan (*feedback*), dan melakukan pengesahan digital (E-Sign) untuk konversi SKS / *Learning Recognition*.
4. **`MITRA` (Pembimbing Universitas Tujuan Luar Negeri / *Host University*):**
   * Melakukan verifikasi jurnal harian di lokasi dan evaluasi akhir laporan capaian kompetensi kadet.
5. **`KADET` (Mahasiswa STIP Indonesia):**
   * Melengkapi data diri, mengunggah paspor dan visa, mengisi jurnal harian dengan foto terkompresi berstempel waktu, serta menyusun laporan akhir studi.

---

## 🎓 4. Database Kadet Riil (1.544 Akun Kadet STIP)

Basis data sistem telah diimpor secara utuh dari berkas data resmi STIP:
* **Sumber Data:** Berkas master absensi `ABSEN 65 68 69 (2026 GANJIL) (1).xlsx` dan laporan SIAKAD STIP Angkatan 68 & 69.
* **Total Akun Kadet:** **1.544 Akun Kadet Aktif** (Program Studi Nautika, Teknika, dan KALK).
* **Format Kredensial:**
  * **ID Pengguna:** Nomor Registrasi Pokok (**NRP**)
  * **Kata Sandi:** Nomor Registrasi Pokok (**NRP**)

---

## 🛠️ 5. Fitur Super Admin Suite

### A. User & Role Management (`/admin/users`)
* Menampilkan daftar seluruh pengguna sistem dengan filter pencarian per Nama, NRP, atau Email.
* Metrik sebaran pengguna: Super Admin, Admin Mobilitas, Dosen STIP, Mitra Kampus, dan Kadet STIP.
* Pengubahan peran langsung secara *real-time* melalui dropdown RBAC.
* Tombol kontrol status akun: **Suspend** (menonaktifkan) dan **Aktifkan Kembali**.

### B. Login History & Audit Trail (`/admin/login-history`)
* Merekam setiap percobaan autentikasi ke database:
  * ID Pengguna dan Email/NRP yang diinput (`emailAttempted`).
  * Alamat IP client (*x-forwarded-for* / *socket IP*).
  * Informasi User-Agent (Perangkat, OS, dan Browser).
  * Status: **SUCCESS** atau **FAILED**.
  * Alasan kegagalan (*failReason*): misal *"Invalid Password"*, *"User Not Found"*, *"Account Suspended"*.
  * Stempel waktu presisi (*createdAt*).
* Filter audit log: Pencarian teks, status login, peran pengguna, dan **pemilih rentang tanggal (*Date Range Picker*)**.

---

## 📦 6. Tujuh Modul Fungsional SIKAMOS

| Modul | Rute | Deskripsi Fungsional |
|---|---|---|
| **Modul 1** | `/kadet` | **Database Kadet** — Pengelolaan profil resmi kadet (NRP, kelas, semester, nomor paspor RI, dan penugasan kampus mitra). |
| **Modul 2 & 3** | `/mitra` | **Master Data Negara & Mitra** — Direktori negara tujuan dan universitas maritim mitra dunia (*World Maritime University*, *Tokyo University of Marine Science*, dll.). |
| **Modul 4** | `/imigrasi` | **Dokumen Imigrasi** — Verifikasi berkas paspor, visa internasional, masa berlaku visa, dan asuransi kesehatan maritim. |
| **Modul 5** | `/monitoring` | **Monitoring Harian Kadet (Fitur Kritis)** — Kompresi foto bukti otomatis **< 1MB**, penempelan cap waktu (*timestamp watermark*) otomatis HTML5 Canvas, koordinat GPS, dan umpan balik pembimbing. |
| **Modul 6** | `/laporan-akhir` | **Evaluasi Laporan Akhir** — Penyusunan laporan kompetensi kadet dan evaluasi bertanda tangan digital oleh Pembimbing Mitra Luar Negeri. |
| **Modul 7** | `/laporan-akhir` | **Pengesahan & E-Sign STIP** — Validasi berjenjang Dosen STIP Indonesia untuk penerbitan Berita Acara Konversi SKS / *Learning Recognition* resmi (Export PDF). |

---

## 🚀 7. Cara Menjalankan Proyek

### A. Prasyarat Sistem
* **Node.js:** Versi 18+ (Direkomendasikan Node.js v20 atau v24)
* **NPM:** Versi 9+

### B. Langkah Menjalankan Server
```bash
# 1. Masuk ke direktori proyek
cd "SIMAKOS Sistem Informasi Kadet Mobilitas Studi"

# 2. Instal dependensi paket
npm install

# 3. Sinkronisasi skema database (SQLite Standalone)
npx prisma generate
npx prisma db push

# 4. Jalankan seeder akun peran utama (Super Admin, Admin, Dosen, Mitra)
npm run prisma:seed

# 5. Jalankan server pengembangan
npm run dev
```

Buka peramban di **[http://localhost:3000](http://localhost:3000)**. Akses ke rute mana pun akan otomatis dialihkan ke halaman login.

---

## 🔑 8. Kredensial Akun Uji Coba (Demo Accounts)

Halaman login [http://localhost:3000/login](http://localhost:3000/login) telah dilengkapi fitur **1-Click Quick Demo Login** untuk seluruh tingkatan peran:

| Tingkatan Peran | Nama Akun / Instansi | ID / Email | Kata Sandi | Target Hak Akses |
|---|---|---|---|---|
| **`SUPER_ADMIN`** | Super Admin Utama (BPSDM / STIP) | `superadmin@stip.ac.id` | `superadmin123` | Akses Penuh: Manajemen Role & Audit Log |
| **`ADMIN`** | Admin Operasional Mobilitas STIP | `admin@stip.ac.id` | `admin123` | Master Data Mitra & Database Kadet |
| **`DOSEN_STIP`** | Capt. Sugeng Hartono, M.Mar., M.Pd. | `dosen@stip.ac.id` | `dosen123` | Verifikasi Jurnal & E-Sign STIP |
| **`MITRA`** | Prof. Henrik Nilsson, Ph.D. (WMU Sweden) | `mitra@wmu.se` | `mitra123` | Evaluasi Luar Negeri & E-Sign Mitra |
| **`KADET`** | Yoel Natanael Fernando (Contoh TK 4) | `365221433` | `365221433` | Pengisian Jurnal Foto & Berkas Imigrasi |
| **`KADET` (Umum)**| 1.544 Kadet Terdaftar Lainnya | `[NRP_KADET]` | `[NRP_KADET]` | Portal Layanan Mandiri Kadet |

---

*Hak Cipta © 2026 SIKAMOS — Sekolah Tinggi Ilmu Pelayaran (STIP) INDONESIA. Badan Pengembangan Sumber Daya Manusia Perhubungan.*
