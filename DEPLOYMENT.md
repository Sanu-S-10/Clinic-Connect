# Deployment Guide: Clinic Connect

This guide covers how to deploy the Clinic Connect monorepo. It is configured to deploy the entire **frontend** as a single application to **Vercel** and the entire **backend** as a single Web Service to **Render**.

## 🗂 Project Structure Map

- `frontend/` ➡️ Deploy to **Vercel** (Includes both User and Admin Interfaces)
- `backend/` ➡️ Deploy to **Render** (Includes both User and Admin Backends via API Gateway)

---

## 💻 Local Development

To run the unified frontend (both User and Admin interfaces) locally for development:

1. Open a terminal and navigate to the `frontend` directory: `cd frontend`
2. Install dependencies (if you haven't already): `npm install`
3. Run the development server:
   ```bash
   npm run dev
   ```
   *This command will start both the user interface and admin interface simultaneously.*

---

## 🚀 Deploying Frontend to Vercel

The frontend is specifically configured to build both the user interface and the admin interface into a single Vercel project.

### Steps for Deployment

1. **Log In:** Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
2. **Import Repository:** Select and import your `clinic-connect` Git repository.
3. **Configure the Project:**
   - **Project Name:** `clinic-connect-frontend`
   - **Root Directory:** Click "Edit" and select `frontend`.
   - **Framework Preset:** Vite (or Other - Vercel will run `npm run build` defined in `frontend/package.json`).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:** Add your unified backend API URL here:
   - `VITE_API_URL`: The URL of your Render backend (e.g., `https://your-backend-url.onrender.com/api`).
5. **Deploy:** Click the **Deploy** button.

Once deployed, the User Interface will be available at the base URL (e.g., `https://your-frontend.vercel.app/`), and the Admin Interface will be securely available at the `/admin/` path (e.g., `https://your-frontend.vercel.app/admin/`).

---

## ☁️ Deploying Backend to Render

The backend uses a single API Gateway (`backend/server.ts`) to serve both the User APIs (at `/api`) and Admin APIs (at `/admin-api`) on Render's single port.

### Steps for Deployment

1. **Log In:** Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. **Connect Repository:** Provide the link to your `clinic-connect` repository.
3. **Configure the Service:**
   - **Name:** `clinic-connect-backend`
   - **Language:** `Node`
   - **Root Directory:** Type `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run start`
   - **Instance Type:** Select "Free" (or another tier if needed).
4. **Environment Variables:** Expand the "Advanced" section and add:
   - `PORT`: `5000` (Or let Render assign it)
   - `MONGODB_URI`: Your production database URL.
   - `GEMINI_API_KEY`: Your Gemini API Key.
   - `OTP_SECRET`: Secret key for JWT/OTP.
   - Email configurations (`FROM_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
   - `FRONTEND_URL`: The deployed Vercel URL (e.g., `https://your-frontend.vercel.app` - IMPORTANT for CORS!).
5. **Deploy:** Click **Create Web Service**.

---

## 🔄 Finalizing the Connection

Because the frontend and backend depend on each other's URLs (for API calls and CORS policies), follow these steps after the initial deployments:

1. **Get Backend URL:** Once Render is done deploying, copy the live URL for the backend.
2. **Update Vercel Environment Variables:** Go into your Vercel Project Settings, and set `VITE_API_URL` to `https://<YOUR_RENDER_URL>/api`. If you made changes, trigger a new deployment in Vercel.
3. **Get Frontend URL:** Copy the live URL for the Vercel frontend.
4. **Update Render Environment Variables:** Go to your Render Web Service settings and ensure the `FRONTEND_URL` environment variable perfectly matches the Vercel URL. If you made changes, Render will automatically spin up a new instance.
