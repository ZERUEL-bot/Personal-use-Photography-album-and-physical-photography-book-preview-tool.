/* Photo_Project_PWA — IndexedDB persistence layer
 * 纯前端、无服务器、无网络请求。数据只保存在当前浏览器 / 当前设备。
 * 每个浏览器配置文件拥有独立的 IndexedDB，因此天然支持多用户互不干扰。
 */
(() => {
  "use strict";

  const DB_NAME = "photo-project-pwa";
  const DB_VERSION = 1;
  const STORE = "portfolio";
  const KEY = "current";
  const SCHEMA = 1;

  let dbPromise = null;

  const isSupported = () =>
    typeof window !== "undefined" &&
    typeof window.indexedDB !== "undefined" &&
    !!window.indexedDB;

  const openDb = () => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!isSupported()) {
        reject(new Error("当前浏览器不支持 IndexedDB"));
        return;
      }
      let request;
      try {
        request = window.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("无法打开本机数据库"));
      request.onblocked = () =>
        reject(new Error("数据库被其它标签页占用，请关闭本程序的其它标签页后重试"));
    }).catch((error) => {
      dbPromise = null;
      throw error;
    });
    return dbPromise;
  };

  const read = async () => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => {
        const record = request.result;
        resolve(record && record.data ? record.data : null);
      };
      request.onerror = () => reject(request.error || new Error("读取本机数据失败"));
    });
  };

  const write = async (data) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      let tx;
      try {
        tx = db.transaction(STORE, "readwrite");
      } catch (error) {
        reject(error);
        return;
      }
      tx.objectStore(STORE).put(
        { schema: SCHEMA, savedAt: new Date().toISOString(), data },
        KEY
      );
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error("写入本机数据失败"));
      tx.onabort = () => reject(tx.error || new Error("写入本机数据被中断"));
    });
  };

  const remove = async () => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error("清除本机数据失败"));
    });
  };

  const estimate = async () => {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    try {
      return await navigator.storage.estimate();
    } catch (error) {
      return null;
    }
  };

  window.PortfolioStore = {
    DB_NAME,
    KEY,
    isSupported,
    read,
    write,
    remove,
    estimate
  };
})();
