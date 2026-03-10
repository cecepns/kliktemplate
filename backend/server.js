const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const mysql = require('mysql2/promise')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'kliktemplate-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `ORD-${ts}-${rand}`
}

const uploadsDir = path.join(__dirname, 'uploads-web-template')
const templatesDir = path.join(__dirname, 'uploads-templates')
fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(templatesDir, { recursive: true })

function unlinkSafe(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch { /* ignore */ }
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, file.fieldname === 'template' ? templatesDir : uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    cb(null, `${Date.now()}-${slugify(path.basename(file.originalname, path.extname(file.originalname)))}${ext}`)
  },
})
const upload = multer({ storage })
const productFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'template', maxCount: 1 },
])

// Konfigurasi MySQL (gunakan env atau fallback)
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'kliktemplate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Static: serve uploads
app.use('/uploads-web-template', express.static(uploadsDir))

app.use(cors({ origin: true }))
app.use(express.json())

// In-memory fallback data jika MySQL belum tersedia
const fallbackCategories = [
  { id: 1, name: 'Acc Game', slug: 'acc-game' },
  { id: 2, name: 'Fitur Lainnya', slug: 'fitur-lainnya' },
  { id: 3, name: 'Home', slug: 'home' },
  { id: 4, name: 'Informasi', slug: 'informasi' },
  { id: 5, name: 'Kategori Menu', slug: 'kategori-menu' },
  { id: 6, name: 'Kostum Checkout', slug: 'kostum-checkout' },
  { id: 7, name: 'Kostum Topup', slug: 'kostum-topup' },
  { id: 8, name: 'Landing', slug: 'landing' },
]

const fallbackProducts = [
  {
    id: 1,
    name: 'Inject Masal',
    slug: 'inject-masal',
    description: 'Script Inject Voucher Masal Open Api',
    price: 50000,
    original_price: 75000,
    image_path: '',
    category_slug: 'fitur-lainnya',
    sold_count: 8,
    is_new: true,
    is_featured: false,
  },
  {
    id: 2,
    name: 'Paket terbaik 1 Set OMNI BYU ONLY4U CUANKU & CUANMAX',
    slug: 'paket-omni-byu-cuanku-cuanmax',
    description: 'Paket lengkap script premium.',
    price: 150000,
    original_price: 250000,
    image_path: '',
    category_slug: 'home',
    sold_count: 32,
    is_new: false,
    is_featured: true,
  },
  {
    id: 3,
    name: 'e-Wallet Bebas Nomial',
    slug: 'e-wallet-bebas-nomial',
    description: 'Fitur e-Wallet dengan nominal bebas.',
    price: 80000,
    original_price: 100000,
    image_path: '',
    category_slug: 'kostum-checkout',
    sold_count: 15,
    is_new: true,
    is_featured: false,
  },
]

let pool = null

async function getPool() {
  if (pool) return pool
  try {
    pool = mysql.createPool(dbConfig)
    await pool.query('SELECT 1')
    return pool
  } catch (err) {
    console.warn('MySQL tidak tersedia, menggunakan data fallback:', err.message)
    return null
  }
}

