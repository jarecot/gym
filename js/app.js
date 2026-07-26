/* =========================================================================
   APP.JS — orquesta toda la aplicación (sin frameworks, vanilla JS)
   ========================================================================= */

const State = {
  users: [],
  activeUserId: null,
  activeUserData: null,
  calendar: null,          // array de 364 días generado a partir del startDate
  calendarFilter: null,    // phaseId o null (todas)
  currentTab: 'inicio',
};

/* ---------------------------------------------------------------------- */
/* INIT                                                                    */
/* ---------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', init);

function init() {
  State.users = STORAGE.getUsers();
  State.activeUserId = STORAGE.getActiveUserId();

  if (!State.activeUserId || !State.users.find(u => u.id === State.activeUserId)) {
    State.activeUserId = State.users.length ? State.users[0].id : null;
    if (State.activeUserId) STORAGE.setActiveUserId(State.activeUserId);
  }

  bindGlobalEvents();
  refreshAll();
}

function refreshAll() {
  State.users = STORAGE.getUsers();
  renderUserSelect();

  if (!State.activeUserId) {
    document.getElementById('noUserState').hidden = false;
    document.getElementById('dashboardContent').hidden = true;
    return;
  }
  document.getElementById('noUserState').hidden = true;
  document.getElementById('dashboardContent').hidden = false;

  State.activeUserData = STORAGE.getUserData(State.activeUserId);
  if (State.activeUserData.startDate) {
    State.calendar = PROGRAM.buildFullCalendar(State.activeUserData.startDate, {
      includePrep: State.activeUserData.settings.includePrepPhase,
    });
  } else {
    State.calendar = null;
  }

  renderCurrentTab();
}

/* ---------------------------------------------------------------------- */
/* NAV / TABS                                                              */
/* ---------------------------------------------------------------------- */
function bindGlobalEvents() {
  document.getElementById('tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    setActiveTab(btn.dataset.tab);
  });

  document.getElementById('userSelect').addEventListener('change', (e) => {
    State.activeUserId = e.target.value;
    STORAGE.setActiveUserId(State.activeUserId);
    refreshAll();
  });

  document.getElementById('newUserBtn').addEventListener('click', promptNewUser);
  document.getElementById('emptyStateNewUser').addEventListener('click', promptNewUser);

  document.getElementById('saveStartDateBtn').addEventListener('click', () => {
    const val = document.getElementById('startDateInput').value;
    if (!val) { toast('Elige una fecha primero'); return; }
    State.activeUserData.startDate = val;
    State.activeUserData.settings.includePrepPhase = document.getElementById('prepToggle').checked;
    STORAGE.saveUserData(State.activeUserId, State.activeUserData);
    toast('Fecha de inicio guardada');
    refreshAll();
  });

  document.getElementById('prepToggle').addEventListener('change', (e) => {
    if (!State.activeUserData) return;
    State.activeUserData.settings.includePrepPhase = e.target.checked;
    STORAGE.saveUserData(State.activeUserId, State.activeUserData);
    if (State.activeUserData.startDate) { toast('Calendario actualizado'); refreshAll(); }
  });

  document.getElementById('measurementForm').addEventListener('submit', onAddMeasurement);

  document.getElementById('saveProfileBtn').addEventListener('click', onSaveProfile);
  document.getElementById('exportBtn').addEventListener('click', onExport);
  document.getElementById('importFile').addEventListener('change', onImport);
  document.getElementById('deleteUserBtn').addEventListener('click', onDeleteUser);

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);

  // Nutrición: recalcular en vivo
  ['pWeight', 'pLevel'].forEach(id => document.getElementById(id).addEventListener('input', renderProteinCalc));
  ['tSex', 'tAge', 'tHeight', 'tWeight', 'tActivity', 'tGoal'].forEach(id =>
    document.getElementById(id).addEventListener('input', renderTdeeCalc));
}

function setActiveTab(tab) {
  State.currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
  renderCurrentTab();
}

function renderCurrentTab() {
  if (!State.activeUserId) return;
  try {
    switch (State.currentTab) {
      case 'inicio': renderInicio(); break;
      case 'calendario': renderCalendario(); break;
      case 'progreso': renderProgreso(); break;
      case 'medidas': renderMedidas(); break;
      case 'nutricion': renderNutricion(); break;
      case 'comparar': renderComparar(); break;
      case 'ajustes': renderAjustes(); break;
    }
  } catch (err) {
    console.error('Error renderizando pestaña', State.currentTab, err);
  }
}

