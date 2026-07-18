# Contributing to Within

Thanks for your interest in contributing! Within is a small project and every contribution counts — bug reports, feature ideas, documentation fixes, and code.

## Ways to Contribute

- **Report a bug** — open a [bug report](https://github.com/aliffrhn/within/issues/new?template=bug_report.yml).
- **Suggest a feature** — open a [feature request](https://github.com/aliffrhn/within/issues/new?template=feature_request.yml).
- **Improve docs** — typos, unclear steps, missing troubleshooting entries.
- **Submit code** — pick an open issue (or open one first for bigger changes) and send a PR.

For anything beyond a small fix, please open an issue first so we can discuss the approach before you invest time in it.

## Development Setup

Prerequisites: Python 3.10+, Node.js 18+, and `ffmpeg` on your PATH (see the [README](README.md#install-ffmpeg-required)).

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/within.git
cd within

# Backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend (in a second terminal)
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies API calls to the Flask backend on port 5050.

> **Tip:** for faster local testing, use a small Whisper model: `export WHISPER_MODEL=tiny`.

## Project Structure

```
within/
├── app.py                 # Flask backend: /config, /transcribe, /summarize
├── requirements.txt       # Python dependencies
├── src/
│   ├── App.jsx            # Main React app
│   ├── main.jsx           # Entry point
│   ├── components/ui/     # Reusable UI components (shadcn/ui style)
│   └── lib/               # Frontend utilities
├── docs/media/            # Screenshots and GIFs used in the README
└── .github/               # Issue templates, PR template, CI workflow
```

## Pull Request Workflow

1. Create a branch from `main`: `git checkout -b feat/short-description` (or `fix/…`, `docs/…`).
2. Make your changes. Keep PRs focused — one change per PR is easier to review.
3. Verify before pushing:
   - `npm run build` succeeds.
   - The app still works end-to-end (upload → transcribe → optional summary).
4. Write a clear commit message in the imperative mood (e.g., `Add drag-and-drop upload`).
5. Push and open a PR against `main`, filling in the PR template.

CI runs a frontend build and a backend check on every PR — please make sure it passes.

## Code Style

- **Python** — follow the existing style in `app.py`; keep it simple and standard-library-first.
- **JavaScript/React** — match the existing component patterns in `src/components/ui/`; Tailwind for styling.
- No need to introduce new dependencies for small features — prefer what's already in the project.

## Questions?

Open a [discussion or issue](https://github.com/aliffrhn/within/issues) — happy to help you get started.
