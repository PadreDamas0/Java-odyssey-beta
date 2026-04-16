# Deployment Guide

## Best Fit For The Current Build

This project should be deployed first on your own domain or subdomain with PHP and MySQL support.

Why:

- `index.html` contains PHP and requires authentication before the game loads.
- `.htaccess` maps `.html` files to PHP.
- The auth and save system uses PHP sessions and MySQL.

That means this is **not** a static HTML5 upload right now.

## Recommended Release Strategy

### 1. Main live version

Use your own hosting for the real game:

- Example: `play.yourdomain.com`
- Web server with PHP enabled
- MySQL or MariaDB database
- HTTPS enabled

This is the setup that matches the current codebase with the least risk.

### 2. Discovery version

Use game sites for exposure, not as the primary backend:

- Create an itch.io page that links to your live domain
- Or publish a separate demo build without account login and server-side saves

### 3. Portal version later

For portals like CrazyGames, prepare a separate portal-friendly build later:

- remove the PHP dependency from the playable bundle
- replace server auth with portal SDK or local save logic
- adapt persistence to the platform's supported save flow

## Hosting Requirements

Your hosting should support:

- PHP with PDO MySQL enabled
- Sessions
- MySQL or MariaDB
- `.htaccess` support if you want to keep the current `.html` file setup

If your host does **not** support `.htaccess` or PHP on `.html` files, the safer fallback is to rename the PHP-backed `.html` entry pages to `.php` and update links.

## Deployment Checklist

1. Buy or assign a domain or subdomain.
2. Choose hosting with PHP and MySQL support.
3. Upload the full project root, including `.htaccess`.
4. Create the database and user.
5. Copy `php/config.example.php` to `php/config.php` on the server and fill in the host, database name, username, and password from the hosting control panel.
6. For InfinityFree, import `php/schema.infinityfree.sql` into the already-created database. Do not import the local `CREATE DATABASE` statements from `php/schema.sql`.
7. Enable HTTPS before testing login.
8. Test register, login, logout, and save progress on the live URL.

## Current Code Areas That Affect Deployment

- `index.html` runs PHP before outputting the page.
- `.htaccess` treats `.html` files as PHP.
- `php/auth_check.php` uses PHP sessions.
- `php/db.php` connects to MySQL and stores player progress.
- `php/config.php` is an untracked deployment-only file for live database credentials.
- `js/auth.js` sends authenticated same-origin requests to the PHP endpoints.

## When A Game Portal Will Not Be Enough

A normal HTML5 portal upload is not enough for the current build if you need:

- user accounts
- PHP session login
- MySQL-backed progress saving
- same-origin authenticated requests

## Practical Recommendation

If you need one answer today: **own domain first, game sites second**.

Best setup for this project:

- main game on your own domain or school subdomain
- itch.io page for visibility
- portal submission later after making a separate static-friendly build
