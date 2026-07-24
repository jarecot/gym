/* =========================================================================
   PROGRAM.JS
   Define la periodización completa: 645 → Chop Wood Carry Water → Dig Deeper
   52 semanas / 364 días. Genera el calendario completo a partir de una
   fecha de inicio elegida por el usuario.
   ========================================================================= */

const PHASES = [
  { id: 'p0',  key:'phase0',      name: 'Fase 0 · Preparación',        short: 'Prep',   weekStart: 1,  weekEnd: 3,  color: '#8C97A8' },
  { id: 'p1',  key:'phase1',      name: 'Fase 1 · 645',                short: '645',    weekStart: 4,  weekEnd: 16, color: '#C1502E' },
  { id: 'd1',  key:'deload',      name: 'Descarga activa',             short: 'Desc.',  weekStart: 17, weekEnd: 17, color: '#4C9A6A' },
  { id: 'p2',  key:'phase2',      name: 'Fase 2 · Chop Wood Carry Water', short: 'CWCW', weekStart: 18, weekEnd: 22, color: '#C9A24B' },
  { id: 'd2',  key:'deload',      name: 'Descarga activa',             short: 'Desc.',  weekStart: 23, weekEnd: 23, color: '#4C9A6A' },
  { id: 'p3',  key:'phase3',      name: 'Fase 3 · Dig Deeper (Ronda 1)', short: 'DD·R1', weekStart: 24, weekEnd: 35, color: '#8B6BC7' },
  { id: 'd3',  key:'deload',      name: 'Descarga activa',             short: 'Desc.',  weekStart: 36, weekEnd: 36, color: '#4C9A6A' },
  { id: 'p4',  key:'phase4',      name: 'Fase 4 · Dig Deeper (Ronda 2)', short: 'DD·R2', weekStart: 37, weekEnd: 48, color: '#5C6BC0' },
  { id: 'd4',  key:'deload',      name: 'Descarga activa',             short: 'Desc.',  weekStart: 49, weekEnd: 49, color: '#4C9A6A' },
  { id: 'tr',  key:'transition',  name: 'Transición · CWCW breve',     short: 'Trans.', weekStart: 50, weekEnd: 52, color: '#8C97A8' },
];

const TOTAL_WEEKS = 52;
const TOTAL_DAYS = TOTAL_WEEKS * 7;

function getPhaseForWeek(week) {
  return PHASES.find(p => week >= p.weekStart && week <= p.weekEnd);
}

/* ---- Patrones de día por tipo de semana --------------------------------- */
// dayInWeek: 0=día1 ... 6=día7 (relativo al inicio elegido por el usuario, no necesariamente lunes real)

const DELOAD_PATTERN = [
  { type: 'movilidad', label: 'Movilidad articular completa', detail: 'Cadera, hombro, tobillo, columna torácica. Sin prisa.', duration: '20-25 min' },
  { type: 'cardio',     label: 'Cardio zona 2 suave',          detail: 'Caminata inclinada, bici o natación, ritmo conversacional.', duration: '25-35 min' },
  { type: 'movilidad',  label: 'Yoga / estiramiento dinámico', detail: 'Zonas con más carga reciente: isquiotibiales, dorsal, hombros.', duration: '25-30 min' },
  { type: 'cardio',     label: 'Cardio zona 2 suave',          detail: 'Igual que el día anterior, o caminata al aire libre.', duration: '25-35 min' },
  { type: 'core',       label: 'Core + activación ligera',     detail: 'Plancha, bird-dog, dead bug. Sin peso o muy liviano.', duration: '20-25 min' },
  { type: 'recreativo', label: 'Actividad recreativa',         detail: 'Caminata larga, senderismo suave, nadar por placer.', duration: '30-45 min' },
  { type: 'descanso',   label: 'Descanso completo',            detail: 'Nada estructurado. Prioriza el sueño.', duration: '—' },
];

const PHASE0_PATTERN = [
  { type: 'fuerza',    label: 'Fuerza básica + movilidad', detail: 'Sentadilla, bisagra de cadera, empuje, tracción, core. Cargas ligeras.', duration: '30-35 min' },
  { type: 'cardio',    label: 'Cardio zona 2',             detail: 'Caminata inclinada, bici o elíptica. Conversación posible.', duration: '20-30 min' },
  { type: 'fuerza',    label: 'Fuerza básica + movilidad', detail: 'Sentadilla, bisagra de cadera, empuje, tracción, core. Cargas ligeras.', duration: '30-35 min' },
  { type: 'cardio',    label: 'Cardio zona 2',             detail: 'Caminata inclinada, bici o elíptica. Conversación posible.', duration: '20-30 min' },
  { type: 'fuerza',    label: 'Fuerza básica + movilidad', detail: 'Sentadilla, bisagra de cadera, empuje, tracción, core. Cargas ligeras.', duration: '30-35 min' },
  { type: 'movilidad', label: 'Movilidad + caminata larga',  detail: 'Actividad recreativa de baja intensidad.', duration: '30-40 min' },
  { type: 'descanso',  label: 'Descanso completo',          detail: 'Nada estructurado.', duration: '—' },
];

