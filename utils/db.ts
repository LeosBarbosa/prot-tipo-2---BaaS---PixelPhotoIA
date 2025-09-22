/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { openDB, IDBPDatabase } from 'idb';
import { ToolId } from '../types';

const DB_NAME = 'PixshopDB';
const HISTORY_STORE = 'historyStore';
const APP_STATE_STORE = 'appStateStore';
const DB_VERSION = 2;

interface HistoryState {
  id: 'currentUserHistory';
  history: File[];
  historyIndex: number;
}

interface RecentToolsState {
    id: 'recentTools';
    toolIds: ToolId[];
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
            if (!db.objectStoreNames.contains(HISTORY_STORE)) {
              db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
            }
        }
        if (oldVersion < 2) {
             if (!db.objectStoreNames.contains(APP_STATE_STORE)) {
              db.createObjectStore(APP_STATE_STORE, { keyPath: 'id' });
            }
        }
      },
    });
  }
  return dbPromise;
};

export const saveHistory = async (history: File[], historyIndex: number): Promise<void> => {
    try {
        const db = await initDB();
        await db.put(HISTORY_STORE, { id: 'currentUserHistory', history, historyIndex });
    } catch (error) {
        console.error("Failed to save history to IndexedDB", error);
    }
};

export const loadHistory = async (): Promise<{ history: File[], historyIndex: number } | null> => {
    try {
        const db = await initDB();
        const data: HistoryState | undefined = await db.get(HISTORY_STORE, 'currentUserHistory');
        return data ? { history: data.history, historyIndex: data.historyIndex } : null;
    } catch (error) {
        console.error("Failed to load history from IndexedDB", error);
        return null;
    }
};

export const clearHistoryDB = async (): Promise<void> => {
    try {
        const db = await initDB();
        await db.delete(HISTORY_STORE, 'currentUserHistory');
    } catch (error) {
        console.error("Failed to clear history from IndexedDB", error);
    }
};

export const saveRecentTools = async (toolIds: ToolId[]): Promise<void> => {
    try {
        const db = await initDB();
        await db.put(APP_STATE_STORE, { id: 'recentTools', toolIds });
    } catch (error) {
        console.error("Failed to save recent tools to IndexedDB", error);
    }
};

export const loadRecentTools = async (): Promise<ToolId[] | null> => {
    try {
        const db = await initDB();
        const data: RecentToolsState | undefined = await db.get(APP_STATE_STORE, 'recentTools');
        return data ? data.toolIds : null;
    } catch (error) {
        console.error("Failed to load recent tools from IndexedDB", error);
        return null;
    }
};