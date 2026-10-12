# Survival Project Guestbook Worker

The public form accepts anonymous posts. Cloudflare D1 stores entries; only a valid Worker-issued admin token can reply to or delete them.

## Deployment

1. Install Wrangler and authenticate with the Cloudflare account that will own the database:

   ```powershell
   npx wrangler login
   ```

2. Create the D1 database and replace `database_id` in `wrangler.toml` with the ID Wrangler returns:

   ```powershell
   npx wrangler d1 create survival-project-guestbook
   ```

3. Initialize its schema:

   ```powershell
   npx wrangler d1 execute survival-project-guestbook --remote --file=./schema.sql
   ```

4. Add the admin password and a separate random session-signing secret. Wrangler prompts for each secret; do not commit either value. Use a password different from the public card-editor password, and a random session secret of at least 32 characters:

   ```powershell
   npx wrangler secret put GUESTBOOK_ADMIN_PASSWORD
   npx wrangler secret put GUESTBOOK_SESSION_SECRET
   ```

5. Deploy the Worker:

   ```powershell
   npx wrangler deploy
   ```

6. Copy the deployed `workers.dev` base URL into `../guestbook-config.js`, for example `https://survival-project-guestbook.<account>.workers.dev`.

`ALLOWED_ORIGINS` already permits the GitHub Pages origin and local port 8000. Update it if the site's origin or local port changes. The admin token remains in memory only and expires after eight hours by default.

## Tests

Run `npm test` from this directory. Tests use Node's built-in test runner and do not require Cloudflare credentials.
# Survival Project Guestbook Worker

The public form accepts anonymous posts. Cloudflare D1 stores entries; only a valid Worker-issued admin token can reply to or delete them.

## Deployment

1. Install Wrangler and authenticate with the Cloudflare account that will own the database:

   ```powershell
   npx wrangler login
   ```

2. Create the D1 database and replace `database_id` in `wrangler.toml` with the ID Wrangler returns:

   ```powershell
   npx wrangler d1 create survival-project-guestbook
   ```

3. Initialize its schema:

   ```powershell
   npx wrangler d1 execute survival-project-guestbook --remote --file=./schema.sql
   ```

4. Add the admin password and a separate random session-signing secret. Wrangler prompts for each secret; do not commit either value. Use a password different from the public card-editor password, and a random session secret of at least 32 characters:

   ```powershell
   npx wrangler secret put GUESTBOOK_ADMIN_PASSWORD
   npx wrangler secret put GUESTBOOK_SESSION_SECRET
   ```

5. Deploy the Worker:

   ```powershell
   npx wrangler deploy
   ```

6. Copy the deployed `workers.dev` base URL into `../guestbook-config.js`, for example `https://survival-project-guestbook.<account>.workers.dev`.

`ALLOWED_ORIGINS` already permits the GitHub Pages origin and local port 8000. Update it if the site's origin or local port changes. The admin token remains in memory only and expires after eight hours by default.

## Tests

Run `npm test` from this directory. Tests use Node's built-in test runner and do not require Cloudflare credentials.
