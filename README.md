# Mboa Studio

Generate unique SVG logo concepts from a brand brief using a LangGraph pipeline and Claude. Stream the AI reasoning in real time, edit colors and typography live, export as SVG or PNG.

**Live:** https://mboastudio.brandonkamga.com

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + Uvicorn |
| AI / Orchestration | Claude (claude-sonnet-4-6) + LangGraph |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Docker + Traefik + GitHub Actions |

---

## Architecture

```
Browser
  │
  │  POST /api/generate  (SSE)
  ▼
FastAPI
  │
  ▼
LangGraph StateGraph
  │
  ├── interpret_brief     → structured design brief (JSON)
  ├── generate_concepts   → 4 concept descriptions
  ├── render_svg          → 4 × parallel LLM calls → SVG strings
  ├── validate_svg        → XML validation (viewBox, required groups, forbidden tags)
  └── conditional edge    → retry failed SVGs (max 3) or stream to frontend
```

Each graph node emits `event: stage` + `event: thinking` chunks over SSE before its result. The frontend accumulates these into a per-stage collapsible timeline.

```
event: stage     {"id": "brief", "label": "Analyse du brief"}
event: thinking  {"delta": "Je vais d'abord..."}
event: stage     {"id": "render", "label": "Rendu SVG"}
event: logo      {"index": 0, "svg": "<svg...", "description": "..."}
event: done      {}
```

---

## Local setup

**Prerequisites:** Node 20+, Python 3.11+, pnpm, an Anthropic API key.

```bash
# 1. Clone
git clone https://github.com/brandonkamga237/Mboa-Studio.git
cd Mboa-Studio

# 2. Backend
cd backend
cp .env.example .env          # fill ANTHROPIC_API_KEY and ADMIN_PIN
pip install -r requirements.txt
uvicorn main:app --reload     # → http://localhost:8000

# 3. Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev                      # → http://localhost:5173
```

Vite proxies `/api` → `localhost:8000` in dev.

---

## Docker (production-like)

```bash
cp backend/.env.example backend/.env   # fill values
docker compose up --build
# frontend → http://localhost:5173
# backend  → http://localhost:8000
```

---

## Environment variables

`backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_PIN=12345678        # 8-digit PIN for /admin237
```

---

## API routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Extract brand info from free text |
| `POST` | `/api/generate` | SSE stream — full generation pipeline |
| `POST` | `/api/refine` | SSE stream — refine selected logos |
| `POST` | `/api/feedback` | Submit star rating + comment |
| `POST` | `/api/admin/login` | PIN auth → returns token |
| `GET` | `/api/admin/stats` | Analytics + feedback summary (auth) |
| `POST` | `/api/admin/maintenance` | Toggle maintenance mode (auth) |
| `GET` | `/health` | Health check |

---

## Admin panel

Access at `/admin237`. Enter the 8-digit PIN from `ADMIN_PIN`.

Features: generation count, daily chart, browser/OS/origin breakdown, feedback list, maintenance mode toggle.

---

## Swapping the LLM

The model is isolated in `backend/services/llm_client.py`:

```python
# Switch to GPT-4o
from langchain_openai import ChatOpenAI

def get_llm():
    return ChatOpenAI(model="gpt-4o", temperature=0.7)
```

No other file needs changing.