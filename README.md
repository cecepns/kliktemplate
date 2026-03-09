# kliktemplate.com

Website jualan produk digital (template/script) — React Vite + Express + MySQL.

## Tech stack

- **Frontend:** React (Vite, JSX), TailwindCSS, Lucide React, AOS
- **Backend:** Express.js (satu file `server.js`), MySQL
- **Upload gambar:** folder `backend/uploads-web-template`

## Menjalankan project

### 1. Frontend

```bash
npm install
npm run dev
```

Buka http://localhost:5173

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # sesuaikan jika pakai MySQL
npm run dev
```

Backend berjalan di http://localhost:3001. Vite sudah diatur proxy `/api` dan `/uploads-web-template` ke backend.

### 3. MySQL (opsional)

Tanpa MySQL, backend memakai data fallback di memory. Untuk pakai database:

1. Buat database dan tabel:

```bash
mysql -u root -p < backend/schema.sql
```

2. Isi `backend/.env`:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=kliktemplate
```

Gambar produk taruh di `backend/uploads-web-template/`. Di database, isi `image_path` dengan nama file (mis. `produk1.png`).

## Struktur

- `src/` — React: layout (Header, Sidebar), halaman (Home, ProductDetail, dll), `lib/api.js`
- `backend/server.js` — API: GET `/api/products`, `/api/products/:slug`, `/api/categories`
- `backend/uploads-web-template/` — file upload gambar
- `public/logo.png` — logo situs
# kliktemplate
