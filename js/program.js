/* =========================================================================
   PROGRAM.JS
   Define la periodización completa: (Fase 0 opcional) → 645 → Chop Wood
   Carry Water → Dig Deeper. Genera el calendario completo a partir de una
   fecha de inicio elegida por el usuario.

   IMPORTANTE sobre fidelidad a los calendarios oficiales:
   - 645 no tiene semana 0 oficialmente: su calendario empieza directo en
     la Semana 1 de la Etapa 1. Por eso Fase 1 (más abajo) reproduce el
     calendario oficial de 645 sin modificar nombres ni frecuencia.
   - La "Fase 0 · Preparación" es una fase OPCIONAL, no oficial de BODi,
     pensada para personas que llevan mucho tiempo sin entrenar. En vez de
     inventar rutinas nuevas, reutiliza las mismas 6 rutinas oficiales de
     645 (Lower Body Strength, Total Body Power, Mobility & Stability,
     Upper Body Strength, Total Body Tempo, Cardio 45), reordenadas y a
     menor frecuencia, para servir de rampa de entrada hacia el 645 real.
     Puede activarse o desactivarse por usuario.
   ========================================================================= */

/* ---- Definición de fases (longitudes en semanas) -------------------------
   La Fase 0 es opcional: si se desactiva, todas las fases siguientes se
   recorren 3 semanas antes y el calendario total pasa de 52 a 49 semanas. */
const PHASE_BLUEPRINT = [
  { key: 'phase0',     id: 'p0', name: 'Fase 0 · Preparación (opcional)',    short: 'Prep',   color: '#8C97A8', weeks: 3,  optional: true },
  { key: 'phase1',     id: 'p1', name: 'Fase 1 · 645',                      short: '645',    color: '#C1502E', weeks: 13 },
  { key: 'deload',     id: 'd1', name: 'Descarga activa',                   short: 'Desc.',  color: '#4C9A6A', weeks: 1 },
  { key: 'phase2',     id: 'p2', name: 'Fase 2 · Chop Wood Carry Water',    short: 'CWCW',   color: '#C9A24B', weeks: 5 },
  { key: 'deload',     id: 'd2', name: 'Descarga activa',                   short: 'Desc.',  color: '#4C9A6A', weeks: 1 },
  { key: 'phase3',     id: 'p3', name: 'Fase 3 · Dig Deeper (Ronda 1)',     short: 'DD·R1',  color: '#8B6BC7', weeks: 12 },
  { key: 'deload',     id: 'd3', name: 'Descarga activa',                   short: 'Desc.',  color: '#4C9A6A', weeks: 1 },
  { key: 'phase4',     id: 'p4', name: 'Fase 4 · Dig Deeper (Ronda 2)',     short: 'DD·R2',  color: '#5C6BC0', weeks: 12 },
  { key: 'deload',     id: 'd4', name: 'Descarga activa',                   short: 'Desc.',  color: '#4C9A6A', weeks: 1 },
  { key: 'transition', id: 'tr', name: 'Transición · CWCW breve',          short: 'Trans.', color: '#8C97A8', weeks: 3 },
];

/**
 * Construye la lista de fases con weekStart/weekEnd calculados, según si la
 * Fase 0 (opcional) está activada o no.
 */
function buildPhases(includePrep) {
  let cursor = 1;
  const phases = [];
  PHASE_BLUEPRINT.forEach(bp => {
    if (bp.optional && !includePrep) return; // se omite la fase 0
    const weekStart = cursor;
    const weekEnd = cursor + bp.weeks - 1;
    phases.push({ id: bp.id, key: bp.key, name: bp.name, short: bp.short, color: bp.color, weekStart, weekEnd });
    cursor = weekEnd + 1;
  });
  return phases;
}

function totalWeeksFor(includePrep) {
  return PHASE_BLUEPRINT.reduce((sum, bp) => sum + ((bp.optional && !includePrep) ? 0 : bp.weeks), 0);
}

