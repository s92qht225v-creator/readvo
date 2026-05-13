# Blim Deployment Guide

Production runs on a single Hetzner CPX22 VPS. Migrated off Vercel on 2026-05-09 because of overdue billing — flat $10/mo replaces variable function-invocation pricing.

## TL;DR

```bash
# 1. Push to GitHub main
git push origin main

# 2. Pull, build, restart on the server
ssh deploy@178.105.107.198 ./deploy.sh
```

That's it. Everything below is reference for when something goes wrong.

---

## Architecture

```
                    Browser
                       │ HTTPS
                       ▼
          178.105.107.198 (Hetzner CPX22, Falkenstein)
                       │
   ┌───────────────────┴────────────────────┐
   │ nginx :80/:443  (TLS via Let's Encrypt) │
   │   server_name blim.uz www.blim.uz       │
   │              test.blim.uz               │
   └───────────────────┬────────────────────┘
                       │ proxy_pass
                       ▼
              Node :3000  (Next.js 16)
              `next start`
              managed by systemd unit `blim.service`
              user: `deploy`
                       │
                       ▼
              Supabase (miruwaeplbzfqmdwacsh)
              — Postgres + Auth + Storage
```

| Domain | DNS | What it serves |
|--------|-----|----------------|
| `blim.uz` | A → 178.105.107.198 | Main app (Chinese learning) |
| `www.blim.uz` | A → 178.105.107.198 | Same (proxy redirects to apex) |
| `test.blim.uz` | A → 178.105.107.198 | Test builder — `src/proxy.ts` rewrites `test.blim.uz/*` → `/test-app/*` |

DNS lives at **ahost.uz** (authoritative `rdns1/2/3.ahost.uz`). TTL 3600 minimum. Changes can take 5–60 min to propagate at the authoritative servers, plus another TTL window at downstream resolvers.

---

## Server layout

| Path | Purpose | Owner |
|------|---------|-------|
| `/home/deploy/app` | Git clone of `s92qht225v-creator/readvo` on `main` | `deploy:deploy` |
| `/home/deploy/app/.env.local` | Env vars (Supabase keys, Telegram, Groq, OpenAI) — **never committed** | `deploy:deploy` mode 600 |
| `/home/deploy/deploy.sh` | One-shot deploy script | `deploy:deploy` |
| `/etc/systemd/system/blim.service` | systemd unit for `next start` | root |
| `/etc/nginx/sites-available/blim` | nginx vhost (HTTPS, host-routed) | root |
| `/etc/letsencrypt/live/blim.uz/` | TLS cert (auto-renew via certbot timer) | root |
| `/swapfile` | 4 GB swap (CPX22 has 4 GB RAM, build can OOM) | root |

---

## SSH access

Two users:

- **`root`** — for system-level work (apt, nginx, systemd, certbot, journalctl).
- **`deploy`** — for app deploys. Cannot sudo except `systemctl restart/status blim`.

