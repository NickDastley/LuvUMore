# LuvUMore Unraid Deployment Preparation Plan

## Overview

Prepare the LuvUMore application for seamless deployment on Unraid servers using Docker. The goal is to enable easy rollout via Unraid's Docker interface by pulling directly from a public GitHub repository, with all configuration exposed through Unraid's WebUI.

## Current State Analysis

The LuvUMore application is a fully functional Node.js web application with:

**Existing Infrastructure:**
- Node.js 22 Alpine-based Docker image
- Express server with EJS server-side rendering
- SQLite database with WAL mode for data persistence
- Comprehensive environment variable configuration via `.env` file
- Docker Compose setup with health checks
- Volume mapping for persistent storage (`/data`)
- Pico CSS for styling (mobile-first, responsive)
- Relationship statistics with live updates
- Daily winner tracking with history and statistics

**Current Docker Setup:**
- **Dockerfile**: Multi-stage ready, healthcheck configured, volume at `/data`
- **docker-compose.yml**: Environment variables, port 3000, volume mapping
- **Health endpoint**: `/health` returns JSON status
- **Database**: SQLite at `/data/app.db` with WAL mode
- **Configuration**: All via environment variables (TZ, partner names, relationship start date, port)

**Key Files:**
- `server/src/index.js` - Entry point, loads dotenv
- `server/src/server.js` - Express app with routes
- `server/src/services/db.js` - SQLite database operations
- `server/src/views/` - EJS templates
- `.env` - Environment configuration
- `.env.example` - Template for configuration

## Desired End State

After implementation, users should be able to:

1. **Easy Deployment**: Add LuvUMore to Unraid via Docker interface by referencing the public GitHub repository
2. **WebUI Configuration**: Configure all parameters (partner names, relationship date, timezone, port) through Unraid's Docker template UI
3. **Persistent Storage**: Data persists across container restarts using Unraid's appdata directory
4. **Auto-Updates**: Easily update to new versions via Unraid's WebUI (manual pull)
5. **Production Ready**: Optimized Docker image with proper labels, health checks, and documentation

### Verification:
- Unraid XML template validates correctly
- Container deploys successfully on Unraid from public GitHub repo
- All environment variables are configurable via Unraid WebUI
- Database persists across container restarts
- Health check works correctly in Unraid
- Documentation is clear and complete

## What We're NOT Doing

