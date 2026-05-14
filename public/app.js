const grid = document.getElementById('bookGrid');
const emptyState = document.getElementById('emptyState');
const genreFilter = document.getElementById('genreFilter');
const sortBy = document.getElementById('sortBy');
const genreList = document.getElementById('genreList');
const modal = document.getElementById('modal');
const form = document.getElementById('bookForm');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const addBtn = document.getElementById('addBtn');
const cancelBtn = document.getElementById('cancelBtn');

let editingId = null;

const REQUIRED = ['title', 'author', 'genre', 'rating', 'date_finished'];

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderStars(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += i <= rating ? '★' : '<span class="empty">★</span>';
  }
  return s;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function loadGenres() {
  const res = await fetch('/api/genres');
  const genres = await res.json();
  const current = genreFilter.value;
  genreFilter.innerHTML = '<option value="">All genres</option>' +
    genres.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
  if (genres.includes(current)) genreFilter.value = current;
  genreList.innerHTML = genres.map((g) => `<option value="${escapeHtml(g)}">`).join('');
}

async function loadBooks() {
  const params = new URLSearchParams();
  if (genreFilter.value) params.set('genre', genreFilter.value);
  if (sortBy.value) params.set('sort', sortBy.value);
  const res = await fetch('/api/books?' + params.toString());
  const books = await res.json();
  render(books);
}

function render(books) {
  if (books.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  grid.innerHTML = books.map((b) => {
    const notes = b.notes ? escapeHtml(b.notes.slice(0, 100)) + (b.notes.length > 100 ? '…' : '') : '';
    return `
      <article class="card">
        <h3>${escapeHtml(b.title)}</h3>
        <p class="author">by ${escapeHtml(b.author)}</p>
        <span class="pill">${escapeHtml(b.genre)}</span>
        <div class="stars-display" aria-label="${b.rating} out of 5 stars">${renderStars(b.rating)}</div>
        <div class="date">Finished ${fmtDate(b.date_finished)}</div>
        ${notes ? `<p class="notes">${notes}</p>` : ''}
        <div class="card-actions">
          <button class="btn btn-secondary" data-edit="${b.id}">Edit</button>
          <button class="btn btn-danger" data-delete="${b.id}">Delete</button>
        </div>
      </article>
    `;
  }).join('');
}

function openModal(book) {
  form.reset();
  clearErrors();
  if (book) {
    editingId = book.id;
    modalTitle.textContent = 'Edit Book';
    submitBtn.textContent = 'Save Changes';
    document.getElementById('bookId').value = book.id;
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('genre').value = book.genre;
    document.getElementById('date_finished').value = book.date_finished;
    document.getElementById('notes').value = book.notes || '';
    const r = document.getElementById('r' + book.rating);
    if (r) r.checked = true;
  } else {
    editingId = null;
    modalTitle.textContent = 'Add Book';
    submitBtn.textContent = 'Save';
    document.getElementById('date_finished').value = new Date().toISOString().slice(0, 10);
  }
  modal.classList.remove('hidden');
  document.getElementById('title').focus();
}

function closeModal() {
  modal.classList.add('hidden');
  editingId = null;
}

function clearErrors() {
  document.querySelectorAll('.error').forEach((e) => (e.textContent = ''));
}

function showError(field, msg) {
  const el = document.querySelector(`[data-error="${field}"]`);
  if (el) el.textContent = msg;
}

function validateForm(data) {
  clearErrors();
  let ok = true;
  for (const f of REQUIRED) {
    if (!data[f]) {
      showError(f, 'Required');
      ok = false;
    }
  }
  return ok;
}

async function submitForm(e) {
  e.preventDefault();
  const fd = new FormData(form);
  const data = {
    title: fd.get('title')?.trim(),
    author: fd.get('author')?.trim(),
    genre: fd.get('genre')?.trim(),
    rating: fd.get('rating'),
    date_finished: fd.get('date_finished'),
    notes: fd.get('notes')?.trim() || null
  };
  if (!validateForm(data)) return;
  data.rating = Number(data.rating);

  const url = editingId ? `/api/books/${editingId}` : '/api/books';
  const method = editingId ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    alert(err.error || 'Request failed');
    return;
  }
  closeModal();
  await loadGenres();
  await loadBooks();
}

async function handleGridClick(e) {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-delete');
  if (editId) {
    const res = await fetch(`/api/books/${editId}`);
    if (res.ok) openModal(await res.json());
  } else if (delId) {
    if (!confirm('Delete this book?')) return;
    const res = await fetch(`/api/books/${delId}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      await loadGenres();
      await loadBooks();
    }
  }
}

addBtn.addEventListener('click', () => openModal(null));
cancelBtn.addEventListener('click', closeModal);
form.addEventListener('submit', submitForm);
grid.addEventListener('click', handleGridClick);
genreFilter.addEventListener('change', loadBooks);
sortBy.addEventListener('change', loadBooks);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

loadGenres().then(loadBooks);