Both use the same authorized SSH key (`~/.ssh/id_ed25519` on Ali's MacBook).

```bash
# As root (system admin)
ssh root@178.105.107.198

# As deploy (deploys + reading app files)
ssh deploy@178.105.107.198
```

Optional `~/.ssh/config` alias:

```
Host blim
  HostName 178.105.107.198
  User deploy
  IdentityFile ~/.ssh/id_ed25519

Host blim-root
  HostName 178.105.107.198
  User root
  IdentityFile ~/.ssh/id_ed25519
```

Then `ssh blim` or `ssh blim-root`.

---

## Deploying

### Standard deploy

```bash
# Make sure local main is committed and pushed
git status
git push origin main

# Run deploy on server
ssh deploy@178.105.107.198 ./deploy.sh
```

### What `deploy.sh` does

```bash
#!/bin/bash
set -e
cd /home/deploy/app
echo ">> pulling latest"
git pull --ff-only origin main
echo ">> installing deps"
npm install --no-audit --no-fund
echo ">> building"
npm run build
echo ">> restarting"
sudo systemctl restart blim
sleep 3
sudo systemctl is-active blim
echo ">> deployed"
```

Typical timing: **2–4 min** total (~1 min npm, ~1.5 min `next build`, ~3 s restart).

### Deploy without code change (just restart)

```bash
ssh deploy@178.105.107.198 sudo systemctl restart blim
```

### Update env vars

```bash
scp ~/ReadVo/.env.local deploy@178.105.107.198:/home/deploy/app/.env.local
ssh deploy@178.105.107.198 sudo systemctl restart blim
```

### Rollback

```bash
# See recent commits on the server
ssh deploy@178.105.107.198 'cd ~/app && git log --oneline -5'

# Reset to a known-good SHA, rebuild, restart
ssh deploy@178.105.107.198 \
  'cd ~/app && git reset --hard <SHA> && npm install --no-audit --no-fund && npm run build && sudo systemctl restart blim'
```

---

## Logs and debugging

### App logs (Next.js stdout/stderr)

```bash
# Live tail
ssh root@178.105.107.198 journalctl -u blim -f

# Last 200 lines
ssh root@178.105.107.198 journalctl -u blim --no-pager -n 200

# Since a specific time
ssh root@178.105.107.198 journalctl -u blim --since "10 minutes ago" --no-pager
```

### nginx access / error logs

```bash
ssh root@178.105.107.198 tail -f /var/log/nginx/access.log
ssh root@178.105.107.198 tail -f /var/log/nginx/error.log
```

### Service status / control

```bash
ssh root@178.105.107.198 systemctl status blim
ssh root@178.105.107.198 systemctl restart blim
ssh root@178.105.107.198 systemctl stop blim
ssh root@178.105.107.198 systemctl start blim
```

---

## DNS

Records at ahost.uz panel:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 178.105.107.198 | 3600 |
| A | www | 178.105.107.198 | 3600 |
| A | test | 178.105.107.198 | 3600 |

ahost.uz enforces a minimum TTL of 3600. Changes propagate to authoritative servers in 5–60 min, then another TTL window at recursive resolvers.

### Verify DNS propagation

```bash
# Authoritative servers
for ns in rdns1.ahost.uz rdns2.ahost.uz rdns3.ahost.uz; do
  echo "-- $ns --"
  for h in blim.uz www.blim.uz test.blim.uz; do
    printf "  %-15s %s\n" "$h" "$(dig +short A $h @$ns | head -1)"
  done
done

# Public resolvers
for r in 1.1.1.1 8.8.8.8 9.9.9.9; do
  echo "-- $r --"
  for h in blim.uz www.blim.uz test.blim.uz; do
    printf "  %-15s %s\n" "$h" "$(dig +short A $h @$r | head -1)"
  done
done
```

If your local machine's DNS cache is stale, override with `/etc/hosts`:

```bash
sudo tee -a /etc/hosts <<EOF
178.105.107.198 blim.uz
178.105.107.198 www.blim.uz
178.105.107.198 test.blim.uz
EOF
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## TLS certificates

Issued via Let's Encrypt. Auto-renewal runs every 12 h via `certbot.timer` (every system already has it).

### Manual renewal / reissue

```bash
ssh root@178.105.107.198 certbot renew --dry-run        # test
ssh root@178.105.107.198 certbot renew                   # force renewal if due
```

### Reissue after adding a new subdomain

```bash
ssh root@178.105.107.198 certbot --nginx \
  -d blim.uz -d www.blim.uz -d test.blim.uz -d new.blim.uz \
  --non-interactive --agree-tos --redirect \
  -m sh.baltabaev@gmail.com
```

### Certificate location

`/etc/letsencrypt/live/blim.uz/{fullchain.pem,privkey.pem}` — referenced from nginx config.

---

## Auth configuration (Supabase)

The app uses **Telegram OAuth** (primary on `blim.uz`) and **Google OAuth** (primary on `test.blim.uz`).

Supabase Auth settings — https://supabase.com/dashboard/project/miruwaeplbzfqmdwacsh/auth/url-configuration

- **Site URL**: `https://blim.uz`
- **Redirect URLs** (need wildcards for query strings):

```
https://blim.uz/auth/callback
https://blim.uz/**
https://www.blim.uz/auth/callback
https://www.blim.uz/**
https://test.blim.uz/auth/callback
https://test.blim.uz/**
http://localhost:3000/auth/callback
http://localhost:3000/**
https://blim.uz/auth/telegram/complete
https://test.blim.uz/auth/telegram/complete
http://localhost:3000/auth/telegram/complete
```

Without the `/**` wildcards, Supabase falls back to the Site URL when our app appends `?next=/dashboard` to the redirect.

### Google OAuth allowlist

In Google Cloud Console → OAuth consent → Credentials → OAuth Client:

- **Authorized JS origins**: `https://blim.uz`, `https://www.blim.uz`, `https://test.blim.uz`, `http://localhost:3000`
- **Authorized redirect URIs**: `https://miruwaeplbzfqmdwacsh.supabase.co/auth/v1/callback` (only — Supabase forwards to our app from there)

---

## RLS (Row-Level Security)

Enabled on 7 tables on 2026-05-09 as defense-in-depth. Server API routes use service role and bypass RLS — no app code change needed.

Tables: `tests`, `test_questions`, `test_responses`, `test_answers`, `payment_requests`, `subscriptions`, `active_sessions`. Skipped (Telegram bigint IDs): `users`, `user_progress`.

Policies in `supabase/rls-policies.sql`. Rollback in same file.

---

## Common breakage patterns

### "Failed to save questions" 400

API rejects with 400 when any question has an empty prompt. Fill in all titles before publishing.

### Login lands on wrong page

User clicked Google from `blim.uz/login` instead of `test.blim.uz/login`. Check the auth log `referer` field. Or the Supabase redirect-URL allowlist is missing the wildcard variant — see Auth section above.

### "Failed to find Server Action" in logs

Cosmetic. Browser sending stale Server Action IDs from cached pages after deploy. No action needed.

### `npm ci` fails: "lock file out of sync"

Local lockfile drifted from package.json. Run `npm install` on server (deploy.sh already does this), or fix locally with `rm package-lock.json && npm install` and commit.

### `next build` OOMs on the VPS

CPX22 has 4 GB RAM + 4 GB swap. Should be enough but if a future deploy OOMs:
- Bump server to CPX32 (€6.40/mo, 8 GB RAM)
- Or build locally and rsync the `.next/` folder

### nginx 502 Bad Gateway

Next process is down. Check:

```bash
ssh root@178.105.107.198 systemctl status blim
ssh root@178.105.107.198 journalctl -u blim --no-pager -n 50
```

### Wallpaper layout jitter on iOS scroll

Use `position: fixed; inset: 0` instead of `100vh` / `100dvh`. See commit `07acaf1`.

---

## Security baselines

- **Firewall (ufw)**: only ports 22, 80, 443 open
- **Auto security updates**: `unattended-upgrades` enabled (kernel + critical patches only, no automatic reboots)
- **TLS**: Let's Encrypt cert, HSTS via Next.js `next.config.js` `headers()` (2yr, preload)
- **HTTP→HTTPS redirect**: nginx auto-rewrites all port 80 traffic
- **Service-role key**: stored only in `.env.local` (mode 600, deploy:deploy). Never logged, never sent to client.
- **SSH**: pubkey only, password auth disabled (Hetzner default)

---

## Costs

| Item | Cost |
|------|------|
| Hetzner CPX22 (2 vCPU / 4 GB / 80 GB) | $10.09/mo |
| ahost.uz domain (already paid) | — |
| Let's Encrypt TLS | $0 |
| Supabase (existing project) | (separate billing) |
| GitHub (private repo) | $0 |
| **Total recurring for hosting** | **~$10/mo flat** |

No per-deploy, per-bandwidth, or per-function costs. The 20 TB monthly bandwidth allowance is well beyond current traffic.

---

## Migration history

- **2026-05-09** Migrated off Vercel due to overdue billing. Provisioned CPX22, set up nginx + Let's Encrypt, cut DNS at ahost.uz, applied RLS policies, configured Supabase Google OAuth allowlist.

## Out-of-scope (deliberately not configured)

- **Preview deploys per PR** — single prod server only. For staging, provision a second VPS or use a `dev` branch on the same box behind a different port.
- **Automated rollback on health-check failure** — manual rollback only.
- **Off-server backups** — Supabase has its own backups for the DB. Code is in Git. Server itself isn't backed up; if the VPS dies, redeploy from scratch (15 min).
- **Cloudflare CDN in front** — not needed at current traffic. Could add later if global latency becomes a concern.
