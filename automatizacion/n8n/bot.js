// ===== Bot de Telegram + Zabbix (Proyecto Redes II) =====
// Lee los mensajes del bot (polling), consulta la API de Zabbix y responde.
// Ademas vigila los problemas de Zabbix y avisa de alertas nuevas/resueltas.
const cfg = $('Configuracion').first().json;
const TG = (cfg.telegram_api || 'https://api.telegram.org') + '/bot' + cfg.telegram_token;
const st = $getWorkflowStaticData('global');
st.offset = st.offset || 0;
st.chats = st.chats || [];
st.known = st.known || {};

const http = (o) => this.helpers.httpRequest(Object.assign({ json: true, timeout: 15000 }, o));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const hora = (ts) => new Date((ts ? Number(ts) * 1000 : Date.now())).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
const SEV = ['Sin clasificar', 'Información', 'Advertencia', 'Media', 'Alta', 'Desastre'];

async function zcall(method, params, auth) {
  const body = { jsonrpc: '2.0', method, params, id: 1 };
  if (auth) body.auth = auth;
  const r = await http({ method: 'POST', url: cfg.zabbix_api, body, headers: { 'Content-Type': 'application/json-rpc' } });
  if (r.error) throw new Error(r.error.data || r.error.message);
  return r.result;
}
async function zbx(method, params) {
  if (!st.auth) st.auth = await zcall('user.login', { user: cfg.zabbix_user, password: cfg.zabbix_password });
  try { return await zcall(method, params, st.auth); }
  catch (e) { st.auth = await zcall('user.login', { user: cfg.zabbix_user, password: cfg.zabbix_password }); return zcall(method, params, st.auth); }
}
async function send(chat_id, text) {
  await http({ method: 'POST', url: TG + '/sendMessage', body: { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true } });
}

// ---------- Consultas a Zabbix ----------
async function equipos() {
  const hosts = await zbx('host.get', { output: ['hostid', 'host'], selectGroups: ['name'], monitored_hosts: true, sortfield: 'host' });
  const items = await zbx('item.get', { output: ['hostid', 'lastvalue', 'lastclock'], filter: { key_: 'icmpping' }, monitored: true });
  const ping = {};
  items.forEach(i => { ping[i.hostid] = i.lastclock === '0' ? null : i.lastvalue === '1'; });
  return hosts.map(h => ({ host: h.host, grupo: (h.groups[0] || {}).name || 'Otros', arriba: ping[h.hostid] }));
}
async function problemas(minSev) {
  return zbx('trigger.get', {
    output: ['triggerid', 'description', 'priority', 'lastchange'], filter: { value: 1 }, monitored: true,
    skipDependent: true, expandDescription: true, min_severity: minSev, selectHosts: ['host'],
    sortfield: ['priority', 'lastchange'], sortorder: 'DESC'
  });
}
const icono = (a) => a === null ? '⚪' : (a ? '🟢' : '🔴');

