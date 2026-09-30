# SmartFarm

SmartFarm is a small Node.js app with seller accounts and a shared marketplace. Public visitors can browse listings; sellers sign in to publish products under their farm name.

## Run locally

Install Node.js 22.5 or newer, then run:

```powershell
npm start
```

Open `http://127.0.0.1:3000`. Create a seller account from the **Sign in** button, then publish from **Advertise**. Accounts, sessions, and products are stored in the relational SQLite database at `data/smartfarm.sqlite`; the public products API serves those products to all visitors using the same running server. The server refreshes the marketplace every 15 seconds while a page is open.

If `data/smartfarm.json` exists from an earlier version, the server imports its users, sessions, and listings once on startup. The JSON file is kept as a backup and is not updated after migration.

Run the backend tests with:

```powershell
npm test
```

## Hosting

The default server binds to `127.0.0.1` for local use. To serve real customers, deploy the Node server on a public host with HTTPS and persistent disk storage. Keep the entire `data/` directory private; it contains account password hashes, sessions, and the SQLite database. The server only serves the app's explicit static files and API routes.

Existing browser-only listings can be imported at sign-in when the account's farm name matches the old listing's seller name.
