const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const REQUIRED = ['title', 'author', 'genre', 'rating', 'date_finished'];

function validate(body) {
  for (const f of REQUIRED) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      return `Field "${f}" is required`;
    }
  }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'Rating must be an integer between 1 and 5';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date_finished)) {
    return 'date_finished must be ISO format YYYY-MM-DD';
  }
  return null;
}

app.get('/api/books', (req, res) => {
  const { genre, sort } = req.query;
  const orders = {
    rating_desc: 'rating DESC, date_finished DESC',
    rating_asc: 'rating ASC, date_finished DESC',
    date_desc: 'date_finished DESC',
    date_asc: 'date_finished ASC'
  };
  const order = orders[sort] || orders.date_desc;
  let sql = 'SELECT * FROM books';
  const params = [];
  if (genre) {
    sql += ' WHERE genre = ?';
    params.push(genre);
  }
  sql += ` ORDER BY ${order}`;
  res.json(db.prepare(sql).all(...params));
});

app.get('/api/genres', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT genre FROM books ORDER BY genre').all();
  res.json(rows.map((r) => r.genre));
});

app.get('/api/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const { title, author, genre, rating, date_finished, notes } = req.body;
  const info = db
    .prepare(
      'INSERT INTO books (title, author, genre, rating, date_finished, notes) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(title, author, genre, Number(rating), date_finished, notes || null);
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Book not found' });
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const { title, author, genre, rating, date_finished, notes } = req.body;
  db.prepare(
    'UPDATE books SET title = ?, author = ?, genre = ?, rating = ?, date_finished = ?, notes = ? WHERE id = ?'
  ).run(title, author, genre, Number(rating), date_finished, notes || null, req.params.id);
  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id));
});

app.delete('/api/books/:id', (req, res) => {
  const info = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Book not found' });
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bookshelf running on http://localhost:${PORT}`);
});
