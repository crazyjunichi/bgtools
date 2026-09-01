/**
 * IndexedDB 的极薄封装。**只给会无界增长的存档用**，日常状态仍走 zustand persist
 * （localStorage）—— 见 [CLAUDE.md](../../CLAUDE.md) 的持久化分工那节。
 *
 * 为什么不把存档也塞进 localStorage：那 5MB 是**整个域名共享**的，项目已经有七个
 * `bgtools:*` key 在分；而且 zustand persist 是全量写回，存档进了 store 就等于
 * 每按一下数字键都把所有历史局一起 `JSON.stringify` 一遍（同步阻塞主线程）。
 *
 * 为什么不引 `idb` 库：这里只需要「按主键读全部 / 写一条 / 删一条 / 清空」四个动作，
 * 原生 API 包一层 Promise 就够，没到值得多一个依赖的程度。
 */

const DB_NAME = 'bgtools'

/**
 * 所有 object store 集中声明。`onupgradeneeded` 一个版本只跑一次，
 * 分散到各业务模块去建必然漏 —— 新增一个存档要 **bump VERSION 并在这里加一行**。
 */
const STORES = ['score-sheet-games'] as const
const VERSION = 1

export type IdbStore = (typeof STORES)[number]

/** 主键字段名。四个函数都假定记录形如 `{ id: string, at: number, ... }` */
const KEY_PATH = 'id'
/** 存档列表一律按时间倒序，索引留着给将来的 cursor 分页 */
const AT_INDEX = 'at'

let handle: Promise<IDBDatabase> | undefined

/**
 * 连接是单例且惰性的：工具页启动不该为存档读盘，只在真正打开历史时才建连接。
 *
 * **打不开是正常分支，不是崩点**：隐私模式与部分 Safari 配置直接禁掉 IDB。
 * 这里照常 reject，由调用方 catch 成「存档功能不可用」，其余功能不受影响 ——
 * 同 [AppHeader](../AppHeader.tsx) 里「localStorage 存不进就当已看过」的思路。
 */
function open(): Promise<IDBDatabase> {
  handle ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of STORES) {
        if (db.objectStoreNames.contains(name)) continue
        db.createObjectStore(name, { keyPath: KEY_PATH }).createIndex(AT_INDEX, AT_INDEX)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    // 另一个标签页开着旧版本时会卡在 blocked，别让 Promise 悬着
    req.onblocked = () => reject(new Error('IndexedDB blocked by another tab'))
  })
  // 失败不缓存：无痕模式外的失败多是暂时的（配额、blocked），下次点开该能重试
  handle.catch(() => {
    handle = undefined
  })
  return handle
}

/** 事务的公共壳：`oncomplete` 而非 `onsuccess` 才代表真正落盘 */
async function tx<T>(
  store: IdbStore,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const req = run(t.objectStore(store))
    let out: T
    req.onsuccess = () => {
      out = req.result as T
    }
    t.oncomplete = () => resolve(out)
    t.onerror = () => reject(t.error ?? new Error('IndexedDB transaction failed'))
    t.onabort = () => reject(t.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export function idbGetAll<T>(store: IdbStore): Promise<T[]> {
  return tx<T[]>(store, 'readonly', (s) => s.getAll())
}

export function idbPut<T>(store: IdbStore, value: T): Promise<void> {
  return tx(store, 'readwrite', (s) => s.put(value))
}

export function idbDelete(store: IdbStore, key: string): Promise<void> {
  return tx(store, 'readwrite', (s) => s.delete(key))
}

export function idbClear(store: IdbStore): Promise<void> {
  return tx(store, 'readwrite', (s) => s.clear())
}