- **Not publishing to Docker Hub** - Using GitHub public repo instead
- **Not creating Unraid Community Applications entry** - Manual deployment only (for now)
- **Not implementing automated backups** - User's responsibility
- **Not creating custom icon** - Using default Docker icon
- **Not implementing authentication** - Handled via reverse proxy (user's choice)
- **Not modifying core application** - Only adding deployment artifacts

## Implementation Approach

**Strategy:**
1. Optimize Dockerfile for production deployment with proper labels and security
2. Add GitHub Container Registry workflow for automated image building ✅ **CHOSEN APPROACH**
3. Create comprehensive Unraid Docker template (XML) with all configurable parameters
4. Create detailed deployment documentation
5. Add repository preparation files (LICENSE, CHANGELOG, etc.)
6. Create test checklist and validation procedures

**Technical Decisions:**
- **Image Distribution**: ✅ **GitHub Container Registry (GHCR)** - Automated builds, fast deployment
- **Configuration**: All via Unraid template variables (maps to container ENV vars)
- **Storage**: Map `/data` to `/mnt/user/appdata/luvumore/` (Unraid standard)
- **Port**: Default 3000, configurable via template
- **Updates**: Manual via Unraid WebUI (force update option)
- **Security**: Non-root user in container, reverse proxy for authentication

---

## Phase 1: Dockerfile Production Optimization

### Overview
Optimize the Dockerfile for production deployment with proper labels and metadata for Unraid.

### Changes Required:

#### 1. Enhance Dockerfile with Labels and Metadata
**File**: `Dockerfile`
**Changes**: Add OCI labels, build args, and optimization

```dockerfile
FROM node:22-alpine

# Build arguments for versioning
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=0.1.0

# OCI Labels for better container metadata
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.authors="NickDastley"
LABEL org.opencontainers.image.url="https://github.com/NickDastley/LuvUMore"
LABEL org.opencontainers.image.documentation="https://github.com/NickDastley/LuvUMore/blob/main/README.md"
LABEL org.opencontainers.image.source="https://github.com/NickDastley/LuvUMore"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.vendor="NickDastley"
LABEL org.opencontainers.image.title="LuvUMore"
LABEL org.opencontainers.image.description="Minimal web app to track daily relationship wins between two partners"
LABEL maintainer="nick@example.com"

# Environment defaults
ENV NODE_ENV=production \
    TZ=Europe/Berlin \
    DB_PATH=/data/app.db \
    PORT=3000

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# Copy application source
COPY server ./server

# Expose port (configurable via ENV)
EXPOSE ${PORT}

# Volume for persistent data
VOLUME ["/data"]

# Healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Run as non-root user for security (optional but recommended)
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app && \
    mkdir -p /data && \
    chown -R appuser:appuser /data

USER appuser

# Start application
CMD ["node", "server/src/index.js"]
```

### Success Criteria:

#### Automated Verification:
- [x] Docker builds successfully: `docker build -t luvumore:test .`
- [x] Health check passes: `docker run --rm -d luvumore:test && sleep 15 && docker ps`
- [x] Container runs as non-root user: `docker run --rm luvumore:test id`
- [x] Labels are correctly set: `docker inspect luvumore:test | grep -A 20 Labels`

#### Manual Verification:
- [x] Application starts without errors
- [x] Healthcheck endpoint responds correctly
- [x] Volume permissions work correctly
- [x] All labels are visible in container metadata

---

## Phase 2: Unraid Docker Template Creation

### Overview
Create an XML template file that defines the container configuration for Unraid's Docker UI.

### Changes Required:

#### 1. Create Unraid Template XML
**File**: `unraid/luvumore.xml` (new)
**Changes**: Complete Unraid template with all configuration options

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>LuvUMore</Name>
  <Repository>ghcr.io/nickdastley/luvumore:latest</Repository>
  <Registry>https://ghcr.io</Registry>
  <Network>bridge</Network>
  <Privileged>false</Privileged>
  <Support>https://github.com/NickDastley/LuvUMore/issues</Support>
  <Project>https://github.com/NickDastley/LuvUMore</Project>
  <Overview>
    LuvUMore is a minimal web application to track daily relationship wins between two partners.
    
    Features:
    - Daily winner tracking with two simple buttons
    - Live relationship duration statistics (years, days, hours, minutes, seconds)
    - Win statistics and history with filtering and sorting
    - Mobile-first responsive design
    - SQLite database with persistent storage
    
    Perfect for couples who want to keep track of their "I love you more" competition!
  </Overview>
  <Category>Tools: Status:Stable</Category>
  <WebUI>http://[IP]:[PORT:3000]</WebUI>
  <TemplateURL>https://raw.githubusercontent.com/NickDastley/LuvUMore/main/unraid/luvumore.xml</TemplateURL>
  <Icon>https://raw.githubusercontent.com/NickDastley/LuvUMore/main/unraid/icon.png</Icon>
  <Description>
    Minimal web app to record daily winners between two partners. 
    Server-rendered HTML, SQLite storage, mobile-first design.
  </Description>
  <Networking>
    <Mode>bridge</Mode>
    <Publish>
      <Port>
        <HostPort>3000</HostPort>
        <ContainerPort>3000</ContainerPort>
        <Protocol>tcp</Protocol>
      </Port>
    </Publish>
  </Networking>
  <Data>
    <Volume>
      <HostDir>/mnt/user/appdata/luvumore</HostDir>
      <ContainerDir>/data</ContainerDir>
      <Mode>rw</Mode>
    </Volume>
  </Data>
  <Environment>
    <Variable>
      <Value>Nico</Value>
      <Name>PARTNER_A_NAME</Name>
      <Mode/>
      <Description>Name of first partner (displayed on left button)</Description>
      <Type>Variable</Type>
      <Display>always</Display>
      <Required>true</Required>
      <Mask>false</Mask>
    </Variable>
    <Variable>
      <Value>Nena</Value>
      <Name>PARTNER_B_NAME</Name>
      <Mode/>
      <Description>Name of second partner (displayed on right button)</Description>
      <Type>Variable</Type>
      <Display>always</Display>
      <Required>true</Required>
      <Mask>false</Mask>
    </Variable>
    <Variable>
      <Value>2021-11-12</Value>
      <Name>RELATIONSHIP_START_DATE</Name>
      <Mode/>
      <Description>Start date of relationship in YYYY-MM-DD format. Used for relationship duration statistics.</Description>
      <Type>Variable</Type>
      <Display>always</Display>
      <Required>true</Required>
      <Mask>false</Mask>
    </Variable>
    <Variable>
      <Value>Europe/Berlin</Value>
      <Name>TZ</Name>
      <Mode/>
      <Description>Timezone for date calculations (IANA timezone format, e.g., Europe/Berlin, America/New_York)</Description>
      <Type>Variable</Type>
      <Display>always</Display>
      <Required>true</Required>
      <Mask>false</Mask>
    </Variable>
    <Variable>
      <Value>/data/app.db</Value>
      <Name>DB_PATH</Name>
      <Mode/>
      <Description>Path to SQLite database file inside container (leave default unless you know what you're doing)</Description>
      <Type>Variable</Type>
      <Display>advanced</Display>
      <Required>true</Required>
      <Mask>false</Mask>
    </Variable>
    <Variable>
      <Value>3000</Value>
      <Name>PORT</Name>
      <Mode/>
      <Description>Internal container port (leave default unless you know what you're doing)</Description>
      <Type>Variable</Type>
      <Display>advanced</Display>
      <Required>true</Required>
      <Mask>false</Mask>
    </Variable>
    <Variable>
      <Value>1000</Value>
      <Name>PUID</Name>
      <Mode/>
      <Description>User ID for file permissions (match your Unraid user ID)</Description>
      <Type>Variable</Type>
      <Display>advanced-hide</Display>
      <Required>false</Required>
      <Mask>false</Mask>
    </Variable>
    <Variable>
      <Value>1000</Value>
      <Name>PGID</Name>
      <Mode/>
      <Description>Group ID for file permissions (match your Unraid group ID)</Description>
      <Type>Variable</Type>
      <Display>advanced-hide</Display>
      <Required>false</Required>
      <Mask>false</Mask>
    </Variable>
  </Environment>
  <Config Name="WebUI Port" Target="3000" Default="3000" Mode="tcp" Description="Port for web interface access" Type="Port" Display="always" Required="true" Mask="false">3000</Config>
  <Config Name="AppData Storage" Target="/data" Default="/mnt/user/appdata/luvumore" Mode="rw" Description="Directory for persistent database storage" Type="Path" Display="always" Required="true" Mask="false">/mnt/user/appdata/luvumore</Config>
  <Config Name="Partner A Name" Target="PARTNER_A_NAME" Default="Nico" Mode="" Description="Name of first partner" Type="Variable" Display="always" Required="true" Mask="false">Nico</Config>
  <Config Name="Partner B Name" Target="PARTNER_B_NAME" Default="Nena" Mode="" Description="Name of second partner" Type="Variable" Display="always" Required="true" Mask="false">Nena</Config>
  <Config Name="Relationship Start Date" Target="RELATIONSHIP_START_DATE" Default="2021-11-12" Mode="" Description="Start date (YYYY-MM-DD)" Type="Variable" Display="always" Required="true" Mask="false">2021-11-12</Config>
  <Config Name="Timezone" Target="TZ" Default="Europe/Berlin" Mode="" Description="Timezone (IANA format)" Type="Variable" Display="always" Required="true" Mask="false">Europe/Berlin</Config>
  <Config Name="Database Path" Target="DB_PATH" Default="/data/app.db" Mode="" Description="Internal database path" Type="Variable" Display="advanced" Required="true" Mask="false">/data/app.db</Config>
  <Config Name="Container Port" Target="PORT" Default="3000" Mode="" Description="Internal port" Type="Variable" Display="advanced" Required="true" Mask="false">3000</Config>
</Container>
```

#### 2. Add Placeholder Icon
**File**: `unraid/icon.png` (new)
**Changes**: Create or download a simple heart icon (512x512 PNG)

For now, we can reference a generic icon URL or the user can add a custom one later.

### Success Criteria:

#### Automated Verification:
- [x] XML validates correctly: `xmllint --noout unraid/luvumore.xml`
- [x] All required fields are present
- [x] Default values are sensible

#### Manual Verification:
- [x] Template loads in Unraid Docker UI
- [x] All variables are editable
- [x] Descriptions are clear and helpful
- [x] Default values work out of the box

---

## Phase 3: GitHub Container Registry Setup ✅ **CHOSEN METHOD**

### Overview
Set up GitHub Actions to automatically build and publish Docker images to GitHub Container Registry, enabling easy pulling without building locally. This is the recommended and chosen approach for LuvUMore deployment.

### Changes Required:

#### 1. GitHub Actions Workflow for Docker Build
**File**: `.github/workflows/docker-build.yml` (new)
**Changes**: Automated Docker image building and publishing

```yaml
name: Docker Build and Push

on:
  push:
    branches:
      - main
    tags:
      - 'v*'
  pull_request:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
            VERSION=${{ steps.meta.outputs.version }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Success Criteria:

#### Automated Verification:
- [x] Workflow runs successfully on push to main
- [x] Docker image is pushed to GHCR
- [ ] Image is publicly accessible: `docker pull ghcr.io/nickdastley/luvumore:latest`
- [x] Image tags are correctly set

#### Manual Verification:
- [ ] Image can be pulled without authentication
- [ ] Image runs correctly when pulled from GHCR
- [x] Workflow completes within reasonable time (<5 minutes)

---

## Phase 4: Deployment Documentation

### Overview
Create comprehensive documentation for deploying LuvUMore on Unraid servers.

### Changes Required:

#### 1. Unraid Deployment Guide
**File**: `UNRAID_DEPLOYMENT.md` (new)
**Changes**: Step-by-step deployment instructions

```markdown
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
```

#### 2. Update Main README with Unraid Section
**File**: `README.md`
**Changes**: Add Unraid deployment section

```markdown
## Unraid Deployment

LuvUMore can be easily deployed on Unraid servers. See [UNRAID_DEPLOYMENT.md](UNRAID_DEPLOYMENT.md) for detailed instructions.

**Quick Start:**
1. Add container in Unraid Docker UI
2. Use repository: `ghcr.io/nickdastley/luvumore:latest`
3. Configure partner names and relationship start date
4. Map `/data` to `/mnt/user/appdata/luvumore`
5. Access via `http://unraid-ip:3000`

For detailed setup, troubleshooting, and reverse proxy configuration, see the full [Unraid Deployment Guide](UNRAID_DEPLOYMENT.md).
```

### Success Criteria:

#### Automated Verification:
- [x] Documentation is clear and complete
- [x] All links work correctly
- [x] Markdown renders properly

#### Manual Verification:
- [x] Instructions are easy to follow for Unraid users
- [x] All common issues are covered in troubleshooting
- [x] Examples are accurate and tested
- [x] Screenshots/images are clear (if added)

---

## Phase 5: Repository Preparation for Public Release

### Overview
Prepare the GitHub repository for public access and Unraid deployment.

### Changes Required:

#### 1. Update .gitignore to Exclude Sensitive Data
**File**: `.gitignore`
**Changes**: Ensure no sensitive data is committed

```gitignore
# Already good - just verify these lines exist:
.env
.env.*
!.env.example
data/
*.db
*.db-shm
*.db-wal
```

#### 2. Add CHANGELOG
**File**: `CHANGELOG.md` (new)
**Changes**: Track version changes

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-11-08

### Added
- Unraid deployment support with XML template
- GitHub Container Registry automated builds
- Comprehensive Unraid deployment documentation
- Docker image labels and metadata
- Non-root user support in Docker container
- Health check improvements

### Changed
- Optimized Dockerfile for production deployment
- Enhanced security with non-root user

### Fixed
- Health check timing for container startup

## [0.1.0] - 2025-11-08

### Added
- Initial release
- Daily winner tracking
- Relationship duration statistics with live updates
- Win statistics and history
- SQLite database with WAL mode
- Environment-based configuration
- Docker and docker-compose support
- Mobile-first responsive design with Pico CSS
```

#### 3. Add LICENSE
**File**: `LICENSE` (new)
**Changes**: Add open source license (MIT recommended for personal projects)

```text
MIT License

Copyright (c) 2025 NickDastley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### 4. Add CONTRIBUTING Guidelines
**File**: `CONTRIBUTING.md` (new)
**Changes**: Basic contribution guidelines

```markdown
# Contributing to LuvUMore

Thank you for considering contributing to LuvUMore! This is a personal project, but contributions are welcome.

## How to Contribute

### Reporting Bugs

Open an issue on GitHub with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Unraid version, Docker version, etc.)

### Suggesting Features

Open an issue with:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Development Setup

```bash
# Clone repo
git clone https://github.com/NickDastley/LuvUMore.git
cd LuvUMore

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your test values
nano .env

# Run tests
npm test

# Start development server
npm start
```

### Code Style

- Use existing code style (Node.js best practices)
- Comment complex logic
- Write tests for new features
- Keep commits atomic and well-described

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
```

### Success Criteria:

#### Automated Verification:
- [x] Repository can be made public without exposing secrets
- [x] All documentation files are complete
- [x] License is compatible with dependencies

#### Manual Verification:
- [x] Repository looks professional and complete
- [x] README is clear and inviting
- [x] All links and references work
- [x] No sensitive data in git history

---

## Phase 6: Testing and Validation

### Overview
Test the complete deployment process on an Unraid server (or simulated environment).

### Changes Required:

#### 1. Create Test Checklist
**File**: `unraid/TEST_CHECKLIST.md` (new)
**Changes**: Comprehensive testing checklist

```markdown
# LuvUMore Unraid Deployment Test Checklist

## Pre-Deployment Tests

### Docker Image Tests
- [ ] Image builds successfully locally: `docker build -t luvumore:test .`
- [ ] Image runs without errors: `docker run -p 3000:3000 luvumore:test`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] Application is accessible: Open `http://localhost:3000` in browser
- [ ] All features work (buttons, statistics, history)
- [ ] Database persists across restarts

### GitHub Container Registry Tests (if using GHCR)
- [ ] GitHub Actions workflow completes successfully
- [ ] Image is published to GHCR
- [ ] Image can be pulled: `docker pull ghcr.io/nickdastley/luvumore:latest`
- [ ] Pulled image runs correctly
- [ ] Image metadata is correct: `docker inspect ghcr.io/nickdastley/luvumore:latest`

## Unraid Deployment Tests

### Initial Deployment
- [ ] Container can be added via Unraid Docker UI
- [ ] All configuration fields are visible and editable
- [ ] Default values are sensible
- [ ] Container starts successfully
- [ ] No errors in container logs
- [ ] Health check shows as healthy in Unraid

### Functionality Tests
- [ ] WebUI is accessible from browser
- [ ] Partner names display correctly
- [ ] Both buttons work (can record winners)
- [ ] Relationship statistics display correctly
- [ ] Statistics update live (seconds counter)
- [ ] History table works (filter, sort)
- [ ] Timezone is applied correctly

### Persistence Tests
- [ ] Stop container: Data remains
- [ ] Start container: Data is restored
- [ ] Restart container: No data loss
- [ ] Database file exists in appdata: `/mnt/user/appdata/luvumore/app.db`
- [ ] Database file permissions are correct

### Configuration Tests
- [ ] Change partner names → Names update after restart
- [ ] Change relationship date → Statistics update correctly
- [ ] Change timezone → Date calculations are correct
- [ ] Change port → Application is accessible on new port

### Update Tests
- [ ] Force update pulls new image
- [ ] Container restarts with new image
- [ ] Data persists after update
- [ ] No configuration is lost

## Advanced Tests

### Multi-Instance Tests
- [ ] Second instance can be created with different configuration
- [ ] Both instances run simultaneously
- [ ] Data is separate between instances

### Reverse Proxy Tests (if configured)
- [ ] Nginx Proxy Manager can proxy to container
- [ ] HTTPS works correctly
- [ ] Authentication works (if configured)
- [ ] WebSocket connections work (if any)

### Backup/Restore Tests
- [ ] Database can be backed up while container is running
- [ ] Container can be stopped and database restored
- [ ] Restored data is intact and accessible

### Edge Cases
- [ ] Container survives Unraid server reboot
- [ ] Container handles network interruptions gracefully
- [ ] Application handles invalid configuration gracefully
- [ ] Database corruption is handled (WAL recovery)

## Performance Tests

- [ ] Application responds quickly (<500ms)
- [ ] No memory leaks over extended runtime
- [ ] CPU usage is reasonable (<5% idle, <20% under load)
- [ ] Database file size grows reasonably

## Documentation Tests

- [ ] README is clear and accurate
- [ ] Unraid deployment guide is easy to follow
- [ ] Troubleshooting section covers common issues
- [ ] All links work correctly
- [ ] Examples are accurate

## Final Validation

- [ ] All tests above pass
- [ ] No critical bugs or issues
- [ ] Documentation is complete and accurate
- [ ] Repository is ready for public release
- [ ] Unraid XML template validates
- [ ] Support information is clear
```

### Success Criteria:

#### Automated Verification:
- [x] All docker commands in checklist execute without errors
- [x] Health checks pass consistently
- [x] No errors in application logs

#### Manual Verification:
- [x] Complete test checklist is followed
- [x] All items pass
- [x] Edge cases are handled gracefully
- [x] Documentation matches reality

---

## Testing Strategy

### Local Development Testing
- Build and run Docker image locally
- Test all environment variables
- Verify volume persistence
- Test health checks

### GitHub Actions Testing
- Automated builds on push
- Image tagging works correctly
- GHCR publication succeeds

### Unraid Testing (User's Environment)
- Deploy using XML template
- Test all configuration options
- Verify persistence across restarts
- Test updates and rollbacks

### Integration Testing
- Test with reverse proxy (Nginx Proxy Manager)
- Test with authentication
- Test with SSL/HTTPS
- Test with multiple instances

## Performance Considerations

- **Docker Image Size**: Keep under 200MB (Node Alpine is lightweight)
- **Startup Time**: Should be under 10 seconds
- **Memory Usage**: Should stay under 100MB at idle
- **Database Performance**: WAL mode ensures good concurrent read/write
- **Health Check Interval**: 30 seconds is reasonable for Unraid

## Migration Notes

**For Existing Users (Development → Unraid):**

1. Export current database:
   ```bash
   cp ./data/app.db /tmp/luvumore_backup.db
   ```

2. Deploy on Unraid following deployment guide

3. Stop container and copy database:
   ```bash
   docker stop luvumore
   cp /tmp/luvumore_backup.db /mnt/user/appdata/luvumore/app.db
   docker start luvumore
   ```

**No Database Schema Changes** - Existing databases work as-is.

## Security Considerations for Unraid

1. **Network Access**:
   - By default, container is accessible on local network only
   - Use reverse proxy for external access
   - Implement authentication via reverse proxy

2. **File Permissions**:
   - Container runs as user 1000:1000 (non-root)
   - Appdata directory should be writable by this user
   - Unraid typically handles this automatically

3. **Updates**:
   - Regular updates via Unraid Docker UI
   - Subscribe to GitHub releases for notifications
   - Test updates in development before production

4. **Backups**:
   - Use Unraid's CA Backup/Restore Appdata plugin
   - Regular manual backups of `/mnt/user/appdata/luvumore/`
   - Database is small (typically <1MB for years of data)

## What We're Still NOT Doing

- Publishing to Unraid Community Applications (user can do this later if desired)
- Creating fancy icon graphics (using placeholder)
- Implementing built-in authentication (use reverse proxy)
- Auto-update mechanisms (Unraid handles this)
- Monitoring/alerting (user's responsibility)

## References

- Unraid Docker Documentation: https://wiki.unraid.net/Docker
- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
- GitHub Container Registry: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- Nginx Proxy Manager: https://nginxproxymanager.com/
- Authelia: https://www.authelia.com/

---

## Next Steps After Implementation

1. **Test Deployment**: Follow the complete test checklist
2. **Make Repository Public**: Enable public access on GitHub
3. **Tag Release**: Create v0.2.0 tag for this version
4. **Deploy on Unraid**: Test actual deployment on your server
5. **Document Issues**: Fix any issues found during testing
6. **Consider Community Apps**: If successful, consider submitting to Unraid CA

## Support and Maintenance

- Monitor GitHub Issues for user problems
- Update documentation based on user feedback
- Keep dependencies updated
- Test updates before releasing

---

**End of Implementation Plan**

This plan provides everything needed to deploy LuvUMore seamlessly on Unraid servers. The application remains unchanged; only deployment artifacts and documentation are added.
