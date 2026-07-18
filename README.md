<div align="center">

<img src="public/favicon.svg" alt="Within logo" width="72" height="72" />

# Within

**Private meeting transcription with timestamps. Your audio never leaves your machine.**

[![CI](https://github.com/aliffrhn/within/actions/workflows/ci.yml/badge.svg)](https://github.com/aliffrhn/within/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/aliffrhn/within)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Node 18+](https://img.shields.io/badge/node-18%2B-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#features) · [Quick Start](#quick-start) · [Configuration](#environment-variables-backend) · [Contributing](#contributing) · [License](#license)

![Timestamped transcript view](docs/media/feature-transcript.png)

</div>

## Why Within?

Most transcription tools upload your recordings to someone else's server. Within runs [OpenAI Whisper](https://github.com/openai/whisper) locally, so meeting audio stays on your desktop — with optional AI recaps only when you ask for them.

## Features

- 🔒 **Local-first** — runs Whisper on your machine; audio never leaves it.
- 🎙️ **Any audio** — upload MP3, WAV, M4A, FLAC, OGG, or WebM and track progress in-app.
- ⏱️ **Timestamped transcripts** — structured segments with quick copy actions.
- 📝 **Optional AI summary** — bring an OpenAI key to generate bullet notes (only transcript text is sent, never audio).
- 🎛️ **Model picker** — choose any Whisper checkpoint from `tiny` to `large-v3` to balance speed and accuracy.

![Within quick tour](docs/media/within-features.gif)

<details>
<summary><b>More screenshots</b></summary>

**Upload & progress**

![Upload form and progress](docs/media/feature-upload.png)
![Local processing status](docs/media/feature-progress.png)

**AI summary**

![AI summary bullets](docs/media/feature-summary.png)

</details>

## How It Works

```
┌────────────────┐      audio       ┌─────────────────┐
│  React + Vite  │ ───────────────► │  Flask backend  │
│   (frontend)   │ ◄─────────────── │ Whisper (local) │
└────────────────┘    transcript    └────────┬────────┘
                                             │ optional, text only
                                             ▼
                                    ┌─────────────────┐
                                    │   OpenAI API    │
                                    │   (summaries)   │
                                    └─────────────────┘
```

Transcription happens entirely on your machine. The only outbound request is the optional summary call, which sends transcript text — never audio.

## Requirements

- Python 3.10+
- Node.js 18+
- `ffmpeg` installed and on your PATH (see below)
- First run needs internet to download Whisper weights

### Install ffmpeg (required)

Whisper depends on `ffmpeg` for audio decoding. Install it once:

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows (PowerShell):**
```powershell
winget install Gyan.FFmpeg
```

Verify:
```bash
ffmpeg -version
```

## Quick Start

Clone the repo:

```bash
git clone https://github.com/aliffrhn/within.git
cd within
```

**Terminal 1 — backend (Flask + Whisper):**

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Optional overrides
export WHISPER_MODEL=medium   # default: medium
export WHISPER_LANGUAGE=auto  # default: auto
export PORT=5050              # default: 5050

python app.py
```

**Terminal 2 — frontend (Vite):**

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The dev server proxies `/config`, `/transcribe`, and `/summarize` to `http://localhost:5050`. If your backend runs elsewhere, set:

```bash
export VITE_BACKEND_URL=http://localhost:5050
```

## Environment Variables (backend)

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | Flask port | `5050` |
| `WHISPER_MODEL` | Default checkpoint | `medium` or recommended |
| `WHISPER_MODELS` | Comma-separated allowlist | `tiny,base,small,medium,large-v2,large-v3` |
| `WHISPER_RECOMMENDED_MODEL` | Highlighted model in UI | `medium` |
| `WHISPER_LANGUAGE` | Default language hint | `auto` |
| `MAX_UPLOAD_MB` | Upload limit in MB | `40` |
| `OPENAI_API_KEY` | Server-side summary key | unset |
| `OPENAI_SUMMARY_MODEL` | Summary model | `gpt-4.1-mini` |
| `OPENAI_API_BASE` | Custom OpenAI-compatible endpoint | `https://api.openai.com/v1` |

## Troubleshooting

- `No such file or directory: 'ffmpeg'` — ffmpeg is missing or not on your PATH. Install it using the steps above and restart your terminal.
- **First transcription is slow** — Whisper downloads model weights on first use. Subsequent runs are much faster.
- **Out of memory with large models** — try a smaller checkpoint like `WHISPER_MODEL=small`.

## Privacy

- Audio never leaves your machine — Whisper runs locally.
- Summary requests send only transcript text plus a language hint.
- Temp files are deleted after transcription completes.

## Contributing

Contributions are welcome! Whether it's a bug report, a feature idea, or a pull request — every bit helps.

1. Read the [Contributing Guide](CONTRIBUTING.md) for setup and workflow.
2. Check [open issues](https://github.com/aliffrhn/within/issues) or open a new one to discuss your idea.
3. Fork, branch, and send a PR.

Please also see our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Distributed under the [MIT License](LICENSE).

## Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) — the speech recognition model that powers Within.
- [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/) — UI components.
- [Vite](https://vitejs.dev/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and [Flask](https://flask.palletsprojects.com/).

---

<div align="center">

If Within is useful to you, consider giving it a ⭐ — it helps others find the project.

</div>
