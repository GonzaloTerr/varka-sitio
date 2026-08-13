# Ampliar /consultora-ia de ~1.300 a 3.000+ palabras

## Qué resuelve

Es la única página de varka.tech que rankea en primera página por "consultora de IA en Argentina", y le saca poca profundidad a los que la superan: `iaaplicada.ar` tiene 4.500-5.000 palabras solo en su home y el listicle de Duotach 3.500-4.000 en una sola página. Subir esta página es más barato que empujar cualquier otra, porque ya tiene la posición ganada.

## Qué voy a hacer

Agregar seis secciones nuevas, todas con las clases de CSS que ya existen. No se toca ni una línea de `styles.css`.

1. **Qué incluye y qué no** — el alcance dicho con todas las letras. Los dos competidores son vagos acá.
2. **Cuánto cuesta** — rangos reales tomados de `llms.txt` y `/precios`, con la distinción entre la llamada gratis de 1 hora y el Diagnóstico de USD 400, que es la confusión más cara.
3. **Qué se puede automatizar, por área** — atención, ventas, operación, administración. Concreto, no categorías.
4. **Cómo elegir una consultora de IA** — checklist de preguntas para hacerle a cualquier proveedor, incluida Varka. Es el ángulo de guía de compra que falta en todo el sitio. Enlaza al artículo del blog en vez de repetirlo.
5. **Qué está funcionando hoy** — Sofía, el SaaS de diagnósticos, los flujos de n8n, la auditoría técnica, el flujo contable. Prueba real, sin nombre de cliente.
6. **Quién está detrás** — los +20 años operando pymes argentinas. Los dos competidores son nulos acá.

Y la **FAQ pasa de 4 a 10 preguntas**, con el `FAQPage` del `<head>` actualizado para que coincida exactamente con lo visible.

## Qué NO voy a hacer

- **No toco `<title>`, canonical, H1 ni la meta description.** El title se acaba de cambiar hoy y el H1 tiene la keyword exacta.
- **No borro la palabra "pymes".** Sostiene la consulta #1 del re-test, ver `posicionamiento_empresas_no_pymes`.
- **No invento clientes, logos, testimonios ni métricas de resultado.** Los casos van anónimos y solo lo que existe y está andando.
- **No agrego CSS ni JavaScript nuevo.** Todo con las clases que ya están.
- **No toco el nav, el footer ni el widget de chat.**
- **No armo tabla de precios**: `styles.css` no tiene clase de tabla y no voy a inventar una. Los precios van en tarjetas.
- **No borro ninguna sección existente.** Todo lo que hoy está indexado se queda donde está.

## Qué no se tiene que romper

| Qué | Cómo se comprueba |
|---|---|
| `/consultora-ia` responde 200 | `curl -o /dev/null -w '%{http_code}'` |
| `<title>`, canonical y H1 intactos | `grep` contra los valores de hoy |
| El `FAQPage` sigue siendo JSON válido | parsear el bloque con `json.loads` |
| Las 4 preguntas viejas de la FAQ siguen presentes | `grep` de cada una |
| El acordeón de la FAQ abre y cierra | las nuevas usan el mismo marcado `.faq-item > .faq-q + .faq-a` |
| Nav, footer y widget de chat | no se tocan; verificar que `/widget.js` siga linkeado |
| Los links internos no se rompen | `curl` a cada destino nuevo |

## Cómo verifico

1. `python -c "json.loads(...)"` sobre el bloque de `FAQPage`.
2. `grep` de title, canonical, H1 y las 4 preguntas viejas.
3. Conteo de palabras del cuerpo, que tiene que dar 3.000+.
4. `curl` a cada URL enlazada, que todas den 200.
5. Después del deploy: `/consultora-ia` en vivo con 200 y las secciones nuevas servidas.

**Lo que no puedo verificar yo: cómo se ve.** El render lo mira Gonzalo antes de pushear.
