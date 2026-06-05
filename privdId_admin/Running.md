# Running the Project — Step-by-Step Guide

This project has **3 required services** and **2 optional ones**. Each runs in its own terminal.

```
zkp-blockchain-identity-main/
├── privdId_admin/
│   ├── backend/          ← Service 1: Student management API  (port 5000)
│   └── frontend/         ← Service 4 (optional): Web admin panel (port 5173)
├── zkp-backend/          ← Service 2: ZK proof generation     (port 3001)
├── digital-app/          ← Service 3: Expo mobile app
└── zk-proofs/            ← Service 5 (optional): Hardhat blockchain (port 8545)
```

---

## Prerequisites

Install these once if you haven't already:

```bash
node -v          # must be v16 or higher
npm -v
npm install -g @expo/cli          # Expo CLI
npm install -g nodemon            # for admin backend hot-reload
```

Install **Expo Go** on your phone (Android / iOS) from the app store.

---

## Service 1 — Admin Backend (port 5000)

> Manages students, sends emails, handles login.

```bash
cd privdId_admin/backend
npm install          # only needed first time
npm run dev          # starts with nodemon (hot-reload)
```

**Verify it's running:**
```
GET http://localhost:5000/api/health
→ { "status": "ok" }
```

### Environment file (`privdId_admin/backend/.env`)

Already configured. Key values:

| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGO_URI` | (set) | MongoDB Atlas connection |
| `EMAIL_USER` | (set) | Gmail address for sending credentials |
| `EMAIL_PASS` | (set) | Gmail App Password |
| `JWT_SECRET` | (set) | Signs admin tokens |
| `ADMIN_PASSWORD` | `admin@privid2024` | Admin panel login password |

---

## Service 2 — ZKP Backend (port 3001)

> Generates zero-knowledge proofs and verifies them on-chain / off-chain.

```bash
cd zkp-backend
npm install          # only needed first time
node server.js
```

**Verify it's running:**
```
GET http://localhost:3001/
→ ZKP backend running
```

> **Note:** On-chain verification requires the Hardhat node (Service 5) to be running. If Hardhat is not running, on-chain verification fails gracefully — the app still works.

---

## Service 3 — Expo Mobile App

> The React Native app that students and admins use.

### 3a. Update the IP address

The phone must reach both backends over your **local Wi-Fi** (same network). Find your machine's LAN IP:

```bash
# Windows (PowerShell)
ipconfig
# Look for "IPv4 Address" under your Wi-Fi adapter, e.g. 192.168.1.10

# macOS / Linux
ifconfig | grep "inet "
```

Open `digital-app/environment.js` and update both fallback URLs:

```js
// digital-app/environment.js
const fallbackBackendUrl      = 'http://YOUR_LAN_IP:3001';   // ZKP backend
const fallbackAdminBackendUrl = 'http://YOUR_LAN_IP:5000';   // Admin backend
```
step 1- hostname-I, get the wsl address
step 2- netsh interface portproxy add v4tov4 listenport=5000 listenaddress=0.0.0.0 connectport=5000 connectaddress=172.25.230.65(wsl ip address)
step 3- netsh advfirewall firewall add rule name="WSL 5000" dir=in action=allow protocol=TCP localport=5000
Or create a `.env` file inside `digital-app/`:

```env
# digital-app/.env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.10:3001
EXPO_PUBLIC_ADMIN_BACKEND_URL=http://192.168.1.10:5000
```

### 3b. Install and start

```bash
cd digital-app
npm install          # only needed first time

# (Optional) Install Excel file picker for admin upload feature:
npx expo install expo-document-picker

npx expo start
```

A QR code will appear in the terminal. Scan it with **Expo Go** on your phone.

| Key | Action |
|---|---|
| `a` | Open on Android emulator |
| `i` | Open on iOS simulator |
| `w` | Open in browser |
| `r` | Reload the app |

---

## Service 4 — Web Admin Panel (optional, port 5173)

> The React web interface for managing students (same features as the Expo admin panel).

```bash
cd privdId_admin/frontend
npm install          # only needed first time
npm run dev
```

Open in browser: `http://localhost:5173`