// Fases "por defecto" (con Fase 0 incluida) — útiles como referencia/leyenda
// antes de que exista un calendario generado para un usuario.
const DEFAULT_PHASES = buildPhases(true);
const DEFAULT_TOTAL_WEEKS = totalWeeksFor(true);

function getPhaseForWeek(week, phases) {
  return (phases || DEFAULT_PHASES).find(p => week >= p.weekStart && week <= p.weekEnd);
}

/* ---- Patrones de día genéricos (no oficiales) ----------------------------- */
// dayInWeek: 0=día1 ... 6=día7 (relativo al inicio elegido por el usuario)

const DELOAD_PATTERN = [
  { type: 'movilidad', label: 'Movilidad articular completa', detail: 'Cadera, hombro, tobillo, columna torácica. Sin prisa.', duration: '20-25 min' },
  { type: 'cardio',     label: 'Cardio zona 2 suave',          detail: 'Caminata inclinada, bici o natación, ritmo conversacional.', duration: '25-35 min' },
  { type: 'movilidad',  label: 'Yoga / estiramiento dinámico', detail: 'Zonas con más carga reciente: isquiotibiales, dorsal, hombros.', duration: '25-30 min' },
  { type: 'cardio',     label: 'Cardio zona 2 suave',          detail: 'Igual que el día anterior, o caminata al aire libre.', duration: '25-35 min' },
  { type: 'core',       label: 'Core + activación ligera',     detail: 'Plancha, bird-dog, dead bug. Sin peso o muy liviano.', duration: '20-25 min' },
  { type: 'recreativo', label: 'Actividad recreativa',         detail: 'Caminata larga, senderismo suave, nadar por placer.', duration: '30-45 min' },
  { type: 'descanso',   label: 'Descanso completo',            detail: 'Nada estructurado. Prioriza el sueño.', duration: '—' },
];

const TRANSITION_PATTERN = [
  { type: 'primal',   label: 'Movilidad + fuerza ligera', detail: 'Reset de movilidad antes del Año 2.', duration: '30 min' },
  { type: 'cardio',   label: 'Cardio',                   detail: 'Zona 2, ritmo conversacional.', duration: '25-30 min' },
  { type: 'primal',   label: 'Movimiento primal',         detail: 'Patrones de suelo, agilidad, coordinación.', duration: '30 min' },
  { type: 'cardio',   label: 'Cardio',                   detail: 'Zona 2 o intervalos suaves.', duration: '25-30 min' },
  { type: 'descanso', label: 'Descanso',                 detail: 'Día libre antes del fin de semana.', duration: '—' },
  { type: 'recreativo', label: 'Actividad recreativa',   detail: 'Deporte, caminata larga, lo que disfrutes.', duration: 'Libre' },
  { type: 'descanso', label: 'Descanso completo',        detail: 'Cierre del Año 1. ¡Bien hecho!', duration: '—' },
];

/* ---- Fase 0 · Preparación (opcional) --------------------------------------
   Reutiliza las 6 rutinas OFICIALES de 645 (no se inventan rutinas nuevas),
   reordenadas y aplicando el mismo enfoque que 645 usa en su propia Deload
   Week. Los materiales oficiales de 645 son explícitos en esto: "the moves,
   intensity, and volume change weekly and end with a Deload Week where your
   intensity stays the same, but with less volume". Es decir: Deload NO baja
   la intensidad/carga, baja el VOLUMEN (menos series o repeticiones).
   Por eso la Fase 0 combina dos palancas distintas y complementarias:
   1) Frecuencia semanal reducida (menos días entrenando por semana).
   2) Estilo Deload dentro de cada sesión: mismas rutinas oficiales, con
      menos series/repeticiones que las indicadas en el video (el usuario
      elige además cargas conservadoras, ya que viene de estar inactivo —
      esto último sí es una recomendación propia, no parte del concepto
      Deload de BODi).
   Progresión:
   Semana 1: solo Mobility & Stability + Cardio 45 (sin fuerza pesada aún).
   Semana 2: se introducen Lower/Upper Body Strength, estilo Deload, espaciadas con movilidad.
   Semana 3: se añade Total Body Power/Tempo, casi a frecuencia completa oficial,
             todavía estilo Deload, dejando al cuerpo listo para empezar 645
             real (Fase 1) a volumen e intensidad completos desde su día 1. */
