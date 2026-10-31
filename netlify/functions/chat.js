// El modelo y el tope de tokens los fija el servidor: lo que mande el navegador no cuenta.
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 512;
const MAX_SYSTEM_CHARS = 8000;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;
const ALLOWED_ORIGINS = ['https://varka.tech', 'https://www.varka.tech'];

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
});

// Devuelve el pedido armado para Anthropic, o null si no es válido.
const buildRequest = (rawBody) => {
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return null;
  }

  const { system, messages } = body || {};
  if (typeof system !== 'string' || system.length > MAX_SYSTEM_CHARS) return null;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const valid = messages.every((m) =>
    m && (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' && m.content.length > 0 &&
    m.content.length <= MAX_MESSAGE_CHARS
  );
  if (!valid || messages[messages.length - 1].role !== 'user') return null;

  // En charlas largas quedan los últimos mensajes, arrancando por uno del usuario.
  let recent = messages;
  if (messages.length > MAX_MESSAGES) {
    recent = messages.slice(-MAX_MESSAGES);
    while (recent[0].role !== 'user') recent = recent.slice(1);
  }

  return {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: recent.map(({ role, content }) => ({ role, content }))
  };
};

exports.handler = async (event) => {
  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return { statusCode: 403, body: JSON.stringify({ error: { message: 'Forbidden' } }) };
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(origin), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(origin), body: 'Method Not Allowed' };
  }

  const request = buildRequest(event.body);
  if (!request) {
    return {
      statusCode: 400,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: { message: 'Invalid request' } })
    };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    const data = await res.json();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: { message: 'Server error' } })
    };
  }
};
