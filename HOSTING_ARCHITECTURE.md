# IAS Research - Opsi Hosting & Skema Jaringan

Dokumentasi ini menjelaskan empat opsi hosting untuk project IAS Research dengan alur jaringan dan skema deployment masing-masing.

---

## OPSI 1: All-in-One Local Stack (Docker Compose + Nginx)
**Status**: Direkomendasikan  
**Kompleksitas Setup**: Medium  
**Skalabilitas**: Low  
**Risiko**: Low

### Deskripsi
Semua komponen (Frontend, Backend, Model AI) di-host dalam satu perangkat menggunakan Docker Compose dan Nginx sebagai reverse proxy.

### Skema Jaringan
```
┌─────────────────────────────────────────────────────┐
│         PC ADMIN (Host)                             │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Docker Compose Environment                   │  │
│  │                                              │  │
│  │  ┌────────────┐  ┌────────────┐              │  │
│  │  │ Frontend   │  │ Backend    │              │  │
│  │  │ (Next.js)  │  │ (Node.js)  │              │  │
│  │  │ Port 3000  │  │ Port 5000  │              │  │
│  │  └────────────┘  └────────────┘              │  │
│  │        │              │                      │  │
│  │        └──────────────┤                      │  │
│  │                       │                      │  │
│  │        ┌──────────────┴──────────┐           │  │
│  │        │                         │           │  │
│  │  ┌─────▼────┐            ┌──────▼──┐        │  │
│  │  │ Nginx     │            │ Model AI│        │  │
│  │  │ Reverse   │            │ Server  │        │  │
│  │  │ Proxy     │            │ Port 8000        │  │
│  │  │ Port 80   │            │ (Python)│        │  │
│  │  └─────┬────┘            └────────┘        │  │
│  │        │                                    │  │
│  └────────┼────────────────────────────────────┘  │
│           │                                       │
└───────────┼───────────────────────────────────────┘
            │
      ┌─────▼─────┐
      │ Browser   │
      │ atau      │
      │ Client    │
      └───────────┘
```

### Alur Data & Request
```
1. User Access:
   Client → http://localhost:80 (atau domain lokal)
                          │
                          ▼
                    [Nginx Reverse Proxy]
                    ├─ /api/* → Backend:5000
                    ├─ /model/* → AI Model:8000
                    └─ /* → Frontend:3000

2. Frontend Request ke Backend:
   Frontend (3000) → Nginx (80) → Backend (5000) → Database

3. Backend Request ke AI Model:
   Backend (5000) → Nginx (80) → AI Model (8000) → Response

4. Docker Network:
   [Network: app-network]
   frontend ---> backend ---> ai-model
                      │
                      └──> database (PostgreSQL)
```

### Workflow Deployment
```
┌──────────────────┐
│ Developer Push   │
│ Code ke Git      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ Clone/Pull di PC Admin   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Docker Compose Build     │
│ docker-compose up --build
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Services Running:        │
│ • Frontend               │
│ • Backend                │
│ • AI Model               │
│ • Database               │
│ • Nginx                  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Accessible via:          │
│ http://pc-admin-ip:80    │
│ atau http://localhost:80 │
└──────────────────────────┘
```

### Keuntungan & Kerugian
**✅ Keuntungan:**
- Low risk, tidak menggunakan provider eksternal
- Setup terpusat dan mudah di-manage
- Resource kontrol penuh
- Semua data tetap lokal

**❌ Kerugian:**
- Sulit jika semua team pergi (downtime tinggi)
- Perlu guidebook lengkap untuk onboarding
- Mengandalkan satu perangkat (single point of failure)
- Perlu resource perangkat yang bagus (CPU, RAM, Storage)

### Konfigurasi File Key
```
docker-compose.yml
├── frontend (Next.js)
├── backend (Node.js/Express)
├── ai-model (Python/FastAPI)
├── database (PostgreSQL)
└── nginx.conf (reverse proxy)

nginx.conf locations:
├── /api/ → proxy_pass http://backend:5000
├── /model/ → proxy_pass http://ai-model:8000
└── / → proxy_pass http://frontend:3000
```

