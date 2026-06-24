# Deployment Guide — Vercel + Render + Railway MySQL

This guide covers Phase 1 (pre-deploy hardening) through initial cloud deployment for the Banking System.

## Architecture

| Component | Platform | URL pattern |
|-----------|----------|-------------|
| Frontend | **Vercel** | `https://your-app.vercel.app` |
| Backend API | **Render** | `https://your-api.onrender.com` |
| Database | **Railway MySQL** | Private host (not public to browser) |

```
Browser → Vercel (static HTML/JS)
       → Render (Spring Boot JAR)
       → Railway MySQL
       → Gmail SMTP (OTP emails)
```

---

## Phase 1 checklist (implemented in repo)

- [x] `application-prod.properties` — production Spring settings
- [x] `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` env-driven datasource
- [x] `PORT` support for Render
- [x] `CORS_ORIGIN_PATTERNS` for Vercel frontend
- [x] Frontend `config.js` + Vercel build script (`API_BASE_URL`)
- [x] `render.yaml` blueprint for backend
- [x] `vercel.json` for frontend
- [x] `/actuator/health` for Render health checks
- [x] H2 console removed from security config

---

## Step 1 — Railway MySQL

1. Go to [railway.app](https://railway.app) → **New Project** → **Provision MySQL**.
2. Open the MySQL service → **Variables** tab. Note:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
3. Build your JDBC URL for Render:

```
jdbc:mysql://<MYSQLHOST>:<MYSQLPORT>/<MYSQLDATABASE>?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

Example:

```
jdbc:mysql://containers-us-west-xxx.railway.app:12345/railway?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
```

4. Enable **public networking** on Railway MySQL if Render cannot reach it privately (free tier typically uses public TCP proxy).

---

## Step 2 — Render (backend)

### Option A: Blueprint (`render.yaml`)

1. Push this repo to GitHub.
2. Render Dashboard → **New** → **Blueprint** → connect repo.
3. Set secret env vars when prompted (see table below).

### Option B: Manual Web Service

1. **New** → **Web Service** → connect GitHub repo.
2. Settings:
   - **Root Directory:** `account-service`
   - **Runtime:** Java
   - **Build Command:** `mvn clean package -DskipTests`
   - **Start Command:** `java -jar target/account-service-1.0.0.jar`
   - **Health Check Path:** `/actuator/health`

### Render environment variables

| Variable | Value | Notes |
|----------|-------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates production config |
| `DB_URL` | JDBC URL from Step 1 | Required |
| `DB_USERNAME` | Railway `MYSQLUSER` | Required |
| `DB_PASSWORD` | Railway `MYSQLPASSWORD` | Required |
| `JWT_SECRET` | 32+ char random string | **Rotate** if ever exposed |
| `ADMIN_EMAIL` | Your admin email | Required at startup |
| `ADMIN_PASSWORD` | Strong password | Only used on **first** DB bootstrap |
| `MAIL_USERNAME` | Gmail address | OTP delivery |
| `MAIL_PASSWORD` | Gmail App Password | Not your Gmail login password |
| `CORS_ORIGIN_PATTERNS` | `https://your-app.vercel.app` | Add `,https://*.vercel.app` for preview deploys |

`PORT` is injected automatically by Render — do not set it manually.

### Verify backend

After deploy, open:

```
https://your-api.onrender.com/actuator/health
```

Expected: `{"status":"UP"}`

---

## Step 3 — Vercel (frontend)

1. Push repo to GitHub (same repo).
2. [vercel.com](https://vercel.com) → **Add New Project** → import repo.
3. **Root Directory:** `frontend`
4. Framework: **Other** (static + build script)
5. **Environment variable** (required):

| Variable | Value |
|----------|-------|
| `API_BASE_URL` | `https://your-api.onrender.com` (no trailing slash) |

6. Deploy. Vercel runs `npm run build` which generates `config.js` from `API_BASE_URL`.

### Update CORS on Render

After you know your Vercel URL, set on Render:

```
CORS_ORIGIN_PATTERNS=https://your-app.vercel.app,https://*.vercel.app
```

Redeploy the Render service if needed.

---

## Step 4 — End-to-end test

1. Open Vercel URL in browser.
2. Register a new user → check email for OTP.
3. Login → create account → deposit / withdraw.
4. Admin login (password + OTP) if using admin flow.

---

## Local development (unchanged)

```powershell
# Set env vars (see .env.example)
cd account-service
mvn spring-boot:run
```

Serve `frontend/index.html` via Live Server. `config.js` defaults to `http://localhost:8081`.

---

## Security reminders

- Never commit `.env` or secrets to git.
- Rotate `JWT_SECRET`, Gmail App Password, and admin password before going public.
- After first successful deploy with tables created, consider changing `spring.jpa.hibernate.ddl-auto` to `validate` in `application-prod.properties`.
- Render free tier sleeps after inactivity — first request may be slow (~30s).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | Set `CORS_ORIGIN_PATTERNS` to exact Vercel URL on Render |
| `JWT secret is missing` | Set `JWT_SECRET` on Render |
| `Admin email is missing` | Set `ADMIN_EMAIL` on Render |
| DB connection refused | Check Railway public networking; verify `DB_URL` host/port |
| Vercel build fails | Set `API_BASE_URL` in Vercel project settings |
| OTP not sent | Verify `MAIL_USERNAME` / `MAIL_PASSWORD` on Render |
