/**
 * Player del video interactivo de Varka.
 *
 * No es un video con botones: es una página que encadena clips y va guardando
 * lo que el visitante elige. Cada elección lo califica sin formulario, y al
 * final el camino sale a n8n y a WhatsApp con el mensaje ya escrito.
 *
 * Player propio a propósito: los SaaS del rubro (Tolstoy y compañía) arrancan
 * en USD 79/mes y atan el producto al proveedor. Esto es HTML plano, se
 * construye una vez y se reusa en cada cliente.
 */

// ───────────────────────────────────────────────────────────────────────────
// ⚠️ COMPLETAR ANTES DE PUBLICAR
// ───────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Números en formato internacional sin + ni espacios.
  WA_SOFIA: "5491125653768",    // donde atiende Sofía
  WA_GONZALO: "5491144049400",  // el número personal
  /**
   * ⛔ Vacío A PROPÓSITO — decidido el 08/08/2026, no es un pendiente.
   *
   * El aviso a n8n llegaría SIN IDENTIDAD: diría que "alguien" recorrió tal
   * camino y se fue, sin nombre ni forma de contactarlo. Como estadística eso ya
   * lo da Umami, que recibe cada elección. Un flujo de n8n para lo mismo es
   * trabajo duplicado, y a un anónimo no se lo puede volver a tocar.
   *
   * Solo vale la pena si algún día los links de outreach llevan identificador de
   * prospecto (`?e=agencia&p=wajner`): ahí el aviso pasa a ser "Fulano miró el
   * video, eligió tal dolor y no escribió", que sí es material de seguimiento.
   * Recién entonces se arma el flujo y se completa esta URL.
   */
  WEBHOOK_N8N: "",
  // Carpeta de los clips, relativa a este archivo.
  CLIPS: "clips/",
};

const $ = (id) => document.getElementById(id);
const video = $("video");
const portada = $("portada");
const opciones = $("opciones");   // la capa entera, con el degradado
const panel = $("panel");         // la columna derecha, donde van pregunta y botones
const pregunta = $("pregunta");
const avance = $("avance");
const saltar = $("saltar");

let grafo = null;
let nodoActual = null;
let camino = [];          // los tags acumulados, en orden
let arrancado = false;
let cerrado = false;      // ya se mandó el camino a n8n: no mandarlo de nuevo al salir
const precargados = new Set(); // rutas ya bajadas al caché, para no pedirlas dos veces

// ── Tracking ───────────────────────────────────────────────────────────────

/** Umami si está; si no, no pasa nada. El player no depende de la analítica. */
const evento = (nombre, datos = {}) => {
  try {
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(nombre, datos);
    }
  } catch (e) {
    /* la analítica nunca puede romper la reproducción */
  }
};

/** El camino completo a n8n. Se manda al llegar al cierre y al salir. */
const aN8n = (motivo) => {
  if (!CONFIG.WEBHOOK_N8N) return;
  const cuerpo = JSON.stringify({
    motivo,
    camino,
    nodo: nodoActual,
    entrada: new URLSearchParams(location.search).get("e") || "directo",
    ts: new Date().toISOString(),
  });
  // sendBeacon sobrevive a que se cierre la pestaña; fetch es el respaldo.
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.WEBHOOK_N8N, new Blob([cuerpo], { type: "application/json" }));
      return;
    }
  } catch (e) { /* sigue por fetch */ }
  fetch(CONFIG.WEBHOOK_N8N, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpo,
    keepalive: true,
  }).catch(() => {});
};

// ── Diagnóstico ────────────────────────────────────────────────────────────
//
// 🔴 El player fallaba EN SILENCIO: si un clip no cargaba, la pantalla quedaba
// negra, los botones aparecían igual y no había ni un mensaje. El `play()`
// tenía un `catch` vacío y el <video> no tenía manejador de `error`, así que
// el único síntoma era el negro.
//
// Con `?debug=1` la secuencia entera se ve en pantalla y se manda al log del
// servidor. Sin el parámetro no se muestra nada, pero el fallo sí avisa.

const DEBUG = new URLSearchParams(location.search).has("debug");
const CAUSAS = { 1: "ABORTADO", 2: "RED", 3: "NO SE PUDO DECODIFICAR", 4: "FORMATO O RUTA NO SOPORTADA" };

let panelDebug = null;
const anotar = (linea) => {
  const t = (performance.now() / 1000).toFixed(2);
  console.log(`[player ${t}s] ${linea}`);
  if (!DEBUG) return;
  if (!panelDebug) {
    panelDebug = document.createElement("pre");
    panelDebug.style.cssText =
      "position:fixed;left:8px;top:8px;z-index:99;max-width:46ch;max-height:60vh;overflow:auto;" +
      "margin:0;padding:10px 12px;background:rgba(11,18,32,.92);color:#B9C2DA;border:1px solid #2D3A5C;" +
      "border-radius:10px;font:12px/1.5 ui-monospace,Consolas,monospace;white-space:pre-wrap";
    document.body.appendChild(panelDebug);
  }
  panelDebug.textContent += `${t}s  ${linea}\n`;
  panelDebug.scrollTop = panelDebug.scrollHeight;
  fetch("/__player?t=" + encodeURIComponent(`${t}s ${linea}`)).catch(() => {});
};