---

## OPSI 2: Distributed Stack (Cloud Interface + Local AI Model)
**Status**: Opsi Performa  
**Kompleksitas Setup**: Medium-High  
**Skalabilitas**: Medium  
**Risiko**: Low-Medium

### Deskripsi
Frontend & Backend di-host di cloud (Vercel, Railway, InfinityFree), sementara AI Model tetap lokal dengan tunneling.

### Skema Jaringan
```
┌──────────────────────────────────────────────────────────────┐
│                        CLOUD PROVIDER                        │
│                   (Vercel/Railway/InfinityFree)              │
│                                                              │
│  ┌─────────────────────┐      ┌──────────────────────┐       │
│  │    Frontend         │      │     Backend          │       │
│  │   (Next.js)         │      │  (Node.js/Express)   │       │
│  │  Vercel Domain:     │      │  Railway/Hosting:    │       │
│  │  koda.vercel.app    │      │  api.koda.railway.app        │
│  │                     │      │                      │       │
│  └──────────┬──────────┘      └──────────┬───────────┘       │
│             │                            │                   │
│             │ HTTPS Request               │ HTTPS Request    │
│             │ (Public Internet)           │ (Public Internet)│
└─────────────┼────────────────────────────┼──────────────────┘
              │                            │
              │                            │
    ┌─────────▼────────┐        ┌──────────▼──────────┐
    │   Browser User   │        │  Backend Server    │
    │  (Any Location)  │        │   (Cloud)          │
    └──────────────────┘        │                    │
                                │  Makes HTTPS Call  │
                                │  via Tunnel:       │
                                │  https://tunnel-  │
                                │  domain.ngrok.io  │
                                └──────────┬────────┘
                                           │
                                   ┌───────▼────────┐
                                   │ Tunnel Client  │
                                   │ (ngrok/expose) │
                                   └───────┬────────┘
                                           │
                    ┌──────────────────────┘
                    │
    ┌───────────────▼───────────────────────┐
    │      PC LOKAL (Local Server)          │
    │                                       │
    │  ┌─────────────────────────────────┐  │
    │  │  AI Model Server                │  │
    │  │  (Python/FastAPI)               │  │
    │  │  Localhost:8000                 │  │
    │  │                                 │  │
    │  │  Tunnel Endpoint:               │  │
    │  │  tunnel-domain.ngrok.io:443     │  │
    │  └─────────────────────────────────┘  │
    │                                       │
    └───────────────────────────────────────┘
```

### Alur Data & Request
```
1. User Access Frontend:
   Browser → https://koda.vercel.app (CDN Global)
   
2. Frontend to Backend Communication:
   Frontend (Vercel) → https://api.koda.railway.app
   
3. Backend to AI Model (via Tunnel):
   Backend (Cloud) → https://tunnel-domain.ngrok.io
                          │
                          ▼
                    [Tunnel Connection Established]
                          │
                          ▼
                    Local AI Server:8000 (PC Admin)

4. Request Flow Detail:
   
   Backend makes request:
   ```
   GET /predict/image
   Host: tunnel-domain.ngrok.io
   Authorization: Bearer <token>
   ```
   
   Tunnel decrypts & forwards:
   ```
   GET /predict/image
   Host: localhost:8000
   Authorization: Bearer <token>
   ```
   
   Local AI Model processes & responds

5. Database Connection:
   Backend (Cloud) ↔ Database (Cloud/Managed Service)
   atau
   Backend (Cloud) → Tunnel → Local Database
```

### Workflow Deployment
```
┌─────────────────────────────┐
│ Code Changes di Git         │
└────────────┬────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────────┐  ┌──────────────┐
│  Frontend   │  │   Backend    │
│  (Vercel)   │  │  (Railway)   │
└────────┬────┘  └────────┬─────┘
         │                │
    Auto Deploy       Auto Deploy
    (GitHub Push)     (GitHub Push)
         │                │
         ▼                ▼
    Frontend        Backend Updated
    Deployed        & Live
    (CDN)
    
┌──────────────────────────────────┐
│ Local Setup (Tetap Manual)       │
│                                  │
│ PC Admin:                        │
│ 1. docker pull latest ai-model   │
│ 2. docker run -p 8000:8000 ...   │
│ 3. ngrok http 8000               │
│    → tunnel-domain.ngrok.io      │
│ 4. Set Backend env var:          │
│    AI_MODEL_URL=tunnel-domain...│
└──────────────────────────────────┘
```

