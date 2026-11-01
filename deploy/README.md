# Deploying Duffle to a VPS

This sets up `https://duffle.tomrossner.dev` on one Ubuntu VPS (Hostinger KVM, Ubuntu 22.04 or 24.04): nginx in front, the app on `127.0.0.1:3000` under systemd, Postgres on localhost, and uploads on disk.

```
/srv/duffle/
  releases/<timestamp>/   one checkout per deploy
  current -> releases/…   what systemd runs
  shared/.env             production settings
  shared/uploads/         user images (UPLOADS_DIR)
  backups/                nightly database and upload backups
  deploy.sh, backup.sh
```

## 1. DNS

Add an `A` record for `duffle` in the `tomrossner.dev` zone pointing to the VPS IPv4 address (and `AAAA` for IPv6 if you use it). Wait until `dig +short duffle.tomrossner.dev` returns the VPS address.

## 2. Packages (as root)

```bash
apt update && apt upgrade -y
apt install -y git curl nginx postgresql certbot python3-certbot-nginx ufw
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

Postgres listens on localhost only by default. Keep it that way, and don't open port 3000 or 5432 in the firewall.

## 3. Database

```bash
DB_PASSWORD="$(openssl rand -hex 24)"; echo "$DB_PASSWORD"
sudo -u postgres psql -c "CREATE ROLE duffle LOGIN PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE duffle OWNER duffle;"
```

## 4. App user and folders

```bash
useradd --system --create-home --home-dir /srv/duffle --shell /bin/bash duffle
sudo -u duffle mkdir -p /srv/duffle/{releases,shared/uploads,backups}
```

Get the deploy files from the repo:

```bash
git clone --depth 1 https://github.com/TomRossner/duffle.git /tmp/duffle
install -o duffle -g duffle -m 755 /tmp/duffle/deploy/deploy.sh /tmp/duffle/deploy/backup.sh /srv/duffle/
```

Let the deploy script restart the service without a password:

```bash
echo 'duffle ALL=(root) NOPASSWD: /usr/bin/systemctl restart duffle' > /etc/sudoers.d/duffle
chmod 440 /etc/sudoers.d/duffle
```

## 5. Settings

Copy `/tmp/duffle/deploy/env.production.example` to `/srv/duffle/shared/.env` and fill it in:

- `DATABASE_URL` with the password from step 3
- `AUTH_SECRET`: `openssl rand -base64 33`
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: `openssl rand -base64 32`
- `SMTP_PASSWORD`: your Resend API key, and `SMTP_FROM` on a domain verified in Resend
- Google and Maps keys

```bash
chown duffle:duffle /srv/duffle/shared/.env && chmod 600 /srv/duffle/shared/.env
```

In Google Cloud, add `https://duffle.tomrossner.dev/api/auth/callback/google` as an authorized redirect URI, and allow `duffle.tomrossner.dev/*` on the Maps key.

## 6. First release and service

```bash
cp /tmp/duffle/deploy/duffle.service /etc/systemd/system/duffle.service
systemctl daemon-reload
systemctl enable duffle
sudo -u duffle /srv/duffle/deploy.sh
```

The first run builds, applies all migrations, starts the service, and waits for `/api/health`.

## 7. nginx and HTTPS

```bash
cp /tmp/duffle/deploy/nginx/duffle.tomrossner.dev.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/duffle.tomrossner.dev.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d duffle.tomrossner.dev --redirect
```

Certbot adds the certificate and the HTTP to HTTPS redirect, and renews it automatically.

## 8. Backups

```bash
sudo -u duffle crontab -e
# 15 3 * * * /srv/duffle/backup.sh >> /srv/duffle/backups/backup.log 2>&1
```

Backups on the same disk don't survive losing the VPS. Turn on Hostinger's VPS backups or copy `/srv/duffle/backups` somewhere else.

Restore:

```bash
pg_restore --clean --no-owner --dbname="$DATABASE_URL" /srv/duffle/backups/db-<stamp>.dump
tar -xzf /srv/duffle/backups/uploads-<stamp>.tar.gz -C /srv/duffle/shared
```

## Deploying updates

Push to `master`, then on the VPS:

```bash
sudo -u duffle /srv/duffle/deploy.sh
```

If the new release fails its health check, the script switches back to the previous release. Database migrations are not reverted, so keep migrations backward compatible.

## Checking on it

```bash
systemctl status duffle
journalctl -u duffle -f
curl -s https://duffle.tomrossner.dev/api/health
```