/**
 * Lo que ve el visitante cuando un clip no carga. Antes veía negro y nada más:
 * cualquier cosa es mejor que eso, porque el negro parece que se rompió la
 * página entera y se va.
 */
const avisarFallo = (motivo) => {
  pregunta.textContent = "No se pudo cargar el video (" + motivo + "). Probá recargar la página.";
  opciones.classList.add("visible");
};

// Cada estado del <video>, para saber dónde se corta. `error` y `stalled` son
// los que importan; el resto da el contexto de hasta dónde llegó.
["loadstart", "loadedmetadata", "canplay", "playing", "waiting", "stalled", "suspend", "ended", "emptied", "abort"]
  .forEach((ev) => video.addEventListener(ev, () => anotar(`${ev} · ${(video.currentSrc || "").split("/").pop()}`)));

video.addEventListener("error", () => {
  const e = video.error;
  const causa = CAUSAS[e && e.code] || `código ${e && e.code}`;
  anotar(`🔴 ERROR del video: ${causa} ${(e && e.message) || ""} · src=${(video.currentSrc || "").split("/").pop()}`);
  evento("video_error", { nodo: nodoActual, causa });
  avisarFallo(causa);
});

// ── Reproducción ───────────────────────────────────────────────────────────

const rutaClip = (id) => CONFIG.CLIPS + grafo.nodos[id].clip;

/**
 * Baja el clip siguiente mientras se reproduce el actual, para que el corte
 * entre uno y otro sea invisible.
 *
 * 🔴 Va con `fetch`, NO con un <video>. La versión anterior creaba un elemento
 * de video por cada destino posible y **no lo soltaba nunca**: quedaban en un
 * Map para siempre. Para el tercer clip había seis decodificadores abiertos y
 * Chrome se caía con `PIPELINE_ERROR_DECODE: failed to send audio packet`,
 * pantalla negra y los botones apareciendo igual.
 *
 * Medido en la máquina de Gonzalo (4 GB, i5-7400): **a partir de 3 videos
 * precargados el siguiente ya no reproduce**. El player llegaba a 6.
 *
 * Un `fetch` no abre decodificador ni pipeline: deja los bytes en el caché
 * HTTP y el <video> los toma de ahí cuando le toca. El `arrayBuffer()` está
 * para consumir la respuesta —si no se lee, el navegador puede cortar la
 * descarga— y se descarta enseguida.
 */
const precargar = (id) => {
  if (!id) return;
  const ruta = rutaClip(id);
  if (precargados.has(ruta)) return;
  precargados.add(ruta);
  fetch(ruta, { cache: "force-cache" })
    .then((r) => r.arrayBuffer())
    .then(() => anotar(`precargado ${ruta.split("/").pop()}`))
    .catch(() => precargados.delete(ruta));
};

const ocultarOpciones = () => {
  opciones.classList.remove("visible");
  panel.querySelectorAll(".opcion").forEach((b) => b.remove());
};

const mostrarOpciones = () => {
  const nodo = grafo.nodos[nodoActual];
  const esSalida = nodo.opciones === "SALIDA";
  const lista = esSalida ? grafo.salida : nodo.opciones;

  // La pregunta que el robot acaba de decir queda escrita arriba de los
  // botones. El subtítulo la muestra mientras la dice, pero se va con el clip:
  // sin esto hay que acordarse de qué preguntó para poder contestar.
  // Sale del grafo, no del código, para que sea la misma frase que el audio.
  pregunta.textContent = nodo.pregunta || "";
  saltar.classList.add("oculto");

  lista.forEach((op) => {
    const b = document.createElement("button");
    b.className = "opcion" + (esSalida ? " salida" : "");
    if (op.accion === "reset") b.className = "opcion suave";
    b.textContent = op.txt;
    b.addEventListener("click", () => (esSalida ? salir(op) : elegir(op)));
    panel.appendChild(b);
  });

  // En los cierres, la vuelta al sitio. El que llega por un link de outreach
  // (?e=agencia) entra directo acá y sus únicas salidas son los dos WhatsApp:
  // si le interesó y quiere ver precios o servicios, no tiene por dónde.
  // Lleva la clase `.opcion` a propósito, así `ocultarOpciones()` lo limpia
  // junto con los botones y no queda colgado si el visitante vuelve a empezar.
  if (esSalida) {
    const a = document.createElement("a");
    a.className = "opcion sitio";
    a.href = "/";
    a.textContent = "Ver todo lo que hacemos →";
    a.addEventListener("click", () =>
      evento("video_al_sitio", { camino: camino.join(" > ") })
    );
    panel.appendChild(a);
  }

  opciones.classList.add("visible");
};