### Keuntungan & Kerugian
**✅ Keuntungan:**
- Resource lebih efisien (hanya host Model AI)
- Frontend/Backend lebih reliable (cloud infrastructure)
- Mudah scale frontend/backend
- Dapat diakses dari mana saja

**❌ Kerugian:**
- Koneksi tunnel rentan lambat
- Setup tunneling cukup kompleks
- Cost untuk cloud provider (minor)
- Latency AI model lebih tinggi
- Dependency pada internet connection

### Tools Tunneling Populer
- **ngrok** (paling populer, free tier dengan batasan)
- **cloudflare tunnel** (free, reliable)
- **expose.dev** (open source)
- **localtunnel** (simple, free)

---

## OPSI 3: Hybrid Stack (Cloud Frontend + Local Backend & AI)
**Status**: Opsi Fleksibel  
**Kompleksitas Setup**: Medium  
**Skalabilitas**: Medium-High  
**Risiko**: Low

### Deskripsi
Frontend di-host di cloud, Backend & AI Model di lokal dengan tunneling. Ini kombinasi terbaik dari fleksibilitas dan performance.

### Skema Jaringan
```
┌───────────────────────────────────────┐
│       CLOUD PROVIDER (Vercel)         │
│                                       │
│  ┌─────────────────────────────────┐  │
│  │  Frontend (Next.js)             │  │
│  │  koda.vercel.app                │  │
│  │                                 │  │
│  │  Endpoint:                      │  │
│  │  /api/* → BACKEND_URL env var   │  │
│  └─────────────────┬───────────────┘  │
│                    │                   │
└────────────────────┼───────────────────┘
                     │
          ┌──────────▼──────────┐
          │ Browser / User      │
          │ (Any Location)      │
          │ Any Device          │
          └─────────────────────┘
                     │ https://
                     │ koda.vercel.app
                     │
    ┌────────────────▼────────────────┐
    │  HTTPS Request with API calls   │
    │  to: backend-tunnel.ngrok.io    │
    └────────────────┬────────────────┘
                     │
                     │
     ┌───────────────▼──────────────────┐
     │   Tunnel Network (ngrok/CF)      │
     │   backend-tunnel.ngrok.io        │
     └───────────────┬──────────────────┘
                     │
    ┌────────────────▼──────────────────────┐
    │   PC LOKAL (Local Server)             │
    │                                       │
    │  ┌────────────────────────────────┐   │
    │  │  Backend Server                │   │
    │  │  (Node.js/Express)             │   │
    │  │  localhost:5000                │   │
    │  │                                │   │
    │  │  Tunnel Endpoint:              │   │
    │  │  backend-tunnel.ngrok.io       │   │
    │  │                                │   │
    │  │  Routes:                       │   │
    │  │  /api/data                     │   │
    │  │  /api/process                  │   │
    │  └────────────┬───────────────────┘   │
    │               │                       │
    │               │ localhost:8000        │
    │               │                       │
    │  ┌────────────▼───────────────────┐   │
    │  │  AI Model Server               │   │
    │  │  (Python/FastAPI)              │   │
    │  │  localhost:8000                │   │
    │  │                                │   │
    │  │  Endpoints:                    │   │
    │  │  /predict                      │   │
    │  │  /analyze                      │   │
    │  │  /train                        │   │
    │  └────────────────────────────────┘   │
    │                                       │
    │  ┌────────────────────────────────┐   │
    │  │  Database (PostgreSQL)         │   │
    │  │  localhost:5432                │   │
    │  └────────────────────────────────┘   │
    │                                       │
    └───────────────────────────────────────┘
```

