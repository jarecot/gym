/* =========================================================================
   NUTRITION-DATA.JS — Contenido de referencia (tablas del plan nutricional)
   ========================================================================= */

const FOOD_VISUAL = [
  ['Pollo, res, pescado (cocidos)', '1 palma de la mano (~2 cm grosor)', '25-30 g'],
  ['Huevo entero', '1 unidad', '6 g'],
  ['Claras de huevo', '3 unidades', '10-11 g'],
  ['Yogur griego', '1 taza', '18-20 g'],
  ['Queso cottage', '1 taza', '25-28 g'],
  ['Atún en lata (escurrido)', '1 lata pequeña', '22-25 g'],
  ['Lentejas / frijoles cocidos', '1 puño cerrado grande (~1 taza)', '15-18 g'],
  ['Garbanzos cocidos', '1 taza', '14-15 g'],
  ['Tofu firme', 'Bloque tamaño de la palma', '15-18 g'],
  ['Proteína en polvo (whey)', '1 scoop', '24-25 g'],
  ['Leche', '1 vaso (250 ml)', '8-9 g'],
  ['Queso (mozzarella / parmesano)', '2 dedos de grosor', '12-14 g'],
  ['Camarones (cocidos)', '1 taza', '18-20 g'],
  ['Nueces / almendras', '1 puñado pequeño', '5-6 g'],
  ['Quinoa cocida', '1 taza', '8 g'],
];

const FOOD_GRAMS = [
  ['Pechuga de pollo', '30-31 g / 100 g'],
  ['Carne de res magra', '26-27 g / 100 g'],
  ['Salmón / atún fresco', '22-25 g / 100 g'],
  ['Tilapia / merluza', '20-22 g / 100 g'],
  ['Camarones', '20-22 g / 100 g'],
  ['Atún en lata (escurrido)', '25-26 g / 100 g'],
  ['Claras de huevo', '11 g / 100 g'],
  ['Huevo entero', '13 g / 100 g (1 huevo ≈ 6 g)'],
  ['Yogur griego', '9-10 g / 100 g'],
  ['Queso cottage', '11 g / 100 g'],
  ['Lentejas cocidas', '9 g / 100 g'],
  ['Frijoles / garbanzos cocidos', '8-9 g / 100 g'],
  ['Tofu firme', '8 g / 100 g'],
  ['Quinoa cocida', '4.4 g / 100 g'],
  ['Proteína en polvo (whey, en seco)', '80-90 g / 100 g (1 scoop 30 g ≈ 24-25 g)'],
];

const MEAL_BANK = {
  desayunos: [
    { code: 'B1', label: '3 huevos enteros revueltos + 1 taza de yogur griego + fruta', protein: 38 },
    { code: 'B2', label: 'Avena cocida en 250 ml de leche + 1 scoop de proteína en polvo', protein: 33 },
    { code: 'B3', label: 'Tostadas integrales + 4 claras + 1 huevo entero + queso', protein: 32 },
    { code: 'B4', label: 'Bowl: 1 taza yogur griego + granola + 1 scoop de proteína', protein: 45 },
    { code: 'B5', label: 'Sándwich de atún (1 lata) + pan integral + queso', protein: 36 },
  ],
  almuerzos: [
    { code: 'L1', label: 'Palma de pollo (~150 g) + 1 taza de lentejas + ensalada', protein: 45 },
    { code: 'L2', label: 'Palma de res magra + arroz + 1/2 taza de frijoles', protein: 37 },
    { code: 'L3', label: 'Palma grande de pescado + 1 taza de garbanzos', protein: 39 },
    { code: 'L4', label: 'Pechuga de pollo grande (palma y media) + ensalada de quinoa', protein: 39 },
    { code: 'L5', label: 'Camarones (1 taza) + arroz + 1/2 taza de frijoles', protein: 31 },
  ],
  cenas: [
    { code: 'D1', label: 'Palma de pescado al horno + verduras salteadas', protein: 25 },
    { code: 'D2', label: 'Tortilla de 3 claras + 1 huevo + queso cottage', protein: 31 },
    { code: 'D3', label: 'Palma de pollo a la plancha + ensalada', protein: 30 },
    { code: 'D4', label: 'Tofu firme salteado + verduras + quinoa', protein: 22 },
    { code: 'D5', label: 'Salmón al horno + espárragos', protein: 25 },
  ],
  snacks: [
    { code: 'S1', label: 'Batido de proteína (1 scoop + agua o leche)', protein: 25 },
    { code: 'S2', label: '1 taza de yogur griego + puñado de nueces', protein: 20 },
    { code: 'S3', label: '1/2 taza de queso cottage + fruta', protein: 14 },
    { code: 'S4', label: '2 huevos duros', protein: 12 },
    { code: 'S5', label: '1 lata pequeña de atún + galletas integrales', protein: 20 },
  ],
};

// Rotación de 7 días (mismo patrón usado en el plan de 30 días)
const MEAL_CYCLE = [
  ['B1','L1','D1','S3'],
  ['B2','L2','D2','S1'],
  ['B3','L3','D3','S2'],
  ['B4','L4','D4','S4'],
  ['B5','L5','D5','S1'],
  ['B1','L2','D3','S1'],
  ['B4','L1','D5','S2'],
];

const DELOAD_TIPS = {
  principles: [
    'Intensidad: 40-50% de la carga que usas en semanas normales.',
    'Volumen: la mitad de las series/repeticiones habituales.',
    'Frecuencia: mantén los mismos días, solo baja la carga, no la consistencia.',
  ],
  extras: [
    'Foam roller / liberación miofascial: 10 min en piernas, espalda y hombros.',
    'Movilidad de hombro y cadera con banda elástica.',
    'Caminatas al aire libre para bajar el cortisol.',
    'Estiramiento estático prolongado (30-60 seg por músculo).',
  ],
  avoid: [
    'Cargas cercanas a tu peso máximo habitual.',
    'Entrenar "al fallo" o técnicas de alta fatiga (drop sets, AMRAP, EMOM intensos).',
    'Usar la semana para "ponerte al día" con volumen perdido.',
  ],
};

window.NUTRITION_DATA = { FOOD_VISUAL, FOOD_GRAMS, MEAL_BANK, MEAL_CYCLE, DELOAD_TIPS };
