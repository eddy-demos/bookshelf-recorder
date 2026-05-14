const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'books.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    date_finished TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const count = db.prepare('SELECT COUNT(*) AS c FROM books').get().c;
if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO books (title, author, genre, rating, date_finished, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const seed = [
    ['The Pragmatic Programmer', 'Andrew Hunt & David Thomas', 'Non-fiction', 5, '2025-01-12', 'Timeless advice on craft and discipline.'],
    ['Project Hail Mary', 'Andy Weir', 'Science Fiction', 5, '2025-02-20', 'Loved the problem-solving and the unexpected friendship.'],
    ['Educated', 'Tara Westover', 'Memoir', 4, '2025-03-08', 'A harrowing and inspiring story of self-reinvention.'],
    ['The Three-Body Problem', 'Liu Cixin', 'Science Fiction', 4, '2025-03-30', 'Big ideas, slow start but rewarding.'],
    ['Atomic Habits', 'James Clear', 'Self-help', 3, '2025-04-15', 'Some useful frameworks; a bit repetitive.'],
    ['Klara and the Sun', 'Kazuo Ishiguro', 'Fiction', 4, '2025-05-02', 'Quiet, melancholy, beautifully observed.'],
    ['Sapiens', 'Yuval Noah Harari', 'Non-fiction', 4, '2025-06-10', 'Sweeping and provocative, sometimes overreaches.'],
    ['Dune', 'Frank Herbert', 'Science Fiction', 5, '2025-07-22', 'A masterwork of world-building and politics.'],
    ['The Remains of the Day', 'Kazuo Ishiguro', 'Fiction', 5, '2025-08-14', 'Restrained, devastating, perfectly paced.']
  ];
  const tx = db.transaction((rows) => rows.forEach((r) => insert.run(...r)));
  tx(seed);
}

module.exports = db;
