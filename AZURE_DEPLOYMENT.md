# TrueTrace — Azure Deployment Guide

Replaces `GOOGLE_CLOUD_DEPLOYMENT.md`, `DEPLOYMENT.md`, `DEPLOYMENT_GUIDE.md`, `STATIC_DEPLOYMENT.md`,
and `deploy*.sh` — those are all GCP/Cloud Run/GCS specific and no longer apply to this stack.
They're left in place for reference; delete them whenever you're ready.

## Current architecture

- **Frontend**: React app — running locally for now (`npm start`), pointed at the deployed
  backend. Will move to **Azure Static Web Apps** later.
- **Backend**: Express API — deployed to your existing **Azure App Service** (Linux, native
  Node.js runtime — no Docker).
- **Database**: **Azure SQL Database** (already provisioned).

## 1. Database: point the backend at Azure SQL

Run `backend/truetrace_schema_azuresql.sql` against your Azure SQL `truetrace` database once
(SSMS or Azure Data Studio, connected directly to that database — see the notes at the top of
that file). It creates the `users` and `products` tables and seeds the same 100 demo products.

Two things to check on the Azure SQL side before that script will connect:
- **Firewall**: your Azure SQL logical server needs a firewall rule allowing your current IP
  (Portal → your SQL server → *Networking* → *Firewall rules* → *Add your client IPv4 address*).
- **"Allow Azure services and resources to access this server"**: also under *Networking* on the
  SQL server — turn this on so your App Service can reach the database too (App Service outbound
  IPs aren't static by default).

## 2. Configure the App Service's Application Settings

These become `process.env.*` in `server.js` — same variable names the code already reads, no
code change needed here. Replace the placeholders and run:

```
az webapp config appsettings set \
  --resource-group <YOUR_RESOURCE_GROUP> \
  --name <YOUR_APP_SERVICE_NAME> \
  --settings \
    DB_SERVER="<your-sql-server-name>.database.windows.net" \
    DB_PORT="1433" \
    DB_USER="<your-sql-login>" \
    DB_PASS="<your-sql-password>" \
    DB_NAME="truetrace" \
    DB_ENCRYPT="true" \
    DB_TRUST_CERT="false" \
    FRONTEND_ORIGIN="http://localhost:3000" \
    GOOGLE_CLIENT_ID="755369053889-4vo7kp3b4la9f5eoikq332h85ld1vduk.apps.googleusercontent.com" \
    JWT_SECRET="<a-long-random-production-secret>"
```

Notes:
- `DB_ENCRYPT=true` / `DB_TRUST_CERT=false` is the Azure SQL setting — the opposite of your local
  `.env`, which uses `false`/`true` for a local, self-signed-cert SQL Server instance.
- `FRONTEND_ORIGIN` is a comma-separated list (`server.js` splits on `,`) — for now it's just your
  local dev origin; add the Static Web Apps URL here too once that's live, e.g.
  `FRONTEND_ORIGIN="http://localhost:3000,https://your-app.azurestaticapps.net"`.
- Don't put real secrets in a committed `.env` file for production — Application Settings are the
  right place; they reach the app as real environment variables, and `dotenv.config()` in
  `server.js` only fills in variables that aren't already set, so this doesn't conflict with local
  `.env` usage.
- Set the Node runtime version if it isn't already:
  ```
  az webapp config set --resource-group <YOUR_RESOURCE_GROUP> --name <YOUR_APP_SERVICE_NAME> --linux-fx-version "NODE|20-lts"
  ```

## 3. Deploy the backend code

App Service's native Node runtime expects `package.json` at the root of what you deploy — so zip
just the **contents** of `backend/`, not the whole repo.

From the `backend` folder (PowerShell):

```powershell
cd backend
Compress-Archive -Path * -DestinationPath ..\backend-deploy.zip -Force
cd ..
az webapp deploy --resource-group <YOUR_RESOURCE_GROUP> --name <YOUR_APP_SERVICE_NAME> --src-path backend-deploy.zip --type zip
```

If Application Settings don't already include it, add this so Azure runs `npm install` on deploy
(Oryx build) instead of expecting `node_modules` to already be zipped up:

```
az webapp config appsettings set --resource-group <YOUR_RESOURCE_GROUP> --name <YOUR_APP_SERVICE_NAME> --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

Check it came up:

```
az webapp log tail --resource-group <YOUR_RESOURCE_GROUP> --name <YOUR_APP_SERVICE_NAME>
```

You're looking for the same `✅ Server listening on :...` / `✅ Database connection successful`
lines you saw locally. Your app's URL is `https://<YOUR_APP_SERVICE_NAME>.azurewebsites.net`.

## 4. Point the local frontend at the deployed backend

In the project root's `.env` (not `.env.production`):

```
REACT_APP_API_URL=https://<YOUR_APP_SERVICE_NAME>.azurewebsites.net
```

Restart `npm start` after changing this — Create React App only reads `.env` at dev-server
startup.

## 5. Google OAuth

`GOOGLE_CLIENT_ID` is reused as-is. If Google sign-in stops working after this, check the OAuth
client in Google Cloud Console (APIs & Services → Credentials) has `http://localhost:3000` under
**Authorized JavaScript origins** — it likely already does from GCP-hosted testing, but worth
confirming since the backend origin changed.

## Later: moving the frontend to Azure Static Web Apps

Not needed yet since the frontend is staying local for now. When you're ready, that'll mean:
adding a Static Web Apps resource, a GitHub Actions workflow (Static Web Apps' deploy model is
built around it) or manual `swa deploy`, and updating `FRONTEND_ORIGIN` on the App Service to
include the new `https://*.azurestaticapps.net` origin. Happy to build that out when you get
there.