const PREP_WEEK_PATTERNS = [
  // Semana de preparación 1 — solo movilidad y cardio, sin fuerza pesada
  [
    { type: 'movilidad', label: 'Mobility & Stability', detail: 'Rutina oficial de 645 usada como base de movilidad para reactivar patrones de movimiento.', duration: '45 min' },
    { type: 'cardio',    label: 'Cardio 45',             detail: 'Rutina oficial de 645. Ritmo suave, zona 2, para reacondicionar el sistema cardiovascular.', duration: '45 min' },
    { type: 'movilidad', label: 'Mobility & Stability',  detail: 'Segunda dosis de movilidad de la semana.', duration: '45 min' },
    { type: 'cardio',    label: 'Cardio 45',             detail: 'Ritmo suave, zona 2.', duration: '45 min' },
    { type: 'movilidad', label: 'Mobility & Stability',  detail: 'Cierre de la semana con movilidad.', duration: '45 min' },
    { type: 'descanso',  label: 'Descanso / caminata libre', detail: 'Actividad libre y suave si te sientes bien, o descanso completo.', duration: 'Libre' },
    { type: 'descanso',  label: 'Rest', detail: 'Descanso.', duration: '—' },
  ],
  // Semana de preparación 2 — se introduce fuerza básica (Lower/Upper), estilo Deload
  [
    { type: 'fuerza',    label: 'Lower Body Strength',  detail: 'Rutina oficial de 645, estilo Deload: haz menos series/repeticiones que las indicadas en el video (mismo movimiento, menos volumen) y elige cargas conservadoras.', duration: '45 min' },
    { type: 'movilidad', label: 'Mobility & Stability',  detail: 'Movilidad entre los dos primeros días de fuerza.', duration: '45 min' },
    { type: 'fuerza',    label: 'Upper Body Strength',  detail: 'Rutina oficial de 645, estilo Deload: menos volumen que el indicado, cargas conservadoras.', duration: '45 min' },
    { type: 'cardio',    label: 'Cardio 45',            detail: 'Ritmo suave-moderado, zona 2.', duration: '45 min' },
    { type: 'movilidad', label: 'Mobility & Stability',  detail: 'Cierre de la semana con movilidad.', duration: '45 min' },
    { type: 'descanso',  label: 'Descanso / caminata libre', detail: 'Actividad libre y suave si te sientes bien, o descanso completo.', duration: 'Libre' },
    { type: 'descanso',  label: 'Rest', detail: 'Descanso.', duration: '—' },
  ],
  // Semana de preparación 3 — casi frecuencia completa oficial, aún estilo Deload
  [
    { type: 'fuerza',    label: 'Lower Body Strength',  detail: 'Rutina oficial de 645, estilo Deload: aumenta ligeramente el volumen respecto a la semana anterior, siempre por debajo del volumen completo del video.', duration: '45 min' },
    { type: 'fuerza',    label: 'Total Body Power',     detail: 'Rutina oficial de 645. Se introduce el patrón de potencia total-body por primera vez, estilo Deload (menos volumen que el indicado).', duration: '45 min' },
    { type: 'movilidad', label: 'Mobility & Stability',  detail: 'Movilidad a mitad de semana.', duration: '45 min' },
    { type: 'fuerza',    label: 'Upper Body Strength',  detail: 'Rutina oficial de 645, estilo Deload: progresión de volumen controlada.', duration: '45 min' },
    { type: 'fuerza',    label: 'Total Body Tempo',     detail: 'Rutina oficial de 645, estilo Deload. Última rutina que faltaba por introducir antes de empezar la Fase 1 a volumen completo.', duration: '45 min' },
    { type: 'cardio',    label: 'Cardio 45',            detail: 'Ya a la frecuencia oficial de 6 días de 645.', duration: '45 min' },
    { type: 'descanso',  label: 'Rest', detail: 'Descanso, igual que en el calendario oficial de 645.', duration: '—' },
  ],
];

