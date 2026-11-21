# Monitoreo y automatización (Zabbix · Grafana · n8n · Telegram)

## Arquitectura

| Servicio | IP (VLAN 40) | Imagen Docker | Acceso externo (NAT estático en R2) |
|---|---|---|---|
| Zabbix 4.4 (server + MySQL + web) | 192.168.40.21 (S2 e2/1) | `zabbix/zabbix-appliance:alpine-4.4-latest` | `http://192.168.224.131:8080` (Admin) |
| Grafana 10.4 + plugin Zabbix 4.6.1 | 192.168.40.23 (S2 e2/0) | `redes2/grafana-zabbix:latest` (build propio) | `http://192.168.224.131:3000` |
| n8n 1.64.3 | 192.168.40.25 (S2 e2/2) | `n8nio/n8n:1.64.3` | `http://192.168.224.131:5678` |
| Pasarela Telegram | 192.168.224.128:8081 (VM PnetLab) | `tg-gateway.py` | — |

- Los servidores van en la **VLAN 40 (gestión)**: la ACL `ACCESO_ADMIN` ya permite que esa VLAN administre los equipos.
- IPs **impares**: la política par/impar de la VLAN 40 deja usar el DNS interno (n8n necesita resolver nombres).
- R2: `ip tcp adjust-mss 1360` en e0/2.40 y NAT estático por puerto para cada servicio.

## Zabbix

- 17 hosts creados por API con [`zabbix_hosts.py`](zabbix_hosts.py): grupos *Routers RIP / EIGRP / OSPF*, *Switches*, *Servidores*.
- Routers y switches: plantilla **Template Net Cisco IOS SNMPv2** (interfaces, tráfico, CPU + ICMP). Servidores: **Template Module ICMP Ping**; SRV-WEB además chequeo `net.tcp.service[http]` con trigger "Servidor web caído".
- SNMP v2c solo lectura, restringido por ACL al servidor Zabbix: [`snmp-routers-switches.txt`](snmp-routers-switches.txt).
- Se desactivó el host "Zabbix server" de fábrica (sin agente) y el trigger *In half-duplex mode* (los IOL reportan half-duplex: artefacto del simulador).
- `USUARIOS_SIN_ADMIN` (R2) se ajustó con `15 permit icmp 192.168.10.0 0.0.0.255 host 192.168.40.21 echo-reply`: Zabbix puede vigilar la VLAN 10 sin romper la política "VLAN 10 nunca accede a VLAN 40".

## Grafana

- Imagen construida en la VM: `FROM grafana/grafana:10.4.2` + `grafana cli plugins install alexanderzobnin-zabbix-app 4.6.1` (`docker build --network host`).
- La versión 6.x del plugin exige Grafana ≥ 11.6 y la 5.x ≥ 10.4.8; la 4.6.1 es compatible con 10.4.2.
- Fuente de datos *Zabbix* → `http://192.168.40.21/api_jsonrpc.php`. Dashboard **Red Pamplona · Estado general** (`/d/red-pamplona`): disponibilidad ICMP, problemas activos, latencia, tráfico de R2 e0/3 (NAT), CPU y tráfico del EtherChannel S1 Po1.

## n8n + Telegram

- Bot: `@redpamplona_kamiro_bot` (BotFather). El token **no** se guarda en el repo.
- Flujo [`n8n/bot-telegram-zabbix.json`](n8n/bot-telegram-zabbix.json): *Cada 10 segundos* → *Configuracion* → *Bot Telegram + Zabbix* ([`n8n/bot.js`](n8n/bot.js)).
  - Lee mensajes con `getUpdates` (polling: Telegram no puede llegar a un webhook dentro del lab).
  - Consulta la API de Zabbix (`host.get`, `item.get icmpping`, `trigger.get`) y responde: `/estado_red`, `/alertas`, `/dispositivos_caidos`, `/zabbix`, `/grafana`, `/resumen`.
  - Compara los problemas con la ejecución anterior y envía **🚨 ALERTA / ✅ RESUELTO** a los chats suscritos.
- **Pasarela** ([`tg-gateway.py`](tg-gateway.py)): desde los contenedores, HTTPS hacia Internet era intermitente (`UND_ERR_CONNECT_TIMEOUT`, `ECONNRESET`) por el doble NAT R2 → VMware. n8n llama por HTTP a la VM (192.168.224.128:8081, alcanzable por R2 sin salir a Internet) y la VM reenvía a `api.telegram.org`. Solo acepta rutas `/bot…`. Arranque con `@reboot` en el crontab de la VM.

## Problemas resueltos

| Problema | Causa | Solución |
|---|---|---|
| `docker pull` falla con `invalid tar header` (n8n) | Docker 19.03 no lee capas zstd | Usar `n8nio/n8n:1.64.3` |
| Pulls / plugin con timeout | `/etc/resolv.conf` de la VM vuelve a `192.168.20.3` | `echo nameserver 8.8.8.8 > /etc/resolv.conf` antes de descargar |
| Plugin Zabbix no carga en Grafana | Plugin 6.11 requiere Grafana ≥ 11.6 | Plugin 4.6.1 copiado con `docker cp` |
| `Template cannot be linked ... more than once` | La plantilla Cisco ya incluye ICMP Ping | Solo plantilla Cisco en equipos SNMP |
| SRV-DHCP "caído" en Zabbix | ACL bloqueaba la respuesta ICMP VLAN 10 → 40 | Regla 15 `echo-reply` hacia Zabbix |
| R1 se reiniciaba | 93 % de 256 MB de RAM (RIP + EIGRP + redistribución) | RAM: R1/R3 1024 MB, R6/S1/S2/S3 512 MB |
| n8n con dos rutas por defecto | `eth0` (Docker) sin Internet | `ip route del default via 10.177.0.1 dev eth0` (nsenter) |

## Pruebas (2026-11-20)

- Grafana: 17/17 equipos *ARRIBA*, latencia ICMP por router.
- Bot: `/resumen` → 17 equipos, 0 alertas, todos los dominios en verde.
- Alerta: *Stop* de R11-SOGAMOSO → `🚨 ALERTA · Alta — R11-SOGAMOSO: Unavailable by ICMP ping` (Zabbix necesita 3 pings fallidos, ~3 min).
