/* =========================================================================
   STORAGE.JS
   Persistencia local multi-usuario (localStorage). Cada usuario es un
   "perfil" independiente: su propia fecha de inicio, días completados,
   medidas corporales y ajustes de nutrición. Pensado para que 2-3 personas
   compartan el mismo navegador/dispositivo y comparen su progreso, o para
   exportar/importar JSON y compartir entre dispositivos.
   ========================================================================= */

const LS_USERS_KEY = 'ptw_users_v1';
const LS_ACTIVE_KEY = 'ptw_active_user_v1';
const LS_DATA_PREFIX = 'ptw_data_v1_';

function uid() {
  return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS_KEY)) || []; }
  catch (e) { return []; }
}

function saveUsers(users) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

function getActiveUserId() {
  return localStorage.getItem(LS_ACTIVE_KEY);
}

function setActiveUserId(id) {
  localStorage.setItem(LS_ACTIVE_KEY, id);
}

function defaultUserData() {
  return {
    profile: {
      name: '',
      sex: 'male',
      age: null,
      heightCm: null,
      weightKg: null,
      activity: 'sedentary',
    },
    startDate: null,          // ISO string, fecha de inicio del programa
    completedDays: {},        // { 'YYYY-MM-DD': true }
    measurements: [],         // [{id, date, weightKg, waist, chest, arm, thigh, bodyFatPct, notes}]
    settings: {
      includePrepPhase: true, // Fase 0 opcional (rampa con rutinas oficiales de 645), activable/desactivable
    },
    nutrition: {
      proteinGPerKg: 1.9,
      goal: 'maintain',
    },
    createdAt: new Date().toISOString(),
  };
}

function getUserData(id) {
  try {
    const raw = localStorage.getItem(LS_DATA_PREFIX + id);
    if (!raw) return defaultUserData();
    const parsed = JSON.parse(raw);
    return {
      ...defaultUserData(),
      ...parsed,
      profile: { ...defaultUserData().profile, ...(parsed.profile || {}) },
      settings: { ...defaultUserData().settings, ...(parsed.settings || {}) },
      nutrition: { ...defaultUserData().nutrition, ...(parsed.nutrition || {}) },
    };
  } catch (e) {
    return defaultUserData();
  }
}

function saveUserData(id, data) {
  localStorage.setItem(LS_DATA_PREFIX + id, JSON.stringify(data));
}

function createUser(name) {
  const users = getUsers();
  const id = uid();
  users.push({ id, name, createdAt: new Date().toISOString() });
  saveUsers(users);
  const data = defaultUserData();
  data.profile.name = name;
  saveUserData(id, data);
  setActiveUserId(id);
  return id;
}

function deleteUser(id) {
  let users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
  localStorage.removeItem(LS_DATA_PREFIX + id);
  if (getActiveUserId() === id) {
    setActiveUserId(users.length ? users[0].id : '');
  }
}

function renameUser(id, newName) {
  const users = getUsers();
  const u = users.find(x => x.id === id);
  if (u) { u.name = newName; saveUsers(users); }
  const data = getUserData(id);
  data.profile.name = newName;
  saveUserData(id, data);
}

function addMeasurement(id, entry) {
  const data = getUserData(id);
  entry.id = 'm_' + Math.random().toString(36).slice(2, 9);
  data.measurements.push(entry);
  data.measurements.sort((a, b) => a.date.localeCompare(b.date));
  saveUserData(id, data);
  return data;
}

function deleteMeasurement(id, measurementId) {
  const data = getUserData(id);
  data.measurements = data.measurements.filter(m => m.id !== measurementId);
  saveUserData(id, data);
  return data;
}

/* ---- Export / Import (para compartir entre dispositivos) --------------- */
function exportAllData() {
  const users = getUsers();
  const payload = { exportVersion: 1, exportedAt: new Date().toISOString(), users: {} };
  users.forEach(u => {
    payload.users[u.id] = { meta: u, data: getUserData(u.id) };
  });
  return payload;
}

function importAllData(payload, mode = 'merge') {
  if (!payload || !payload.users) throw new Error('Archivo inválido');
  if (mode === 'replace') {
    getUsers().forEach(u => localStorage.removeItem(LS_DATA_PREFIX + u.id));
    saveUsers([]);
  }
  const users = getUsers();
  Object.entries(payload.users).forEach(([id, entry]) => {
    if (!users.find(u => u.id === id)) users.push(entry.meta);
    saveUserData(id, entry.data);
  });
  saveUsers(users);
  if (!getActiveUserId() && users.length) setActiveUserId(users[0].id);
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.STORAGE = {
  getUsers, saveUsers, getActiveUserId, setActiveUserId,
  getUserData, saveUserData, createUser, deleteUser, renameUser,
  addMeasurement, deleteMeasurement,
  exportAllData, importAllData, downloadJSON, defaultUserData,
};
