# Batanes Niche Job Portal - Production Setup Runbook (Version 2)

This document is the **authoritative 19-step production deployment runbook** for the **Batanes Niche Job Portal (Version 2)**. It provides instructions for provisioning, configuring, securing, and operating the system in a production environment.

---

## Architecture Overview

- **Frontend**: Single Page Application compiled to static HTML5/CSS3/JS, served via Nginx with client-side route fallback and caching.
- **Backend Gateway**: Nginx reverse-proxies `/api/` and `/admin/` to Gunicorn/Uvicorn workers.
- **Backend API**: FastAPI running asynchronous Python 3.11 with SQLAlchemy 2.0.
- **Admin Portal**: Server-side rendered Jinja2 templates served directly by FastAPI under `/admin`.
- **Database**: PostgreSQL 16 with connection pooling and automated WAL archiving/backups.
- **Security Perimeter**: Non-root container users, SSL/TLS termination, strict CSP, CORS restrictions, rate limiting, and zero tech-jargon leakage.

---

## 19-Step Production Deployment Runbook

### Step 1: Server Provisioning & OS Hardening
1. Provision an Ubuntu 22.04 LTS or Debian 12 virtual machine (minimum 2 vCPU, 4GB RAM, 40GB SSD).
2. Update all system packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
3. Create a dedicated non-root deployer user:
   ```bash
   sudo adduser deployer
   sudo usermod -aG sudo deployer
   ```
4. Configure Uncomplicated Firewall (UFW):
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

### Step 2: Dependency Installation
Install Docker Engine, Docker Compose Plugin, and Git:
```bash
sudo apt install -y ca-certificates curl gnupg lsb-release git

# Docker official GPG key and repository
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker deployer
```

---

### Step 3: Git Repository Clone & Branch Verification
Clone the Version 2 repository to `/opt/batanes_niche`:
```bash
sudo mkdir -p /opt/batanes_niche
sudo chown deployer:deployer /opt/batanes_niche
cd /opt/batanes_niche
git clone https://github.com/YourOrg/Batanes_Niche.git .
git checkout main
```

---

### Step 4: Production Environment Configuration
Generate cryptographically strong secrets and configure `.env`:
```bash
# Generate 64-character hex secret
SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 24)

cat <<EOF > .env
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=${SECRET_KEY}
DATABASE_URL=postgresql+asyncpg://batanes_user:${POSTGRES_PASSWORD}@db:5432/batanes_niche
POSTGRES_DB=batanes_niche
POSTGRES_USER=batanes_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=https://batanesjobs.ph
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_BYTES=5242880
ALLOWED_FILE_EXTENSIONS=.pdf,.jpg,.jpeg,.png
PORT=8000
EOF

chmod 600 .env
```

---

### Step 5: Production Database Provisioning
The PostgreSQL service is orchestrated by `docker-compose.yml`. Ensure the persistence mount directory exists:
```bash
sudo mkdir -p /var/lib/docker-volumes/postgres_data
```

---

### Step 6: Persistent Storage & Upload Directories
Create host directory for uploaded resumes and profile photos with correct permissions:
```bash
sudo mkdir -p /opt/batanes_niche/uploads
sudo chown -R 1001:1001 /opt/batanes_niche/uploads
sudo chmod 750 /opt/batanes_niche/uploads
```

---

### Step 7: TLS/SSL Certificate Issuance
Obtain Let's Encrypt certificates using Certbot:
```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d batanesjobs.ph -d www.batanesjobs.ph
```
Set up automated renewal via cron (`sudo certbot renew --dry-run`).

---

### Step 8: Reverse Proxy & Gateway Configuration
Verify `docker/nginx.conf` contains the proper upstream proxy definitions, security headers, and client routing fallbacks. Ensure TLS certificates are linked into Nginx if terminating directly inside the frontend container.

---

### Step 9: Database Migrations Execution
Execute Alembic migrations to build the 12 approved tables:
```bash
docker compose run --rm backend alembic upgrade head
```

---

### Step 10: Initial Admin User Provisioning
Seed the authoritative system administrator account:
```bash
docker compose run --rm backend python -m app.commands.create_admin \
  --username admin \
  --email admin@batanesjobs.ph \
  --password "$(openssl rand -base64 16)"
```
Save the generated credentials securely in a team password manager.

---

### Step 11: Docker Image Build & Verification
Build all multi-stage production images:
```bash
docker compose build --no-cache
```
Verify images are built and tagged properly:
```bash
docker images | grep batanes
```

---

### Step 12: Container Orchestration Launch
Start the full stack in detached mode:
```bash
docker compose up -d
```
Verify running containers:
```bash
docker compose ps
```

---

### Step 13: Health Check Verification
Validate container health checks:
```bash
# Verify backend internal health
docker compose exec backend curl -f http://localhost:8000/health

# Verify frontend/nginx health
curl -f http://localhost/health
```

---

### Step 14: API Smoke Testing
Perform end-to-end smoke tests against the production endpoints:
```bash
# 1. Health endpoint
curl -i https://batanesjobs.ph/health

# 2. Public jobs list
curl -i https://batanesjobs.ph/api/v1/jobs

# 3. Recommendations check
curl -i https://batanesjobs.ph/api/v1/recommendations/jobs-ranked
```

---

### Step 15: Admin Portal Verification
1. Navigate to `https://batanesjobs.ph/admin/login` in your web browser.
2. Sign in with the credentials generated in Step 10.
3. Verify the server-rendered dashboard loads with audit logs, job approvals, and metrics.
4. Confirm session cookies are marked `HttpOnly; Secure; SameSite=Lax`.

---

### Step 16: Log Aggregation & Rotation
Configure Docker daemon log rotation in `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "5"
  }
}
```
Restart Docker daemon to apply:
```bash
sudo systemctl restart docker
docker compose up -d
```

---

### Step 17: Automated Database Backup
Create `/opt/batanes_niche/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/batanes_niche"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

docker compose exec -T db pg_dump -U batanes_user batanes_niche | gzip > "$FILENAME"
chmod 600 "$FILENAME"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -exec rm {} \;
```
Make executable and add to crontab:
```bash
chmod +x /opt/batanes_niche/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/batanes_niche/backup.sh") | crontab -
```

---

### Step 18: Monitoring & Alerting
- Configure external uptime monitoring (e.g., Uptime Kuma, Pingdom) targeting `https://batanesjobs.ph/health`.
- Set alert thresholds for HTTP 5xx error rates, response times > 1500ms, and container restarts.

---

### Step 19: Disaster Recovery & Rollback Procedure
If a deployment fails:
1. Revert Git commit:
   ```bash
   git checkout <PREVIOUS_COMMIT_TAG>
   ```
2. Re-run database downgrade if required:
   ```bash
   docker compose run --rm backend alembic downgrade -1
   ```
3. Rebuild and restart containers:
   ```bash
   docker compose build
   docker compose up -d
   ```
4. Restore database from backup if needed:
   ```bash
   gunzip < /var/backups/batanes_niche/db_backup_XXXX.sql.gz | docker compose exec -T db psql -U batanes_user -d batanes_niche
   ```
