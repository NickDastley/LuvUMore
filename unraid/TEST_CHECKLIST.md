# LuvUMore Unraid Deployment Test Checklist

This checklist helps verify that LuvUMore is properly configured for Unraid deployment.

## Pre-Deployment Tests

### Docker Image Tests
- [ ] Image builds successfully locally: `docker build -t luvumore:test .`
- [ ] Image runs without errors: `docker run -p 3000:3000 luvumore:test`
- [ ] Health check passes: `curl http://localhost:3000/health`
- [ ] Application is accessible: Open `http://localhost:3000` in browser
- [ ] All features work (buttons, statistics, history)
- [ ] Database persists across restarts
- [ ] Container runs as non-root user: `docker run --rm luvumore:test id`
- [ ] Labels are correctly set: `docker inspect luvumore:test | grep -A 20 Labels`

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
- [ ] No WebSocket issues (if any)

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

## XML Template Validation

- [ ] XML validates correctly: `xmllint --noout unraid/luvumore.xml`
- [ ] All required fields are present
- [ ] Default values are sensible
- [ ] Descriptions are clear and helpful

## Final Validation

- [ ] All tests above pass
- [ ] No critical bugs or issues
- [ ] Documentation is complete and accurate
- [ ] Repository is ready for public release
- [ ] Unraid XML template validates
- [ ] Support information is clear

## Notes

Use this section to track any issues found during testing:

```
Issue: 
Status: 
Resolution: 

Issue: 
Status: 
Resolution: 
```

## Testing Commands Reference

### Local Docker Testing
```bash
# Build image
docker build -t luvumore:test .

# Run container
docker run -d -p 3000:3000 --name luvumore-test \
  -e PARTNER_A_NAME=Nico \
  -e PARTNER_B_NAME=Nena \
  -e RELATIONSHIP_START_DATE=2021-11-12 \
  -e TZ=Europe/Berlin \
  -v $(pwd)/data:/data \
  luvumore:test

# Check health
curl http://localhost:3000/health

# Check logs
docker logs luvumore-test

# Check user
docker exec luvumore-test id

# Inspect labels
docker inspect luvumore-test | grep -A 20 Labels

# Cleanup
docker stop luvumore-test
docker rm luvumore-test
```

### GHCR Testing
```bash
# Pull image
docker pull ghcr.io/nickdastley/luvumore:latest

# Run pulled image
docker run -d -p 3000:3000 --name luvumore-ghcr \
  -e PARTNER_A_NAME=Nico \
  -e PARTNER_B_NAME=Nena \
  -e RELATIONSHIP_START_DATE=2021-11-12 \
  -e TZ=Europe/Berlin \
  -v $(pwd)/data:/data \
  ghcr.io/nickdastley/luvumore:latest

# Cleanup
docker stop luvumore-ghcr
docker rm luvumore-ghcr
```

### XML Validation
```bash
# Install xmllint (if not available)
# Ubuntu/Debian: sudo apt-get install libxml2-utils
# MacOS: brew install libxml2

# Validate XML
xmllint --noout unraid/luvumore.xml
```
