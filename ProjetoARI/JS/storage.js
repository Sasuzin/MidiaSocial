/* =========================================================
   Bem Social — armazenamento local
   - Usuários e sessão: localStorage
   - Publicações (com mídias): IndexedDB, que aceita arquivos
     grandes (vídeos, áudios, desenhos) sem estourar o limite
     de ~5 MB do localStorage.
   ========================================================= */

const Store = (() => {
  const USERS_KEY = 'Users';
  const SESSION_KEY = 'usuarioLogado';

  const DB_NAME = 'bem-social';
  const DB_VERSION = 1;
  const POSTS = 'posts';

  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

  /* ---------- Usuários ---------- */
  function getUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function findUserByEmail(email) {
    const target = normalizeEmail(email);
    return getUsers().find((user) => normalizeEmail(user.email) === target) || null;
  }

  function addUser(user) {
    const users = getUsers();
    users.push(user);
    saveUsers(users);
  }

  /* ---------- Sessão ---------- */
  function login(email) {
    localStorage.setItem(SESSION_KEY, normalizeEmail(email));
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getSessionUser() {
    try {
      const email = localStorage.getItem(SESSION_KEY);
      return email ? findUserByEmail(email) : null;
    } catch {
      return null;
    }
  }

  /* ---------- Publicações (IndexedDB) ---------- */
  let dbPromise = null;

  function openDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(POSTS)) {
            db.createObjectStore(POSTS, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return dbPromise;
  }

  async function run(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(POSTS, mode);
      const request = action(transaction.objectStore(POSTS));
      transaction.oncomplete = () => resolve(request ? request.result : undefined);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function getPosts() {
    const posts = await run('readonly', (store) => store.getAll());
    // Mais novo para o mais velho
    return (posts || []).sort((a, b) => b.createdAt - a.createdAt);
  }

  const savePost = (post) => run('readwrite', (store) => store.put(post));
  const deletePost = (id) => run('readwrite', (store) => store.delete(id));

  function createId() {
    if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  return {
    getUsers,
    findUserByEmail,
    addUser,
    login,
    logout,
    getSessionUser,
    getPosts,
    savePost,
    deletePost,
    createId,
  };
})();
