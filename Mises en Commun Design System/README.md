# Mises en Commun — Design System

## Overview

**Mises en Commun** is a French-language web application for children's church (culte d'enfants) teams. It digitizes the weekly Saturday "mise en commun" (team alignment meeting) where monitors and leaders plan the Sunday service together.

**Source:** Product specification document (V3) — no external codebase or Figma link provided. This design system was created from the specification alone.

---

## Product Summary

The app is the **single place** where the weekly service preparation lives — before, during, and after the Saturday meeting.

### Core Problem
| Fragilité | Consequence |
|-----------|-------------|
| Oral-only information | Missing Saturday = missing everything |
| Improvised prep | Time lost on basics |
| No historical record | Songs repeated unknowingly |
| No clean final deliverable | Everyone has a different version Sunday |

### The Central Concept: The "Brouillon" (Draft)
A *brouillon* is a structured document created by a monitor describing what will happen on a given Sunday. It has a lifecycle:

```
CRÉÉ → PROPOSÉ COMME CANDIDAT → OFFICIEL → ARCHIVÉ
```

Each brouillon has 4 blocks:
1. **Chants** — List of up to 10 songs, each tagged with one of 10 fixed liturgical steps
2. **Liturgie** — Free text: the pedagogical flow
3. **Leçon** — Free text: lesson content for children
4. **Divers** — Free text: announcements, materials, birthdays

### User Roles (cumulative)
| Role | Key Powers |
|------|-----------|
| **Moniteur** | Create/edit own drafts, read/comment others', submit candidate |
| **Responsable** | All of Moniteur + designate official, edit official, manage attendance |
| **Administrateur** | All of Responsable + user management, settings |

### Key Screens
1. **Tableau de bord** — Weekly status at a glance
2. **Brouillon** — 4-tab editor (Chants, Liturgie, Leçon, Divers)
3. **Liste des brouillons** — All drafts for the upcoming Sunday
4. **Historique** — Chronological archive with multi-criteria search
5. **Administration** — User management (Admin only)

### The PDF Output
The critical deliverable: a clean A4/mobile-optimized PDF with all 4 blocks, printed or viewed on phones every Sunday.

---

## CONTENT FUNDAMENTALS

### Language
- **100% French**. All UI copy, labels, errors, and help text in French.
- No English mixing in user-facing strings (technical stack is separate).

### Tone
- **Warm, collegial, pastoral** — this is a volunteer team in a church community
- **Direct and action-oriented** — no corporate jargon
- **Encouraging, not punitive** — the system must "never punish" anyone for missing a week
- Uses **"vous"** for formal instructions, **"tu"** naturally for peer interactions in comments

### Casing
- Screen titles: **Sentence case** ("Tableau de bord", not "Tableau De Bord")
- Button labels: **Sentence case** ("Ajouter un chant", "Voir l'historique")
- Status labels: **Capitalized noun phrases** ("Brouillon officiel", "Candidat final")

### Copy Examples
- ✅ "Aucun brouillon proposé cette semaine." (neutral, not alarming)
- ✅ "Dimanche 9 nov. — Pas de brouillon officiel" (factual, calm)
- ✅ "Dupliquer un brouillon précédent comme point de départ"
- ✅ "2 nouveaux commentaires sur les brouillons des autres"
- ❌ No exclamation marks in system messages
- ❌ No "Error!" style alarming language
- ❌ No emoji in UI (except comment reactions if explicitly added)

### Information Hierarchy
Less is more. The dashboard must be understood in 3 seconds. Each screen answers one question clearly.

---

## VISUAL FOUNDATIONS

### Color Philosophy
The palette draws on **warm ecclesiastical warmth** — deep navies and warm creams inspired by printed hymnals and illuminated manuscripts, with a clear **status color system** for brouillon states.

#### Base Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--brand-navy` | `#1E2D4A` | Primary dark, headers, sidebar |
| `--brand-blue` | `#2B4C7E` | Interactive elements, links |
| `--brand-gold` | `#C9952A` | Accent, highlights, official status |
| `--brand-cream` | `#F7F3EE` | Primary background |
| `--brand-warm-white` | `#FDFAF7` | Card surfaces |
| `--brand-stone` | `#E8E2D9` | Dividers, subtle borders |

#### Status Colors (Brouillon lifecycle)
| Token | Value | Status |
|-------|-------|--------|
| `--status-draft` | `#6B7280` | Créé (grey, neutral) |
| `--status-candidate` | `#D97706` | Candidat final (amber) |
| `--status-official` | `#15803D` | Officiel (green) |
| `--status-archived` | `#9CA3AF` | Archivé (muted grey) |

#### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--fg-primary` | `#1E2D4A` | Primary text |
| `--fg-secondary` | `#4B5563` | Secondary/supporting text |
| `--fg-muted` | `#9CA3AF` | Timestamps, metadata |
| `--bg-page` | `#F7F3EE` | Page background |
| `--bg-card` | `#FDFAF7` | Card/panel background |
| `--bg-sidebar` | `#1E2D4A` | Navigation sidebar |
| `--border-subtle` | `#E8E2D9` | Dividers |
| `--border-medium` | `#D1C9BE` | Card borders |

### Typography
- **Display/Headings**: *Lora* (serif) — warm, literary, echoes printed liturgical materials
- **Body/UI**: *Source Sans 3* (sans-serif) — highly legible, neutral, works at small sizes
- **Mono**: *JetBrains Mono* — for code/technical (admin only)

### Spacing & Layout
- Base unit: **4px**
- Common spacing: 4, 8, 12, 16, 24, 32, 48, 64px
- Content max-width: **720px** (mobile-first, single-column focus)
- Sidebar width: **240px** (desktop)
- Card padding: **20px**

### Backgrounds
- Primary: warm cream (`#F7F3EE`) — no gradients on page backgrounds
- Cards: slightly warmer white (`#FDFAF7`) with subtle warm border
- Sidebar: deep navy, no gradient
- No full-bleed imagery; no background textures

### Borders & Radius
- Cards: `border-radius: 8px` with `1px solid var(--border-medium)`
- Buttons: `border-radius: 6px`
- Inputs: `border-radius: 6px`
- Badges/pills: `border-radius: 999px`
- No aggressive drop shadows — cards use `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`

### Shadows
- Card: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- Dropdown/modal: `0 4px 16px rgba(0,0,0,0.12)`
- No colored shadows; no inset shadows

### Animation
- Subtle and functional only
- Transitions: `150ms ease` for color/opacity; `200ms ease` for transforms
- No bounces; no spring physics
- No decorative animations

### Hover/Active States
- Buttons: darken background by ~10% on hover; slight scale `0.98` on press
- Links: underline on hover
- Cards (if clickable): `box-shadow` lifts slightly; background lightens
- Sidebar items: light navy highlight (`rgba(255,255,255,0.08)`)

### Icons
- **Lucide Icons** (via CDN) — stroke-based, 1.5px weight, consistent style
- Size: 16px inline, 20px in buttons/nav, 24px standalone
- Never filled icons; always stroke

### Status Indicators
- Colored left-border on brouillon cards (draft=grey, candidate=amber, official=green)
- Colored dot badges for comment counts
- Status pills (pill shape, colored background + text)

---

## ICONOGRAPHY

**Icon system:** Lucide Icons (CDN: `https://unpkg.com/lucide@latest`)
- Stroke weight: 1.5px (default Lucide)
- Color: inherits from `currentColor`
- Never use emoji as icons in the UI
- Common icons used:
  - `file-text` — brouillon/document
  - `music` — chants
  - `book-open` — liturgie/leçon
  - `message-circle` — comments
  - `check-circle` — official/validated
  - `clock` — pending/candidate
  - `archive` — archived
  - `download` — PDF download
  - `user` — user/moniteur
  - `shield` — responsable
  - `settings` — admin
  - `plus` — add action
  - `calendar` — date
  - `search` — search
  - `history` — historique

**No custom SVG illustrations.** No emoji. No PNG icons.

---

## File Index

```
README.md                    ← This file
SKILL.md                     ← Agent skill definition
colors_and_type.css          ← CSS design tokens (colors + typography)
assets/
  logo.svg                   ← App wordmark/logo
preview/
  colors-brand.html          ← Brand color swatches
  colors-status.html         ← Status color system
  colors-semantic.html       ← Semantic color tokens
  type-display.html          ← Display/heading type specimens
  type-body.html             ← Body type specimens
  type-scale.html            ← Full type scale
  spacing-tokens.html        ← Spacing token reference
  spacing-shadows.html       ← Shadow & radius tokens
  component-buttons.html     ← Button variants
  component-badges.html      ← Status badges & pills
  component-inputs.html      ← Form inputs & selects
  component-brouillon-card.html ← Brouillon card component
  component-comment.html     ← Comment thread component
  component-nav.html         ← Sidebar navigation
ui_kits/
  app/
    README.md
    index.html               ← Interactive prototype (dashboard → brouillon)
    Dashboard.jsx
    Brouillon.jsx
    BrouillonList.jsx
    Historique.jsx
    Components.jsx
```

---

## Key Design Decisions

1. **One brouillon = one author** — no real-time collaborative editing; preserves authorship
2. **Status over stages** — single Brouillon entity with status field, not separate tables
3. **Never punishing** — empty weeks show neutral messages, not errors
4. **PDF is the deliverable** — every design decision serves the Sunday morning PDF
5. **Mobile-first** — the web app must work on phones (viewing during service)
