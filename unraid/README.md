# Unraid Template Assets

This directory contains assets for the Unraid Docker template.

## Icon

The `icon.png` file should be a 512x512 PNG image representing the LuvUMore application.

For now, you can:
1. Use any heart icon from https://www.flaticon.com or similar
2. Create a custom icon with a heart symbol
3. Leave it as-is and Unraid will use a default Docker icon

To add a custom icon:
1. Replace `icon.png` with your 512x512 PNG image
2. Commit and push to the repository
3. The Unraid template will automatically use it

## Template

The `luvumore.xml` file is the Unraid Docker template that defines:
- Container configuration
- Environment variables
- Port mappings
- Volume mounts
- Default values

This template allows users to easily deploy LuvUMore on Unraid servers.
