# LuvUMore - Unraid Deployment Guide

This guide will help you deploy LuvUMore on your Unraid server using Docker.

## Prerequisites

- Unraid server (version 6.9+ recommended)
- Docker service enabled on Unraid
- Basic knowledge of Unraid's Docker interface

## Deployment Methods

You have two options for deploying LuvUMore on Unraid:

### Method 1: Using GitHub Container Registry (Recommended)

This method pulls pre-built images from GitHub Container Registry.

### Method 2: Building Locally from Source

This method builds the Docker image directly on your Unraid server.

---

## Method 1: Using GitHub Container Registry (Recommended)

### Step 1: Add Docker Container via Unraid WebUI

1. Log in to your Unraid server's web interface
2. Navigate to **Docker** tab
3. Click **Add Container** at the bottom
4. Fill in the following settings:

#### Basic Settings
- **Name**: `luvumore`
- **Repository**: `ghcr.io/nickdastley/luvumore:latest`
- **Network Type**: `Bridge`
- **Console shell command**: `sh`

#### Port Mappings
Click **Add another Path, Port, Variable, Label or Device**

- **Config Type**: `Port`
- **Name**: `WebUI`
- **Container Port**: `3000`
- **Host Port**: `3000` (or any available port you prefer)
- **Connection Type**: `TCP`

#### Volume Mappings
Click **Add another Path, Port, Variable, Label or Device**

- **Config Type**: `Path`
- **Name**: `AppData`
- **Container Path**: `/data`
- **Host Path**: `/mnt/user/appdata/luvumore`
- **Access Mode**: `Read/Write`

#### Environment Variables

Add the following variables (Click **Add another Path, Port, Variable, Label or Device** for each):

