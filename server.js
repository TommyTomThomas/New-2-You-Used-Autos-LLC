
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// DB
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);
db.exec(`
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  make TEXT,
  model TEXT,
  year INTEGER,
  price REAL,
  mileage INTEGER,
  color TEXT,
  description TEXT,
  images TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000*60*60*8 }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Auth
function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthed) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname).toLowerCase())
});
const upload = multer({ storage });

// Pages
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/inventory', (_, res) => res.sendFile(path.join(__dirname, 'public', 'inventory.html')));
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Auth API
app.post('/api/login', (req, res) => {
  const real = process.env.ADMIN_PASSWORD;
  const { password } = req.body || {};
  if (!real) return res.status(500).json({ error: 'Missing ADMIN_PASSWORD on server.' });
  if (password && password === real) {
    req.session.isAuthed = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Invalid password' });
});
app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

// Inventory API
app.get('/api/vehicles', (_, res) => {
  const rows = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
  res.json(rows.map(v => ({ ...v, images: v.images ? JSON.parse(v.images) : [] })));
});
app.post('/api/vehicles', requireAuth, upload.array('photos', 10), (req, res) => {
  try {
    const { make, model, year, price, mileage, color, description } = req.body;
    const id = uuidv4();
    const imagePaths = (req.files || []).map(f => `/uploads/${f.filename}`);
    db.prepare(`INSERT INTO vehicles (id, make, model, year, price, mileage, color, description, images)
                VALUES (@id, @make, @model, @year, @price, @mileage, @color, @description, @images)`)
      .run({
        id, make, model,
        year: parseInt(year||0,10),
        price: parseFloat(price||0),
        mileage: parseInt(mileage||0,10),
        color, description,
        images: JSON.stringify(imagePaths)
      });
    res.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save vehicle' });
  }
});
app.delete('/api/vehicles/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const row = db.prepare('SELECT images FROM vehicles WHERE id = ?').get(id);
  if (row?.images) {
    try {
      JSON.parse(row.images).forEach(p => {
        const f = path.join(__dirname, p);
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
    } catch {}
  }
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
