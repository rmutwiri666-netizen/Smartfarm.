const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
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
