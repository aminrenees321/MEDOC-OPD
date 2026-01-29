# OPD Token Allocation Engine - Frontend

React frontend for the OPD Token Allocation Engine.

## Live Demo

**Frontend:** https://medoc-opd.netlify.app  
**Backend:** https://medoc-opd.onrender.com

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set:

```
REACT_APP_API_URL=http://localhost:5000
```

**Note:** Backend must be running on port 5000 for local dev.

### 3. Run

```bash
npm start
```

App runs at http://localhost:3000

---

## Production (Netlify)

### Environment Variable

In Netlify Dashboard:

1. Go to **Site configuration** → **Environment variables**
2. Add variable:
   - **Key:** `REACT_APP_API_URL`
   - **Value:** `https://medoc-opd.onrender.com`
3. **Save** and **Trigger deploy**

### Build

- **Build command:** `npm run build`
- **Publish directory:** `build`

These are set in `netlify.toml`.

---

## Pages

| Page | Description |
|------|-------------|
| Dashboard | Overview stats (doctors, slots, tokens) |
| Doctors | Create and manage doctors with default slots |
| Slots | Generate and view daily slots |
| Tokens | Create tokens, emergency tokens, cancel/no-show |
| Simulation | Run OPD day simulation |
