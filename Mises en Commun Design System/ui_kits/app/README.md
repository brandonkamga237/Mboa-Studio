# App UI Kit — Mises en Commun

## Overview
A high-fidelity interactive prototype of the **Mises en Commun** web application. Click through the full app using the dev toolbar at the top to switch roles and screens.

## Screens included

| Screen | File | Description |
|--------|------|-------------|
| Tableau de bord | `Dashboard.jsx` | Weekly status, quick actions, recent history |
| Brouillons de la semaine | `BrouillonList.jsx` | All drafts for the upcoming Sunday |
| Brouillon | `Brouillon.jsx` | 4-tab editor (Chants, Liturgie, Leçon, Divers) + comment panel |
| Historique | `Historique.jsx` | Chronological archive with search |
| Présence | inline in `index.html` | Attendance tracking (Responsable only) |
| Administration | inline in `index.html` | User management (Admin only) |

## Dev toolbar features
- **Vue**: Switch between Moniteur / Responsable / Admin roles — sidebar and actions update live
- **Écran**: Jump to any screen directly
- **Statut du brouillon** (visible on Brouillon screen): Toggle Créé / Candidat / Officiel / Archivé to see how the UI adapts
- **Auteur**: Toggle between "Moi" (owner) and "Autre" to see permission differences

## Component architecture

```
index.html              ← Entry point; App shell + inline screens (Presence, Admin)
Components.jsx          ← Shared primitives: Avatar, Btn, Card, StatusPill, Sidebar, all Icons
Dashboard.jsx           ← Dashboard screen
Brouillon.jsx           ← Draft editor with tabs + comment thread panel
BrouillonList.jsx       ← Week drafts list
Historique.jsx          ← Archive search screen
```

## Design notes
- **Font**: Lora (display/headings) + Source Sans 3 (body/UI) via Google Fonts
- **Icons**: Inline SVG (Lucide-style stroke icons), no external dependency
- **Colors**: Full token set from `colors_and_type.css`
- **Status system**: Color-coded left borders on cards + pill badges
- **Comment threads**: Nested replies with resolved state, per the spec
- **Design width**: 900px+ (desktop-first, sidebar + content layout)
