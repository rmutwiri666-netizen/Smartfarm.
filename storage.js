const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function createStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const legacyFile = path.join(dataDir, 'smartfarm.json');
  const database = new DatabaseSync(path.join(dataDir, 'smartfarm.sqlite'));
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      seller TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS products_created_idx ON products(created_at DESC);
    CREATE INDEX IF NOT EXISTS products_owner_idx ON products(owner_id);
  `);

  const statements = {
    migration: database.prepare('SELECT id FROM migrations WHERE id = ?'),
    markMigration: database.prepare('INSERT INTO migrations (id, applied_at) VALUES (?, ?)'),
    userById: database.prepare('SELECT * FROM users WHERE id = ?'),
    userByEmail: database.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE'),
    insertUser: database.prepare('INSERT OR IGNORE INTO users (id, name, email, salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
    sessionByHash: database.prepare('SELECT sessions.expires_at, users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?'),
    insertSession: database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?) ON CONFLICT(token_hash) DO UPDATE SET user_id = excluded.user_id, expires_at = excluded.expires_at'),
    deleteSession: database.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    deleteExpiredSessions: database.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
    insertLegacySession: database.prepare('INSERT OR IGNORE INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
    insertProduct: database.prepare('INSERT INTO products (id, name, category, location, seller, price, unit, quantity, description, image, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
    insertLegacyProduct: database.prepare('INSERT OR IGNORE INTO products (id, name, category, location, seller, price, unit, quantity, description, image, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'),
    allProducts: database.prepare('SELECT * FROM products ORDER BY created_at DESC'),
    productsByOwner: database.prepare('SELECT * FROM products WHERE owner_id = ? ORDER BY created_at DESC')
  };

  function migrateLegacyJson() {
    const migrationId = 'legacy-json-v1';
    if (statements.migration.get(migrationId)) return;
    let legacy = { users: [], products: [], sessions: {} };
    if (fs.existsSync(legacyFile)) {
      try {
        legacy = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
      } catch (error) {
        throw new Error(`Could not migrate ${legacyFile}: ${error.message}`);
      }
    }

    database.exec('BEGIN IMMEDIATE');
    try {
      for (const user of legacy.users || []) {
        if (!user.id || !user.email || !user.salt || !user.passwordHash) continue;
        statements.insertUser.run(user.id, user.name || 'SmartFarm seller', user.email, user.salt, user.passwordHash, Number(user.createdAt) || Date.now());
      }
      for (const [tokenHash, session] of Object.entries(legacy.sessions || {})) {
        if (session.userId && statements.userById.get(session.userId)) {
          statements.insertLegacySession.run(tokenHash, session.userId, Number(session.expiresAt) || 0);
        }
      }
      for (const product of legacy.products || []) {
        if (!product.id || !product.ownerId || !statements.userById.get(product.ownerId)) continue;
        const owner = statements.userById.get(product.ownerId);
        statements.insertLegacyProduct.run(
          product.id,
          String(product.name || 'Farm listing'),
          String(product.category || 'Services'),
          String(product.location || 'Kenya'),
          String(product.seller || owner.name),
          Number(product.price) || 0,
          String(product.unit || 'per item'),
          Number(product.quantity) || 0,
          String(product.description || ''),
          String(product.image || ''),
          product.ownerId,
          Number(product.createdAt) || Date.now()
        );
      }
      statements.markMigration.run(migrationId, Date.now());
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }

  migrateLegacyJson();
  statements.deleteExpiredSessions.run(Date.now());

  function mapUser(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      salt: row.salt,
      passwordHash: row.password_hash,
      createdAt: row.created_at
    };
  }

  function mapProduct(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      location: row.location,
      seller: row.seller,
      price: row.price,
      unit: row.unit,
      quantity: row.quantity,
      description: row.description,
      image: row.image,
      own: false,
      ownerId: row.owner_id,
      createdAt: row.created_at
    };
  }

  return {
    getUserById(id) {
      return mapUser(statements.userById.get(id));
    },
    getUserByEmail(email) {
      return mapUser(statements.userByEmail.get(email));
    },
    createUser(user) {
      database.prepare('INSERT INTO users (id, name, email, salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(user.id, user.name, user.email, user.salt, user.passwordHash, user.createdAt);
    },
    getSessionUser(tokenHash) {
      const row = statements.sessionByHash.get(tokenHash);
      if (!row) return null;
      if (row.expires_at <= Date.now()) {
        statements.deleteSession.run(tokenHash);
        return null;
      }
      return mapUser(row);
    },
    saveSession(tokenHash, userId, expiresAt) {
      statements.insertSession.run(tokenHash, userId, expiresAt);
    },
    deleteSession(tokenHash) {
      statements.deleteSession.run(tokenHash);
    },
    listProducts() {
      return statements.allProducts.all().map(mapProduct);
    },
    listProductsByOwner(userId) {
      return statements.productsByOwner.all(userId).map(mapProduct);
    },
    createProduct(product) {
      statements.insertProduct.run(
        product.id,
        product.name,
        product.category,
        product.location,
        product.seller,
        product.price,
        product.unit,
        product.quantity,
        product.description,
        product.image,
        product.ownerId,
        product.createdAt
      );
    },
    close() {
      database.close();
    }
  };
}

module.exports = { createStore };
