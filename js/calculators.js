/* =========================================================================
   CALCULATORS.JS
   Proteína (g/kg), TMB (Mifflin-St Jeor), TDEE, calorías objetivo y macros.
   ========================================================================= */

/* ---- Proteína --------------------------------------------------------- */
// Rango científico general: 1.6-2.2 g/kg/día. Ver plan nutricional.
function calcProtein(weightKg, gPerKg) {
  const total = weightKg * gPerKg;
  return Math.round(total);
}

function proteinRange(weightKg) {
  return {
    min: Math.round(weightKg * 1.6),
    mid: Math.round(weightKg * 1.9),
    max: Math.round(weightKg * 2.2),
  };
}

// Reparto en "palmas de mano" (~25 g proteína animal / scoop) para referencia rápida
function proteinToPalms(grams) {
  return Math.round((grams / 25) * 10) / 10;
}

/* ---- TMB (Tasa Metabólica Basal) — Fórmula Mifflin-St Jeor ------------- */
// Hombres: TMB = 10*peso(kg) + 6.25*altura(cm) - 5*edad + 5
// Mujeres:  TMB = 10*peso(kg) + 6.25*altura(cm) - 5*edad - 161
function calcBMR({ weightKg, heightCm, age, sex }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

const ACTIVITY_FACTORS = [
  { id: 'sedentary',   label: 'Sedentario (poco o ningún ejercicio)', factor: 1.2 },
  { id: 'light',       label: 'Actividad ligera (1-3 días/semana)',    factor: 1.375 },
  { id: 'moderate',    label: 'Actividad moderada (3-5 días/semana)',  factor: 1.55 },
  { id: 'active',      label: 'Muy activo (6-7 días/semana)',          factor: 1.725 },
  { id: 'very_active', label: 'Extremadamente activo (2x/día, físico)', factor: 1.9 },
];

function calcTDEE(bmr, activityFactorId) {
  const af = ACTIVITY_FACTORS.find(a => a.id === activityFactorId) || ACTIVITY_FACTORS[0];
  return Math.round(bmr * af.factor);
}

/* ---- Objetivo calórico y macros ---------------------------------------- */
const GOALS = [
  { id: 'lose',     label: 'Bajar grasa (déficit)',        pct: -0.20 },
  { id: 'lose_mild', label: 'Bajar grasa (déficit leve)',   pct: -0.12 },
  { id: 'maintain', label: 'Mantener / recomposición',      pct: 0 },
  { id: 'gain_mild', label: 'Ganar músculo (superávit leve)', pct: 0.10 },
  { id: 'gain',     label: 'Ganar músculo (superávit)',      pct: 0.18 },
];

function calcTargetCalories(tdee, goalId) {
  const g = GOALS.find(x => x.id === goalId) || GOALS[2];
  return Math.round(tdee * (1 + g.pct));
}

/**
 * Calcula macros completos dado el peso, calorías objetivo y g/kg de proteína.
 * Proteína fija en gramos (prioridad), grasa 25% de las calorías totales, resto en carbohidratos.
 */
function calcMacros({ weightKg, targetCalories, proteinGPerKg = 1.9, fatPct = 0.25 }) {
  const proteinG = Math.round(weightKg * proteinGPerKg);
  const proteinKcal = proteinG * 4;
  const fatKcal = targetCalories * fatPct;
  const fatG = Math.round(fatKcal / 9);
  const carbsKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
  const carbsG = Math.round(carbsKcal / 4);
  return { proteinG, fatG, carbsG, proteinKcal: Math.round(proteinKcal), fatKcal: Math.round(fatKcal), carbsKcal: Math.round(carbsKcal) };
}

window.CALC = {
  calcProtein, proteinRange, proteinToPalms,
  calcBMR, ACTIVITY_FACTORS, calcTDEE,
  GOALS, calcTargetCalories, calcMacros,
};
