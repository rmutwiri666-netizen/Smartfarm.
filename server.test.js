const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { after, before, test } = require('node:test');
const { createServer } = require('./server');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartfarm-test-'));
const server = createServer({ dataDir });
let baseUrl;
let sessionCookie;
let registeredUser;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

async function request(route, { method = 'GET', body, cookie } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (cookie) headers.cookie = cookie;
  return fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
}

test('only signed-in sellers can publish listings visible to everyone', async () => {
  const listing = {
    name: 'Fresh beans', category: 'Vegetables', location: 'Meru', price: 250,
    unit: 'per kg', quantity: 15, description: 'Harvested this week.'
  };
  const blocked = await request('/api/products', { method: 'POST', body: listing });
  assert.equal(blocked.status, 401);

  const register = await request('/api/register', {
    method: 'POST',
    body: { name: 'Green Valley Farm', email: 'seller@example.com', password: 'harvest123' }
  });
  assert.equal(register.status, 201);
  const registerResult = await register.json();
  registeredUser = registerResult.user;
  assert.equal(registeredUser.name, 'Green Valley Farm');
  assert.equal('passwordHash' in registerResult, false);
  sessionCookie = register.headers.get('set-cookie').split(';')[0];

  const publish = await request('/api/products', { method: 'POST', body: listing, cookie: sessionCookie });
  assert.equal(publish.status, 201);
  const saved = (await publish.json()).product;
  assert.equal(saved.seller, 'Green Valley Farm');
  assert.equal(saved.ownerId, registeredUser.id);

  const publicRead = await request('/api/products');
  const publicProducts = (await publicRead.json()).products;
  assert.equal(publicProducts.some((product) => product.id === saved.id), true);
});

test('accounts persist and can sign in again', async () => {
  const login = await request('/api/login', {
    method: 'POST',
    body: { email: 'seller@example.com', password: 'harvest123' }
  });
  assert.equal(login.status, 200);
  assert.deepEqual((await login.json()).user, registeredUser);

  const restartedServer = createServer({ dataDir });
  await new Promise((resolve) => restartedServer.listen(0, '127.0.0.1', resolve));
  try {
    const restartedUrl = `http://127.0.0.1:${restartedServer.address().port}`;
    const publicRead = await fetch(`${restartedUrl}/api/products`);
    const products = (await publicRead.json()).products;
    assert.equal(products.some((product) => product.seller === 'Green Valley Farm'), true);
  } finally {
    await new Promise((resolve, reject) => restartedServer.close((error) => error ? reject(error) : resolve()));
  }
});

test('stores accounts and adverts in relational SQLite tables', () => {
  const database = new DatabaseSync(path.join(dataDir, 'smartfarm.sqlite'));
  try {
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
    assert.deepEqual(tables.sort(), ['migrations', 'products', 'sessions', 'users']);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM products').get().count, 1);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM users').get().count, 1);
  } finally {
    database.close();
  }
});

test('imports legacy JSON accounts, sessions, and adverts without deleting the backup', async () => {
  const legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartfarm-legacy-'));
  const legacyFile = path.join(legacyDir, 'smartfarm.json');
  const salt = crypto.randomBytes(16).toString('hex');
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const user = {
    id: 'legacy-user-1',
    name: 'Legacy Farm',
    email: 'legacy@example.com',
    salt,
    passwordHash: crypto.scryptSync('legacy-pass-123', salt, 64).toString('hex'),
    createdAt: Date.now()
  };
  const product = {
    id: 'legacy-product-1',
    name: 'Legacy tomatoes',
    category: 'Vegetables',
    location: 'Meru',
    seller: user.name,
    price: 700,
    unit: 'per crate',
    quantity: 12,
    description: 'Imported from the previous data store.',
    image: 'https://images.unsplash.com/legacy.jpg',
    ownerId: user.id,
    createdAt: Date.now()
  };
  fs.writeFileSync(legacyFile, JSON.stringify({
    users: [user],
    products: [product],
    sessions: {
      [crypto.createHash('sha256').update(sessionToken).digest('hex')]: {
        userId: user.id,
        expiresAt: Date.now() + 60_000
      }
    }
  }));

  const migrationServer = createServer({ dataDir: legacyDir });
  await new Promise((resolve) => migrationServer.listen(0, '127.0.0.1', resolve));
  try {
    const migrationUrl = `http://127.0.0.1:${migrationServer.address().port}`;
    const productsResponse = await fetch(`${migrationUrl}/api/products`);
    const products = (await productsResponse.json()).products;
    assert.equal(products.some((item) => item.id === product.id), true);

    const sessionResponse = await fetch(`${migrationUrl}/api/session`, {
      headers: { cookie: `smartfarm_session=${sessionToken}` }
    });
    assert.deepEqual((await sessionResponse.json()).user, {
      id: user.id,
      name: user.name,
      email: user.email
    });
    assert.equal(fs.existsSync(legacyFile), true);
  } finally {
    await new Promise((resolve, reject) => migrationServer.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(legacyDir, { recursive: true, force: true });
  }
});
