#!/usr/bin/env bash
# Build a new release on the VPS, switch to it, and roll back if it fails the health check.
# Run as the duffle user:  /srv/duffle/deploy.sh   (optionally BRANCH=some-branch)
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/duffle}"
REPO="${REPO:-https://github.com/TomRossner/duffle.git}"
BRANCH="${BRANCH:-master}"
PORT="${PORT:-3000}"
KEEP="${KEEP:-5}"

release="$APP_DIR/releases/$(date -u +%Y%m%d%H%M%S)"
previous="$(readlink -f "$APP_DIR/current" 2>/dev/null || true)"

echo "==> Cloning $BRANCH into $release"
git clone --quiet --depth 1 --branch "$BRANCH" "$REPO" "$release"
ln -sfn "$APP_DIR/shared/.env" "$release/.env"

cd "$release"
set -a
# shellcheck disable=SC1091
. "$APP_DIR/shared/.env"
set +a

echo "==> Installing dependencies"
npm ci --no-audit --no-fund
npx prisma generate

echo "==> Applying migrations and building"
NODE_ENV=production npm run build

echo "==> Switching to the new release"
ln -sfn "$release" "$APP_DIR/current.tmp"
mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"
sudo /usr/bin/systemctl restart duffle

echo "==> Waiting for /api/health"
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    echo "==> Live: $(basename "$release")"
    # Keep the newest $KEEP releases.
    ls -1dt "$APP_DIR"/releases/*/ | tail -n +"$((KEEP + 1))" | xargs -r rm -rf
    exit 0
  fi
  sleep 2
done

echo "!! Health check failed." >&2
if [ -n "$previous" ] && [ -d "$previous" ]; then
  echo "!! Rolling back to $(basename "$previous"). Database migrations are not reverted." >&2
  ln -sfn "$previous" "$APP_DIR/current.tmp"
  mv -Tf "$APP_DIR/current.tmp" "$APP_DIR/current"
  sudo /usr/bin/systemctl restart duffle
fi
echo "!! Logs: journalctl -u duffle -n 100" >&2
exit 1