### Frontend `.env` (create if missing)

```env
# privdId_admin/frontend/.env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Service 5 — Hardhat Local Blockchain (optional, port 8545)

> Required only for on-chain proof verification. The app works without it.

```bash
cd zk-proofs
npm install          # only needed first time
npx hardhat node     # starts local blockchain
```

In a second terminal, deploy the verifier contract:

```bash
cd zk-proofs
npx hardhat ignition deploy ./ignition/modules/Lock.js --network localhost
```

---

## All-at-Once (4 terminals)

Open 4 terminal windows and run one command in each:

| Terminal | Command |
|---|---|
| **1** | `cd privdId_admin/backend && npm run dev` |
| **2** | `cd zkp-backend && node server.js` |
| **3** | `cd digital-app && npx expo start` |
| **4** *(optional)* | `cd privdId_admin/frontend && npm run dev` |

---

## App Flows

### Student Flow
1. Open Expo app → tap **"Login with Credentials"**
2. Enter email + temporary password (sent by admin)
3. Your details load from the database
4. Enter your **Date of Birth** (not stored in DB, needed for ZK proof)
5. Tap fields to toggle which ones appear in the QR (privacy control)
6. Tap **"Generate Zero-Knowledge Proof"**
7. Wait for proof generation + verification (off-chain + blockchain)
8. Share the QR code — scanner sees only the fields you selected

### Admin Flow (in Expo app)
1. Open Expo app → tap **"Admin Panel"** (bottom of home screen)
2. Enter admin password: `admin@privid2024`
3. From the dashboard you can:
   - **Add Student** — fill the form, a temp password is auto-generated
   - **Upload Excel** — bulk import (requires `expo-document-picker`)
   - **Send Email** — select students → "Send Email" to deliver their credentials

### Admin Flow (web panel)
1. Open `http://localhost:5173`
2. Dashboard shows all students with email status
3. Navigate to **Add Student** or **Upload Excel** via the sidebar
4. Select students on the dashboard → **Send Credentials** button

---

## Bulk Add Students (in Expo app)

The **Bulk Add** screen in the Expo admin panel is an inline table editor — no Excel file needed.

- Rows start with 3 empty rows; tap **+ Add Row** for more
- Only filled rows are submitted; empty rows are skipped
- Tap **✕** on a row to delete it
- Hit **Import N Students** to submit all filled rows at once

Each row needs: Full Name, Email, Roll No, Programme, Contact Number.

## Excel Upload Format (web admin panel only)

For bulk import via the web panel (`privdId_admin/frontend`), your `.xlsx` file must have these column headers (case-insensitive):

| Column | Accepted names |
|---|---|
| Name | `name` |
| Email | `email`, `mail` |
| Roll No | `rollNo`, `rollnumber`, `roll` |
| Programme | `programme`, `program`, `course` |
| Contact | `contactNo`, `contactnumber`, `contact` |

Example row:
```
name         | email                    | rollNo    | programme    | contactNo
Aarav Sharma | aarav@college.edu        | 22BCSD01  | B.Tech CSE   | 9876543210
```

---

## Common Issues

| Problem | Fix |
|---|---|
| Phone can't connect to backend | Make sure phone and PC are on the **same Wi-Fi**. Update LAN IP in `environment.js`. |
| `ADMIN_PASSWORD not configured` | Add `ADMIN_PASSWORD=admin@privid2024` to `privdId_admin/backend/.env` |
| Excel upload button does nothing | Run `npx expo install expo-document-picker` inside `digital-app/` |
| On-chain verification fails | Start Hardhat node (Service 5) and deploy the contract |
| `Cannot find module` on backend | Run `npm install` inside the backend folder |
| Expo QR won't scan | Use **tunnel mode**: `npx expo start --tunnel` (requires `npm install -g @expo/ngrok`) |
