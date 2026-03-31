# AI Logo Generator

Generate 4 unique SVG logo concepts from a brand brief using a LangGraph pipeline and Claude. Edit colors, typography, and layout live. Export as SVG or PNG.

## Prerequisites

- Node 18+
- Python 3.11+
- An Anthropic API key

## Backend setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Vite proxies `/api` → `localhost:8000`.

## Architecture

```text
Browser
  │
  │  POST /api/generate
  ▼
FastAPI (main.py)
  │
  ▼
LangGraph StateGraph
  │
  ├── Node 1: interpret_brief  ──── LLM → structured design brief (JSON)
  │
  ├── Node 2: generate_concepts ── LLM → 4 concept descriptions
  │
  ├── Node 3: render_svg ────────── 4 × LLM calls in parallel → SVG strings
  │
  ├── Node 4: validate_svg ──────── Pure Python XML validation
  │                                  (viewBox, g#icon, g#brand-name, forbidden tags…)
  │
  └── Conditional edge: retry failed SVGs (max 2 retries) → Node 3
                        or return to frontend
```

## Swapping the LLM

The LLM is isolated in `backend/services/llm_client.py`. To switch to GPT-4:

```python
# llm_client.py
from langchain_openai import ChatOpenAI

def get_llm():
    return ChatOpenAI(model="gpt-4o", temperature=0.7)
```

No other file needs to change.

## Deploy

- **Frontend**: Vercel — set `VITE_API_URL` and update axios base URL
- **Backend**: Render — set `ANTHROPIC_API_KEY` env var, start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