### Alur Data & Request
```
1. User Access Frontend:
   Browser → https://koda.vercel.app (CDN, instant loading)

2. Frontend Load & Render:
   Next.js App serves static assets from CDN
   Real-time data loading via JavaScript

3. Frontend to Backend Communication:
   ```
   const response = await fetch(
     `${process.env.REACT_APP_API_URL}/api/data`,
     { method: 'GET' }
   );
   ```
   
   REACT_APP_API_URL = https://backend-tunnel.ngrok.io

4. Request Flow:
   
   Frontend (Vercel) 
       ↓ HTTPS Request
   Tunnel Network
       ↓ Route to local
   Backend (localhost:5000)
       ↓ Process logic
   AI Model (localhost:8000)
       ↓ Process prediction
   Database (localhost:5432)
       ↓ Store/retrieve data
   Response back through tunnel
       ↓
   Frontend renders data

5. Real-time Communication (Optional):
   WebSocket can also tunnel through:
   wss://backend-tunnel.ngrok.io/ws
```

### Workflow Deployment
```
┌──────────────────────────────────────┐
│  Developer Pushes Code               │
│  (GitHub Repo)                       │
└────────────┬─────────────────────────┘
             │
    ┌────────┴───────────┐
    │                    │
    ▼                    ▼
┌────────────────┐  ┌───────────────────┐
│  Frontend      │  │  Backend & Model  │
│  (Git Push)    │  │  (Git Push)       │
└────────┬───────┘  └────────┬──────────┘
         │                   │
    Auto Deploy          Manual Pull
    (Vercel)            & Restart
    Linked to           (SSH/Local)
    GitHub Repo
         │                   │
         ▼                   ▼
    Frontend         Backend Updated
    Live on CDN      Running Locally
    
    (Vercel Build     (docker restart)
     & Deploy         (systemctl restart)
     Automatic)       (manual)

┌──────────────────────────────────────┐
│  Keep Tunnel Alive                   │
│                                      │
│  Option 1: Manual Terminal           │
│  $ ngrok http 5000                   │
│  → backend-tunnel.ngrok.io          │
│                                      │
│  Option 2: Systemd Service           │
│  systemctl start ngrok               │
│  (auto-start on reboot)              │
│                                      │
│  Option 3: Docker with restart       │
│  docker run --restart=always ...     │
└──────────────────────────────────────┘
```

### Keuntungan & Kerugian
**✅ Keuntungan:**
- **Best of both worlds**: Frontend fast (CDN), Backend flexible (lokal)
- User dapat akses dari mana saja dengan domain yang jelas
- Setup lebih fleksibel dan modular
- Frontend/Backend dapat di-update independently
- Performance cukup baik (CDN untuk frontend)

**❌ Kerugian:**
- Tetap ada sedikit kompleksitas tunnel
- Perlu maintain tunnel connection tetap hidup
- Latency backend sedikit lebih tinggi
- Dependency pada lokal server untuk backend

### Recommended Configuration
```
# .env.frontend (Vercel)
NEXT_PUBLIC_API_URL=https://backend-tunnel.ngrok.io
NEXT_PUBLIC_APP_NAME=KODA

# .env.backend (Local)
AI_MODEL_URL=http://localhost:8000
DATABASE_URL=postgresql://user:pass@localhost:5432/koda
NODE_ENV=production

# Tunnel Config (Local)
# ngrok.yml or autossh config for persistent tunnel
```

---

## OPSI 4: Fully Distributed Stack (Each on Different Platform)
**Status**: Opsi Setup Rumit  
**Kompleksitas Setup**: High  
**Skalabilitas**: High  
**Risiko**: Medium

### Deskripsi
Setiap stack (Frontend, Backend, AI Model) di-host di platform yang berbeda dengan konfigurasi tersendiri.

