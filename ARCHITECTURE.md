# Architecture Overview

This document provides a high-level architecture overview for the prode-mundial application (nazarenorocco-ux/prode-mundial). The repository is primarily a JavaScript frontend with CSS and a small amount of HTML, so the diagram focuses on a typical static-frontend + API architecture used by apps like this.

```mermaid
flowchart LR
  %% Users and clients
  U[User\n(Browser / Mobile)]

  %% Frontend
  subgraph Frontend
    FE[Frontend SPA\n(JavaScript, CSS, HTML)]
  end

  U -->|Uses UI / HTTP| FE

  %% Hosting & CDN
  subgraph Hosting
    CDN[CDN / Static Hosting\n(e.g., GitHub Pages, Vercel, Netlify)]
    ASSETS[Static Assets]
  end

  FE -->|Fetches assets / deployed app| CDN
  FE -->|API requests| API

  %% Backend & APIs
  subgraph Backend
    API[API / Serverless Functions\n(e.g., REST / GraphQL)]
    AUTH[Auth Provider\n(e.g., OAuth, Firebase Auth)]
    DB[(Database)\n(e.g., PostgreSQL, Firestore)]
    STORAGE[(File Storage)\n(e.g., S3, Cloud Storage)]
  end

  API --> DB
  API --> AUTH
  API --> STORAGE

  %% Integrations
  External[Third-party Services\n(Analytics, Payments, Notifications)]
  API --> External
  FE --> External

  %% Dev & CI/CD
  subgraph Dev
    Repo[GitHub Repo\n(nazarenorocco-ux/prode-mundial)]
    CI[CI/CD (GitHub Actions)]
    Tests[Tests & Linting]
  end

  Repo -->|push / PR| CI
  CI -->|run| Tests
  CI -->|build & deploy| CDN

  %% Optional on-device storage and caching
  FE -->|Cache| CACHE[(Browser / Service Worker Cache)]

  style Repo fill:#f9f,stroke:#333,stroke-width:1px
  style CI fill:#ffd27f
  style CDN fill:#d0f0fd
  style API fill:#f0d0d0
  style DB fill:#d0ffd0
```

Notes

- Frontend: The repository shows a primarily JavaScript-based frontend (≈83% JS). Treat the repo as the single-page application codebase.
- Backend: If there is no backend in this repo, consider this a recommended architecture to integrate with serverless functions or an external API.
- CI/CD: Use GitHub Actions to build, test, and deploy to a static host (Netlify/Vercel/GitHub Pages) or to trigger serverless function deploys.

If you'd like, I can: update the diagram to reflect the actual frameworks in the repo (React, Vue, or plain JS), add more detail about specific services (Firebase, Supabase, etc.), or create a PNG/SVG export of this diagram and add it to the repository.
