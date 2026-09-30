# SmartFarm

SmartFarm is a small Node.js app with seller accounts and a shared marketplace. Public visitors can browse listings; sellers sign in to publish products under their farm name.

## Run locally

Install Node.js 20 or newer, then run:

```powershell
npm start
```

Open `http://127.0.0.1:3000`. Create a seller account from the **Sign in** button, then publish from **Advertise**. Products are stored on the server in `data/smartfarm.json` and appear for other visitors using the same running server. The server refreshes the marketplace every 15 seconds while a page is open.

Run the backend tests with:

```powershell
npm test
```

## Hosting

The default server binds to `127.0.0.1` for local use. To serve real customers, deploy the Node server on a public host with HTTPS and persistent disk storage. Do not publish `data/smartfarm.json`; it contains account password hashes, sessions, and private application data. The server only serves the app's explicit static files and API routes.

Existing browser-only listings can be imported at sign-in when the account's farm name matches the old listing's seller name.