async function cmdEstado() {
  const eq = await equipos();
  const grupos = {};
  eq.forEach(e => { (grupos[e.grupo] = grupos[e.grupo] || []).push(e); });
  let t = '<b>📡 Estado de la red</b>\n';
  Object.keys(grupos).sort().forEach(g => {
    t += `\n<b>${esc(g)}</b>\n` + grupos[g].map(e => `${icono(e.arriba)} ${esc(e.host)}`).join('\n') + '\n';
  });
  return t + `\n<i>${hora()}</i>`;
}
async function cmdCaidos() {
  const caidos = (await equipos()).filter(e => e.arriba === false);
  if (!caidos.length) return '✅ <b>No hay dispositivos caídos.</b> Todos responden a ICMP.\n<i>' + hora() + '</i>';
  return `🔴 <b>Dispositivos caídos (${caidos.length})</b>\n\n` + caidos.map(e => `• ${esc(e.host)} <i>(${esc(e.grupo)})</i>`).join('\n') + '\n\n<i>' + hora() + '</i>';
}
async function cmdAlertas() {
  const p = await problemas(2);
  if (!p.length) return '✅ <b>Sin alertas activas</b> en Zabbix.\n<i>' + hora() + '</i>';
  return `🚨 <b>Alertas activas (${p.length})</b>\n\n` + p.slice(0, 20).map(x =>
    `• <b>${esc(x.hosts[0] ? x.hosts[0].host : '?')}</b>: ${esc(x.description)}\n   ${SEV[x.priority]} · desde ${hora(x.lastchange)}`).join('\n');
}
async function cmdZabbix() {
  const v = await zcall('apiinfo.version', {});
  const eq = await equipos();
  const items = await zbx('item.get', { countOutput: true, monitored: true });
  return `<b>📊 Zabbix</b>\nVersión: ${esc(v)}\nServidor: 192.168.40.21 (VLAN 40)\nEquipos monitoreados: ${eq.length}\nMétricas activas: ${items}\nMonitoreo: ICMP + SNMP v2c\n\n🔗 ${cfg.zabbix_url}`;
}
async function cmdGrafana() {
  return `<b>📈 Grafana</b>\nServidor: 192.168.40.23 (VLAN 40)\nFuente de datos: Zabbix (plugin alexanderzobnin)\nDashboard: <i>Red Pamplona · Estado general</i>\n\n🔗 ${cfg.grafana_url}`;
}
async function cmdResumen() {
  const eq = await equipos();
  const p = await problemas(3);
  const arriba = eq.filter(e => e.arriba).length, caidos = eq.filter(e => e.arriba === false).length;
  const dom = (g) => { const x = eq.filter(e => e.grupo === g); return x.length ? `${x.every(e => e.arriba) ? '🟢' : '🔴'} ${g}: ${x.filter(e => e.arriba).length}/${x.length}` : ''; };
  return `<b>📋 Resumen de la red</b>\n\n` +
    `Equipos: <b>${eq.length}</b> · 🟢 ${arriba} · 🔴 ${caidos}\n` +
    `Alertas activas (media o mayor): <b>${p.length}</b>\n\n` +
    ['Routers RIP', 'Routers EIGRP', 'Routers OSPF', 'Switches', 'Servidores'].map(dom).filter(Boolean).join('\n') +
    `\n\n<i>${hora()}</i>`;
}
const AYUDA = '<b>🤖 Bot de la Red Pamplona</b>\nComandos disponibles:\n\n' +
  '/estado_red — estado de todos los equipos\n/alertas — problemas activos en Zabbix\n' +
  '/dispositivos_caidos — equipos que no responden\n/zabbix — información del servidor Zabbix\n' +
  '/grafana — enlace al dashboard\n/resumen — resumen general\n\n' +
  'Este chat queda suscrito a las <b>alertas automáticas</b> (caídas y recuperaciones).';
const CMDS = { '/start': async () => AYUDA, '/ayuda': async () => AYUDA, '/help': async () => AYUDA,
  '/estado_red': cmdEstado, '/alertas': cmdAlertas, '/dispositivos_caidos': cmdCaidos,
  '/zabbix': cmdZabbix, '/grafana': cmdGrafana, '/resumen': cmdResumen };

// ---------- 1) Atender comandos ----------
const out = [];
const upd = await http({ method: 'GET', url: `${TG}/getUpdates?offset=${st.offset}&timeout=0` });
for (const u of (upd.result || [])) {
  st.offset = u.update_id + 1;
  const m = u.message;
  if (!m || !m.text) continue;
  const chat = m.chat.id;
  if (cfg.allowed_chats.length && !cfg.allowed_chats.includes(chat)) { await send(chat, '⛔ Chat no autorizado.'); continue; }
  if (!st.chats.includes(chat)) st.chats.push(chat);
  const cmd = m.text.trim().split(/[\s@]/)[0].toLowerCase();
  const fn = CMDS[cmd];
  let resp;
  try { resp = fn ? await fn() : 'No conozco ese comando. Escribe /ayuda'; }
  catch (e) { resp = '⚠️ Error consultando Zabbix: ' + esc(e.message); }
  await send(chat, resp);
  out.push({ json: { chat, cmd, respondido: true } });
}

// ---------- 2) Alertas automaticas ----------
try {
  const p = await problemas(3);
  const now = {};
  p.forEach(x => { now[x.triggerid + ':' + x.lastchange] = x; });
  if (st.init) {
    for (const k of Object.keys(now)) if (!st.known[k]) {
      const x = now[k];
      for (const c of st.chats) await send(c, `🚨 <b>ALERTA</b> · ${SEV[x.priority]}\n<b>${esc(x.hosts[0] ? x.hosts[0].host : '?')}</b>: ${esc(x.description)}\n<i>${hora(x.lastchange)}</i>`);
      out.push({ json: { alerta: x.description } });
    }
    for (const k of Object.keys(st.known)) if (!now[k]) {
      const x = st.known[k];
      for (const c of st.chats) await send(c, `✅ <b>RESUELTO</b>\n<b>${esc(x.host)}</b>: ${esc(x.description)}\n<i>${hora()}</i>`);
      out.push({ json: { resuelto: x.description } });
    }
  }
  st.known = {};
  Object.keys(now).forEach(k => { st.known[k] = { host: now[k].hosts[0] ? now[k].hosts[0].host : '?', description: now[k].description }; });
  st.init = true;
} catch (e) { out.push({ json: { error_alertas: e.message } }); }

return out.length ? out : [{ json: { ok: true, sin_novedades: true } }];
