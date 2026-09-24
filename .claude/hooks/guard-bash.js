#!/usr/bin/env node
// Reglas OBLIGATORIAS para comandos (Bash / PowerShell). Corre antes de cada comando.
//   1. git commit/push/add/pull/merge/reset/rebase SOLO dentro de la carpeta "Reportes-ProControl"
//      (la de afuera, "Reportes-Procontrol", es otro repo viejo que ya pisó GitHub una vez).
//   2. git commit, git push y wrangler deploy SIEMPRE piden confirmación al usuario.
//   3. Prohibido llamar al Worker o a Gemini (gastan la cuota gratuita).
// Salida: exit 2 = bloquea (el mensaje le llega a Claude); JSON "ask" = obliga a preguntar.
const { execFileSync } = require('child_process');
const path = require('path');

const REPO_OK = 'Reportes-ProControl'; // mayúsculas exactas

let raw = '';
process.stdin.on('data', d => (raw += d)).on('end', () => {
  let input;
  try { input = JSON.parse(raw); } catch { process.exit(0); }
  const cmd = (input.tool_input && input.tool_input.command) || '';
  const bloquear = msg => { process.stderr.write('BLOQUEADO por regla del proyecto: ' + msg + '\n'); process.exit(2); };
  const preguntar = msg => {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: msg } }));
    process.exit(0);
  };

  // 3. Llamadas al Worker o a Gemini (cuota gratuita limitada)
  if (/workers\.dev|generativelanguage\.googleapis\.com/i.test(cmd)) {
    bloquear('no se hacen llamadas al Worker ni a Gemini (gastan la cuota gratuita). Si de verdad hace falta una prueba, que la haga el usuario.');
  }

  // 1. git dentro del repo correcto
  const g = cmd.match(/\bgit\s+(?:-C\s+(?:"[^"]+"|'[^']+'|\S+)\s+)?(commit|push|add|pull|merge|reset|rebase)\b/);
  if (g) {
    const aRuta = p => (p || '').replace(/^\/([a-zA-Z])\//, '$1:/');
    let dir = aRuta(input.cwd || process.cwd());
    // Último "cd <ruta>" que aparece ANTES del git dentro del mismo comando
    const antes = cmd.slice(0, g.index);
    let m, ultimoCd = null;
    const reCd = /\bcd\s+(?:\/d\s+)?(?:"([^"]+)"|'([^']+)'|([^\s;&|]+))/g;
    while ((m = reCd.exec(antes))) ultimoCd = m[1] || m[2] || m[3];
    if (ultimoCd) dir = path.resolve(dir, aRuta(ultimoCd));
    const c = cmd.match(/\bgit\s+-C\s+(?:"([^"]+)"|'([^']+)'|(\S+))/);
    if (c) dir = path.resolve(dir, aRuta(c[1] || c[2] || c[3]));

    let top = null;
    try { top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
    if (top && path.basename(top) !== REPO_OK) {
      bloquear('ese comando de git se iba a ejecutar en "' + top + '", que NO es el repo del proyecto. Solo se trabaja en la carpeta "' + REPO_OK + '" (la de adentro, con esas mayúsculas exactas).');
    }
  }

  // 2. Acciones con efecto hacia afuera: siempre preguntar
  if (/\bgit\s+(?:-C\s+(?:"[^"]+"|'[^']+'|\S+)\s+)?(commit|push)\b/.test(cmd)) {
    preguntar('git commit/push: el usuario debe aprobarlo cada vez (regla del proyecto).');
  }
  if (/\bwrangler\s+deploy\b/.test(cmd)) {
    preguntar('wrangler deploy publica el Worker en producción: el usuario debe aprobarlo cada vez (regla del proyecto).');
  }
  process.exit(0);
});