function prepWeekPattern(weekOfPhase) {
  const idx = Math.min(Math.max(weekOfPhase, 1), PREP_WEEK_PATTERNS.length) - 1;
  return PREP_WEEK_PATTERNS[idx];
}

function prepWeekBanner(weekOfPhase) {
  if (weekOfPhase === 1) return 'Fase 0 · Solo movilidad y cardio';
  return 'Fase 0 · Estilo Deload — mismo movimiento, menor volumen';
}

/* ---- Fase 1 · 645 — calendario oficial exacto -----------------------------
   Fuente: 645 Workout Calendar (Beachbody/BODi, 2021). El calendario oficial
   usa EXACTAMENTE los mismos 7 nombres las 13 semanas — incluidas las 3
   semanas de descarga (fin de cada etapa) y la semana de rendimiento
   (semana 13). Lo que cambia semana a semana es el volumen/intensidad
   interno de cada rutina, no su nombre, así que aquí no se modifica nada:
   se reproduce el calendario oficial tal cual, sin frecuencia reducida. */
const PHASE1_PATTERN = [
  { type: 'fuerza',    label: 'Lower Body Strength', detail: 'Rutina oficial 645 del lunes: fuerza de tren inferior.', duration: '45 min' },
  { type: 'fuerza',    label: 'Total Body Power',    detail: 'Rutina oficial 645 del martes: potencia total-body.', duration: '45 min' },
  { type: 'movilidad', label: 'Mobility & Stability', detail: 'Rutina oficial 645 del miércoles: movilidad y estabilidad.', duration: '45 min' },
  { type: 'fuerza',    label: 'Upper Body Strength', detail: 'Rutina oficial 645 del jueves: fuerza de tren superior.', duration: '45 min' },
  { type: 'fuerza',    label: 'Total Body Tempo',    detail: 'Rutina oficial 645 del viernes: fuerza total-body a tempo controlado.', duration: '45 min' },
  { type: 'cardio',    label: 'Cardio 45',           detail: 'Rutina oficial 645 del sábado: cardio de 45 minutos.', duration: '45 min' },
  { type: 'descanso',  label: 'Rest',                detail: 'Descanso oficial del programa 645.', duration: '—' },
];

// Semanas oficiales de descarga y rendimiento dentro de 645 (según el
// calendario original: Semana 4, 8 y 12 = Deload Week; Semana 13 = Performance
// Week). Mismo nombre de rutina, solo cambia el "banner" informativo de la semana.
function phase1WeekBanner(weekOfProgram) {
  if ([4, 8, 12].includes(weekOfProgram)) return 'Deload Week — mismo movimiento, menos volumen';
  if (weekOfProgram === 13) return 'Performance Week — pico de la etapa';
  return null;
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
  return base.map(d => /active rest day/i.test(d.label) ? d : { ...d, detail: d.detail + ' (Semana 5: repaso/refuerzo añadido antes de Dig Deeper, no forma parte de las 4 semanas oficiales).' });
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
  return base.map(d => d.type === 'fuerza'
    ? { ...d, label: `${d.label} (R2)`, detail: d.detail + ' Ronda 2: aplica sobrecarga progresiva (más peso que en la Ronda 1).' }
    : d);
}

const DIGDEEPER_COLLECTIONS = [
  { weekRange: [1, 4],  name: 'Dynamic Circuits', cardioNum: 1 },
  { weekRange: [5, 8],  name: 'Sculpt & Define',  cardioNum: 2 },
  { weekRange: [9, 12], name: 'The Build',         cardioNum: 3 },
];