### Skema Jaringan
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────┐       ┌──────────────────┐                  │
│  │ VERCEL         │       │ RAILWAY/RENDER   │                  │
│  │ (Frontend)     │       │ (Backend)        │                  │
│  │                │       │                  │                  │
│  │ koda.app       │       │ api.koda.app     │                  │
│  │                │       │                  │                  │
│  │ Domain:        │       │ Domain:          │                  │
│  │ Custom DNS     │       │ Custom DNS       │                  │
│  └────────┬───────┘       └────────┬─────────┘                  │
│           │                        │                            │
│           └────────────┬───────────┘                            │
│                        │                                        │
│                    INTERNET                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Browser / User    │
              │   (Any Location)    │
              └─────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                   ANOTHER CLOUD PROVIDER                        │
│                   (HuggingFace/Replicate)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AI Model Service                                          │ │
│  │  (Managed ML Inference)                                    │ │
│  │                                                            │ │
│  │  Endpoint:                                                 │ │
│  │  api.huggingface.co/v1/predictions                        │ │
│  │                                                            │ │
│  │  Backend calls via API Key                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│            DATABASE PROVIDER (Cloud PostgreSQL)                 │
│            (Railway/Supabase/Heroku)                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Managed PostgreSQL Database                               │ │
│  │  (Automatic Backup, Scaling)                               │ │
│  │                                                            │ │
│  │  Connection String:                                        │ │
│  │  postgresql://user:pass@db.provider.com:5432/koda         │ │
│  │                                                            │ │
│  │  Backend connects via connection pool                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Alur Data & Request (Detail)
```
USER FLOW:
═════════════════════════════════════════════════════════════════

1. User Opens Browser:
   Browser → https://koda.app (Vercel CDN)
   
   Response: HTML + CSS + JavaScript
   (Hosted on Vercel CDN globally)

2. Frontend Load & Interactive:
   Next.js app loads
   React components initialize
   
3. Frontend Calls Backend API:
   Frontend.js:
   ```javascript
   const response = await fetch('https://api.koda.app/data', {
     method: 'GET',
     headers: { 'Authorization': 'Bearer token' }
   });
   ```
   
   Route:
   Browser → Internet → Railway Server:5000
   
4. Backend Process Request:
   Railway Backend:
   - Authenticate request
   - Validate data
   - Query Database (if needed)
   
   ```javascript
   const dbResult = await pool.query(
     'SELECT * FROM users WHERE id = $1',
     [userId]
   );
   ```
   
   Database Route:
   Railway Server → Internet → Supabase PostgreSQL:5432

5. Backend Calls AI Model:
   ```javascript
   const prediction = await fetch(
     'https://api.huggingface.co/v1/predictions',
     {
       method: 'POST',
       headers: { 
         'Authorization': 'Bearer HF_TOKEN',
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ 
         inputs: imageData,
         model: 'our-model-id'
       })
     }
   );
   ```
   
   Route:
   Railway Server → Internet → HuggingFace API:443

6. Response Flow:
   HuggingFace → Railway → Database (store result) → Frontend
   
   Complete Flow:
   ┌─────────────────────────────────────────────────────┐
   │ User Request                                        │
   │ (koda.app)                                          │
   │ Vercel                                              │
   │      │                                              │
   │      ▼                                              │
   │ API Call to api.koda.app                            │
   │ (Railway)                                           │
   │      │                                              │
   │      ├──→ Database Query (Supabase)                │
   │      │         ▼                                    │
   │      │    Database Response                         │
   │      │         ▼                                    │
   │      ├──→ Call AI Model (HuggingFace)              │
   │      │         ▼                                    │
   │      │    ML Prediction Result                     │
   │      │         ▼                                    │
   │      ├──→ Combine & Format Response                │
   │      │                                              │
   │      ▼                                              │
   │ Send to Frontend                                    │
   │ (Vercel)                                            │
   │      ▼                                              │
   │ Display to User                                     │
   └─────────────────────────────────────────────────────┘
```