/* ---------------------------------------------------------------------- */
/* USUARIOS                                                                */
/* ---------------------------------------------------------------------- */
function renderUserSelect() {
  const sel = document.getElementById('userSelect');
  sel.innerHTML = '';
  if (!State.users.length) {
    const opt = document.createElement('option');
    opt.textContent = 'Sin perfiles';
    sel.appendChild(opt);
    return;
  }
  State.users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.name;
    if (u.id === State.activeUserId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function promptNewUser() {
  const name = prompt('¿Cómo se llama esta persona?');
  if (!name || !name.trim()) return;
  const id = STORAGE.createUser(name.trim());
  State.activeUserId = id;
  toast(`Perfil "${name.trim()}" creado`);
  refreshAll();
}

function onSaveProfile() {
  const p = State.activeUserData.profile;
  p.name = document.getElementById('settName').value.trim() || p.name;
  p.sex = document.getElementById('settSex').value;
  p.age = numOrNull(document.getElementById('settAge').value);
  p.heightCm = numOrNull(document.getElementById('settHeight').value);
  p.weightKg = numOrNull(document.getElementById('settWeight').value);
  STORAGE.saveUserData(State.activeUserId, State.activeUserData);
  STORAGE.renameUser(State.activeUserId, p.name);
  toast('Perfil guardado');
  refreshAll();
}

function onDeleteUser() {
  if (!State.activeUserId) return;
  const u = State.users.find(x => x.id === State.activeUserId);
  if (!confirm(`¿Eliminar el perfil "${u ? u.name : ''}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
  STORAGE.deleteUser(State.activeUserId);
  State.activeUserId = STORAGE.getActiveUserId();
  toast('Perfil eliminado');
  refreshAll();
}

function onExport() {
  const payload = STORAGE.exportAllData();
  STORAGE.downloadJSON(payload, `el-camino-backup-${PROGRAM.fmtISO(new Date())}.json`);
}

function onImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      STORAGE.importAllData(payload, 'merge');
      toast('Datos importados correctamente');
      State.activeUserId = STORAGE.getActiveUserId();
      refreshAll();
    } catch (err) {
      toast('No se pudo importar: archivo inválido');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* ---------------------------------------------------------------------- */
/* HELPERS COMPARTIDOS DE PROGRESO                                          */
/* ---------------------------------------------------------------------- */
function getProgressStatus(calendar, completedDays) {
  if (!calendar) return { todayIdx: -1, currentDay: null, completedCount: 0, adherenceBase: 0, adherencePct: 0 };

  const todayIso = PROGRAM.fmtISO(new Date());
  const todayIdx = calendar.findIndex(d => d.isoDate === todayIso);
  const completedCount = Object.values(completedDays).filter(Boolean).length;

  let currentDay, adherenceBase;
  if (todayIdx >= 0) {
    currentDay = calendar[todayIdx];
    adherenceBase = todayIdx + 1;
  } else if (new Date(todayIso) < new Date(calendar[0].isoDate)) {
    currentDay = calendar[0];
    adherenceBase = 0;
  } else {
    currentDay = calendar[calendar.length - 1];
    adherenceBase = calendar.length;
  }
  const adherencePct = adherenceBase > 0 ? Math.round((completedCount / adherenceBase) * 100) : 0;
  return { todayIdx, currentDay, completedCount, adherenceBase, adherencePct };
}

/* ---------------------------------------------------------------------- */
/* INICIO (DASHBOARD)                                                       */
/* ---------------------------------------------------------------------- */
function renderInicio() {
  const data = State.activeUserData;

  document.getElementById('startDateInput').value = data.startDate || '';
  document.getElementById('prepToggle').checked = data.settings.includePrepPhase;
  const note = document.getElementById('startDateNote');

  if (!State.calendar) {
    note.textContent = 'Aún no has definido tu fecha de inicio.';
    document.getElementById('statPhase').textContent = '—';
    document.getElementById('statWeek').textContent = '—';
    document.getElementById('statCompleted').textContent = '—';
    document.getElementById('statAdherence').textContent = '—';
    document.getElementById('statStreak').textContent = '—';
    document.getElementById('todayWorkout').innerHTML = '<p class="card__hint">Guarda tu fecha de inicio para ver el entrenamiento de hoy.</p>';
    document.getElementById('upcomingStrip').innerHTML = '';
    renderRing(null);
    return;
  }
  note.textContent = `El programa termina el ${State.calendar[State.calendar.length - 1].humanDate}.`;

  const { todayIdx, currentDay, completedCount, adherencePct } = getProgressStatus(State.calendar, data.completedDays);

  document.getElementById('statPhase').textContent = currentDay.phaseName;
  document.getElementById('statWeek').textContent = `Semana ${currentDay.week} de ${State.calendar.totalWeeks}`;
  document.getElementById('statCompleted').textContent = `${completedCount} / ${State.calendar.length}`;
  document.getElementById('statAdherence').textContent = `${adherencePct}%`;
  document.getElementById('statStreak').textContent = `${computeStreak(data)} días`;

  renderRing(currentDay);
  renderTodayWorkout(todayIdx >= 0 ? State.calendar[todayIdx] : null);
  renderUpcomingStrip(todayIdx);
}

function computeStreak(data) {
  const dates = Object.keys(data.completedDays).filter(k => data.completedDays[k]).sort();
  if (!dates.length) return 0;
  let streak = 1;
  let maxStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const cur = new Date(dates[i]);
    const diffDays = Math.round((cur - prev) / 86400000);
    if (diffDays === 1) { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 1;
  }
  // racha activa: cuenta hacia atrás desde hoy/ayer
  const todayIso = PROGRAM.fmtISO(new Date());
  let activeStreak = 0;
  let cursor = new Date(todayIso);
  while (data.completedDays[PROGRAM.fmtISO(cursor)]) {
    activeStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return activeStreak;
}

function renderTodayWorkout(day) {
  const el = document.getElementById('todayWorkout');
  if (!day) {
    el.innerHTML = '<p class="card__hint">Hoy está fuera del rango del programa (aún no empieza o ya terminó).</p>';
    return;
  }
  const meta = PROGRAM.WORKOUT_TYPE_META[day.workoutType];
  const isDone = !!State.activeUserData.completedDays[day.isoDate];
  el.innerHTML = `
    <div class="today-workout__info">
      <div class="today-workout__icon">${meta.icon}</div>
      <div>
        <div class="today-workout__label">${day.workoutLabel}</div>
        <div class="today-workout__meta">Día ${day.index} · Semana ${day.week} · ${day.phaseName} · ${day.workoutDuration}</div>
        <div class="today-workout__detail">${day.workoutDetail}</div>
      </div>
    </div>
    <button class="check-toggle ${isDone ? 'done' : ''}" id="todayCheckBtn">${isDone ? '✓ Completado' : 'Marcar como hecho'}</button>
  `;
  document.getElementById('todayCheckBtn').addEventListener('click', () => {
    toggleDayCompleted(day.isoDate);
    renderInicio();
  });
}

function renderUpcomingStrip(todayIdx) {
  const el = document.getElementById('upcomingStrip');
  el.innerHTML = '';
  const start = todayIdx >= 0 ? todayIdx : 0;
  const slice = State.calendar.slice(start, start + 7);
  slice.forEach(day => {
    const meta = PROGRAM.WORKOUT_TYPE_META[day.workoutType];
    const isDone = !!State.activeUserData.completedDays[day.isoDate];
    const isToday = day.isoDate === PROGRAM.fmtISO(new Date());
    const div = document.createElement('div');
    div.className = `upcoming-day ${isToday ? 'today' : ''} ${isDone ? 'completed' : ''}`;
    div.innerHTML = `
      <div class="upcoming-day__date">${day.weekdayName.slice(0,3)} ${day.humanDate.split(' ')[0]}</div>
      <div class="upcoming-day__icon">${meta.icon}</div>
      <div class="upcoming-day__label">${day.workoutLabel}</div>
    `;
    div.addEventListener('click', () => openDayModal(day));
    el.appendChild(div);
  });
}

/* ---- Ring SVG (elemento distintivo: anillos de crecimiento) ------------- */
function renderRing(currentDay) {
  const svg = document.getElementById('ringSvg');
  const legend = document.getElementById('ringLegend');
  svg.innerHTML = '';
  legend.innerHTML = '';

  const cx = 110, cy = 110, r = 92, strokeWidth = 14;
  const circumference = 2 * Math.PI * r;

  // fondo
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r);
  bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', '#22262e'); bg.setAttribute('stroke-width', strokeWidth);
  svg.appendChild(bg);

  const phases = State.calendar ? State.calendar.phases : PROGRAM.DEFAULT_PHASES;
  const totalDays = State.calendar ? State.calendar.totalDays : PROGRAM.DEFAULT_TOTAL_WEEKS * 7;

  phases.forEach(phase => {
    const startFrac = ((phase.weekStart - 1) * 7) / totalDays;
    const endFrac = (phase.weekEnd * 7) / totalDays;
    const arcLen = (endFrac - startFrac) * circumference;
    const gap = 2;
    const seg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    seg.setAttribute('cx', cx); seg.setAttribute('cy', cy); seg.setAttribute('r', r);
    seg.setAttribute('fill', 'none');
    seg.setAttribute('stroke', phase.color);
    seg.setAttribute('stroke-width', strokeWidth);
    seg.setAttribute('stroke-dasharray', `${Math.max(arcLen - gap, 0)} ${circumference - arcLen + gap}`);
    seg.setAttribute('stroke-dashoffset', -startFrac * circumference);
    seg.setAttribute('stroke-linecap', 'round');
    seg.style.opacity = '0.35';
    svg.appendChild(seg);
  });

  // progreso completado (radio interior, superpuesto según días marcados)
  if (currentDay) {
    const doneFrac = Math.min(currentDay.index / totalDays, 1);
    const progress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progress.setAttribute('cx', cx); progress.setAttribute('cy', cy); progress.setAttribute('r', r);
    progress.setAttribute('fill', 'none');
    progress.setAttribute('stroke', currentDay.phaseColor);
    progress.setAttribute('stroke-width', strokeWidth);
    progress.setAttribute('stroke-dasharray', `${doneFrac * circumference} ${circumference}`);
    progress.setAttribute('stroke-linecap', 'round');
    svg.appendChild(progress);
    document.getElementById('ringDayLabel').textContent = currentDay.index;
  } else {
    document.getElementById('ringDayLabel').textContent = '—';
  }

  phases.filter((p, i, arr) => arr.findIndex(x => x.short === p.short) === i).forEach(phase => {
    const span = document.createElement('span');
    span.innerHTML = `<i style="background:${phase.color}"></i>${phase.short}`;
    legend.appendChild(span);
  });
}

/* ---------------------------------------------------------------------- */
/* CALENDARIO                                                               */
/* ---------------------------------------------------------------------- */
function renderCalendario() {
  const container = document.getElementById('calendarContainer');
  const filterEl = document.getElementById('phaseFilter');

  if (!State.calendar) {
    container.innerHTML = '<p class="card__hint">Primero define tu fecha de inicio en la pestaña Inicio.</p>';
    filterEl.innerHTML = '';
    return;
  }

  // filtros de fase (únicos)
  filterEl.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = `phase-chip ${!State.calendarFilter ? 'active' : ''}`;
  allChip.textContent = 'Todas las fases';
  allChip.style.background = !State.calendarFilter ? 'var(--accent)' : '';
  allChip.addEventListener('click', () => { State.calendarFilter = null; renderCalendario(); });
  filterEl.appendChild(allChip);

  const seen = new Set();
  State.calendar.phases.forEach(phase => {
    if (seen.has(phase.name)) return;
    seen.add(phase.name);
    const chip = document.createElement('button');
    chip.className = `phase-chip ${State.calendarFilter === phase.id ? 'active' : ''}`;
    chip.textContent = phase.name;
    if (State.calendarFilter === phase.id) chip.style.background = phase.color;
    chip.addEventListener('click', () => { State.calendarFilter = phase.id; renderCalendario(); });
    filterEl.appendChild(chip);
  });

  container.innerHTML = '';
  const todayIso = PROGRAM.fmtISO(new Date());

  for (let week = 1; week <= State.calendar.totalWeeks; week++) {
    const weekDays = State.calendar.filter(d => d.week === week);
    if (State.calendarFilter && weekDays[0].phaseId !== State.calendarFilter) continue;

    const doneCount = weekDays.filter(d => State.activeUserData.completedDays[d.isoDate]).length;
    const banner = weekDays[0].weekBanner;

    const block = document.createElement('div');
    block.className = 'week-block';
    block.innerHTML = `
      <div class="week-block__header">
        <span class="dot" style="background:${weekDays[0].phaseColor}"></span>
        Semana ${week} · ${weekDays[0].phaseName} · ${weekDays[0].humanDate} — ${weekDays[6].humanDate}
        ${banner ? `<span class="week-banner">${banner}</span>` : ''}
        <span class="week-progress">${doneCount}/7 completados</span>
      </div>
      <div class="day-grid"></div>
    `;
    const grid = block.querySelector('.day-grid');

    weekDays.forEach(day => {
      const meta = PROGRAM.WORKOUT_TYPE_META[day.workoutType];
      const isDone = !!State.activeUserData.completedDays[day.isoDate];
      const isToday = day.isoDate === todayIso;
      const card = document.createElement('div');
      card.className = `day-card ${isToday ? 'is-today' : ''} ${isDone ? 'is-completed' : ''} ${day.isRest ? 'is-rest' : ''}`;
      card.innerHTML = `
        ${isDone ? '<span class="day-card__check">✓</span>' : ''}
        <div class="day-card__date">${day.weekdayName.slice(0,3)} ${day.humanDate.split(' ')[0]}</div>
        <div class="day-card__icon">${meta.icon}</div>
        <div class="day-card__label">${day.workoutLabel}</div>
      `;
      card.addEventListener('click', () => openDayModal(day));
      grid.appendChild(card);
    });

    container.appendChild(block);
  }
}

function openDayModal(day) {
  const modal = document.getElementById('dayModal');
  const body = document.getElementById('modalBody');
  const meta = PROGRAM.WORKOUT_TYPE_META[day.workoutType];
  const isDone = !!State.activeUserData.completedDays[day.isoDate];

  body.innerHTML = `
    <div style="font-size:34px; margin-bottom:8px;">${meta.icon}</div>
    <h3 class="modal-title">${day.workoutLabel}</h3>
    <div class="modal-sub">${day.weekdayName} ${day.humanDate} · Día ${day.index}/${State.calendar.totalDays}</div>
    <p class="modal-detail">${day.workoutDetail}</p>
    <div class="modal-meta">
      <span>⏱ ${day.workoutDuration}</span>
      <span>📍 ${day.phaseName}</span>
      <span>📅 Semana ${day.week}</span>
    </div>
    ${day.weekBanner ? `<div class="week-banner" style="display:block; margin-bottom:14px;">${day.weekBanner}</div>` : ''}
    <button class="check-toggle ${isDone ? 'done' : ''}" id="modalCheckBtn" style="width:100%; justify-content:center; display:flex;">
      ${isDone ? '✓ Completado — quitar marca' : 'Marcar como completado'}
    </button>
  `;
  document.getElementById('modalCheckBtn').addEventListener('click', () => {
    toggleDayCompleted(day.isoDate);
    closeModal();
    renderCurrentTab();
  });
  modal.hidden = false;
}

function closeModal() {
  document.getElementById('dayModal').hidden = true;
}

function toggleDayCompleted(isoDate) {
  const data = State.activeUserData;
  data.completedDays[isoDate] = !data.completedDays[isoDate];
  if (!data.completedDays[isoDate]) delete data.completedDays[isoDate];
  STORAGE.saveUserData(State.activeUserId, data);
}

/* ---------------------------------------------------------------------- */
/* PROGRESO                                                                 */
/* ---------------------------------------------------------------------- */
function renderProgreso() {
  const data = State.activeUserData;

  // Peso
  const weightSeries = data.measurements
    .filter(m => m.weightKg)
    .map(m => ({ x: m.date, y: Number(m.weightKg) }));
  CHARTS.renderWeightChart('weightChart', [{ label: State.activeUserData.profile.name || 'Peso', data: weightSeries, color: '#c1502e' }]);

  // Adherencia por fase
  if (State.calendar) {
    const uniquePhases = [];
    State.calendar.phases.forEach(p => { if (!uniquePhases.find(x => x.name === p.name)) uniquePhases.push(p); });
    const labels = uniquePhases.map(p => p.short);
    const colors = uniquePhases.map(p => p.color);
    const values = uniquePhases.map(p => {
      const days = State.calendar.filter(d => d.phaseName === p.name);
      const todayIso = PROGRAM.fmtISO(new Date());
      const pastDays = days.filter(d => d.isoDate <= todayIso);
      if (!pastDays.length) return 0;
      const done = pastDays.filter(d => data.completedDays[d.isoDate]).length;
      return Math.round((done / pastDays.length) * 100);
    });
    CHARTS.renderBarChart('phaseChart', labels, values, colors);
  }

  renderHeatmap();
}

function renderHeatmap() {
  const el = document.getElementById('heatmap');
  el.innerHTML = '';
  if (!State.calendar) { el.innerHTML = '<p class="card__hint">Define tu fecha de inicio primero.</p>'; return; }
  const todayIso = PROGRAM.fmtISO(new Date());
  State.calendar.forEach(day => {
    const i = document.createElement('i');
    if (day.isoDate > todayIso) i.className = 'future';
    else if (State.activeUserData.completedDays[day.isoDate]) i.className = 'done';
    else i.className = 'pending';
    i.title = `${day.humanDate} — ${day.workoutLabel}`;
    el.appendChild(i);
  });
}

/* ---------------------------------------------------------------------- */
/* MEDIDAS                                                                  */
/* ---------------------------------------------------------------------- */
function renderMedidas() {
  document.getElementById('mDate').value = PROGRAM.fmtISO(new Date());
  renderMeasurementsTable();
  renderBeforeDuringAfter();
}

function onAddMeasurement(e) {
  e.preventDefault();
  const entry = {
    date: document.getElementById('mDate').value,
    weightKg: numOrNull(document.getElementById('mWeight').value),
    waist: numOrNull(document.getElementById('mWaist').value),
    chest: numOrNull(document.getElementById('mChest').value),
    arm: numOrNull(document.getElementById('mArm').value),
    thigh: numOrNull(document.getElementById('mThigh').value),
    bodyFatPct: numOrNull(document.getElementById('mBodyfat').value),
    notes: document.getElementById('mNotes').value.trim(),
  };
  if (!entry.date) { toast('Elige una fecha'); return; }
  STORAGE.addMeasurement(State.activeUserId, entry);
  State.activeUserData = STORAGE.getUserData(State.activeUserId);
  e.target.reset();
  document.getElementById('mDate').value = PROGRAM.fmtISO(new Date());
  toast('Registro guardado');
  renderMedidas();
}

function renderMeasurementsTable() {
  const tbody = document.querySelector('#measurementsTable tbody');
  tbody.innerHTML = '';
  const list = [...State.activeUserData.measurements].sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="card__hint">Aún no hay registros.</td></tr>';
    return;
  }
  list.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m.date}</td>
      <td class="num">${m.weightKg ?? '—'}</td>
      <td class="num">${m.waist ?? '—'}</td>
      <td class="num">${m.chest ?? '—'}</td>
      <td class="num">${m.arm ?? '—'}</td>
      <td class="num">${m.thigh ?? '—'}</td>
      <td class="num">${m.bodyFatPct ?? '—'}</td>
      <td>${m.notes || ''}</td>
      <td><button class="btn btn--ghost btn--sm" data-del="${m.id}">Borrar</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      STORAGE.deleteMeasurement(State.activeUserId, btn.dataset.del);
      State.activeUserData = STORAGE.getUserData(State.activeUserId);
      renderMedidas();
    });
  });
}

function renderBeforeDuringAfter() {
  const el = document.getElementById('beforeDuringAfter');
  const list = [...State.activeUserData.measurements].sort((a, b) => a.date.localeCompare(b.date));
  if (list.length < 2) {
    el.innerHTML = '<p class="card__hint">Necesitas al menos 2 registros para comparar. Registra tu punto de partida y ve añadiendo más cada 2-4 semanas.</p>';
    return;
  }
  const before = list[0];
  const after = list[list.length - 1];
  const mid = list[Math.floor(list.length / 2)];
  const points = list.length >= 3 ? [before, mid, after] : [before, after];
  const labels = points.length === 3 ? ['Antes', 'Durante', 'Después (más reciente)'] : ['Antes', 'Después (más reciente)'];

  el.innerHTML = points.map((p, i) => `
    <div class="card" style="background:var(--surface-2)">
      <h4 style="font-family:var(--font-display); font-size:13px; letter-spacing:.03em; text-transform:uppercase; color:var(--gold); margin:0 0 8px;">${labels[i]}</h4>
      <div class="fine-print" style="margin-bottom:8px;">${p.date}</div>
      <div class="stat-row"><span>Peso</span><strong>${p.weightKg ?? '—'} kg</strong></div>
      <div class="stat-row"><span>Cintura</span><strong>${p.waist ?? '—'} cm</strong></div>
      <div class="stat-row"><span>Pecho</span><strong>${p.chest ?? '—'} cm</strong></div>
      <div class="stat-row"><span>Brazo</span><strong>${p.arm ?? '—'} cm</strong></div>
      <div class="stat-row"><span>Muslo</span><strong>${p.thigh ?? '—'} cm</strong></div>
      <div class="stat-row"><span>% Grasa</span><strong>${p.bodyFatPct ?? '—'}</strong></div>
    </div>
  `).join('');
}

/* ---------------------------------------------------------------------- */
/* NUTRICION                                                                */
/* ---------------------------------------------------------------------- */
function renderNutricion() {
  const p = State.activeUserData.profile;
  if (p.weightKg) document.getElementById('pWeight').value = p.weightKg;
  if (p.weightKg) document.getElementById('tWeight').value = p.weightKg;
  if (p.age) document.getElementById('tAge').value = p.age;
  if (p.heightCm) document.getElementById('tHeight').value = p.heightCm;
  if (p.sex) document.getElementById('tSex').value = p.sex;

  const activitySel = document.getElementById('tActivity');
  if (!activitySel.dataset.filled) {
    activitySel.innerHTML = CALC.ACTIVITY_FACTORS.map(a => `<option value="${a.id}">${a.label}</option>`).join('');
    activitySel.dataset.filled = '1';
  }
  activitySel.value = p.activity || 'sedentary';

  const goalSel = document.getElementById('tGoal');
  if (!goalSel.dataset.filled) {
    goalSel.innerHTML = CALC.GOALS.map(g => `<option value="${g.id}">${g.label}</option>`).join('');
    goalSel.dataset.filled = '1';
  }
  goalSel.value = State.activeUserData.nutrition.goal || 'maintain';

  renderProteinCalc();
  renderTdeeCalc();
  renderFoodTables();
  renderMealBank();
  renderDeloadTips();
}

function renderProteinCalc() {
  const weight = numOrNull(document.getElementById('pWeight').value);
  const level = Number(document.getElementById('pLevel').value);
  const box = document.getElementById('proteinResult');
  if (!weight) { box.innerHTML = '<p class="card__hint">Ingresa tu peso corporal.</p>'; return; }

  const total = CALC.calcProtein(weight, level);
  const range = CALC.proteinRange(weight);
  const palms = CALC.proteinToPalms(total);

  box.innerHTML = `
    <div class="result-box__big">${total} g/día</div>
    <div class="result-box__label">≈ ${palms} palmas de mano de proteína repartidas en el día (1 palma ≈ 25 g)</div>
    <div class="result-box__row"><span>Mínimo (1.6 g/kg)</span><strong>${range.min} g</strong></div>
    <div class="result-box__row"><span>Recomendado (1.9 g/kg)</span><strong>${range.mid} g</strong></div>
    <div class="result-box__row"><span>Máximo (2.2 g/kg)</span><strong>${range.max} g</strong></div>
  `;
}

function renderTdeeCalc() {
  const sex = document.getElementById('tSex').value;
  const age = numOrNull(document.getElementById('tAge').value);
  const heightCm = numOrNull(document.getElementById('tHeight').value);
  const weightKg = numOrNull(document.getElementById('tWeight').value);
  const activity = document.getElementById('tActivity').value;
  const goal = document.getElementById('tGoal').value;
  const box = document.getElementById('tdeeResult');

  if (!age || !heightCm || !weightKg) {
    box.innerHTML = '<p class="card__hint">Completa edad, altura y peso.</p>';
    return;
  }

  const bmr = CALC.calcBMR({ weightKg, heightCm, age, sex });
  const tdee = CALC.calcTDEE(bmr, activity);
  const targetCal = CALC.calcTargetCalories(tdee, goal);
  const macros = CALC.calcMacros({ weightKg, targetCalories: targetCal, proteinGPerKg: 1.9 });

  const proteinShare = Math.round((macros.proteinKcal / targetCal) * 100);
  const fatShare = Math.round((macros.fatKcal / targetCal) * 100);
  const carbShare = Math.max(100 - proteinShare - fatShare, 0);

  box.innerHTML = `
    <div class="result-box__row"><span>TMB (Mifflin-St Jeor)</span><strong>${bmr} kcal</strong></div>
    <div class="result-box__row"><span>Gasto total diario (TDEE)</span><strong>${tdee} kcal</strong></div>
    <div class="result-box__row"><span>Calorías objetivo</span><strong>${targetCal} kcal</strong></div>
    <div class="result-box__label" style="margin-top:12px;">Reparto de macros sugerido</div>
    <div class="macro-bars">
      <span style="width:${proteinShare}%; background:var(--accent)"></span>
      <span style="width:${fatShare}%; background:var(--gold)"></span>
      <span style="width:${carbShare}%; background:var(--blue)"></span>
    </div>
    <div class="result-box__row"><span>🟧 Proteína</span><strong>${macros.proteinG} g (${proteinShare}%)</strong></div>
    <div class="result-box__row"><span>🟨 Grasas</span><strong>${macros.fatG} g (${fatShare}%)</strong></div>
    <div class="result-box__row"><span>🟦 Carbohidratos</span><strong>${macros.carbsG} g (${carbShare}%)</strong></div>
  `;

  // guardar preferencia de objetivo
  if (State.activeUserData.nutrition.goal !== goal) {
    State.activeUserData.nutrition.goal = goal;
    STORAGE.saveUserData(State.activeUserId, State.activeUserData);
  }
}

function renderFoodTables() {
  const vBody = document.querySelector('#foodVisualTable tbody');
  if (!vBody.dataset.filled) {
    vBody.innerHTML = NUTRITION_DATA.FOOD_VISUAL.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td class="num">${row[2]}</td></tr>`).join('');
    vBody.dataset.filled = '1';
  }
  const gBody = document.querySelector('#foodGramsTable tbody');
  if (!gBody.dataset.filled) {
    gBody.innerHTML = NUTRITION_DATA.FOOD_GRAMS.map(row => `<tr><td>${row[0]}</td><td class="num">${row[1]}</td></tr>`).join('');
    gBody.dataset.filled = '1';
  }
}

function renderMealBank() {
  const el = document.getElementById('mealBank');
  if (el.dataset.filled) return;
  const groups = [
    ['Desayunos', NUTRITION_DATA.MEAL_BANK.desayunos],
    ['Almuerzos', NUTRITION_DATA.MEAL_BANK.almuerzos],
    ['Cenas', NUTRITION_DATA.MEAL_BANK.cenas],
    ['Snacks', NUTRITION_DATA.MEAL_BANK.snacks],
  ];
  el.innerHTML = groups.map(([title, items]) => `
    <div class="meal-bank__group">
      <h4>${title}</h4>
      ${items.map(it => `<div class="meal-bank__item"><span>${it.code} · ${it.label}</span><strong>${it.protein} g</strong></div>`).join('')}
    </div>
  `).join('');
  el.dataset.filled = '1';
}

function renderDeloadTips() {
  const el = document.getElementById('deloadTips');
  if (el.dataset.filled) return;
  const t = NUTRITION_DATA.DELOAD_TIPS;
  el.innerHTML = `
    <div><h4>Principios</h4><ul>${t.principles.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div><h4>Ayuda extra</h4><ul>${t.extras.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div><h4>Evitar</h4><ul>${t.avoid.map(x => `<li>${x}</li>`).join('')}</ul></div>
  `;
  el.dataset.filled = '1';
}

/* ---------------------------------------------------------------------- */
/* COMPARAR                                                                  */
/* ---------------------------------------------------------------------- */
let compareSelection = new Set();

function renderComparar() {
  const el = document.getElementById('compareSelector');
  el.innerHTML = '';
  if (!State.users.length) { el.innerHTML = '<p class="card__hint">Crea al menos 2 perfiles para comparar.</p>'; return; }

  if (compareSelection.size === 0) {
    State.users.slice(0, Math.min(3, State.users.length)).forEach(u => compareSelection.add(u.id));
  }

  State.users.forEach((u, i) => {
    const label = document.createElement('label');
    label.className = 'compare-check';
    const checked = compareSelection.has(u.id);
    label.innerHTML = `<input type="checkbox" ${checked ? 'checked' : ''} data-uid="${u.id}"> <span style="color:${CHARTS.CHART_COLORS[i % CHARTS.CHART_COLORS.length]}">●</span> ${u.name}`;
    label.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) compareSelection.add(u.id); else compareSelection.delete(u.id);
      renderComparar();
    });
    el.appendChild(label);
  });

  const selectedUsers = State.users.filter(u => compareSelection.has(u.id));
  const series = [];
  const tableRows = [];

  selectedUsers.forEach((u, i) => {
    const data = STORAGE.getUserData(u.id);
    const color = CHARTS.CHART_COLORS[i % CHARTS.CHART_COLORS.length];
    const weightData = data.measurements.filter(m => m.weightKg).map(m => ({ x: m.date, y: Number(m.weightKg) }));
    series.push({ label: u.name, data: weightData, color });

    let calendar = null;
    let progress = { currentDay: null, completedCount: 0, adherencePct: 0 };
    if (data.startDate) {
      calendar = PROGRAM.buildFullCalendar(data.startDate, { includePrep: data.settings.includePrepPhase });
      progress = getProgressStatus(calendar, data.completedDays);
    }
    const currentDay = progress.currentDay;
    const completedCount = progress.completedCount;
    const adherencePct = progress.adherencePct;

    const sortedM = [...data.measurements].sort((a,b) => a.date.localeCompare(b.date));
    const firstW = sortedM.find(m => m.weightKg)?.weightKg;
    const lastW = [...sortedM].reverse().find(m => m.weightKg)?.weightKg;
    const deltaW = (firstW && lastW) ? (lastW - firstW).toFixed(1) : null;

    tableRows.push(`
      <tr>
        <td><span style="color:${color}">●</span> ${u.name}</td>
        <td>${data.startDate || '—'}</td>
        <td class="num">${currentDay ? currentDay.index + '/' + calendar.totalDays : '—'}</td>
        <td>${currentDay ? currentDay.phaseShort : '—'}</td>
        <td class="num">${completedCount}</td>
        <td class="num">${adherencePct}%</td>
        <td class="num">${firstW ?? '—'}</td>
        <td class="num">${lastW ?? '—'}</td>
        <td class="num">${deltaW !== null ? (deltaW > 0 ? '+' : '') + deltaW + ' kg' : '—'}</td>
      </tr>
    `);
  });

  CHARTS.renderWeightChart('compareWeightChart', series);

  const adherenceLabels = selectedUsers.map(u => u.name);
  const adherenceValues = selectedUsers.map(u => {
    const data = STORAGE.getUserData(u.id);
    if (!data.startDate) return 0;
    const calendar = PROGRAM.buildFullCalendar(data.startDate, { includePrep: data.settings.includePrepPhase });
    return getProgressStatus(calendar, data.completedDays).adherencePct;
  });
  CHARTS.renderBarChart('compareAdherenceChart', adherenceLabels, adherenceValues, selectedUsers.map((_, i) => CHARTS.CHART_COLORS[i % CHARTS.CHART_COLORS.length]));

  document.querySelector('#compareTable tbody').innerHTML = tableRows.join('') || '<tr><td colspan="9" class="card__hint">Selecciona al menos un perfil.</td></tr>';
}

/* ---------------------------------------------------------------------- */
/* AJUSTES                                                                   */
/* ---------------------------------------------------------------------- */
function renderAjustes() {
  const p = State.activeUserData.profile;
  document.getElementById('settName').value = p.name || '';
  document.getElementById('settSex').value = p.sex || 'male';
  document.getElementById('settAge').value = p.age || '';
  document.getElementById('settHeight').value = p.heightCm || '';
  document.getElementById('settWeight').value = p.weightKg || '';
}

/* ---------------------------------------------------------------------- */
/* UTILIDADES                                                                */
/* ---------------------------------------------------------------------- */
function numOrNull(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; el.classList.remove('show'); }, 2600);
}
