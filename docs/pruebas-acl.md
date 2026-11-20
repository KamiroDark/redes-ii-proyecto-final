# Pruebas de listas de acceso - Bloque 1 (2026-11-19)

| # | ACL | Prueba | Resultado | Esperado |
|---|---|---|---|---|
| 1 | USUARIOS_SIN_ADMIN | PC14 `ping 192.168.40.3` | ICMP 3/13 *administratively prohibited* desde 192.168.10.1 | Bloqueado |
| 2 | USUARIOS_SIN_ADMIN | PC14 `ping 192.168.30.12` | Responde, TTL 63 | Permitido |
| 3 | PROTEGER_WEB | PC14 `ping 192.168.30.2 -P 6 -p 80` | Connect / SendData / Close | Permitido |
| 4 | PROTEGER_WEB | PC14 `ping 192.168.30.2 -P 6 -p 22` | ICMP 3/13 *administratively prohibited* | Bloqueado |
| 5 | ACCESO_ADMIN | R1 `ssh -l admin 20.20.20.2` | `% Connection refused by remote host` | Bloqueado |
| 6 | PROTEGER_WEB | Chrome en Windows → `http://192.168.224.131` | La página carga | Permitido |

Contadores en R2 (`show access-lists`): `ACCESO_ADMIN deny any log (1 match)`, `PROTEGER_WEB permit www (50)`, `deny ip any any log (3)`, `USUARIOS_SIN_ADMIN deny 10→40 (5)`.

**Justificación**

- **ACCESO_ADMIN (R1, R2, S3):** administración solo desde la red de administración y solo por SSH v2 (cifrado), con usuario local.
- **PROTEGER_WEB (R2 e0/2.30 out):** el servidor web solo recibe HTTP/HTTPS, ICMP para diagnóstico, respuestas a conexiones que él inició y respuestas del DNS interno. Todo lo demás se descarta y se registra.
- **USUARIOS_SIN_ADMIN (R2 e0/1.10 in):** los usuarios no llegan a la red de administración. Se permite primero la respuesta del servidor DHCP (puerto 67) hacia el relay de la VLAN 40, para no romper el DHCP de esa VLAN.
