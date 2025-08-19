const DB_NAME = 'ScholarLensDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

interface PDFRecord {
  id: string;
  dataUri: string;
  name: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // IndexedDB is a browser-only feature
    if (typeof window === 'undefined') {
      return reject('IndexedDB not available');
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
  });
}

async function performDbOperation<T>(operation: (store: IDBObjectStore) => IDBRequest<T>, mode: IDBTransactionMode): Promise<T> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  const request = operation(store);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = () => {
      console.error('Transaction error:', tx.error);
      db.close();
      reject(tx.error);
    };
  });
}

export async function savePdf(id: string, name: string, dataUri: string): Promise<void> {
  await clearPdfs();
  await performDbOperation(store => store.put({ id, name, dataUri }), 'readwrite');
}

export async function getPdf(): Promise<PDFRecord | null> {
    const allPdfs = await performDbOperation(store => store.getAll(), 'readonly') as PDFRecord[];
    return allPdfs.length > 0 ? allPdfs[0] : null;
}

export async function clearPdfs(): Promise<void> {
  await performDbOperation(store => store.clear(), 'readwrite');
}
