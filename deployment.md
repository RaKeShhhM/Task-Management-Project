# 🌐 Deploying TeamBoard to Render

This guide deploys the **backend** as a Render Web Service and the **frontend** as a Render Static Site. Both are free-tier friendly.

---

## Before you start

Make sure you've pushed the latest code (including the fixes from this session — the `VITE_API_URL` environment variable usage and the cookie `sameSite` fix) to GitHub:

```bash
git add .
git commit -m "Prep for deployment: env-based API URL, cross-site cookie fix"
git push
```

---

## Step 1: Allow Render to reach your MongoDB Atlas database

1. Log into [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to **Network Access** (left sidebar)
3. Click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)

This is needed because Render's free tier doesn't use static IPs, so you can't whitelist a specific one.

---

## Step 2: Deploy the Backend (Web Service)

1. Go to [render.com](https://render.com) and sign in (GitHub login is easiest)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (`Project-Manager` or whatever you named it)
4. Fill in:
   - **Name**: `teamboard-backend` (or anything you like)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Scroll to **Environment Variables** and add each one from your `backend/.env`:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your MongoDB Atlas connection string |
   | `JWT_SECRET` | your long random string |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | *(leave blank for now — we'll fill this in Step 4)* |
   | `EMAIL_HOST` | `smtp.gmail.com` |
   | `EMAIL_PORT` | `587` |
   | `EMAIL_USER` | your Gmail address |
   | `EMAIL_PASS` | your Gmail App Password |
   | `EMAIL_FROM` | your Gmail address |

   *(Don't set `PORT` — Render sets this automatically, and your code already reads `process.env.PORT`.)*

6. Click **Create Web Service**

Render will build and deploy. Once live, you'll get a URL like:
```
https://teamboard-backend.onrender.com
```
**Copy this URL** — you need it for the next step.

⚠️ **Free tier note**: this service "spins down" after ~15 minutes of inactivity. The first request after that (like logging in) can take 30–50 seconds to wake it back up. Totally normal on the free tier.

---

## Step 3: Deploy the Frontend (Static Site)

1. Back on Render, click **New +** → **Static Site**
2. Connect the same GitHub repo
3. Fill in:
   - **Name**: `teamboard-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add an environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | the backend URL from Step 2, e.g. `https://teamboard-backend.onrender.com` |

5. Click **Create Static Site**

Once live, you'll get a URL like:
```
https://teamboard-frontend.onrender.com
```

---

## Step 4: Connect the two — update CORS

Now that you have your frontend's real URL, go back to your **backend** service on Render:

1. Open the backend service → **Environment**
2. Set `CLIENT_URL` to your frontend URL (e.g. `https://teamboard-frontend.onrender.com`)
3. Save — Render will automatically redeploy the backend with the new value

This matters because your backend's CORS config only allows requests from whatever `CLIENT_URL` is set to — without this, the browser will block every API call with a CORS error.

---

## Step 5: Test the live app

1. Visit your frontend URL
2. Register a new account (first request will be slow if the backend was asleep — that's expected)
3. Create a project, add a task, check that real-time updates still work by opening two browser windows
4. Test email notifications by assigning a task to a real email address

---

## Common issues

**"Network Error" or blank page on login**
→ Check the browser console. If you see a CORS error, double check `CLIENT_URL` on the backend exactly matches your frontend's URL (including `https://`, no trailing slash).

**Login seems to work but you get logged out immediately / profile fetch fails**
→ This is almost always the cookie `sameSite` setting. Confirm `NODE_ENV=production` is set on your backend service — without it, cookies default to `sameSite: "lax"` locally, which browsers block cross-site.

**First request takes forever**
→ Expected on Render's free tier (cold start after inactivity). Not a bug.

**Socket.io not connecting / no real-time updates**
→ Check that `VITE_API_URL` on the frontend points to the backend's Render URL, not `localhost`.

---

## Optional: custom domain

Render supports free custom domains on both Static Sites and Web Services — under each service's **Settings → Custom Domain** if you want something like `teamboard.yourdomain.com` instead of the `.onrender.com` subdomain.