function phase1Pattern6day() {
  return [
    { type: 'fuerza',    label: 'Fuerza Total-Body A', detail: 'Patrón de sentadilla + empuje horizontal + core.', duration: '45 min' },
    { type: 'fuerza',    label: 'Fuerza Total-Body B', detail: 'Patrón de bisagra de cadera + tracción + core.', duration: '45 min' },
    { type: 'movilidad', label: 'Movilidad',           detail: 'Cadera, hombro, columna torácica. Prevención de lesiones.', duration: '30 min' },
    { type: 'fuerza',    label: 'Fuerza Total-Body C', detail: 'Empuje vertical + zancada + core rotacional.', duration: '45 min' },
    { type: 'fuerza',    label: 'Fuerza Total-Body D', detail: 'Tracción vertical + puente de glúteo + core anti-extensión.', duration: '45 min' },
    { type: 'cardio',    label: 'Cardio',              detail: 'Intervalos moderados o steady-state, a elección.', duration: '30 min' },
    { type: 'descanso',  label: 'Descanso completo',   detail: 'Nada estructurado.', duration: '—' },
  ];
}

function phase1Pattern5day() {
  const p = phase1Pattern6day();
  // sustituye el día de cardio dedicado por descanso extra (semanas 4-6)
  p[5] = { type: 'descanso', label: 'Descanso / caminata libre', detail: 'Cardio ligero opcional integrado a tus caminatas diarias.', duration: 'Libre' };
  return p;
}

function phase1PerformanceWeek() {
  return [
    { type: 'fuerza',  label: 'Fuerza — Test de rendimiento A', detail: 'Semana de rendimiento máximo: cierre de la Fase 1.', duration: '45 min' },
    { type: 'fuerza',  label: 'Fuerza — Test de rendimiento B', detail: 'Cargas cercanas a tu mejor marca del bloque.', duration: '45 min' },
    { type: 'movilidad', label: 'Movilidad', detail: 'Mantén el día de movilidad incluso en semana pico.', duration: '30 min' },
    { type: 'fuerza',  label: 'Fuerza — Test de rendimiento C', detail: 'Cargas cercanas a tu mejor marca del bloque.', duration: '45 min' },
    { type: 'fuerza',  label: 'Fuerza — Test de rendimiento D', detail: 'Cargas cercanas a tu mejor marca del bloque.', duration: '45 min' },
    { type: 'cardio',  label: 'Cardio', detail: 'Cierre de fase con esfuerzo moderado-alto.', duration: '30 min' },
    { type: 'descanso', label: 'Descanso completo', detail: 'Prepárate para la semana de descarga que sigue.', duration: '—' },
  ];
}

const CWCW_PATTERN = [
  { type: 'primal', label: 'Tempo Strength', detail: 'Fuerza controlada con tempo, patrones de suelo y bisagra.', duration: '30-35 min' },
  { type: 'primal', label: 'Hot Start',      detail: 'Activación + trabajo primal de movilidad dinámica.', duration: '25-30 min' },
  { type: 'primal', label: 'EMOM Circuit',   detail: 'Circuito cada minuto en punto: fuerza + agilidad.', duration: '30 min' },
  { type: 'primal', label: 'Burnout',        detail: 'Cierre metabólico de alta densidad.', duration: '25-30 min' },
  { type: 'primal', label: 'Tempo Strength', detail: 'Segunda dosis de fuerza controlada de la semana.', duration: '30-35 min' },
  { type: 'recreativo', label: 'Actividad libre / descanso activo', detail: 'Caminata, deporte recreativo, o descanso.', duration: 'Libre' },
  { type: 'descanso', label: 'Descanso completo', detail: 'Nada estructurado.', duration: '—' },
];

function digDeeperPattern(round, collection) {
  const tag = round === 2 ? ' (R2 · +peso)' : '';
  return [
    { type: 'fuerza', label: `${collection} — Empuje${tag}`,  detail: 'Press de banca/hombro, fondos, accesorios de tríceps.', duration: '35-50 min' },
    { type: 'fuerza', label: `${collection} — Tracción${tag}`, detail: 'Remo, dominadas/jalones, accesorios de bíceps y espalda.', duration: '35-50 min' },
    { type: 'fuerza', label: `${collection} — Pierna${tag}`,  detail: 'Sentadilla, peso muerto, zancadas, gemelo.', duration: '35-50 min' },
    { type: 'fuerza', label: `${collection} — Upper Body${tag}`, detail: 'Combinado de empuje/tracción superior, mayor densidad.', duration: '35-50 min' },
    { type: 'fuerza', label: `${collection} — Total Body${tag}`, detail: 'Movimientos compuestos, cierre de la semana de fuerza.', duration: '35-50 min' },
    { type: 'cardio', label: 'Cardio de bajo impacto', detail: 'Opcional pero recomendado para la parte de "definición".', duration: '20-30 min' },
    { type: 'descanso', label: 'Descanso completo', detail: 'Nada estructurado.', duration: '—' },
  ];
}

