#!/usr/bin/env node
// Reglas OBLIGATORIAS para el código que se escribe (Edit / Write). Corre antes de cada edición.
//   1. Nada de API keys / secretos escritos en el código (ya se filtró una en GitHub).
//   2. Nada de window.prompt() ni window.confirm(): fallan (devuelven null/false sin mostrar
//      nada) en navegadores embebidos como el de WhatsApp y hacen que "no se guarde" el archivo.
// Exit 2 = bloquea la edición y le explica a Claude por qué.
let raw = '';
process.stdin.on('data', d => (raw += d)).on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const ti = input.tool_input || {};
  const file = String(ti.file_path || '').replace(/\\/g, '/');
  const texto = String(ti.new_string != null ? ti.new_string : ti.content != null ? ti.content : '');

  // Solo código de la página/Worker; los hooks y las pruebas mencionan estos patrones a propósito.
  if (!/\.(html|js|mjs|jsonc?)$/i.test(file) || /\/\.claude\//.test(file) || /\/(scratchpad|node_modules)\//.test(file)) process.exit(0);

  const bloquear = msg => { process.stderr.write('BLOQUEADO por regla del proyecto: ' + msg + '\n'); process.exit(2); };

  // 1. Secretos
  const secretos = [
    [/AIza[0-9A-Za-z_\-]{30,}/, 'clave de Google/Gemini (AIza...)'],
    [/\bAQ\.[A-Za-z0-9_\-]{30,}/, 'clave de Gemini (AQ....)'],
    [/\bre_[A-Za-z0-9]{24,}/, 'clave de Resend (re_...)'],
    [/Bearer\s+[A-Za-z0-9_\-\.]{30,}/, 'token Bearer'],
  ];
  for (const [re, nombre] of secretos) {
    if (re.test(texto)) bloquear('el texto que se iba a escribir contiene una ' + nombre + '. Las claves viven solo como secrets del Worker (wrangler secret put), nunca en el código ni en el repo.');
  }

  // 2. prompt() / confirm() (se ignoran comentarios)
  const lineas = texto.split('\n');
  for (const l of lineas) {
    const t = l.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('<!--')) continue;
    const codigo = l.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    if (/(^|[^A-Za-z0-9_$.])(window\.)?(prompt|confirm)\s*\(/.test(codigo)) {
      bloquear('se usa prompt()/confirm() en: "' + t.slice(0, 80) + '". Están prohibidos: fallan en navegadores embebidos (WhatsApp) y el usuario pierde datos sin ver ningún error. Usa un aviso propio o el patrón de doble clic (extraDosPasos).');
    }
  }
  process.exit(0);
});