1. **Partner A Name**
   - **Config Type**: `Variable`
   - **Name**: `PARTNER_A_NAME`
   - **Key**: `PARTNER_A_NAME`
   - **Value**: `Nico` (or your first partner's name)

2. **Partner B Name**
   - **Config Type**: `Variable`
   - **Name**: `PARTNER_B_NAME`
   - **Key**: `PARTNER_B_NAME`
   - **Value**: `Nena` (or your second partner's name)

3. **Relationship Start Date**
   - **Config Type**: `Variable`
   - **Name**: `RELATIONSHIP_START_DATE`
   - **Key**: `RELATIONSHIP_START_DATE`
   - **Value**: `2021-11-12` (use format YYYY-MM-DD)

4. **Timezone**
   - **Config Type**: `Variable`
   - **Name**: `TZ`
   - **Key**: `TZ`
   - **Value**: `Europe/Berlin` (or your timezone in IANA format)

5. **Database Path** (Advanced - usually keep default)
   - **Config Type**: `Variable`
   - **Name**: `DB_PATH`
   - **Key**: `DB_PATH`
   - **Value**: `/data/app.db`

6. **Port** (Advanced - usually keep default)
   - **Config Type**: `Variable`
   - **Name**: `PORT`
   - **Key**: `PORT`
   - **Value**: `3000`

### Step 2: Apply and Start

1. Click **Apply** at the bottom
2. Unraid will pull the image and start the container
3. Wait for the container to start (check the Docker tab)

### Step 3: Access Your Application

1. Once the container is running, click the container icon
2. Click **WebUI** or navigate to `http://YOUR-UNRAID-IP:3000`
3. You should see the LuvUMore interface with your partner names

---

## Method 2: Building Locally from Source

### Step 1: Prepare the Source Code

1. SSH into your Unraid server or use the terminal
2. Navigate to a temporary directory:
   ```bash
   cd /tmp
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/NickDastley/LuvUMore.git
   cd LuvUMore
   ```

4. Create `.env` file from example:
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

### Step 2: Build the Docker Image

```bash
docker build -t luvumore:latest .
```

### Step 3: Create docker-compose.yml or Use Unraid UI

#### Option A: Using docker-compose

1. Ensure `.env` file is configured
2. Run:
   ```bash
   docker-compose up -d
   ```

#### Option B: Using Unraid Docker UI

Follow the same steps as Method 1, but use:
- **Repository**: `luvumore:latest` (your local image)

---

## Post-Deployment Configuration

### Setting Up Reverse Proxy (Optional)

If you want to access LuvUMore via a domain name with HTTPS:

1. Install **Nginx Proxy Manager** or **Swag** from Community Applications
2. Configure a proxy host pointing to `http://unraid-ip:3000`
3. Set up SSL certificate (Let's Encrypt)
4. Add authentication if desired (Basic Auth, OAuth, etc.)

### Example Nginx Proxy Manager Setup:

1. **Domain Names**: `luvumore.yourdomain.com`
2. **Scheme**: `http`
3. **Forward Hostname/IP**: Your Unraid server IP
4. **Forward Port**: `3000`
5. **Enable SSL**: Yes (Request Let's Encrypt certificate)
6. **Force SSL**: Yes
7. **Access List** (Optional): Add Basic Authentication for security

---

## Backup and Restore

### Backup

Your data is stored in `/mnt/user/appdata/luvumore/app.db`

To backup:
```bash
cp /mnt/user/appdata/luvumore/app.db /mnt/user/backups/luvumore_backup_$(date +%Y%m%d).db
```

Or use Unraid's **CA Backup/Restore Appdata** plugin.

### Restore

To restore from backup:
```bash
docker stop luvumore
cp /mnt/user/backups/luvumore_backup_YYYYMMDD.db /mnt/user/appdata/luvumore/app.db
docker start luvumore
```

---

## Updating

### Method 1 (GHCR Images):

1. Go to Docker tab in Unraid
2. Click on the LuvUMore container
3. Click **Force Update**
4. Wait for the new image to download
5. Container will restart automatically

### Method 2 (Local Build):

```bash
cd /tmp/LuvUMore
git pull
docker build -t luvumore:latest .
docker restart luvumore
```

---

## Troubleshooting

### Container won't start

1. Check logs: Docker tab → LuvUMore → **Logs**
2. Verify all environment variables are set correctly
3. Ensure `/mnt/user/appdata/luvumore` directory exists and has correct permissions

### Permission issues

If you see database permission errors:

```bash
chown -R 1000:1000 /mnt/user/appdata/luvumore
```

### Port already in use

If port 3000 is already in use:
1. Change the **Host Port** in Unraid Docker settings to another port (e.g., 3001)
2. Access via `http://unraid-ip:3001`

### Database is locked

This usually happens if the container was forcefully stopped:

```bash
docker stop luvumore
rm /mnt/user/appdata/luvumore/app.db-shm
rm /mnt/user/appdata/luvumore/app.db-wal
docker start luvumore
```

### Health check failing

1. Check if the application is responding: `curl http://localhost:3000/health`
2. If no response, check application logs for errors
3. Verify all dependencies are installed (they should be in the Docker image)

---

## Advanced Configuration

### Custom Port

To change the internal application port (not recommended):

1. Set environment variable `PORT` to desired port
2. Update the **Container Port** mapping to match
3. Update health check if customized

### Multiple Instances

To run multiple instances (e.g., for multiple couples):

1. Create separate containers with different:
   - Container names (`luvumore-couple1`, `luvumore-couple2`)
   - Host ports (`3000`, `3001`)
   - AppData paths (`/mnt/user/appdata/luvumore-couple1`, `/mnt/user/appdata/luvumore-couple2`)
   - Environment variables (different names, dates)

---

## Security Considerations

⚠️ **Important**: This application has no built-in authentication!

**Recommendations:**

1. **Use a reverse proxy with authentication** (Nginx Proxy Manager, Authelia, etc.)
2. **Keep it on your local network** - Don't expose directly to the internet
3. **Use HTTPS** via reverse proxy
4. **Regular backups** of your database
5. **Update regularly** to get security patches

---

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/NickDastley/LuvUMore/issues
- Repository: https://github.com/NickDastley/LuvUMore

---

## Common Timezone Values

- **Europe/Berlin** - Germany
- **Europe/London** - UK
- **America/New_York** - US Eastern
- **America/Los_Angeles** - US Pacific
- **America/Chicago** - US Central
- **Asia/Tokyo** - Japan
- **Australia/Sydney** - Australia

Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