const TRANSITION_PATTERN = [
  { type: 'primal',   label: 'Movilidad + fuerza ligera', detail: 'Reset de movilidad antes del Año 2.', duration: '30 min' },
  { type: 'cardio',   label: 'Cardio',                   detail: 'Zona 2, ritmo conversacional.', duration: '25-30 min' },
  { type: 'primal',   label: 'Movimiento primal',         detail: 'Patrones de suelo, agilidad, coordinación.', duration: '30 min' },
  { type: 'cardio',   label: 'Cardio',                   detail: 'Zona 2 o intervalos suaves.', duration: '25-30 min' },
  { type: 'descanso', label: 'Descanso',                 detail: 'Día libre antes del fin de semana.', duration: '—' },
  { type: 'recreativo', label: 'Actividad recreativa',   detail: 'Deporte, caminata larga, lo que disfrutes.', duration: 'Libre' },
  { type: 'descanso', label: 'Descanso completo',        detail: 'Cierre del Año 1. ¡Bien hecho!', duration: '—' },
];

const DIGDEEPER_COLLECTIONS_R1 = [
  { weeks: [24,25,26,27], name: 'Dynamic Circuits' },
  { weeks: [28,29,30,31], name: 'Sculpt & Define' },
  { weeks: [32,33,34,35], name: 'The Build' },
];
const DIGDEEPER_COLLECTIONS_R2 = [
  { weeks: [37,38,39,40], name: 'Dynamic Circuits' },
  { weeks: [41,42,43,44], name: 'Sculpt & Define' },
  { weeks: [45,46,47,48], name: 'The Build' },
];

function collectionForWeek(week, table) {
  const found = table.find(c => c.weeks.includes(week));
  return found ? found.name : 'The Build';
}

/* ---- Generador de patrón diario según semana ----------------------------- */
function getWeekPattern(week) {
  const phase = getPhaseForWeek(week);
  if (!phase) return DELOAD_PATTERN;

  switch (phase.key) {
    case 'phase0':
      return PHASE0_PATTERN;
    case 'deload':
      return DELOAD_PATTERN;
    case 'phase1': {
      if ([7, 11, 15].includes(week)) return DELOAD_PATTERN; // deload incorporado al final de cada etapa
      if (week === 16) return phase1PerformanceWeek();
      if (week <= 6) return phase1Pattern5day();
      return phase1Pattern6day();
    }
    case 'phase2':
      return CWCW_PATTERN;
    case 'phase3': {
      const collection = collectionForWeek(week, DIGDEEPER_COLLECTIONS_R1);
      return digDeeperPattern(1, collection);
    }
    case 'phase4': {
      const collection = collectionForWeek(week, DIGDEEPER_COLLECTIONS_R2);
      return digDeeperPattern(2, collection);
    }
    case 'transition':
      return TRANSITION_PATTERN;
    default:
      return DELOAD_PATTERN;
  }
}

/* ---- Utilidad de fechas ---------------------------------------------------- */
function fmtISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAY_NAMES = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
const MONTH_NAMES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function fmtHuman(date) {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Genera el calendario completo de 364 días a partir de una fecha de inicio (Date, o string ISO).
 * Devuelve un array de objetos día con toda la info necesaria para render y tracking.
 */
function buildFullCalendar(startDateInput) {
  const startDate = typeof startDateInput === 'string' ? new Date(startDateInput + 'T00:00:00') : new Date(startDateInput);
  const days = [];

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const week = Math.floor(i / 7) + 1;
    const dayInWeek = i % 7; // 0-6
    const phase = getPhaseForWeek(week);
    const pattern = getWeekPattern(week);
    const workout = pattern[dayInWeek];

    days.push({
      index: i + 1,                    // día 1..364
      isoDate: fmtISO(date),
      humanDate: fmtHuman(date),
      weekdayName: WEEKDAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1],
      week,
      dayInWeek: dayInWeek + 1,        // 1..7
      phaseId: phase ? phase.id : null,
      phaseKey: phase ? phase.key : null,
      phaseName: phase ? phase.name : '—',
      phaseShort: phase ? phase.short : '—',
      phaseColor: phase ? phase.color : '#666',
      workoutType: workout.type,
      workoutLabel: workout.label,
      workoutDetail: workout.detail,
      workoutDuration: workout.duration,
      isRest: workout.type === 'descanso',
    });
  }
  return days;
}

const WORKOUT_TYPE_META = {
  fuerza:     { icon: '🏋️', label: 'Fuerza' },
  movilidad:  { icon: '🤸', label: 'Movilidad' },
  cardio:     { icon: '🏃', label: 'Cardio' },
  core:       { icon: '🧱', label: 'Core' },
  primal:     { icon: '🪵', label: 'Primal' },
  recreativo: { icon: '🌤️', label: 'Recreativo' },
  descanso:   { icon: '😴', label: 'Descanso' },
};

// Exponer en window para uso desde app.js (sin módulos, para simplicidad de GitHub Pages)
window.PROGRAM = {
  PHASES, TOTAL_WEEKS, TOTAL_DAYS,
  getPhaseForWeek, buildFullCalendar, WORKOUT_TYPE_META, fmtISO, fmtHuman,
};