### Deployment Workflow
```
DEPLOYMENT PIPELINE:
═════════════════════════════════════════════════════════════════

FRONTEND:
┌──────────────────────────────────────────────────────┐
│ 1. Developer pushes code → GitHub                    │
│ 2. Vercel detects push (webhook)                     │
│ 3. Vercel builds: npm run build                      │
│ 4. Build generates .next/ folder                     │
│ 5. Vercel deploys to CDN globally                    │
│ 6. Domain koda.app → Vercel CDN                      │
│ 7. Automatic SSL/TLS certificate                     │
│ 8. Environment variables set in Vercel dashboard     │
│    NEXT_PUBLIC_API_URL=https://api.koda.app         │
└──────────────────────────────────────────────────────┘

BACKEND:
┌──────────────────────────────────────────────────────┐
│ 1. Developer pushes code → GitHub (different repo)   │
│ 2. Railway detects push via webhook                  │
│ 3. Railway builds: npm install && npm build          │
│ 4. Railway runs: npm start or node server.js         │
│ 5. Railway assigns domain: api.koda.railway.app      │
│    (or custom domain: api.koda.app via DNS)          │
│ 6. Environment variables in Railway:                 │
│    DATABASE_URL=postgresql://...@db.provider.com     │
│    AI_MODEL_API_KEY=hf_xxxxxxxxxxxx                  │
│    NODE_ENV=production                              │
│ 7. Auto-deploy on git push                           │
│ 8. Automatic scaling based on load                   │
└──────────────────────────────────────────────────────┘

DATABASE:
┌──────────────────────────────────────────────────────┐
│ 1. Setup managed PostgreSQL (Supabase/Railway)       │
│ 2. Create schema & tables (one-time)                 │
│ 3. Configure backups (automatic daily)               │
│ 4. Set connection limits & timeout                   │
│ 5. Database URL provided:                            │
│    postgresql://user:pass@db.host:5432/koda         │
│ 6. Backend connects via connection pool              │
│ 7. Monitoring & alerts available                     │
└──────────────────────────────────────────────────────┘

AI MODEL:
┌──────────────────────────────────────────────────────┐
│ Option A: Use Managed Service (Recommended)          │
│ - HuggingFace Inference API                          │
│ - Replicate                                          │
│ - AWS SageMaker                                      │
│ Setup: API Key only, no deployment needed            │
│                                                      │
│ Option B: Self-hosted (More Control)                │
│ 1. Deploy model server to separate provider         │
│    (Paperspace, Lambda Labs, etc.)                  │
│ 2. Configure model server                            │
│ 3. Expose via API (Flask, FastAPI)                   │
│ 4. Backend calls model API endpoint                  │
└──────────────────────────────────────────────────────┘
```

### Platform Selection Guide
```
FRONTEND HOSTING OPTIONS:
├─ Vercel (Recommended for Next.js)
│  ├─ Free tier available
│  ├─ Automatic deployments
│  ├─ Global CDN
│  └─ Serverless functions
├─ Netlify
│  ├─ Similar features to Vercel
│  ├─ Good for React apps
│  └─ Free tier
└─ GitHub Pages
   ├─ Free, static sites only
   └─ Limited functionality

BACKEND HOSTING OPTIONS:
├─ Railway (Recommended - simple)
│  ├─ Pay-as-you-go pricing
│  ├─ Docker support
│  ├─ Easy environment variables
│  └─ Managed database addon
├─ Render
│  ├─ Free tier (limited)
│  ├─ Easy deployment
│  └─ Automatic SSL
├─ Heroku (Legacy)
│  ├─ Paid only now (no free tier)
│  ├─ Mature platform
│  └─ Great for beginners
└─ DigitalOcean App Platform
   ├─ Affordable
   ├─ Scalable
   └─ Docker native

DATABASE HOSTING OPTIONS:
├─ Supabase (Recommended - PostgreSQL)
│  ├─ Free tier available
│  ├─ Real-time capabilities
│  ├─ Built-in auth
│  └─ REST API
├─ Railway Database Add-on
│  ├─ Integrated with backend
│  ├─ Simple setup
│  └─ Same platform as backend
├─ Render PostgreSQL
│  ├─ Free tier
│  ├─ Automatic backups
│  └─ Simple connection string
└─ PlanetScale (MySQL)
   ├─ Free tier
   ├─ Serverless MySQL
   └─ Great for scale

AI MODEL HOSTING OPTIONS:
├─ HuggingFace Inference API (Recommended)
│  ├─ Free tier for public models
│  ├─ Thousands of pre-trained models
│  ├─ Simple API calls
│  └─ Pay-per-inference for production
├─ Replicate
│  ├─ Easy model deployment
│  ├─ Pricing per API call
│  └─ Good community
├─ AWS SageMaker
│  ├─ Powerful but complex
│  ├─ Endpoint pricing
│  └─ Best for production scale
└─ Self-hosted (Paperspace, Lambda Labs)
   ├─ Full control
   ├─ Higher cost
   └─ More complex setup
```

