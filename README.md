# bookshelf-recorder

A simple CRUD web app for tracking books I've read.

## Stack
- Node.js + Express
- SQLite via better-sqlite3
- Vanilla JS frontend, plain CSS

## Setup

```bash
npm install
npm start
```

Then open http://localhost:3000.

On first run, `books.db` is created and seeded with 5 example books.

## Usage
- **+ Add Book** opens a modal to create a new entry.
- **Edit** / **Delete** buttons on each card modify or remove entries.
- Use the **Genre** and **Sort** dropdowns to filter and sort the list.
- Press **Esc** to dismiss the modal.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/books?genre=&sort=` | List books (sort: `rating_desc`, `rating_asc`, `date_desc`, `date_asc`) |
| GET | `/api/books/:id` | Get one book |
| POST | `/api/books` | Create |
| PUT | `/api/books/:id` | Update |
| DELETE | `/api/books/:id` | Delete |
| GET | `/api/genres` | Distinct genres |

Required fields: `title`, `author`, `genre`, `rating` (1–5), `date_finished` (YYYY-MM-DD). `notes` optional.

## Files
- `server.js` — Express app and routes
- `db.js` — SQLite setup, schema, seed
- `public/index.html`, `public/app.js`, `public/styles.css` — frontend
- `books.db` — SQLite database (gitignored)
