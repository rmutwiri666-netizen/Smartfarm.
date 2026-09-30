(() => {
  const databaseName = 'SmartFarmDatabase';
  const storeName = 'collections';
  const version = 1;

  const connection = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = window.indexedDB.open(databaseName, version);
    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'id' });
      }
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });

  function runTransaction(mode, operation) {
    return connection.then((database) => new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      let result;

      operation(store, (value) => { result = value; });
      transaction.addEventListener('complete', () => resolve(result), { once: true });
      transaction.addEventListener('error', () => reject(transaction.error), { once: true });
      transaction.addEventListener('abort', () => reject(transaction.error || new Error('Database transaction aborted.')), { once: true });
    }));
  }

  window.smartFarmDatabase = {
    get(id) {
      return runTransaction('readonly', (store, setResult) => {
        const request = store.get(id);
        request.addEventListener('success', () => setResult(request.result?.value), { once: true });
      });
    },
    put(id, value) {
      return runTransaction('readwrite', (store) => store.put({ id, value }));
    }
  };
})();