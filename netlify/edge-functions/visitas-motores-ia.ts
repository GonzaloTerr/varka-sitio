import type { Config, Context } from "@netlify/edge-functions";

// Registra en Umami cuando un motor de IA pasa por el sitio. Son dos cosas
// distintas y por eso van como dos eventos separados:
//
//   visita-motor-ia  -> alguien le preguntó algo al motor y el motor vino a
//                       leer la página para contestarle. Indica intención.
//   rastreo-motor-ia -> el rastreador pasó solo, indexando o juntando material
//                       de entrenamiento. Indica que el contenido se ingirió.
//
// La contraparte de todo esto es el referido (chatgpt.com, gemini.google.com,
// etc.), que Umami ya registra por su cuenta y dice que entró una persona.

const UMAMI = "https://analytics.varka.tech/api/send";
const WEBSITE_ID = "d49f6204-1f1d-4ae0-956e-c7d5e2d0883d"; // varka.tech

// Se dispara porque un usuario preguntó.
const AGENTES_USUARIO: Array<[string, string]> = [
  ["ChatGPT-User", "ChatGPT"],
  ["Perplexity-User", "Perplexity"],
  ["Claude-User", "Claude"],
  ["meta-externalfetcher", "Meta AI"],
];

// Pasan solos. Ninguno implica que alguien haya preguntado nada.
const RASTREADORES: Array<[string, string]> = [
  ["OAI-SearchBot", "OpenAI (indexacion)"],
  ["OAI-AdsBot", "OpenAI (publicidad)"],
  ["GPTBot", "OpenAI (entrenamiento)"],
  ["Claude-SearchBot", "Anthropic (busqueda)"],
  ["ClaudeBot", "Anthropic (entrenamiento)"],
  ["PerplexityBot", "Perplexity (indexacion)"],
  ["meta-webindexer", "Meta AI (indexacion)"],
  ["meta-externalagent", "Meta (entrenamiento)"],
];

// Ojo con el orden: OAI-SearchBot y OAI-AdsBot van ANTES que GPTBot, y
// Claude-SearchBot antes que ClaudeBot. Son cadenas distintas, pero si alguna
// vez se agrega un token que sea prefijo de otro, el mas especifico va primero.
//
// Quedan afuera a proposito:
//   bingbot              -> es por donde entra Copilot, pero es el rastreador
//                           de Bing de siempre; no se puede separar lo que es
//                           Copilot de lo que es SEO comun.
//   Google-Extended      -> no visita: es un token de robots.txt para no
//                           aparecer en el entrenamiento de Gemini.
//   Google-GeminiNotebook-> es NotebookLM, no el chat de Gemini. Meterlo se
//                           leeria como "Gemini" y taparia que el chat de
//                           Gemini NO tiene agente propio documentado.
//   meta-externalads     -> publicidad, no respuestas de IA.
//   facebookexternalhit  -> la tarjeta de previsualizacion al compartir.
//
// Gemini y Copilot no tienen agente de usuario documentado: de esos dos solo
// se puede medir el referido.

function identificar(ua: string): [string, string, string] | null {
  const usuario = AGENTES_USUARIO.find(([token]) => ua.includes(token));
  if (usuario) return ["visita-motor-ia", usuario[1], "usuario"];

  const rastreador = RASTREADORES.find(([token]) => ua.includes(token));
  if (rastreador) return ["rastreo-motor-ia", rastreador[1], "rastreo"];

  return null;
}

export default async (request: Request, context: Context) => {
  const ua = request.headers.get("user-agent") ?? "";
  const encontrado = identificar(ua);

  // El filtro de config ya deberia garantizar esto, pero si cambia el patron
  // no queremos mandar ruido a Umami.
  if (!encontrado) return;

  const [evento, motor, tipo] = encontrado;
  const url = new URL(request.url);

  // waitUntil deja el envio corriendo despues de responder: el bot no espera a
  // Umami. El limite de CPU por request es de 50 ms.
  context.waitUntil(
    fetch(UMAMI, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // OJO: Umami tiene filtro de bots y descarta el evento si el
        // User-Agent no parece un navegador — responde {"beep":"boop"} con
        // HTTP 200 y no guarda nada, asi que falla en silencio. Verificado el
        // 28/08/2026 contra la base: con un UA propio, 0 filas; con este, la
        // fila entra. El agente real del motor viaja en data.agente, no se
        // pierde nada.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        type: "event",
        payload: {
          website: WEBSITE_ID,
          hostname: url.hostname,
          url: url.pathname,
          name: evento,
          data: {
            motor,
            tipo,
            agente: ua.slice(0, 200),
          },
        },
      }),
    }).catch(() => {
      // Si Umami no responde, se pierde el evento y ya. Nunca se rompe la
      // respuesta al bot por un problema de analitica.
    }),
  );

  // Sigue la cadena normal: el bot recibe la pagina igual que siempre.
  return;
};

export const config: Config = {
  path: "/*",

  // La funcion se invoca SOLO si el User-Agent matchea. Una visita real de una
  // persona nunca la ejecuta, asi que no le agrega ni un milisegundo al sitio.
  header: {
    "user-agent":
      "(ChatGPT-User|Perplexity-User|Claude-User|meta-externalfetcher|OAI-SearchBot|OAI-AdsBot|GPTBot|Claude-SearchBot|ClaudeBot|PerplexityBot|meta-webindexer|meta-externalagent)",
  },

  // Si la funcion llegara a tirar error, la request sigue de largo y la pagina
  // se sirve igual. Por defecto Netlify haria lo contrario: cortar y mostrar
  // una pagina de error.
  onError: "bypass",
};
