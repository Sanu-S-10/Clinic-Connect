# ClinicConnect — Deployment Guide

## Project Structure

```
Clinic-Connect/
├── frontend/          → Deploy to Vercel
│   ├── user-interface/
│   ├── admin-interface/
│   └── vite.config.ts
└── backend/           → Deploy to Render
    ├── user-backend/
    ├── admin-backend/
    └── server.ts
```

---

## 🌐 Frontend — Deploy to Vercel

### Step 1: Connect Repository
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo: `Sanu-S-10/Clinic-Connect`
3. Set **Root Directory** to `frontend`

### Step 2: Configure Build Settings

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3: Environment Variables (Vercel)

Go to **Project → Settings → Environment Variables** and add:

| Variable | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` | Your Render backend URL (set after deploying backend) |
| `GEMINI_API_KEY` | `your-gemini-api-key` | Google Gemini API key for the AI chatbot |

> **Note:** After you deploy the backend to Render and get the URL, come back and set `VITE_API_URL`.

### Step 4: Update Frontend API Base URL

Before deploying, update your API service file to use the environment variable.
In `frontend/user-interface/services/api.ts` and `frontend/admin-interface/services/api.ts`,
make sure the base URL reads from the env:

```ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### Step 5: Deploy
Click **Deploy**. Vercel will build and publish automatically.

**Your app will be live at:**
- User Interface: `https://your-app.vercel.app/user-interface/`
- Admin Interface: `https://your-app.vercel.app/admin-interface/`

---

## ⚙️ Backend — Deploy to Render

### Step 1: Create a New Web Service
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo: `Sanu-S-10/Clinic-Connect`
3. Set **Root Directory** to `backend`

### Step 2: Configure Service Settings

| Setting | Value |
|---|---|
| **Environment** | Node |
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Node Version** | 18+ |

### Step 3: Environment Variables (Render)

Go to **Environment → Environment Variables** and add all of these:

#### 🗄️ Database
| Variable | Example Value | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/clinicconnect?retryWrites=true&w=majority` | MongoDB Atlas connection string |

#### 📧 Email (SMTP)
| Variable | Example Value | Description |
|---|---|---|
| `FROM_EMAIL` | `youremail@gmail.com` | Sender email address |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP port (587 for TLS) |
| `SMTP_USER` | `youremail@gmail.com` | SMTP login username |
| `SMTP_PASS` | `your-app-password` | Gmail App Password (not your Gmail password) |

#### 🤖 AI Chatbot
| Variable | Example Value | Description |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API key |

#### 🔐 OTP / Security
| Variable | Example Value | Description |
|---|---|---|
| `OTP_SECRET` | `clinic-connect-otp-secret-key-2026` | Secret key for OTP hashing |
| `OTP_TTL_MINUTES` | `10` | OTP expiry in minutes |
| `OTP_MAX_ATTEMPTS` | `5` | Max OTP attempts before lockout |

#### 🌐 Server
| Variable | Example Value | Description |
|---|---|---|
| `PORT` | `5000` | Port (Render sets this automatically, but you can define it) |

### Step 4: Fix CORS for Production

In `backend/user-backend/index.ts` and `backend/admin-backend/index.ts`, update CORS to allow your Vercel domain:

```ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app'  // ← add your Vercel URL
  ],
  credentials: true
}));
```

### Step 5: Deploy
Click **Create Web Service**. Render will build and start your server.

**Your backend will be live at:** `https://your-backend.onrender.com`

---

## 🔄 After Both Are Deployed

1. Copy your Render backend URL → go back to **Vercel → Environment Variables**
2. Set `VITE_API_URL = https://your-backend.onrender.com`
3. Redeploy the frontend on Vercel (or it will redeploy automatically on next push)

---

## 📋 Environment Variables Quick Reference

### Backend (Render) — All Required

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/clinicconnect
GEMINI_API_KEY=your_gemini_api_key
FROM_EMAIL=youremail@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_gmail_app_password
OTP_SECRET=your_random_secret_string
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

### Frontend (Vercel) — Required

```env
VITE_API_URL=https://your-backend.onrender.com
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🔑 How to Get Each Secret

| Secret | How to Get |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Cluster → Connect → Drivers |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API Key |
| `SMTP_PASS` | Gmail → Account → Security → 2-Step Verification → App Passwords → Generate |

---

## ⚠️ Important Notes

- **Never commit `.env.local`** to Git — it's already in `.gitignore` ✅
- **Free Render tier** spins down after 15 minutes of inactivity — first request after sleep may be slow (~30s)
- **MongoDB Atlas** free tier (M0) is sufficient for development and small production use
- Make sure your MongoDB Atlas cluster allows connections from **all IPs** (`0.0.0.0/0`) or add Render's IP ranges
