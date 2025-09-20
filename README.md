# Problem Template — Static preview

This is a tiny static website that provides a simple "problem report" template form. It stores reports in your browser's localStorage so you can try filling the template and saving sample entries.

Files added:
- `index.html` — the form and saved list UI
- `styles.css` — minimal styling
- `script.js` — localStorage persistence and UI logic

How to preview locally

Open a terminal and run a static server in this folder. For example, with Python 3:

```bash
cd /Users/arun/ProblemPad
python3 -m http.server 8000

# Then open http://localhost:8000 in your browser
```

Notes
- The frontend will try to talk to a backend at the same origin under `/api/reports`. If no backend is running, the app falls back to using localStorage.

Backend (Flask + SQLite)

Files added under `backend/`:
- `app.py` — Flask app that serves the frontend and provides `/api/reports` endpoints
- `requirements.txt` — Python dependencies

To run the backend (recommended):

```bash
cd /Users/arun/ProblemPad/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py

# then open http://127.0.0.1:8000
```

The server will create `reports.db` in the `ProblemPad` root and provide the API used by the frontend.

Admin access & Excel download

An admin page is available at `/admin.html` but protected by a token. For local testing the token defaults to `changeme`.

To download the Excel directly (admin token required):

```
http://127.0.0.1:8000/api/reports.xlsx?token=changeme
```

Docker

Build and run using the provided `Dockerfile`:

```bash
docker build -t problempad:latest .
docker run -p 8000:8000 -e ADMIN_TOKEN="your-secret-token" problempad:latest
```

Then access the app at http://localhost:8000 and the admin at http://localhost:8000/admin.html?token=your-secret-token
