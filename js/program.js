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

// 645 — el calendario oficial usa EXACTAMENTE los mismos nombres de rutina
// las 13 semanas (incluidas las semanas de descarga y la de rendimiento);
// lo único que cambia semana a semana es el volumen/intensidad interno de
// cada rutina, no su nombre. Fuente: 645 Workout Calendar (Beachbody/BODi).
function phase1Pattern6day(weekLabel) {
  const tag = weekLabel ? ` (${weekLabel})` : '';
  return [
    { type: 'fuerza',    label: `Lower Body Strength${tag}`, detail: 'Rutina oficial 645 del lunes: fuerza de tren inferior.', duration: '45 min' },
    { type: 'fuerza',    label: `Total Body Power${tag}`,    detail: 'Rutina oficial 645 del martes: potencia total-body.', duration: '45 min' },
    { type: 'movilidad', label: `Mobility & Stability${tag}`, detail: 'Rutina oficial 645 del miércoles: movilidad y estabilidad.', duration: '45 min' },
    { type: 'fuerza',    label: `Upper Body Strength${tag}`, detail: 'Rutina oficial 645 del jueves: fuerza de tren superior.', duration: '45 min' },
    { type: 'fuerza',    label: `Total Body Tempo${tag}`,    detail: 'Rutina oficial 645 del viernes: fuerza total-body a tempo controlado.', duration: '45 min' },
    { type: 'cardio',    label: `Cardio 45${tag}`,           detail: 'Rutina oficial 645 del sábado: cardio de 45 minutos.', duration: '45 min' },
    { type: 'descanso',  label: 'Rest',                      detail: 'Descanso oficial del programa 645.', duration: '—' },
  ];
}

function phase1Pattern5day() {
  // Modificación propia (no oficial) para las primeras 3 semanas: se
  // mantienen los 5 días de fuerza/movilidad oficiales y se sustituye el
  // día 6 (Cardio 45) por descanso/caminata libre mientras el cuerpo se
  // readapta. A partir de la semana 4 de esta fase se usa el calendario
  // oficial completo de 6 días (ver phase1Pattern6day).
  const p = phase1Pattern6day();
  p[5] = { type: 'descanso', label: 'Descanso / caminata libre', detail: 'Versión adaptada: cardio ligero opcional integrado a tus caminatas diarias en vez de Cardio 45.', duration: 'Libre' };
  return p;
}

