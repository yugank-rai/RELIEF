export interface OfflineReport {
  id?: number;
  type: string;
  severity: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  trappedCount?: number;
  elderlyChildCount?: number;
  medicalEmergency?: boolean;
  resourceUrgencyScore?: number;
  reporterName?: string;
  reporterPhone?: string;
  clientCreatedAt: string;
  status: 'pending' | 'synced' | 'failed';
}

const DB_NAME = 'ReliefDisasterOpsDB';
const DB_VERSION = 1;
const STORE_NAME = 'offlineReports';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineReport(report: Omit<OfflineReport, 'id' | 'status'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: OfflineReport = {
      ...report,
      status: 'pending',
    };
    const req = store.add(item);
    req.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('offline-queue-updated'));
      resolve(Number(req.result));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingOfflineReports(): Promise<OfflineReport[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get offline reports:', err);
    return [];
  }
}

export async function clearOfflineReports(ids: number[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    ids.forEach(id => store.delete(id));
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent('offline-queue-updated'));
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncOfflineReports(apiBaseUrl = 'http://localhost:4000/api'): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingOfflineReports();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  try {
    const token = localStorage.getItem('relief_token');
    const response = await fetch(`${apiBaseUrl}/incidents/batch-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reports: pending }),
    });

    if (response.ok) {
      const idsToDelete = pending.map(p => p.id!).filter(Boolean);
      await clearOfflineReports(idsToDelete);
      return { synced: idsToDelete.length, failed: 0 };
    }
  } catch (err) {
    console.warn('Sync attempt failed (still offline or server unreachable):', err);
  }

  return { synced: 0, failed: pending.length };
}

// Auto-sync listener when browser reconnects to internet
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Connection restored. Flushing offline sync queue...');
    syncOfflineReports();
  });
}
