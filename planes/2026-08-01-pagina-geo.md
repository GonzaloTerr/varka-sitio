# Página de GEO en varka.tech

## Qué resuelve

GEO ya es producto vendible —lista de precios cerrada para Argentina y España el 01/08/2026— pero no existe en el sitio. Hoy no hay a dónde mandar a un interesado.

Hay un segundo motivo, más de fondo: el bloqueo real del GEO propio es la indexación de `varka.tech`. Una página sobre GEO es a la vez vitrina comercial y activo citable sobre el tema. Es el único servicio donde la página se demuestra a sí misma.

## Decisiones tomadas (01/08/2026)

| Punto | Decisión |
|---|---|
| URL | `/posicionamiento-ia`, siguiendo el patrón de las páginas existentes |
| Navegación | Sí, como sexto ítem |
| Precios | Política "desde", igual que el resto del sitio. Sin grilla |

## Qué voy a hacer

1. **`posicionamiento-ia.html`** nueva, sobre el molde de `agentes-de-ia.html`: head completo (title, description, canonical, OG, favicons), JSON-LD de `FAQPage`, nav y mobile-nav, secciones de contenido, CTA al diagnóstico gratuito, widget y Umami.
2. **Contenido de la página**, en este orden: qué cambió en cómo busca la gente · qué es GEO sin jerga · qué se hace concretamente (las cinco capas) · **la serie temporal medida sobre el propio sitio** (día 10 cero, día 18 cero, día 25 primer movimiento, primero la marca) · FAQ · CTA.
3. **Nav en los 19 archivos** que lo tienen duplicado, incluida `blog/_plantilla.html` para que las notas futuras salgan bien. Son dos inserciones por archivo (nav de escritorio y mobile). Con script Python en UTF-8.
4. **Tarjeta en la grilla de servicios de `index.html`**, junto a las que ya están.
5. **Artículo de blog**, en el mismo deploy. Ángulo: **cuánto tarda una empresa en aparecer en ChatGPT**, contado con la serie medida sobre `varka.tech`. Es el dato que ninguna agencia publica, así que es lo más citable que se puede escribir sobre el tema. Enlaza a `/posicionamiento-ia` y la página enlaza al artículo.
6. **`llms.txt`**: una línea en "Qué hace Varka" apuntando a la página nueva, y el artículo en la lista de contenidos.
7. **`sitemap.xml`**: alta de las dos URLs.
8. **Aviso a IndexNow** para que Bing las levante rápido, que es la vía por la que entra a ChatGPT.

## Qué NO voy a hacer

- **No publicar la grilla de precios.** Solo "desde", como el resto del sitio.
- **No tocar el prompt del asistente del sitio.** No está en el repo; se ve por separado para que el bot sepa vender GEO.
- **No distribuir el artículo en los otros cuatro canales** (dev.to, Medium, post de feed, Artículo de LinkedIn). El blog propio va primero porque la indexación de `varka.tech` es el bloqueo real; el resto de la distribución es un paso aparte, después del deploy.
- **No rediseñar el nav ni tocar `styles.css`.** Si con seis ítems queda apretado, se avisa y se decide, no se refactoriza de paso.
- **No tocar el contenido de las otras páginas** más allá de la línea del nav.
- **No renombrar ni redirigir** ninguna URL existente.

## Qué no se tiene que romper

- **El nav en las 19 páginas**, en escritorio y en mobile. Es el riesgo principal: un reemplazo mal hecho rompe la navegación de todo el sitio a la vez.
- **El acentuado.** `index.html` tiene acentos en mayúscula que no matchean con la herramienta de edición; va todo por script Python en UTF-8 y se verifica que no aparezcan caracteres rotos después.
- **El JSON-LD existente** de `index.html` y de cada página de servicio: tiene que seguir validando.
- **El deploy de Netlify** desde `main`. El working tree está limpio hoy, así que el commit lleva solo esto.
- **`llms.txt` y `sitemap.xml`** tienen que seguir siendo válidos y sin URLs muertas.

## Cómo verifico

1. Abrir `posicionamiento-ia.html` local y revisar que carguen estilos, nav, widget y que no haya acentos rotos.
2. Validar el JSON-LD de la página nueva.
3. Revisar el nav con la ventana angosta y en mobile, en tres páginas distintas: `index.html`, una de servicio y una del blog.
4. `grep` de control: que los 19 archivos tengan exactamente dos veces el link nuevo, ni más ni menos.
5. Después del deploy: `curl` a `https://varka.tech/posicionamiento-ia` esperando 200, y confirmar que la URL figura en el sitemap publicado.