function collectionForProgramWeek(weekOfProgram) {
  return DIGDEEPER_COLLECTIONS.find(c => weekOfProgram >= c.weekRange[0] && weekOfProgram <= c.weekRange[1])
    || DIGDEEPER_COLLECTIONS[DIGDEEPER_COLLECTIONS.length - 1];
}

/* ---- Generador de patrón diario según semana ----------------------------- */
function getWeekPattern(week, phases) {
  const phase = getPhaseForWeek(week, phases);
  if (!phase) return DELOAD_PATTERN;
  const weekOfProgram = week - phase.weekStart + 1; // semana 1..N dentro de la fase actual

  switch (phase.key) {
    case 'phase0':
      return prepWeekPattern(weekOfProgram);
    case 'deload':
      return DELOAD_PATTERN;
    case 'phase1':
      return PHASE1_PATTERN; // calendario oficial 645, sin modificar
    case 'phase2':
      return cwcwWeekPattern(weekOfProgram);
    case 'phase3': {
      const c = collectionForProgramWeek(weekOfProgram);
      return digDeeperPattern(1, c.name, c.cardioNum);
    }
    case 'phase4': {
      const c = collectionForProgramWeek(weekOfProgram);
      return digDeeperPattern(2, c.name, c.cardioNum);
    }
    case 'transition':
      return TRANSITION_PATTERN;
    default:
      return DELOAD_PATTERN;
  }
}

function getWeekBanner(week, phases) {
  const phase = getPhaseForWeek(week, phases);
  if (!phase) return null;
  const weekOfProgram = week - phase.weekStart + 1;
  if (phase.key === 'phase0') return prepWeekBanner(weekOfProgram);
  if (phase.key === 'phase1') return phase1WeekBanner(weekOfProgram);
  return null;
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
 * Genera el calendario completo a partir de una fecha de inicio (Date, o
 * string ISO). `options.includePrep` (default true) determina si se incluye
 * la Fase 0 opcional; el total de semanas se ajusta automáticamente (52 con
 * Fase 0, 49 sin ella).
 * Devuelve un array de días con propiedades extra: .phases, .totalWeeks,
 * .totalDays e .includePrep, para que el resto de la app no dependa de
 * constantes globales fijas.
 */
function buildFullCalendar(startDateInput, options) {
  const includePrep = options && typeof options.includePrep === 'boolean' ? options.includePrep : true;
  const phases = buildPhases(includePrep);
  const totalWeeks = totalWeeksFor(includePrep);
  const totalDays = totalWeeks * 7;

  const startDate = typeof startDateInput === 'string' ? new Date(startDateInput + 'T00:00:00') : new Date(startDateInput);
  const days = [];

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const week = Math.floor(i / 7) + 1;
    const dayInWeek = i % 7; // 0-6
    const phase = getPhaseForWeek(week, phases);
    const pattern = getWeekPattern(week, phases);
    const workout = pattern[dayInWeek];

    days.push({
      index: i + 1,
      isoDate: fmtISO(date),
      humanDate: fmtHuman(date),
      weekdayName: WEEKDAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1],
      week,
      dayInWeek: dayInWeek + 1,
      phaseId: phase ? phase.id : null,
      phaseKey: phase ? phase.key : null,
      phaseName: phase ? phase.name : '—',
      phaseShort: phase ? phase.short : '—',
      phaseColor: phase ? phase.color : '#666',
      weekBanner: getWeekBanner(week, phases),
      workoutType: workout.type,
      workoutLabel: workout.label,
      workoutDetail: workout.detail,
      workoutDuration: workout.duration,
      isRest: workout.type === 'descanso' || /rest day/i.test(workout.label),
    });
  }

  days.phases = phases;
  days.totalWeeks = totalWeeks;
  days.totalDays = totalDays;
  days.includePrep = includePrep;
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
  DEFAULT_PHASES, DEFAULT_TOTAL_WEEKS,
  buildPhases, totalWeeksFor,
  getPhaseForWeek, buildFullCalendar, WORKOUT_TYPE_META, fmtISO, fmtHuman,
};
