# Video interactivo, robots con sombrero y limpieza del listicle

Todo apunta al **deploy del jueves 13/08**, junto con el artículo nuevo del blog.

## Qué resuelve

Tres cosas sueltas que hoy no están en el sitio: el video interactivo está terminado y aprobado pero solo corre en localhost; los sombreros por país se aprobaron y viven en una página de bocetos; y el listicle propio le da visibilidad a cuatro consultoras argentinas que compiten por el mismo cliente.

## Qué voy a hacer

**1 · Video interactivo en `/demo` (lo más riesgoso, va primero)**
- Copiar `Desktop\video-interactivo\player\` → `varka-sitio\demo\` (index, player.js, grafo.json, portada.jpg y los 12 clips).
- Verificar que **todas las rutas de `player.js` sean relativas**. Si alguna es absoluta o apunta a `localhost`, corregirla.
- 🔴 **Bloque del home PENDIENTE de definición.** Hay puesta una tarjeta provisoria con link de texto en la sección "Probalo antes de confiar", pero **no es lo pedido**: Gonzalo quiere **la imagen de la portada, clickeable**, en un lugar del home que él va a indicar. Cuando lo diga, se reemplaza.
- Sumar `/demo` al `sitemap.xml`.
- Con esto queda resuelto **dónde se publica**: adentro del sitio, en Netlify.

**2 · Listicle `mejores-consultoras-ia-argentina.html`**
- Sacar **Duotach, Suris Code, Artics y NexoSmart** — los cuatro compiten por el mismo cliente.
- Reemplazarlos por actores argentinos que **no** compiten por una pyme: grandes consultoras y plataformas de producto tipo chatbot enlatado.
- Reencuadrar la sección para que el contraste sea **producto enlatado vs. sistema montado**, que es un argumento de venta ya usado.

**3 · Robots con sombrero — ⛔ FUERA DEL SITIO (decisión del 10/08)**

Se colocaron tres en el home y Gonzalo los mandó sacar: *"están quitándole seriedad a la página, necesito más una imagen de confianza que un enganche simpático"*. **Quedan solo los dos usos con función: la cabeza sin sombrero en la burbuja del chat y la portada del video.** Los 19 SVG quedan en `img/robots/` por si sirven para piezas por país.

**4 · Bloque de prueba — ✅ NUEVO, reemplaza a los robots**

Sección `.prueba` entre "Quién está detrás" y "Cómo trabajamos", con título *"Nada de esto es una demo"* y cuatro hechos: el agente de WhatsApp con memoria y agenda, la plataforma de diagnósticos cobrando (con link a `app.varka.tech`), los 16 flujos activos de la operación propia y las tres vulnerabilidades críticas de la última auditoría. **Sin íconos, sin animación y sin tarjetas**, a propósito.

**Lo que quedó del intento original:**
- ⚠️ **Cambió el método respecto de lo anotado el 09/08.** No hizo falta Remotion: los sombreros ya estaban dibujados en código dentro de `bocetos-sombreros.html` y `robotSVG()` es una función pura, así que se evaluó en Node y escribió los archivos directo. **Sin render de 45 min, sin cerrar Chrome, y en SVG en vez de PNG** (8-11 KB cada uno, nítidos en cualquier pantalla).
- **18 archivos en `img/robots/`**: los 9 sombreros × dos versiones, `-cabeza` (recorte) y entero.
- **Se colocan de a uno, uno por lugar, sin repetir sombrero.** Gonzalo dice dónde va cada uno.

### Reparto de sombreros

⛔ **El cowboy queda reservado para el video.** Se borraron sus tres archivos del sitio para no usarlo por error.

| Sombrero | Dónde | Estado |
|---|---|---|
| *(sin sombrero)* | Burbuja del chat, en todas las páginas | ✅ `robot-cabeza-ajustado.svg`, 46 px |
| **Charro** 🇲🇽 | Hero del home, apuntando al botón de diagnóstico gratuito | ✅ `robot-charro-senala.svg`, 104 px, girado 13°, brazo a 58°, flota. Lleva al mismo cal.com que el botón |
| Boina 🇫🇷 | — | libre |
| Chullo 🇵🇪 | — | libre |
| Bombín 🇧🇴 | — | libre |
| Vueltiao 🇨🇴 | — | libre |
| Cordobés 🇪🇸 | — | libre |
| Chupalla 🇨🇱 | — | libre |
| Llanero 🇻🇪 | — | libre |

**Para que un robot señale algo** hay un generador: envuelve el brazo izquierdo en un `<g>` que rota sobre el hombro (37, 152) y ensancha el viewBox por izquierda, porque el puño levantado se sale del encuadre original.

**4 · `widget.js`** — tiene sin commitear la corrección de asesoría a "$120 la hora suelta, $100/h desde 10 horas". Viaja en este deploy.

## Qué NO voy a hacer

- **No embeber el player en el home.** Va link a `/demo`, decidido el 10/08.
- **No cambiar la geografía del listicle.** Sigue siendo un artículo sobre Argentina con empresas argentinas; lo que cambia es el criterio de quién entra.
- **No tocar el resto del blog**, ni los otros 10 artículos, ni el diseño del sitio.
- **No rediseñar el home.** Solo se agrega el bloque del video y los robots donde correspondan.
- **No optimizar los clips de nuevo.** Ya se recomprimieron una vez; 49,8 MB es lo que hay.
- **No armar la boina gaucha.** Argentina y Uruguay quedan sin sombrero propio, decidido el 09/08.

## Qué no se tiene que romper

- **El sitio entero sigue en pie.** Home, las 6 páginas de servicio, los 11 artículos del blog y el glosario cargan igual.
- **La indexación.** `llms.txt`, `robots.txt`, `sitemap.xml` y los canónicos del blog no se tocan salvo para **sumar** `/demo`. La indexación de `varka.tech` costó 32 días.
- **El widget del asistente** sigue funcionando en todas las páginas.
- **El deploy de Netlify no se rompe por peso.** 49,8 MB de clips entran al repo y al build.
- **El player sigue andando igual que en local**: los 8 caminos, el audio, los subtítulos y los botones de WhatsApp con los dos números ya cargados.
- **Los parámetros `?e=agencia` y `?e=empresa`** del outreach tienen que seguir leyéndose.

## Cómo verifico

1. **Antes de tocar:** `git status` limpio salvo `widget.js`, y anotar el commit actual para poder volver.
2. **Video:** abrir `/demo` en el sitio publicado y **recorrer un camino entero**, no solo la portada — que encadene los clips, se escuche y caigan los botones. ⚠️ **Netlify tiene que servir Range requests**: es lo que hacía fallar a `python -m http.server`. Si el segundo clip no arranca, es eso.
3. **Probar `/demo?e=agencia`** y confirmar que el perfil se conserva.
4. **Listicle:** que ninguno de los cuatro nombres siga en el HTML, y que la página cargue con el mismo formato.
5. **Lo que no se tiene que romper:** abrir home, las 6 páginas de servicio y 3 artículos del blog al azar. Confirmar que el widget aparece.
6. **Sitemap y llms.txt** siguen respondiendo 200.

## Orden

Video → listicle → sombreros. El video primero porque es el que puede fallar por peso o rutas, y conviene que falle hoy y no el jueves con todo encima. **Los sombreros son lo único que puede no llegar**; si no llegan, el deploy sale igual sin ellos.
