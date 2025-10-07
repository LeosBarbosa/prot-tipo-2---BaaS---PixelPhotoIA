/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { openDB, IDBPDatabase } from 'idb';
import { ToolId, type Workflow, type LayerStateSnapshot } from '../types';

const DB_NAME = 'PixelPhotoIADB';
const HISTORY_STORE = 'historyStore';
const APP_STATE_STORE = 'appStateStore';
const USER_INSIGHTS_STORE = 'userInsightsStore';
const SAVED_WORKFLOWS_STORE = 'savedWorkflowsStore';
const PROMPT_HISTORY_STORE = 'promptHistoryStore';
const DB_VERSION = 4;

interface HistoryState {
  id: 'currentUserHistory';
  history: LayerStateSnapshot[];
  historyIndex: number;
  toolHistory: ToolId[];
}

interface RecentToolsState {
    id: 'recentTools';
    toolIds: ToolId[];
}

interface ActionHistoryState {
    id: 'actionHistory';
    actions: ToolId[];
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
        if (oldVersion < 3) {
            if (!db.objectStoreNames.contains(USER_INSIGHTS_STORE)) {
                db.createObjectStore(USER_INSIGHTS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SAVED_WORKFLOWS_STORE)) {
                db.createObjectStore(SAVED_WORKFLOWS_STORE, { keyPath: 'id' });
            }
        }
        if (oldVersion < 4) {
            if (!db.objectStoreNames.contains(PROMPT_HISTORY_STORE)) {
                db.createObjectStore(PROMPT_HISTORY_STORE, { keyPath: 'id' });
            }
        }
      },
    });
  }
  return dbPromise;
};


export const saveHistory = async (history: LayerStateSnapshot[], historyIndex: number, toolHistory: ToolId[]): Promise<void> => {
  const db = await initDB();
  await db.put(HISTORY_STORE, { id: 'currentUserHistory', history, historyIndex, toolHistory });
};

export const loadHistory = async (): Promise<HistoryState | undefined> => {
  const db = await initDB();
  return db.get(HISTORY_STORE, 'currentUserHistory');
};

export const clearHistoryDB = async (): Promise<void> => {
  const db = await initDB();
  await db.clear(HISTORY_STORE);
};

export const saveRecentTools = async (toolIds: ToolId[]): Promise<void> => {
    const db = await initDB();
    await db.put(APP_STATE_STORE, { id: 'recentTools', toolIds });
};

export const loadRecentTools = async (): Promise<ToolId[] | undefined> => {
    const db = await initDB();
    const result: RecentToolsState | undefined = await db.get(APP_STATE_STORE, 'recentTools');
    return result?.toolIds;
};

export const loadWorkflows = async (): Promise<Workflow[]> => {
    const db = await initDB();
    return db.getAll(SAVED_WORKFLOWS_STORE);
};

export const addWorkflow = async (workflow: Workflow): Promise<void> => {
    const db = await initDB();
    await db.put(SAVED_WORKFLOWS_STORE, workflow);
};

export const deleteWorkflow = async (id: string): Promise<void> => {
    const db = await initDB();
    await db.delete(SAVED_WORKFLOWS_STORE, id);
};

export const savePromptHistory = async (prompts: string[]): Promise<void> => {
    const db = await initDB();
    await db.put(PROMPT_HISTORY_STORE, { id: 'userPrompts', prompts });
};

export const loadPromptHistory = async (): Promise<string[] | undefined> => {
    const db = await initDB();
    const result = await db.get(PROMPT_HISTORY_STORE, 'userPrompts');
    return result?.prompts;
};