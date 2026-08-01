// ══════════════════════════════════════════════════════════════════
//  VARKA AI CHAT WIDGET — compartido en todas las páginas
//  Se inyecta solo en el body y se auto-inicializa.
// ══════════════════════════════════════════════════════════════════
(function () {
  if (window.__varkaChatLoaded) return;   // evita doble carga
  window.__varkaChatLoaded = true;

  // ── INYECTAR HTML ────────────────────────────────────────────────
  const markup = `
  <div class="ai-tooltip" id="aiTooltip" role="status">
    <button class="ai-tooltip-close" id="aiTooltipClose" aria-label="Cerrar">×</button>
    ¿Automatizás algo en tu negocio? Puedo ayudarte a ver qué conviene 👋
  </div>
  <button class="ai-bubble" id="aiBubble" aria-label="Abrir chat con Varka AI" aria-expanded="false">
    <svg class="ai-bubble-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg class="ai-bubble-close" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <div class="ai-badge" id="aiBadge">1</div>
  </button>
  <div class="ai-panel" id="aiPanel" role="dialog" aria-modal="true" aria-label="Chat con Varka AI">
    <div class="ai-panel-hdr">
      <div class="ai-panel-avatar">
        <svg viewBox="0 0 28 28" fill="none" width="20" height="20" aria-hidden="true">
          <polygon points="14,2 24.5,8 24.5,20 14,26 3.5,20 3.5,8" stroke="white" stroke-width="1.75" fill="rgba(255,255,255,.1)" stroke-linejoin="round"/>
          <circle cx="14" cy="14" r="3" fill="white"/>
        </svg>
      </div>
      <div style="flex:1">
        <div class="ai-panel-name">Varka AI</div>
        <div class="ai-panel-status"><span class="status-dot"></span>En línea ahora</div>
      </div>
      <button id="aiClose" aria-label="Cerrar chat" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;border-radius:6px;transition:background .2s;">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M12 4L4 12M4 4l8 8" stroke="rgba(225,245,238,.7)" stroke-width="1.75" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="ai-msgs" id="aiMsgs"></div>
    <div class="ai-input-row">
      <textarea class="ai-input" id="aiInput" placeholder="Escribí tu pregunta..." rows="1" aria-label="Mensaje para Varka AI"></textarea>
      <button class="ai-send" id="aiSend" aria-label="Enviar mensaje">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <div class="ai-note">Impulsado por Claude AI · Varka</div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', markup);

  // ── CONFIG ───────────────────────────────────────────────────────
  const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbypGnd5xdTOk9zLT6JMmToTWdxIGfW2lQ2I-QdGiiqG2KcGZyOcFE4f60FvTEA4_zjD/exec';

  const VARKA_SYSTEM = `Sos Varka AI, el asistente inteligente de Varka — consultora de inteligencia artificial para pymes y emprendedores de Argentina, Uruguay y Chile.

Tu rol: ayudar al visitante a entender cómo Varka puede mejorar su negocio, responder sus dudas y guiarlo hacia el diagnóstico gratuito de 1 hora.

═══ SOBRE VARKA ═══
Email: consultas@varka.tech | Web: varka.tech | Fundada: 2024
Países: Argentina, Uruguay, Chile

═══ SERVICIOS ═══
Todo se cobra como SETUP ÚNICO + ABONO MENSUAL de mantenimiento y mejoras, sin permanencia mínima. Los valores son de referencia; el precio final sale del diagnóstico.

1. CHATBOTS Y ASISTENTES — desde $1.500 USD setup + $200/mes (el más solicitado)
   Para WhatsApp, web o Instagram. Atienden 24/7, califican leads, agendan citas. Entrega: 2-4 semanas.
   Variantes: web embebido desde $1.200 + $150/mes · recepcionista por rubro desde $1.800 + $220/mes · agente de voz telefónico desde $2.500 + $300/mes.

2. AUTOMATIZACIÓN DE PROCESOS — a medida (mayor ROI)
   Elimina tareas repetitivas: reportes, seguimientos, carga de datos, facturación, conciliaciones. Automatizaciones sueltas por flujo desde $190 (simple), $390 (media) o $790 (compleja). Un proyecto interno completo arranca desde $2.000 setup + $400/mes. Entrega: 1-2 semanas las simples.

3. CAPTACIÓN DE LEADS CON IA — desde $700 USD setup + $300/mes
   Busca, enriquece y contacta prospectos por email y WhatsApp. Sin costo de pauta.

4. CONTENIDO Y MARCA CON IA — desde $300 USD setup + $150/mes
   Reels, carruseles y artículos SEO en piloto automático. Plan Pro desde $450 + $300/mes; con avatar de IA desde $700 + $400/mes.

5. ASESORÍA ESTRATÉGICA — desde $120 USD/sesión (punto de entrada ideal)
   Análisis del negocio + plan concreto de IA con prioridades y costos estimados.

6. AUDITORÍA DE CIBERSEGURIDAD — a medida
   Pentest autorizado sobre app, e-commerce o API: se buscan las vulnerabilidades antes que un atacante. Informe claro y plan de remediación priorizado. Más info: varka.tech/ciberseguridad-ia

7. POSICIONAMIENTO EN IA — GEO — auditoría desde $450 USD
   Que ChatGPT, Perplexity y Gemini nombren y citen a la empresa cuando alguien pregunta por su rubro. Incluye medición inicial con 25 consultas en los tres motores, preparación del sitio, presencia en directorios, contenido citable y re-test mensual fechado. Plan mensual desde $1.200 setup + $350/mes. Sobre los tiempos: se mide en semanas, no en días; el primer movimiento aparece cerca de la cuarta semana y primero se mueven las consultas de marca, después las del rubro. No se garantiza aparecer primero: los modelos deciden qué citan. Más info: varka.tech/posicionamiento-ia

═══ CÓMO SE COBRA ═══
Setup único por servicio + abono mensual de mantenimiento y mejoras. NO hay planes de soporte con nombre ni escalones fijos: cada solución tiene su propio abono, ya listado arriba. Quien tenga dos soluciones paga los dos abonos.
Sin permanencia mínima: el abono se da de baja cuando el cliente quiera.
La infraestructura y las APIs (servidor, API de IA, mensajería de WhatsApp) las paga el cliente aparte y quedan a su nombre, así que nunca queda atado a un intermediario. Única excepción: en GEO las claves las pone Varka.

═══ PROCESO ═══
1. Diagnóstico gratuito 1 hora (sin compromiso)
2. Propuesta concreta días 5-7 (precio fijo, plazo claro)
3. Kickoff semana 2 con 50% adelanto
4. Entrega semana 3-6 + capacitación 30 min al equipo
5. Soporte mensual opcional desde mes 2

═══ PREGUNTAS FRECUENTES ═══
¿Necesito conocimientos técnicos? No. Varka se encarga de todo.
¿Qué herramientas usan? OpenAI, Make, Zapier, n8n, Botpress, Manychat y más según el caso.
¿El diagnóstico es gratis? Sí, 100% gratuito y sin compromiso.
Modalidad de pago: 50% adelanto + 50% al entregar.
Tamaño de negocios: desde emprendedores unipersonales hasta 100 personas.
Si el bot no sabe algo, deriva automáticamente a un humano.

═══ COMPORTAMIENTO ═══
- Hablá en español rioplatense: "vos", "tenés", "podés". NUNCA uses "tú" ni "usted".
- Sé amigable, directo y sin tecnicismos.
- Mensajes cortos (máx 3-4 oraciones). Preferí varios cortos a uno largo.
- Máx 1 emoji por mensaje, solo si suma al tono.
- Hacé preguntas de calificación naturales: "¿Qué tipo de negocio tenés?", "¿Cuál es el proceso que más tiempo te consume?".
- Si quieren agendar el diagnóstico: antes de dar el link, asegurate de tener su nombre, email Y teléfono. Pedí los tres datos juntos si no los tenés: "Para enviarte el link necesito tu nombre, email y teléfono 😊". Una vez que los tenés, respondé normalmente Y agregá al final sin explicarlo, en este orden exacto:
<!--LEAD:{"nombre":"NOMBRE","email":"EMAIL","telefono":"TELEFONO","empresa":"EMPRESA","negocio":"TIPO_DE_NEGOCIO","servicio":"SERVICIO_DE_INTERES","problema":"PROBLEMA_PRINCIPAL","consulta":"RESUMEN_COMPLETO_DE_LA_CONVERSACION"}-->
<!--CALENDLY:{"nombre":"NOMBRE","email":"EMAIL","telefono":"TELEFONO"}-->
(reemplazá cada campo con los datos reales del usuario)
- Para otras consultas: invitalos a escribir a consultas@varka.tech.
- Si el usuario da su nombre, usalo en la conversación.
- Si no sabés algo específico de su caso, derivá al diagnóstico gratuito.
- No inventes precios ni datos que no estén en este prompt.

═══ CAPTURA DE LEADS ═══
Cuando el usuario te dé su nombre Y al menos un dato de contacto (email o teléfono), agregá al FINAL de tu respuesta —sin mencionarlo ni explicarlo al usuario— este bloque exacto:
<!--LEAD:{"nombre":"NOMBRE","email":"EMAIL","telefono":"TELEFONO","empresa":"EMPRESA","negocio":"TIPO_DE_NEGOCIO","servicio":"SERVICIO_DE_INTERES","problema":"PROBLEMA_PRINCIPAL","consulta":"RESUMEN_COMPLETO_DE_LA_CONVERSACION"}-->
Reemplazá cada campo con los datos reales. Si no tenés un dato, dejá el valor como string vacío "".
- negocio: tipo/rubro del negocio (ej: "panadería", "e-commerce de ropa", "clínica dental")
- servicio: qué servicio de Varka le interesa (ej: "chatbot para WhatsApp", "automatización de facturación")
- problema: el dolor o proceso que quiere resolver
- consulta: resumen completo de todo lo hablado hasta ahora
IMPORTANTE: Cuando incluyas <!--CALENDLY:...-->, siempre incluí también <!--LEAD:...--> en la MISMA respuesta (el LEAD va antes que el CALENDLY).`;

  // ── ESTADO Y REFERENCIAS ─────────────────────────────────────────
  let aiHistory     = [];
  let aiOpen        = false;
  let aiLoading     = false;
  let aiLeadSaved   = false;
  let aiCalendlyUrl = '';

  const aiPanel  = document.getElementById('aiPanel');
  const aiBubble = document.getElementById('aiBubble');
  const aiBadge  = document.getElementById('aiBadge');
  const aiMsgs   = document.getElementById('aiMsgs');
  const aiInput  = document.getElementById('aiInput');
  const aiSend   = document.getElementById('aiSend');
  const aiTooltip = document.getElementById('aiTooltip');
  const aiTooltipClose = document.getElementById('aiTooltipClose');

  // ── TOOLTIP PROACTIVO ────────────────────────────────────────────
  function hideTooltip() { aiTooltip.classList.remove('show'); }
  setTimeout(() => { if (!aiOpen) aiTooltip.classList.add('show'); }, 8000);
  aiTooltip.addEventListener('click', (e) => {
    if (e.target === aiTooltipClose || aiTooltipClose.contains(e.target)) return;
    hideTooltip();
    if (!aiOpen) toggleAiPanel();
  });
  aiTooltipClose.addEventListener('click', (e) => { e.stopPropagation(); hideTooltip(); });

  // ── ABRIR / CERRAR ───────────────────────────────────────────────
  function toggleAiPanel() {
    aiOpen = !aiOpen;
    aiPanel.classList.toggle('open', aiOpen);
    aiBubble.classList.toggle('open', aiOpen);
    aiBubble.setAttribute('aria-expanded', aiOpen);
    if (aiOpen) {
      hideTooltip();
      aiBadge.classList.add('hidden');
      if (aiHistory.length === 0) aiGreet();
      setTimeout(() => aiInput.focus(), 320);
    }
  }
  aiBubble.addEventListener('click', toggleAiPanel);
  document.getElementById('aiClose').addEventListener('click', toggleAiPanel);

  // Hero widget → abre el panel (si existe en la página)
  const heroWidget = document.querySelector('.chat-widget');
  if (heroWidget) {
    heroWidget.setAttribute('role', 'button');
    heroWidget.setAttribute('tabindex', '0');
    heroWidget.title = 'Chateá con Varka AI en vivo';
    heroWidget.addEventListener('click', () => { if (!aiOpen) toggleAiPanel(); });
    heroWidget.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!aiOpen) toggleAiPanel(); }
    });
  }

  // ── RENDER ───────────────────────────────────────────────────────
  function aiAddMsg(text, role) {
    const el = document.createElement('div');
    el.className = 'ai-msg ' + (role === 'user' ? 'ai-msg-user' : 'ai-msg-bot');
    if (role === 'bot') {
      const btnMatch = text.match(/\n\n__CALENDLY_BTN__(https?:\/\/[^\s]+)/);
      const displayText = text.replace(/\n\n__CALENDLY_BTN__.*$/, '');
      let html = displayText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#5DCAA5;text-decoration:underline;word-break:break-all;">$1</a>');
      if (btnMatch) {
        html += '<br><a class="ai-calendly-btn" href="' + btnMatch[1] + '" target="_blank" rel="noopener">Agendar ahora →</a>';
      }
      el.innerHTML = html;
    } else {
      el.textContent = text;
    }
    aiMsgs.appendChild(el);
    aiMsgs.scrollTop = aiMsgs.scrollHeight;
  }
  function aiShowTyping() {
    const el = document.createElement('div');
    el.className = 'ai-typing'; el.id = 'aiTyping';
    el.innerHTML = '<span></span><span></span><span></span>';
    aiMsgs.appendChild(el); aiMsgs.scrollTop = aiMsgs.scrollHeight;
  }
  function aiHideTyping() { const t = document.getElementById('aiTyping'); if (t) t.remove(); }

  // ── SALUDO INICIAL ───────────────────────────────────────────────
  function aiGreet() {
    const msg = '¡Hola! Soy Varka AI 👋 Preguntame lo que quieras sobre nuestros servicios, precios o cómo podemos ayudar a tu negocio.';
    aiAddMsg(msg, 'bot');
    aiHistory.push({ role: 'assistant', content: msg });
  }

  // ── ENVIAR MENSAJE ───────────────────────────────────────────────
  async function aiSendMsg(text) {
    if (!text.trim() || aiLoading) return;
    aiLoading = true;
    aiSend.disabled = true;
    aiInput.value = '';
    aiInput.style.height = 'auto';

    aiAddMsg(text, 'user');
    aiHistory.push({ role: 'user', content: text });
    aiShowTyping();

    try {
      const reply = await aiCallClaude(aiHistory);
      aiHideTyping();
      const leadMatch = reply.match(/<!--LEAD:([\s\S]*?)-->/);
      const calendlyMatch = reply.match(/<!--CALENDLY:([\s\S]*?)-->/);
      let cleanReply = reply.replace(/<!--LEAD:[\s\S]*?-->/, '').replace(/<!--CALENDLY:[\s\S]*?-->/, '').trim();
      let newCalendlyUrl = '';
      if (calendlyMatch) {
        try {
          const cd = JSON.parse(calendlyMatch[1]);
          newCalendlyUrl = 'https://cal.com/consultora-varka/diagnostico-gratuito'
            + '?name=' + encodeURIComponent(cd.nombre || '')
            + '&email=' + encodeURIComponent(cd.email || '');
          aiCalendlyUrl = newCalendlyUrl;
        } catch(e) {}
      }
      if (leadMatch) {
        try {
          const ld = JSON.parse(leadMatch[1]);
          if (aiCalendlyUrl) ld.calendly_url = aiCalendlyUrl;
          saveLead(ld);
          aiLeadSaved = true;
        } catch(e) {}
      } else if (newCalendlyUrl && !aiLeadSaved) {
        try {
          const cd = JSON.parse(calendlyMatch[1]);
          saveLead({ nombre: cd.nombre||'', email: cd.email||'', telefono: cd.telefono||'', calendly_url: newCalendlyUrl });
          aiLeadSaved = true;
        } catch(e) {}
      } else if (newCalendlyUrl && aiLeadSaved) {
        saveLead({ calendly_url: newCalendlyUrl, _update: true });
      }
      if (newCalendlyUrl) {
        cleanReply += '\n\n__CALENDLY_BTN__' + newCalendlyUrl;
      }
      aiAddMsg(cleanReply, 'bot');
      aiHistory.push({ role: 'assistant', content: cleanReply.replace(/\n\n__CALENDLY_BTN__.*$/, '') });
    } catch (err) {
      aiHideTyping();
      aiAddMsg(
        err.message === 'NO_KEY'
          ? 'El chat aún está en configuración. Mientras tanto, escribinos a consultas@varka.tech y te respondemos en seguida 🙂'
          : 'Hubo un problema técnico. Por favor escribinos a consultas@varka.tech y te respondemos enseguida.',
        'bot'
      );
    }

    aiLoading = false;
    aiSend.disabled = false;
    aiInput.focus();
  }

  // ── GUARDAR LEAD EN GOOGLE SHEETS ────────────────────────────────
  function saveLead(data) {
    try {
      const url = SHEETS_ENDPOINT + '?data=' + encodeURIComponent(JSON.stringify(data));
      fetch(url, { mode: 'no-cors' });
    } catch(e) {}
  }

  // ── LLAMADA AL API VIA NETLIFY FUNCTION ──────────────────────────
  async function aiCallClaude(messages) {
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: VARKA_SYSTEM,
        messages
      })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e.error && e.error.message) || 'API error');
    }
    return (await res.json()).content[0].text;
  }

  // ── INPUT HANDLERS ───────────────────────────────────────────────
  aiSend.addEventListener('click', () => aiSendMsg(aiInput.value.trim()));
  aiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); aiSendMsg(aiInput.value.trim()); }
  });
  aiInput.addEventListener('input', () => {
    aiInput.style.height = 'auto';
    aiInput.style.height = Math.min(aiInput.scrollHeight, 80) + 'px';
  });
})();