/* ---- Chop Wood Carry Water — calendario oficial de 5 días/semana --------- */
// Fuente: CWCW Workout Calendar 5-Day (BODi, 2023). 20 workouts / 4 semanas
// oficiales. Se añade una 5ª semana como refuerzo propio (no oficial) antes
// de pasar a Dig Deeper, repitiendo la rotación de la semana 1.
const CWCW_WEEKS_OFFICIAL = [
  // Semana 1
  [
    { type: 'primal', label: 'Chest & Back — Tempo Strength', detail: 'Rutina oficial CWCW semana 1, lunes.', duration: '30-35 min' },
    { type: 'primal', label: 'Shoulders — Hot Start',         detail: 'Rutina oficial CWCW semana 1, martes.', duration: '25-30 min' },
    { type: 'primal', label: 'Legs — EMOM Circuit',           detail: 'Rutina oficial CWCW semana 1, miércoles.', duration: '30 min' },
    { type: 'primal', label: 'Arms & Flow — Burnout',         detail: 'Rutina oficial CWCW semana 1, jueves.', duration: '25-30 min' },
    { type: 'primal', label: 'Total Body — MixMet Vol. 1',    detail: 'Rutina oficial CWCW semana 1, viernes. Bonus opcional: Recovery — Primal Movement Activation.', duration: '30-35 min' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
  ],
  // Semana 2
  [
    { type: 'primal', label: 'Chest & Back — EMOM Circuit',   detail: 'Rutina oficial CWCW semana 2, lunes.', duration: '30 min' },
    { type: 'primal', label: 'Shoulders — Tempo Strength',    detail: 'Rutina oficial CWCW semana 2, martes.', duration: '30-35 min' },
    { type: 'primal', label: 'Legs — Burnout',                detail: 'Rutina oficial CWCW semana 2, miércoles.', duration: '25-30 min' },
    { type: 'primal', label: 'Arms & Flow — Hot Start',       detail: 'Rutina oficial CWCW semana 2, jueves. Bonus opcional: Recovery — Joint Mobilization.', duration: '25-30 min' },
    { type: 'primal', label: 'Total Body — MixMet Vol. 2',    detail: 'Rutina oficial CWCW semana 2, viernes.', duration: '30-35 min' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
  ],
  // Semana 3
  [
    { type: 'primal', label: 'Chest & Back — Hot Start',      detail: 'Rutina oficial CWCW semana 3, lunes.', duration: '25-30 min' },
    { type: 'primal', label: 'Shoulders — Burnout',           detail: 'Rutina oficial CWCW semana 3, martes.', duration: '25-30 min' },
    { type: 'primal', label: 'Legs — Tempo Strength',         detail: 'Rutina oficial CWCW semana 3, miércoles.', duration: '30-35 min' },
    { type: 'primal', label: 'Arms & Flow — EMOM Circuit',    detail: 'Rutina oficial CWCW semana 3, jueves.', duration: '30 min' },
    { type: 'primal', label: 'Total Body — MixMet Vol. 3',    detail: 'Rutina oficial CWCW semana 3, viernes. Bonus opcional: Recovery — Full Body Foam Rolling.', duration: '30-35 min' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
  ],
  // Semana 4 (semana de recovery/bonus, cierre de la colección de 20 workouts)
  [
    { type: 'movilidad', label: 'Recovery — Primal Movement Activation', detail: 'Rutina oficial CWCW semana 4, lunes. Bonus opcional: TGU-T.', duration: '20-25 min' },
    { type: 'primal',    label: 'Total Body — Primal Movement Flow',     detail: 'Rutina oficial CWCW semana 4, martes.', duration: '30 min' },
    { type: 'movilidad', label: 'Recovery — Joint Mobilization',         detail: 'Rutina oficial CWCW semana 4, miércoles. Bonus opcional: Primal Movement Cardio.', duration: '20-25 min' },
    { type: 'movilidad', label: 'Recovery — Full Body Foam Rolling',     detail: 'Rutina oficial CWCW semana 4, jueves. Bonus opcional: Primal Movement Flow Express.', duration: '20-25 min' },
    { type: 'primal',    label: 'Total Body — MixMet Vol. 4',            detail: 'Rutina oficial CWCW semana 4, viernes. Cierre de la colección de 20 workouts.', duration: '30-35 min' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
    { type: 'recreativo', label: 'Active Rest Day', detail: 'Descanso activo oficial: movimiento libre y suave.', duration: 'Libre' },
  ],
];

function cwcwWeekPattern(weekOfPhase) {
  // weekOfPhase: 1-5 (semana 5 es un refuerzo propio, no oficial, que repite la rotación de la semana 1)
  const idx = Math.min(weekOfPhase, 4) - 1;
  const base = CWCW_WEEKS_OFFICIAL[idx];
  if (weekOfPhase <= 4) return base;
  // Semana 5 (extra, propia): repetición de la semana 1 con nota de refuerzo
  return base.map(d => d.label.includes('Active Rest') ? d : { ...d, detail: d.detail + ' (Semana 5: repaso/refuerzo añadido antes de Dig Deeper, no forma parte de las 4 semanas oficiales).' });
}

/* ---- Dig Deeper — calendario oficial de 12 semanas ------------------------ */
// Fuente: Dig Deeper "Ultimate 12-Week Body Recomposition Calendar" (BODi, 2023).
// Cada colección de 4 semanas usa los MISMOS nombres de rutina las 4 semanas;
// lo que cambia es el peso/intensidad, no el nombre.
const DIGDEEPER_COLLECTION_PATTERNS = {
  'Dynamic Circuits': (cardioNum) => [
    { type: 'fuerza', label: 'Upper Body Circuit 1', detail: 'Rutina oficial Dig Deeper — Dynamic Circuits, lunes.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Lower Body Circuit 1',  detail: 'Rutina oficial Dig Deeper — Dynamic Circuits, martes.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Total Body Circuit',    detail: 'Rutina oficial Dig Deeper — Dynamic Circuits, miércoles.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Upper Body Circuit 2',  detail: 'Rutina oficial Dig Deeper — Dynamic Circuits, jueves.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Lower Body Circuit 2',  detail: 'Rutina oficial Dig Deeper — Dynamic Circuits, viernes.', duration: '35-50 min' },
    { type: 'cardio', label: `Steady State Cardio ${cardioNum} (opcional)`, detail: 'Cardio zona 2 de bajo impacto. Opcional, recomendado para la parte de definición.', duration: '20-30 min' },
    { type: 'descanso', label: 'Rest', detail: 'Descanso oficial del programa Dig Deeper.', duration: '—' },
  ],
  'Sculpt & Define': (cardioNum) => [
    { type: 'fuerza', label: 'Total Body',                  detail: 'Rutina oficial Dig Deeper — Sculpt & Define, lunes.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Chest & Back',                detail: 'Rutina oficial Dig Deeper — Sculpt & Define, martes.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Legs',                        detail: 'Rutina oficial Dig Deeper — Sculpt & Define, miércoles.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Shoulders, Glutes, & Abs',    detail: 'Rutina oficial Dig Deeper — Sculpt & Define, jueves.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Bis & Tris',                  detail: 'Rutina oficial Dig Deeper — Sculpt & Define, viernes.', duration: '35-50 min' },
    { type: 'cardio', label: `Steady State Cardio ${cardioNum} (opcional)`, detail: 'Cardio zona 2 de bajo impacto. Opcional, recomendado para la parte de definición.', duration: '20-30 min' },
    { type: 'descanso', label: 'Rest', detail: 'Descanso oficial del programa Dig Deeper.', duration: '—' },
  ],
  'The Build': (cardioNum) => [
    { type: 'fuerza', label: 'Chest',              detail: 'Rutina oficial Dig Deeper — The Build, lunes.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Back & Abs',         detail: 'Rutina oficial Dig Deeper — The Build, martes.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Arms',               detail: 'Rutina oficial Dig Deeper — The Build, miércoles.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Legs',               detail: 'Rutina oficial Dig Deeper — The Build, jueves.', duration: '35-50 min' },
    { type: 'fuerza', label: 'Shoulders & Abs',    detail: 'Rutina oficial Dig Deeper — The Build, viernes.', duration: '35-50 min' },
    { type: 'cardio', label: `Steady State Cardio ${cardioNum} (opcional)`, detail: 'Cardio zona 2 de bajo impacto. Opcional, recomendado para la parte de definición.', duration: '20-30 min' },
    { type: 'descanso', label: 'Rest', detail: 'Descanso oficial del programa Dig Deeper.', duration: '—' },
  ],
};

function digDeeperPattern(round, collection, cardioNum) {
  const base = DIGDEEPER_COLLECTION_PATTERNS[collection](cardioNum);
  if (round !== 2) return base;
  // Ronda 2: mismos nombres oficiales, solo se anota la sobrecarga progresiva en el detalle.
  return base.map(d => d.type === 'fuerza'
    ? { ...d, label: `${d.label} (R2)`, detail: d.detail + ' Ronda 2: aplica sobrecarga progresiva (más peso que en la Ronda 1).' }
    : d);
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
  { weeks: [24,25,26,27], name: 'Dynamic Circuits', cardioNum: 1 },
  { weeks: [28,29,30,31], name: 'Sculpt & Define',  cardioNum: 2 },
  { weeks: [32,33,34,35], name: 'The Build',         cardioNum: 3 },
];
const DIGDEEPER_COLLECTIONS_R2 = [
  { weeks: [37,38,39,40], name: 'Dynamic Circuits', cardioNum: 1 },
  { weeks: [41,42,43,44], name: 'Sculpt & Define',  cardioNum: 2 },
  { weeks: [45,46,47,48], name: 'The Build',         cardioNum: 3 },
];

function collectionForWeek(week, table) {
  return table.find(c => c.weeks.includes(week)) || table[table.length - 1];
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
      // semanas 4-6 de mi calendario = semanas 1-3 de 645 → versión 5 días (modificación propia)
      if (week <= 6) return phase1Pattern5day();
      const weekOfProgram = week - 3; // semana 1-13 del programa oficial 645
      if ([4, 8, 12].includes(weekOfProgram)) return phase1Pattern6day('Descarga · mismo movimiento, menos volumen');
      if (weekOfProgram === 13) return phase1Pattern6day('Semana de Rendimiento');
      return phase1Pattern6day();
    }
    case 'phase2': {
      const weekOfProgram = week - 17; // semana 1-5 de CWCW (4 oficiales + 1 refuerzo propio)
      return cwcwWeekPattern(weekOfProgram);
    }
    case 'phase3': {
      const c = collectionForWeek(week, DIGDEEPER_COLLECTIONS_R1);
      return digDeeperPattern(1, c.name, c.cardioNum);
    }
    case 'phase4': {
      const c = collectionForWeek(week, DIGDEEPER_COLLECTIONS_R2);
      return digDeeperPattern(2, c.name, c.cardioNum);
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
      isRest: workout.type === 'descanso' || /rest day/i.test(workout.label),
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
