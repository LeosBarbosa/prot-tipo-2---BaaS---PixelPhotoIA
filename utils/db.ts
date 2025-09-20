/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'PixshopDB';
const STORE_NAME = 'historyStore';
const DB_VERSION = 1;

interface HistoryState {
  id: 'currentUserHistory';
  history: File[];
  historyIndex: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveHistory = async (history: File[], historyIndex: number): Promise<void> => {
    try {
        const db = await initDB();
        await db.put(STORE_NAME, { id: 'currentUserHistory', history, historyIndex });
    } catch (error) {
        console.error("Failed to save history to IndexedDB", error);
    }
};

export const loadHistory = async (): Promise<{ history: File[], historyIndex: number } | null> => {
    try {
        const db = await initDB();
        const data: HistoryState | undefined = await db.get(STORE_NAME, 'currentUserHistory');
        return data ? { history: data.history, historyIndex: data.historyIndex } : null;
    } catch (error) {
        console.error("Failed to load history from IndexedDB", error);
        return null;
    }
};

export const clearHistoryDB = async (): Promise<void> => {
    try {
        const db = await initDB();
        await db.delete(STORE_NAME, 'currentUserHistory');
    } catch (error) {
        console.error("Failed to clear history from IndexedDB", error);
    }
};
