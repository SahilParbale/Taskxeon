# TaskFlow Enterprise CI/CD Pipeline Documentation

This repository includes a production-grade Continuous Integration and Continuous Deployment (CI/CD) pipeline built with GitHub Actions (`.github/workflows/ci-cd.yml`).

---

## 1. Pipeline Architecture

```
[ Push / PR to main ]
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ Stage 1: Build, Lint & Verify (CI)                    │
│ • Checkout source code                                 │
│ • Setup Node.js 20 runtime with npm dependency cache   │
│ • Install clean dependencies (npm ci)                  │
│ • TypeScript Static Analysis (tsc --noEmit)            │
│ • Production Bundle (vite build)                       │
│ • Validate dist/ output bundle                         │
│ • Upload release artifact (14 days retention)          │
└────────────────────────────────────────────────────────┘
         │
         ├────────────────────────────────────────┐
         ▼                                        ▼
┌───────────────────────────────┐  ┌────────────────────────────────────┐
│ Stage 2: Deploy to Pages (CD) │  │ Stage 3: Deploy to Vercel (CD)     │
│ • Auto-runs on main branch    │  │ • Runs when VERCEL_TOKEN is set    │
│ • Deploys dist to Pages       │  │ • Deploys dist to production       │
│ • Zero downtime               │  │ • Global edge CDN distribution     │
└───────────────────────────────┘  └────────────────────────────────────┘
```

---

## 2. GitHub Actions Triggers

The workflow automatically triggers on:
- **Push to `main` or `master` branches**: Runs CI verification and deploys to production.
- **Pull Requests to `main` or `master`**: Runs CI verification (linting, typechecking, build) to ensure PRs never break production.
- **Manual Workflow Dispatch**: Can be triggered manually from the GitHub Actions tab with target environment selection.

---

## 3. Configuring Repository Secrets (Optional)

To enable automatic Vercel deployments and link custom Supabase instances, navigate to **GitHub Repository -> Settings -> Secrets and variables -> Actions** and add the following repository secrets:

| Secret Name | Description | Example / Default |
|-------------|-------------|-------------------|
| `VERCEL_TOKEN` | Vercel Personal Access Token | `AbCdEf123456...` |
| `VERCEL_ORG_ID` | Vercel Organization / Team ID | `team_xxx` |
| `VERCEL_PROJECT_ID` | Vercel Project Identifier | `prj_xxx` |
| `VITE_SUPABASE_URL` | Supabase Cloud Database URL | `https://xdwkcybxgqdtnpnypxfj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Client Public Key | `eyJhbGciOi...` |

*(Note: If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set as secrets, the pipeline automatically falls back to the production keys configured in `.env.example`).*

---

## 4. Enabling GitHub Pages Deployment

1. Go to **Settings -> Pages** in your GitHub repository.
2. Under **Build and deployment -> Source**, select **GitHub Actions**.
3. Any push to `main` will now automatically build and publish to your GitHub Pages URL!

---

## 5. Local Build Verification

To test the CI build steps locally before committing:

```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Production Build
npm run build

# 3. Preview Production Bundle
npm run preview
```
