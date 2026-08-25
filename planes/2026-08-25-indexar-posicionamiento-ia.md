# Destrabar la indexación de /posicionamiento-ia

## Qué resuelve

Search Console la marca **"Descubierta: actualmente sin indexar" desde el 11/07/2026**. Es la página del servicio de GEO, o sea la del producto que hoy se está vendiendo. Técnicamente está impecable (200, `index, follow`, canonical propia, en sitemap y en `llms.txt`), así que no hay nada que desbloquear: Google la vio y decidió que no valía el rastreo. Las dos causas probables son que es flaca (1.193 palabras contra 3.124 de `/consultora-ia`) y que **sus únicos enlaces internos reales son dos** — el resto son menú y pie, que Google descuenta por ser plantilla.

## Qué voy a hacer

1. **Enlaces de cuerpo** hacia `/posicionamiento-ia` desde las dos páginas con más peso, que hoy solo la enlazan desde el menú y el pie:
   - `consultora-ia.html` (3.124 palabras, indexada, la única citada en la medición propia).
   - `blog/inmobiliarias-buenos-aires-que-aparecen-en-ia.html` (el mejor contenido GEO, indexado y verificado).
2. **Ampliar `/posicionamiento-ia`** con tres bloques, en el estilo y las clases que ya usa la página:
   - **La prueba propia, en positivo:** la medición publicada de 19 inmobiliarias de Buenos Aires con 12 preguntas reales, con enlace al artículo.
   - **"Cómo darte cuenta de que te venden humo":** generosidad del lado del comprador, que es la que vende.
   - **Tres preguntas nuevas en el FAQ**, sumadas también al JSON-LD `FAQPage` para que no queden desincronizados.

## Qué NO voy a hacer

- ⛔ **No publico el protocolo de medición ni cómo se arma el corpus.** Regla `contenido_no_ensena_ni_se_autoflagela`: se describe **qué entrega** el servicio, no **cómo se hace**. Era la mitad de lo que iba a escribir y se cae entera.
- ⛔ **Ningún dato propio en negativo.** Nada de "no aparecíamos", "a los 10 días cero".
- ⛔ **No publico el precio mensual** (`geo_precio_mensual_no_se_publica`): publicarlo le fija el precio al partner.
- ⛔ Sin testimonios ni nombres de clientes.
- No toco el diseño, el CSS, el hero, ni las secciones que ya existen.
- No toco la home, el sitemap ni `llms.txt`: la URL ya está en los dos.
- No solicito la indexación manual — eso lo hace Gonzalo desde Search Console.

## Qué no se tiene que romper

- Las 24 URLs del sitio siguen respondiendo 200.
- **El acordeón del FAQ sigue abriendo.** El JS engancha por las clases `faq-item`, `faq-q`, `faq-a`: las preguntas nuevas tienen que replicar esa estructura exacta, incluido el SVG del ícono.
- **El JSON-LD sigue siendo válido.** Hay un `FAQPage` en la cabecera y se le suman entradas; un error de coma lo rompe entero y en silencio.
- El menú, el pie y los botones de CTA quedan igual.
- `consultora-ia.html` y el artículo del índice siguen renderizando bien tras insertarles el párrafo.

## Cómo verifico

1. `python -c json.load` sobre el bloque JSON-LD de la página, para confirmar que parsea.
2. Conteo de palabras antes y después de `/posicionamiento-ia`.
3. `grep` de la estructura del FAQ: misma cantidad de `faq-item`, `faq-q` y `faq-a`.
4. Tras el deploy: las tres URLs tocadas en 200, y que los enlaces nuevos de cuerpo aparezcan en el HTML publicado.
5. Recorrer la lista de arriba punto por punto y reportar las dos cosas — lo nuevo y lo que no se rompió.
