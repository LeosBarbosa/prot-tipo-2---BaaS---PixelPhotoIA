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
// NOVA STORE PARA CACHE DE IMAGENS
const IMAGE_CACHE_STORE = 'imageCacheStore';

// AUMENTAR VERSÃO DO DB PARA SUPORTAR NOVA STORE
const DB_VERSION = 5; 

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

// NOVO: Interface para a entrada de Cache
interface CacheEntry {
    id: string; // A chave do cache (ex: hash da imagem + prompt)
    blob: Blob; // Os dados reais da imagem (Blob)
    timestamp: number;
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
        // NOVA MIGRATION PARA DB_VERSION 5
        if (oldVersion < 5) {
            if (!db.objectStoreNames.contains(IMAGE_CACHE_STORE)) {
                // Armazenará Blob (imagem) indexado por uma chave única (hash)
                db.createObjectStore(IMAGE_CACHE_STORE, { keyPath: 'id' });
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

// -----------------------------------------------------------
// NOVO: Funções de Cache de Imagem
// -----------------------------------------------------------

/**
 * Salva um Blob ou File no cache IndexedDB.
 * @param key Uma chave única para o cache (hash + prompt).
 * @param data O Blob ou File da imagem.
 */
export const saveImageToCache = async (key: string, data: Blob | File): Promise<void> => {
  try {
      if (!data) return;
      const db = await initDB();
      const entry: CacheEntry = {
          id: key,
          blob: data, // IndexedDB pode armazenar Blobs e Files diretamente
          timestamp: Date.now(),
      };
      await db.put(IMAGE_CACHE_STORE, entry);
      // Chamar limpeza em segundo plano (não bloqueia)
      cleanImageCache(); 
  } catch (e) {
      console.error("Falha ao salvar imagem no cache:", e);
  }
};

/**
 * Carrega um Blob de imagem do cache IndexedDB.
 * @param key A chave única do cache.
 * @returns Um Promise que resolve com o Blob da imagem ou undefined.
 */
export const loadImageFromCache = async (key: string): Promise<Blob | undefined> => {
  try {
      const db = await initDB();
      const entry: CacheEntry | undefined = await db.get(IMAGE_CACHE_STORE, key);
      return entry?.blob;
  } catch (e) {
      console.error("Falha ao carregar imagem do cache:", e);
      return undefined;
  }
};

/**
 * Limpa entradas antigas do cache de imagens para evitar que o banco de dados fique muito grande.
 * @param maxAgeMs A idade máxima em milissegundos para manter uma entrada (padrão: 7 dias).
 */
export const cleanImageCache = async (maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> => {
  try {
      const db = await initDB();
      // 'readwrite' transaction is required for deletion
      const tx = db.transaction(IMAGE_CACHE_STORE, 'readwrite');
      const store = tx.objectStore(IMAGE_CACHE_STORE);
      
      const cutoff = Date.now() - maxAgeMs;
      
      let cursor = await store.openCursor();
      while (cursor) {
          if (cursor.value.timestamp < cutoff) {
              cursor.delete();
          }
          cursor = await cursor.continue();
      }
      await tx.done; // Wait for the transaction to complete
  } catch (e) {
      console.warn("Falha ao limpar cache de imagens:", e);
  }
};
