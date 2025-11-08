# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-08

### Added
- Unraid deployment support with XML template
- GitHub Container Registry automated builds via GitHub Actions
- Comprehensive Unraid deployment documentation (UNRAID_DEPLOYMENT.md)
- Docker image OCI labels and metadata for better container identification
- Non-root user support in Docker container for enhanced security (UID/GID 1000)
- Health check improvements with configurable PORT environment variable
- Complete test checklist for Unraid deployment validation
- Docker entrypoint script to detect and report permission issues
- Automatic tagging strategy (latest, version tags, SHA tags)

### Changed
- Optimized Dockerfile for production deployment
- Enhanced security with non-root user using existing node user (UID/GID 1000)
- Updated health check start-period from 5s to 10s for better reliability
- Added build arguments for versioning (BUILD_DATE, VCS_REF, VERSION)
- Updated Unraid template to use :latest tag for automatic update detection

### Fixed
- Health check timing for container startup
- Volume permission handling with entrypoint script
- Clear error messages when /data directory is not writable
- Documentation for permission troubleshooting on Unraid

## [0.1.0] - 2025-11-08

### Added
- Initial release
- Daily winner tracking between two partners
- Relationship duration statistics with live updates
- Win statistics and history with filtering and sorting
- SQLite database with WAL mode for data persistence
- Environment-based configuration via .env file
- Docker and docker-compose support
- Mobile-first responsive design with Pico CSS
- Express server with EJS server-side rendering
- Health check endpoint for container monitoring

[0.2.0]: https://github.com/NickDastley/LuvUMore/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/NickDastley/LuvUMore/releases/tag/v0.1.0
