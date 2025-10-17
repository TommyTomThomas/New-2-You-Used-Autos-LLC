# New 2 You Used Autos LLC

A polished used car dealership website with:
- Drifting car landing animation with smoke forming “New 2 You Used Autos LLC”
- Public inventory page (search/sort)
- Owner-only admin upload system

## Render (all-in-one hosting)
1. Push this folder to GitHub (web UI works fine).
2. On https://render.com → **New + → Web Service**
3. Connect the repo and set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
4. Add env vars:
   - `ADMIN_PASSWORD` = strong password
   - `SESSION_SECRET` = long random string
5. Deploy → Get your live URL.

## Local run
```bash
npm install
cp .env.example .env
# edit .env with secrets
npm start
# open http://localhost:3000
```