const reproducir = (id) => {
  nodoActual = id;
  ocultarOpciones();
  avance.style.width = "0%";

  anotar(`reproducir(${id}) → ${rutaClip(id)}`);
  video.src = rutaClip(id);
  // `load()` explícito: sin él, cambiar `src` sobre un video que YA TERMINÓ no
  // siempre dispara una carga nueva, y el elemento se queda en el estado viejo.
  video.load();
  const p = video.play();
  if (p && p.catch) {
    p.catch((err) => {
      // Ya no se traga el error: sin esto, un `play()` rechazado dejaba la
      // pantalla negra y nadie se enteraba de por qué.
      anotar(`🔴 play() rechazado: ${err.name} — ${err.message}`);
      evento("video_play_rechazado", { nodo: id, causa: err.name });
      if (err.name !== "AbortError") avisarFallo(err.name);
    });
  }

  saltar.classList.remove("oculto");

  // Precarga de todos los destinos posibles de este nodo. Son 2 o 3 y el
  // visitante va a ver uno solo, pero no sabemos cuál hasta que elija.
  const nodo = grafo.nodos[id];
  if (nodo.opciones !== "SALIDA") {
    nodo.opciones.forEach((op) => precargar(op.va));
  }
};

const elegir = (op) => {
  camino.push(op.tag);
  evento("video_choice", { nodo: nodoActual, tag: op.tag });
  reproducir(op.va);
};

const salir = (op) => {
  if (op.accion === "reset") {
    evento("video_reset", { camino: camino.join(" > ") });
    camino = [];
    cerrado = false;
    reproducir(grafo.inicio);
    return;
  }

  // El mensaje de WhatsApp cambia según el camino: el último tag es el que más
  // dice, porque es el dolor concreto que eligió.
  const ultimo = camino[camino.length - 1];
  const texto = grafo.mensajes[ultimo] || grafo.mensajes._default;
  const numero = op.accion === "wa_sofia" ? CONFIG.WA_SOFIA : CONFIG.WA_GONZALO;

  evento("video_complete", { accion: op.accion, camino: camino.join(" > ") });
  aN8n(op.accion);
  cerrado = true;

  if (!numero) {
    alert(
      "Falta cargar el número de WhatsApp en player.js (CONFIG.WA_SOFIA / WA_GONZALO).\n\n" +
      "El mensaje que se iba a enviar era:\n\n" + texto
    );
    return;
  }
  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, "_blank");
};

// ── Eventos del video ──────────────────────────────────────────────────────

video.addEventListener("timeupdate", () => {
  if (!video.duration) return;
  avance.style.width = (video.currentTime / video.duration) * 100 + "%";
});

video.addEventListener("ended", () => {
  avance.style.width = "100%";
  mostrarOpciones();
});

// Saltar el clip: va directo a las opciones sin esperar. Está para el que
// vuelve o ya sabe lo que quiere; no le quita nada al que mira todo.
saltar.addEventListener("click", () => {
  video.pause();
  mostrarOpciones();
});

// Si se va sin llegar al final, igual queda registrado por dónde iba. Si ya
// llegó al cierre y eligió salida, no se manda de nuevo: sería el mismo lead
// contado dos veces en n8n.
window.addEventListener("pagehide", () => {
  if (arrancado && !cerrado && camino.length) {
    evento("video_exit", { nodo: nodoActual, camino: camino.join(" > ") });
    aN8n("exit");
  }
});

// ── Arranque ───────────────────────────────────────────────────────────────

/**
 * El nodo inicial sale de `?e=` — así el mismo player sirve para la web y para
 * el outreach, entrando derecho al clip que le habla a ese perfil. Cero clips
 * extra: es un parámetro leído al iniciar.
 */
const nodoInicial = () => {
  const e = new URLSearchParams(location.search).get("e");
  return (e && grafo.entradas[e]) || grafo.inicio;
};

$("empezar").addEventListener("click", () => {
  arrancado = true;
  portada.style.display = "none";
  const inicio = nodoInicial();

  // Entrando por ?e= se saltea el clip de apertura, y con él el botón que
  // habría registrado el perfil. Se recupera del nodo inicial: la opción que
  // lleva a este clip es exactamente la que el visitante habría apretado.
  if (inicio !== grafo.inicio) {
    const salto = grafo.nodos[grafo.inicio].opciones.find((op) => op.va === inicio);
    if (salto) camino.push(salto.tag);
  }

  evento("video_start", { entrada: new URLSearchParams(location.search).get("e") || "directo" });
  reproducir(inicio);
});

fetch("grafo.json")
  .then((r) => r.json())
  .then((g) => {
    grafo = g;
    // Se precarga el primer clip mientras el visitante lee la portada.
    precargar(nodoInicial());
  })
  .catch((err) => {
    portada.innerHTML =
      '<div class="columna"><h1>No se pudo cargar el video</h1>' +
      '<p style="color:#97A0B8">' +
      "Abrí la carpeta con un servidor local: <code>npx serve player</code>. " +
      "Al abrir el archivo directo, el navegador bloquea la carga del grafo.</p></div>";
    console.error(err);
  });