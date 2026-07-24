# Forjado — 645 → Chop Wood Carry Water → Dig Deeper

Web app de seguimiento de entrenamiento y nutrición para el plan anual
645 → Chop Wood Carry Water → Dig Deeper. Incluye calendario de 52 semanas,
checklist diario, gráficas de progreso, registro de medidas corporales,
calculadoras de nutrición (proteína, TMB/TDEE, macros) y comparación entre
varios usuarios.

Es un sitio 100% estático (HTML/CSS/JS puro, sin backend ni build step),
pensado para desplegarse directamente en **GitHub Pages**.

## Cómo funciona el almacenamiento (importante)

GitHub Pages solo sirve archivos estáticos: no hay servidor ni base de
datos. Por eso esta app guarda todo en el **`localStorage` del navegador**:

- Puedes crear varios perfiles (tú, un amigo, etc.) y todos viven en el
  mismo navegador/dispositivo — ideal si comparten computador, o si cada
  quien abre la web en su propio celular/PC y luego comparan exportando datos.
- Cada perfil es independiente: fecha de inicio, días completados, medidas
  y ajustes de nutrición propios.
- **Para pasar datos entre dispositivos o hacer respaldo:** usa el botón
  "Exportar todos los perfiles (.json)" en la pestaña **Ajustes**, y luego
  "Importar archivo" en el otro dispositivo. Así puedes centralizar el
  progreso de varias personas en un mismo navegador para compararlo en la
  pestaña **Comparar**.
- Si borras el caché/datos del navegador, se pierde la información local
  a menos que hayas exportado un respaldo antes.

## Publicar en GitHub Pages

### Opción A — repositorio nuevo

1. Crea un repositorio en GitHub (público o privado con Pages habilitado
   en tu plan).
2. Sube **todo el contenido de esta carpeta** (no la carpeta en sí, sino
   su contenido: `index.html`, `css/`, `js/`, `.nojekyll`) a la raíz del
   repositorio, o a una subcarpeta `docs/` si prefieres esa convención.
3. Ve a **Settings → Pages**.
4. En "Source", elige la rama (`main`) y la carpeta (`/root` o `/docs`
   según dónde hayas subido los archivos).
5. Guarda. GitHub te dará una URL del tipo:
   `https://tu-usuario.github.io/tu-repositorio/`

### Opción B — desde la terminal

```bash
cd forjado-app          # esta carpeta
git init
git add .
git commit -m "Forjado: plan de entrenamiento y nutrición"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

Luego activa Pages igual que en la Opción A (Settings → Pages → rama `main`,
carpeta `/root`).

La app tarda 1-2 minutos en publicarse tras el primer push.

## Requisitos de conexión

La app usa dos librerías por CDN (necesitan internet la primera vez que
cargan, luego el navegador las cachea):

- [Chart.js](https://www.chartjs.org/) — gráficas de progreso.
- [Google Fonts](https://fonts.google.com/) — tipografías Oswald, Inter y
  JetBrains Mono.

Si por algún motivo no cargan (sin internet, bloqueador de anuncios muy
agresivo), el resto de la app (calendario, checklist, calculadoras,
medidas) sigue funcionando con normalidad — solo las gráficas mostrarán
un aviso.

## Estructura del proyecto

```
index.html              Estructura de la app (todas las pestañas)
css/styles.css           Estilos (tema "Forjado")
js/program.js            Periodización completa: fases y calendario de 364 días
js/calculators.js        Fórmulas de proteína, TMB (Mifflin-St Jeor), TDEE y macros
js/nutrition-data.js     Tablas de alimentos y banco de comidas de referencia
js/storage.js            Persistencia multi-usuario en localStorage
js/charts.js             Helpers de Chart.js con el tema visual
js/app.js                Lógica principal: estado, render de pestañas, eventos
.nojekyll                 Evita que GitHub Pages procese el sitio con Jekyll
```

## Personalizar la fecha de inicio de cada quien

Cada perfil define su propia fecha de inicio en la pestaña **Inicio**. El
calendario de 52 semanas (fases 0 a la transición del Año 2) se recalcula
automáticamente a partir de esa fecha — no hace falta editar código para
que dos personas empiecen en fechas distintas.

## Nota

Esta app es una herramienta de seguimiento personal, no reemplaza la
valoración de un médico deportivo, fisioterapeuta o entrenador certificado.