// GET /api/categories
app.get('/api/categories', async (_req, res) => {
  try {
    const p = await getPool()
    if (p) {
      const [rows] = await p.query(
        'SELECT id, name, slug FROM categories ORDER BY name'
      )
      return res.json(rows)
    }
    res.json(fallbackCategories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

async function attachImages(pool, products) {
  if (!products.length) return products
  const ids = products.map((p) => p.id)
  const [imgs] = await pool.query(
    `SELECT id, product_id, image_path, sort_order FROM product_images WHERE product_id IN (?) ORDER BY sort_order, id`,
    [ids]
  )
  const map = {}
  for (const img of imgs) {
    if (!map[img.product_id]) map[img.product_id] = []
    map[img.product_id].push(img)
  }
  return products.map((p) => ({
    ...p,
    images: map[p.id] || (p.image_path ? [{ id: null, product_id: p.id, image_path: p.image_path, sort_order: 0 }] : []),
  }))
}

// GET /api/products?search=&category=&sort=&page=1&limit=18
app.get('/api/products', async (req, res) => {
  try {
    let { search = '', category = '', sort = 'terlaris' } = req.query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 18))
    const offset = (page - 1) * limit

    if (search === 'undefined' || search == null) search = ''
    if (category === 'undefined' || category == null) category = ''
    search = String(search).trim()
    category = String(category).trim()
    const p = await getPool()

    if (p) {
      let where = ' WHERE 1=1'
      const params = []
      if (search) {
        where += ' AND (p.name LIKE ? OR p.description LIKE ?)'
        const term = `%${search}%`
        params.push(term, term)
      }
      if (category) {
        where += ' AND c.slug = ?'
        params.push(category)
      }

      const countSql = `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON p.category_id = c.id${where}`
      const [[{ total }]] = await p.query(countSql, params)

      let sql = `
        SELECT p.id, p.name, p.slug, p.description, p.price, p.original_price,
               p.image_path, p.sold_count, p.is_new, p.is_featured, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${where}
      `
      if (sort === 'terbaru') sql += ' ORDER BY p.created_at DESC'
      else if (sort === 'harga_terendah') sql += ' ORDER BY p.price ASC'
      else if (sort === 'harga_tertinggi') sql += ' ORDER BY p.price DESC'
      else sql += ' ORDER BY p.sold_count DESC, p.id'
      sql += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const [rows] = await p.query(sql, params)
      const withImages = await attachImages(p, rows)
      return res.json({ data: withImages, total, page, limit, totalPages: Math.ceil(total / limit) })
    }

    let list = [...fallbackProducts]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (fp) =>
          fp.name.toLowerCase().includes(q) ||
          (fp.description || '').toLowerCase().includes(q)
      )
    }
    if (category) {
      list = list.filter((fp) => fp.category_slug === category)
    }
    if (sort === 'terbaru') list.reverse()
    if (sort === 'harga_terendah') list.sort((a, b) => a.price - b.price)
    if (sort === 'harga_tertinggi') list.sort((a, b) => b.price - a.price)
    const total = list.length
    const paged = list.slice(offset, offset + limit).map((fp) => ({
      ...fp,
      images: fp.image_path ? [{ id: null, product_id: fp.id, image_path: fp.image_path, sort_order: 0 }] : [],
    }))
    res.json({ data: paged, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/products/:slug
app.get('/api/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const p = await getPool()

    if (p) {
      const [rows] = await p.query(
        `SELECT p.id, p.name, p.slug, p.description, p.price, p.original_price,
                p.image_path, p.sold_count, p.is_new, p.is_featured
         FROM products p
         WHERE p.slug = ?`,
        [slug]
      )
      if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan' })
      const [withImages] = await attachImages(p, rows)
      return res.json(withImages)
    }

    const product = fallbackProducts.find((x) => x.slug === slug)
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    res.json({
      ...product,
      images: product.image_path
        ? [{ id: null, product_id: product.id, image_path: product.image_path, sort_order: 0 }]
        : [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/testimonials (public, only visible — dari table saja)
app.get('/api/testimonials', async (_req, res) => {
  try {
    const p = await getPool()
    if (!p) return res.json([])
    const [rows] = await p.query(
      'SELECT id, author_name, content, rating, created_at FROM testimonials WHERE is_visible = 1 ORDER BY id DESC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Auth ---

async function ensureAdminTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(150) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  const [rows] = await pool.query('SELECT id FROM admin_users LIMIT 1')
  if (!rows.length) {
    const hash = await bcrypt.hash('admin123', 10)
    await pool.query(
      'INSERT INTO admin_users (username, password_hash, display_name) VALUES (?, ?, ?)',
      ['admin', hash, 'Administrator']
    )
    console.log('Default admin created: admin / admin123')
  }
}

getPool().then((p) => { if (p) ensureAdminTable(p).catch(console.error) })

// POST /api/auth/login
app.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' })

    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia' })

    const [rows] = await p.query('SELECT id, username, password_hash, display_name FROM admin_users WHERE username = ?', [username])
    if (!rows.length) return res.status(401).json({ error: 'Username atau password salah' })

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Username atau password salah' })

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    res.json({
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET)
    req.adminUser = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah expired' })
  }
}

// GET /api/auth/me (verify token)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const p = await getPool()
    if (!p) return res.json({ id: req.adminUser.id, username: req.adminUser.username })
    const [rows] = await p.query('SELECT id, username, display_name FROM admin_users WHERE id = ?', [req.adminUser.id])
    if (!rows.length) return res.status(401).json({ error: 'User tidak ditemukan' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/auth/password (change password)
app.put('/api/auth/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {}
    if (!current_password || !new_password) return res.status(400).json({ error: 'Password lama dan baru wajib diisi' })
    if (new_password.length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter' })

    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia' })

    const [rows] = await p.query('SELECT id, password_hash FROM admin_users WHERE id = ?', [req.adminUser.id])
    if (!rows.length) return res.status(401).json({ error: 'User tidak ditemukan' })

    const valid = await bcrypt.compare(current_password, rows[0].password_hash)
    if (!valid) return res.status(400).json({ error: 'Password lama salah' })

    const hash = await bcrypt.hash(new_password, 10)
    await p.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, req.adminUser.id])

    res.json({ message: 'Password berhasil diubah' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Protect all /api/admin/* routes
app.use('/api/admin', authMiddleware)

// --- Admin API ---

// GET /api/admin/categories (full list for admin)
app.get('/api/admin/categories', async (_req, res) => {
  try {
    const p = await getPool()
    if (p) {
      const [rows] = await p.query('SELECT id, name, slug FROM categories ORDER BY name')
      return res.json(rows)
    }
    res.json(fallbackCategories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/categories
app.post('/api/admin/categories', express.json(), async (req, res) => {
  try {
    const { name, slug: rawSlug } = req.body || {}
    const nameStr = String(name || '').trim()
    if (!nameStr) return res.status(400).json({ error: 'name wajib diisi' })
    const slug = rawSlug ? String(rawSlug).trim() || slugify(nameStr) : slugify(nameStr)

    const p = await getPool()
    if (p) {
      const [r] = await p.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [nameStr, slug])
      const [rows] = await p.query('SELECT id, name, slug FROM categories WHERE id = ?', [r.insertId])
      return res.status(201).json(rows[0])
    }
    const id = Math.max(0, ...fallbackCategories.map((c) => c.id)) + 1
    fallbackCategories.push({ id, name: nameStr, slug })
    res.status(201).json({ id, name: nameStr, slug })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/categories/:id
app.put('/api/admin/categories/:id', express.json(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { name, slug: rawSlug } = req.body || {}
    const nameStr = String(name ?? '').trim()
    const slug = rawSlug != null ? String(rawSlug).trim() || slugify(nameStr) : null

    const p = await getPool()
    if (p) {
      if (slug !== null) {
        await p.query('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [nameStr, slug, id])
      } else {
        await p.query('UPDATE categories SET name = ? WHERE id = ?', [nameStr, id])
      }
      const [rows] = await p.query('SELECT id, name, slug FROM categories WHERE id = ?', [id])
      if (!rows.length) return res.status(404).json({ error: 'Kategori tidak ditemukan' })
      return res.json(rows[0])
    }
    const cat = fallbackCategories.find((c) => c.id === id)
    if (!cat) return res.status(404).json({ error: 'Kategori tidak ditemukan' })
    cat.name = nameStr
    if (slug !== null) cat.slug = slug
    res.json(cat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/categories/:id
app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const p = await getPool()
    if (p) {
      const [r] = await p.query('DELETE FROM categories WHERE id = ?', [id])
      if (r.affectedRows === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' })
      return res.status(204).send()
    }
    const idx = fallbackCategories.findIndex((c) => c.id === id)
    if (idx === -1) return res.status(404).json({ error: 'Kategori tidak ditemukan' })
    fallbackCategories.splice(idx, 1)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/products?search=&page=1&limit=10
app.get('/api/admin/products', async (req, res) => {
  try {
    let { search = '' } = req.query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10))
    const offset = (page - 1) * limit
    if (search === 'undefined' || search == null) search = ''
    search = String(search).trim()

    const p = await getPool()
    if (p) {
      let where = ' WHERE 1=1'
      const params = []
      if (search) {
        where += ' AND (p.name LIKE ? OR p.description LIKE ?)'
        const term = `%${search}%`
        params.push(term, term)
      }
      const [[{ total }]] = await p.query(
        `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON p.category_id = c.id${where}`,
        params
      )
      const [rows] = await p.query(
        `SELECT p.id, p.name, p.slug, p.description, p.price, p.original_price,
                p.image_path, p.template_file, p.sold_count, p.is_new, p.is_featured, p.category_id,
                c.slug AS category_slug
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         ${where}
         ORDER BY p.id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      )
      const withImages = await attachImages(p, rows)
      return res.json({ data: withImages, total, page, limit, totalPages: Math.ceil(total / limit) })
    }

    let list = fallbackProducts.map((x) => ({
      ...x,
      category_id: fallbackCategories.find((c) => c.slug === x.category_slug)?.id ?? null,
    }))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (x) => x.name.toLowerCase().includes(q) || (x.description || '').toLowerCase().includes(q)
      )
    }
    const total = list.length
    const paged = list.slice(offset, offset + limit).map((x) => ({
      ...x,
      images: x.image_path ? [{ id: null, product_id: x.id, image_path: x.image_path, sort_order: 0 }] : [],
    }))
    res.json({ data: paged, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/products/:id (by id for edit)
app.get('/api/admin/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const p = await getPool()
    if (p) {
      const [rows] = await p.query(`
        SELECT p.id, p.name, p.slug, p.description, p.price, p.original_price,
               p.image_path, p.template_file, p.sold_count, p.is_new, p.is_featured, p.category_id,
               c.slug AS category_slug FROM products p
        LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
      `, [id])
      if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan' })
      const [withImages] = await attachImages(p, rows)
      return res.json(withImages)
    }
    const product = fallbackProducts.find((x) => x.id === id)
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    const category_id = fallbackCategories.find((c) => c.slug === product.category_slug)?.id ?? null
    res.json({
      ...product,
      category_id,
      images: product.image_path
        ? [{ id: null, product_id: product.id, image_path: product.image_path, sort_order: 0 }]
        : [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/products (multipart: images + template + fields)
app.post('/api/admin/products', productFields, async (req, res) => {
  try {
    const body = req.body || {}
    const nameStr = String(body.name ?? '').trim()
    if (!nameStr) return res.status(400).json({ error: 'name wajib diisi' })
    const slug = String(body.slug ?? slugify(nameStr)).trim() || slugify(nameStr)
    const description = String(body.description ?? '').trim()
    const price = Math.max(0, parseInt(body.price, 10) || 0)
    const original_price = Math.max(0, parseInt(body.original_price, 10) || 0)
    const sold_count = Math.max(0, parseInt(body.sold_count, 10) || 0)
    const is_new = Boolean(body.is_new === true || body.is_new === '1' || body.is_new === 'true')
    const is_featured = Boolean(body.is_featured === true || body.is_featured === '1' || body.is_featured === 'true')
    const category_id = body.category_id ? parseInt(body.category_id, 10) || null : null
    const imageFiles = req.files?.images || []
    const templateFile = req.files?.template?.[0] || null
    const primaryImage = imageFiles.length ? imageFiles[0].filename : null
    const template_file = templateFile ? templateFile.filename : null

    const p = await getPool()
    if (p) {
      const [r] = await p.query(
        `INSERT INTO products (category_id, name, slug, description, price, original_price, image_path, template_file, sold_count, is_new, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [category_id, nameStr, slug, description, price, original_price, primaryImage, template_file, sold_count, is_new ? 1 : 0, is_featured ? 1 : 0]
      )
      const productId = r.insertId
      for (let i = 0; i < imageFiles.length; i++) {
        await p.query(
          'INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)',
          [productId, imageFiles[i].filename, i]
        )
      }
      const [rows] = await p.query(`
        SELECT p.id, p.name, p.slug, p.description, p.price, p.original_price, p.image_path, p.template_file, p.sold_count, p.is_new, p.is_featured, p.category_id, c.slug AS category_slug
        FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
      `, [productId])
      const [withImages] = await attachImages(p, rows)
      return res.status(201).json(withImages)
    }
    const id = Math.max(0, ...fallbackProducts.map((x) => x.id)) + 1
    const catSlug = fallbackCategories.find((c) => c.id === category_id)?.slug || null
    const newProduct = {
      id, name: nameStr, slug, description, price, original_price, template_file,
      image_path: primaryImage || '', category_slug: catSlug, sold_count, is_new, is_featured,
      images: imageFiles.map((f, i) => ({ id: null, product_id: id, image_path: f.filename, sort_order: i })),
    }
    fallbackProducts.push(newProduct)
    res.status(201).json({ ...newProduct, category_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/products/:id (optional images + template)
app.put('/api/admin/products/:id', productFields, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const body = req.body || {}
    const nameStr = String(body.name ?? '').trim()
    if (!nameStr) return res.status(400).json({ error: 'name wajib diisi' })
    const slug = String(body.slug ?? slugify(nameStr)).trim() || slugify(nameStr)
    const description = String(body.description ?? '').trim()
    const price = Math.max(0, parseInt(body.price, 10) || 0)
    const original_price = Math.max(0, parseInt(body.original_price, 10) || 0)
    const sold_count = Math.max(0, parseInt(body.sold_count, 10) || 0)
    const is_new = Boolean(body.is_new === true || body.is_new === '1' || body.is_new === 'true')
    const is_featured = Boolean(body.is_featured === true || body.is_featured === '1' || body.is_featured === 'true')
    const category_id = body.category_id ? parseInt(body.category_id, 10) || null : null
    const imageFiles = req.files?.images || []
    const templateFile = req.files?.template?.[0] || null

    const p = await getPool()
    if (p) {
      if (templateFile) {
        const [oldProd] = await p.query('SELECT template_file FROM products WHERE id = ?', [id])
        if (oldProd.length && oldProd[0].template_file) {
          unlinkSafe(path.join(templatesDir, oldProd[0].template_file))
        }
        await p.query(
          `UPDATE products SET category_id=?, name=?, slug=?, description=?, price=?, original_price=?, template_file=?, sold_count=?, is_new=?, is_featured=? WHERE id=?`,
          [category_id, nameStr, slug, description, price, original_price, templateFile.filename, sold_count, is_new ? 1 : 0, is_featured ? 1 : 0, id]
        )
      } else {
        await p.query(
          `UPDATE products SET category_id=?, name=?, slug=?, description=?, price=?, original_price=?, sold_count=?, is_new=?, is_featured=? WHERE id=?`,
          [category_id, nameStr, slug, description, price, original_price, sold_count, is_new ? 1 : 0, is_featured ? 1 : 0, id]
        )
      }
      if (imageFiles.length) {
        const [[{ maxSort }]] = await p.query(
          'SELECT COALESCE(MAX(sort_order), -1) AS maxSort FROM product_images WHERE product_id = ?',
          [id]
        )
        for (let i = 0; i < imageFiles.length; i++) {
          await p.query(
            'INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)',
            [id, imageFiles[i].filename, maxSort + 1 + i]
          )
        }
        const [[firstImg]] = await p.query(
          'SELECT image_path FROM product_images WHERE product_id = ? ORDER BY sort_order, id LIMIT 1',
          [id]
        )
        if (firstImg) {
          await p.query('UPDATE products SET image_path = ? WHERE id = ?', [firstImg.image_path, id])
        }
      }
      const [rows] = await p.query(`
        SELECT p.id, p.name, p.slug, p.description, p.price, p.original_price, p.image_path, p.template_file, p.sold_count, p.is_new, p.is_featured, p.category_id, c.slug AS category_slug
        FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
      `, [id])
      if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan' })
      const [withImages] = await attachImages(p, rows)
      return res.json(withImages)
    }
    const product = fallbackProducts.find((x) => x.id === id)
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    product.name = nameStr
    product.slug = slug
    product.description = description
    product.price = price
    product.original_price = original_price
    product.sold_count = sold_count
    product.is_new = is_new
    product.is_featured = is_featured
    if (category_id != null) {
      const cat = fallbackCategories.find((c) => c.id === category_id)
      product.category_slug = cat ? cat.slug : null
    }
    if (imageFiles.length) product.image_path = imageFiles[0].filename
    if (templateFile) product.template_file = templateFile.filename
    res.json({ ...product, category_id, images: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/products/:productId/images/:imageId
app.delete('/api/admin/products/:productId/images/:imageId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10)
    const imageId = parseInt(req.params.imageId, 10)
    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia' })

    const [imgRows] = await p.query(
      'SELECT image_path FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, productId]
    )
    if (!imgRows.length) return res.status(404).json({ error: 'Gambar tidak ditemukan' })

    const deletedFile = imgRows[0].image_path
    await p.query('DELETE FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId])

    unlinkSafe(path.join(uploadsDir, deletedFile))

    const [[firstImg]] = await p.query(
      'SELECT image_path FROM product_images WHERE product_id = ? ORDER BY sort_order, id LIMIT 1',
      [productId]
    )
    await p.query('UPDATE products SET image_path = ? WHERE id = ?', [
      firstImg ? firstImg.image_path : null,
      productId,
    ])

    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/products/:id
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const p = await getPool()
    if (p) {
      const [prodRows] = await p.query('SELECT template_file FROM products WHERE id = ?', [id])
      if (!prodRows.length) return res.status(404).json({ error: 'Produk tidak ditemukan' })

      const [imgRows] = await p.query('SELECT image_path FROM product_images WHERE product_id = ?', [id])

      await p.query('DELETE FROM products WHERE id = ?', [id])

      for (const img of imgRows) unlinkSafe(path.join(uploadsDir, img.image_path))
      if (prodRows[0].template_file) unlinkSafe(path.join(templatesDir, prodRows[0].template_file))

      return res.status(204).send()
    }
    const idx = fallbackProducts.findIndex((x) => x.id === id)
    if (idx === -1) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    fallbackProducts.splice(idx, 1)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/testimonials (dari table saja)
app.get('/api/admin/testimonials', async (_req, res) => {
  try {
    const p = await getPool()
    if (!p) return res.json([])
    const [rows] = await p.query('SELECT id, author_name, content, rating, is_visible, created_at FROM testimonials ORDER BY id DESC')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/testimonials (dari table saja)
app.post('/api/admin/testimonials', express.json(), async (req, res) => {
  try {
    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia. Testimoni hanya disimpan di database.' })
    const { author_name, content, rating, is_visible } = req.body || {}
    const authorStr = String(author_name ?? '').trim()
    const contentStr = String(content ?? '').trim()
    if (!authorStr) return res.status(400).json({ error: 'author_name wajib diisi' })
    if (!contentStr) return res.status(400).json({ error: 'content wajib diisi' })
    const ratingNum = rating != null ? Math.min(5, Math.max(0, parseInt(rating, 10) || 0)) : null
    const visible = is_visible !== false && is_visible !== '0'

    const [r] = await p.query(
      'INSERT INTO testimonials (author_name, content, rating, is_visible) VALUES (?, ?, ?, ?)',
      [authorStr, contentStr, ratingNum, visible ? 1 : 0]
    )
    const [rows] = await p.query('SELECT id, author_name, content, rating, is_visible, created_at FROM testimonials WHERE id = ?', [r.insertId])
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/testimonials/:id (dari table saja)
app.put('/api/admin/testimonials/:id', express.json(), async (req, res) => {
  try {
    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia. Testimoni hanya disimpan di database.' })
    const id = parseInt(req.params.id, 10)
    const { author_name, content, rating, is_visible } = req.body || {}
    const authorStr = String(author_name ?? '').trim()
    const contentStr = String(content ?? '').trim()
    if (!authorStr) return res.status(400).json({ error: 'author_name wajib diisi' })
    if (!contentStr) return res.status(400).json({ error: 'content wajib diisi' })
    const ratingNum = rating != null ? Math.min(5, Math.max(0, parseInt(rating, 10) || 0)) : null
    const visible = is_visible !== false && is_visible !== '0'

    const [r] = await p.query(
      'UPDATE testimonials SET author_name = ?, content = ?, rating = ?, is_visible = ? WHERE id = ?',
      [authorStr, contentStr, ratingNum, visible ? 1 : 0, id]
    )
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Testimoni tidak ditemukan' })
    const [rows] = await p.query('SELECT id, author_name, content, rating, is_visible, created_at FROM testimonials WHERE id = ?', [id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/testimonials/:id (dari table saja)
app.delete('/api/admin/testimonials/:id', async (req, res) => {
  try {
    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia. Testimoni hanya disimpan di database.' })
    const id = parseInt(req.params.id, 10)
    const [r] = await p.query('DELETE FROM testimonials WHERE id = ?', [id])
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Testimoni tidak ditemukan' })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Orders / Checkout ---

// POST /api/checkout
app.post('/api/checkout', express.json(), async (req, res) => {
  try {
    const { product_id, customer_name, customer_email, customer_whatsapp } = req.body || {}
    const pid = parseInt(product_id, 10)
    const name = String(customer_name ?? '').trim()
    const email = String(customer_email ?? '').trim()
    const wa = String(customer_whatsapp ?? '').trim()
    if (!pid) return res.status(400).json({ error: 'product_id wajib diisi' })
    if (!name) return res.status(400).json({ error: 'Nama wajib diisi' })
    if (!email) return res.status(400).json({ error: 'Email wajib diisi' })
    if (!wa) return res.status(400).json({ error: 'Nomor WhatsApp wajib diisi' })

    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia' })

    const [prods] = await p.query('SELECT id, name, price FROM products WHERE id = ?', [pid])
    if (!prods.length) return res.status(404).json({ error: 'Produk tidak ditemukan' })
    const product = prods[0]

    const orderId = generateOrderId()
    await p.query(
      `INSERT INTO orders (order_id, product_id, customer_name, customer_email, customer_whatsapp, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [orderId, pid, name, email, wa, product.price]
    )
    const [rows] = await p.query(
      `SELECT o.id, o.order_id, o.product_id, o.customer_name, o.customer_email, o.customer_whatsapp,
              o.amount, o.status, o.created_at, p.name AS product_name
       FROM orders o JOIN products p ON o.product_id = p.id WHERE o.order_id = ?`,
      [orderId]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/orders/:orderId (public check)
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia' })

    const [rows] = await p.query(
      `SELECT o.id, o.order_id, o.product_id, o.customer_name, o.customer_email,
              o.amount, o.status, o.created_at, o.paid_at,
              p.name AS product_name, p.template_file
       FROM orders o JOIN products p ON o.product_id = p.id
       WHERE o.order_id = ?`,
      [orderId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Order tidak ditemukan' })
    const order = rows[0]
    const result = {
      order_id: order.order_id,
      product_name: order.product_name,
      customer_name: order.customer_name,
      amount: order.amount,
      status: order.status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      has_download: order.status === 'paid' && !!order.template_file,
    }
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/orders/:orderId/download
app.get('/api/orders/:orderId/download', async (req, res) => {
  try {
    const { orderId } = req.params
    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia' })

    const [rows] = await p.query(
      `SELECT o.status, p.template_file, p.name AS product_name
       FROM orders o JOIN products p ON o.product_id = p.id
       WHERE o.order_id = ?`,
      [orderId]
    )
    if (!rows.length) return res.status(404).json({ error: 'Order tidak ditemukan' })
    const order = rows[0]
    if (order.status !== 'paid') return res.status(403).json({ error: 'Pembayaran belum dikonfirmasi' })
    if (!order.template_file) return res.status(404).json({ error: 'File template tidak tersedia' })

    const filePath = path.join(templatesDir, order.template_file)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File tidak ditemukan di server' })

    const ext = path.extname(order.template_file)
    const downloadName = `${slugify(order.product_name)}${ext}`
    res.download(filePath, downloadName)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/orders?page=1&limit=10&status=&search=
app.get('/api/admin/orders', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10))
    const offset = (page - 1) * limit
    let { search = '', status = '' } = req.query
    search = String(search ?? '').trim()
    status = String(status ?? '').trim()

    const p = await getPool()
    if (!p) return res.json({ data: [], total: 0, page, limit, totalPages: 0 })

    let where = ' WHERE 1=1'
    const params = []
    if (search) {
      where += ' AND (o.order_id LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR p.name LIKE ?)'
      const term = `%${search}%`
      params.push(term, term, term, term)
    }
    if (status) {
      where += ' AND o.status = ?'
      params.push(status)
    }
    const [[{ total }]] = await p.query(
      `SELECT COUNT(*) AS total FROM orders o JOIN products p ON o.product_id = p.id${where}`,
      params
    )
    const [rows] = await p.query(
      `SELECT o.id, o.order_id, o.product_id, o.customer_name, o.customer_email, o.customer_whatsapp,
              o.amount, o.status, o.admin_note, o.created_at, o.paid_at,
              p.name AS product_name
       FROM orders o JOIN products p ON o.product_id = p.id
       ${where}
       ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/orders/:id (update status)
app.put('/api/admin/orders/:id', express.json(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { status, admin_note } = req.body || {}
    const validStatuses = ['pending', 'paid', 'expired', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status harus: ${validStatuses.join(', ')}` })
    }

    const p = await getPool()
    if (!p) return res.status(503).json({ error: 'Database tidak tersedia' })

    const updates = []
    const vals = []
    if (status) {
      updates.push('status = ?')
      vals.push(status)
      if (status === 'paid') {
        updates.push('paid_at = NOW()')
      }
    }
    if (admin_note != null) {
      updates.push('admin_note = ?')
      vals.push(String(admin_note))
    }
    if (!updates.length) return res.status(400).json({ error: 'Tidak ada data yang diupdate' })
    vals.push(id)

    const [r] = await p.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, vals)
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Order tidak ditemukan' })

    const [rows] = await p.query(
      `SELECT o.id, o.order_id, o.product_id, o.customer_name, o.customer_email, o.customer_whatsapp,
              o.amount, o.status, o.admin_note, o.created_at, o.paid_at,
              p.name AS product_name
       FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?`,
      [id]
    )
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// --- Settings ---

const SETTING_KEYS = ['announcement', 'whatsapp_number', 'ketentuan_layanan']

const fallbackSettings = {
  announcement: 'Selamat datang di kliktemplate.com — Paket Script Dengan biaya lebih Hemat. Silakan cek produk terbaru dan promo kami.',
  whatsapp_number: '6281234567890',
  ketentuan_layanan: 'Syarat dan ketentuan penggunaan layanan kliktemplate.com.',
}

function buildSettingsObj(rows) {
  const obj = {}
  for (const r of rows) obj[r.setting_key] = r.setting_value
  const result = {}
  for (const key of SETTING_KEYS) result[key] = obj[key] ?? fallbackSettings[key] ?? ''
  return result
}

// GET /api/settings (public — only safe keys)
app.get('/api/settings', async (_req, res) => {
  try {
    const p = await getPool()
    if (p) {
      const [rows] = await p.query('SELECT setting_key, setting_value FROM settings')
      return res.json(buildSettingsObj(rows))
    }
    res.json({ ...fallbackSettings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/settings
app.get('/api/admin/settings', async (_req, res) => {
  try {
    const p = await getPool()
    if (p) {
      const [rows] = await p.query('SELECT setting_key, setting_value FROM settings')
      return res.json(buildSettingsObj(rows))
    }
    res.json({ ...fallbackSettings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/settings
app.put('/api/admin/settings', express.json(), async (req, res) => {
  try {
    const body = req.body || {}
    const p = await getPool()
    if (p) {
      for (const key of SETTING_KEYS) {
        if (body[key] != null) {
          await p.query(
            `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [key, String(body[key])]
          )
        }
      }
      const [rows] = await p.query('SELECT setting_key, setting_value FROM settings')
      return res.json(buildSettingsObj(rows))
    }
    for (const key of SETTING_KEYS) {
      if (body[key] != null) fallbackSettings[key] = String(body[key])
    }
    res.json({ ...fallbackSettings })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`)
  console.log(`Uploads: ${uploadsDir}`)
})