### Keuntungan & Kerugian
**✅ Keuntungan:**
- Mudah mengidentifikasi kesalahan (isolated services)
- Mudah maintenance per service
- High scalability per component
- Independent deployment cycles
- Industry standard architecture

**❌ Kerugian:**
- Setup paling rumit & kompleks
- Multiple provider management
- Tidak developer friendly (learning curve)
- Biaya lebih tinggi (multiple services)
- Multiple points of failure
- Coordination antar tim untuk deployment

---

## PERBANDINGAN RINGKAS

| Aspek | Opsi 1 | Opsi 2 | Opsi 3 | Opsi 4 |
|-------|--------|--------|--------|---------|
| **Setup Complexity** | Medium | Med-High | Medium | High |
| **Skalabilitas** | Low | Medium | Med-High | High |
| **Cost** | Low | Low-Mid | Low-Mid | Medium-High |
| **Risk/Availability** | High (SPOF) | Low | Low | Medium |
| **Performance** | Good | Fair (Tunnel) | Very Good | Excellent |
| **Maintenance Effort** | Medium | High | Medium | High |
| **Ideal For** | Development/Testing | Performance Priority | **Best Overall** | Enterprise |
| **Team Size** | Small (<5) | Small-Medium | Medium (5-15) | Large (15+) |
| **Internet Dependency** | Lokal Network | High | Medium | High |

---

## REKOMENDASI

### Untuk Phase Saat Ini (MVP/Testing)
**→ Gunakan OPSI 3: Hybrid Stack**
- Frontend di Vercel (mudah share & akses)
- Backend + AI lokal dengan tunnel (fleksibel & murah)
- Users dapat akses dari mana saja dengan link yang jelas
- Setup moderate, tidak terlalu rumit

### Transition Plan
```
Phase 1 (Sekarang):     Opsi 3 (Hybrid)
                        ↓
Phase 2 (Validation):   Opsi 1 (All-in-One) jika fokus lokal
                        atau tetap Opsi 3 jika sudah stabil
                        ↓
Phase 3 (Production):   Opsi 4 (Distributed) atau Opsi 2
                        tergantung kebutuhan skala
```

---

## FILE STRUKTUR REFERENSI

```
IAS-Research/
├── frontend/              (Opsi 3 & 4: Vercel deployment)
│   ├── next.config.js
│   ├── .vercelignore
│   ├── vercel.json
│   ├── .env.local
│   └── .env.production
│
├── backend/               (Opsi 3: ngrok tunnel | Opsi 4: Railway)
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── .env.local
│   ├── .env.production
│   ├── railway.json       (untuk Railway deployment)
│   └── .ngrok/config      (untuk tunnel config)
│
├── ai-model/              (Opsi 3: lokal | Opsi 4: HuggingFace/API)
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── requirements.txt
│
└── HOSTING_ARCHITECTURE.md (File ini)
```

---

## Kesimpulan

Setiap opsi memiliki trade-off tersendiri:
- **Opsi 1** = Sederhana tapi terpusat (risk tinggi)
- **Opsi 2** = Fokus performa (tunnel kompleks)
- **Opsi 3** = Balanced & fleksibel ✨ **Rekomendasi**
- **Opsi 4** = Scalable tapi kompleks (untuk later stage)

Dimulai dengan **Opsi 3**, dan scale-up ke **Opsi 4** ketika sudah memiliki resource & kebutuhan yang jelas.
