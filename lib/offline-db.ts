"use client";

import type { VideoQuality } from "@/lib/videos";

const DB_NAME = "ordem-unida-offline";
const DB_VERSION = 1;
const STORE_NAME = "videos";

export type OfflineVideoRecord = {
  id: string;
  blob: Blob;
  quality: Exclude<VideoQuality, "auto">;
  downloadedAt: number;
  size: number;
};

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openOfflineDb();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export async function saveOfflineVideo(record: OfflineVideoRecord) {
  await withStore("readwrite", (store) => store.put(record));
}

export async function getOfflineVideo(id: string) {
  return withStore<OfflineVideoRecord | undefined>("readonly", (store) => store.get(id));
}

export async function deleteOfflineVideo(id: string) {
  await withStore("readwrite", (store) => store.delete(id));
}

export async function listOfflineVideos() {
  return withStore<OfflineVideoRecord[]>("readonly", (store) => store.getAll());
}
