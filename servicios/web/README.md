# Servidor Web (Servidor Web-VLAN 30)

| Dato | Valor |
|---|---|
| IP (eth1) | 192.168.30.2/24, gateway 192.168.30.1 |
| Software | Apache 2.4.41 (viene en la imagen del nodo) |
| Página | [`index.html`](index.html) → `/var/www/html/index.html` |
| Nombres | `web.pamplona.local`, `www.pamplona.local`, `pamplona.com`, `www.pamplona.com` (DNS interno) |
| Acceso externo | `http://192.168.224.131` (NAT estático TCP 80 en R2 e0/3) |

## Notas

- Se instaló Nginx (paquetes en `debs/`, offline), pero la imagen ya traía Apache escuchando en el puerto 80, así que se usa Apache. Nginx queda instalado sin uso.
- Arranque automático en `/root/.bashrc`: si `apache2` no corre, espera la IP de eth1, asegura la ruta por defecto y ejecuta `apache2ctl start`.
- **Problema:** desde Windows la conexión TCP se establecía, pero llegaban 0 bytes (las respuestas pequeñas, como un `HEAD` desde R2, sí funcionaban). Solución: `ip tcp adjust-mss 1360` en R2 (e0/3 y e0/2.30).
- Para entrar por nombre desde Windows se agregó al archivo `C:\Windows\System32\drivers\etc\hosts`: `192.168.224.131  pamplona.com  www.pamplona.com`.
- Nodo opcional `CHROME-VLAN10` (`pnetlab/pnet-chrome`, consola RDP, eth1 por DHCP en S1 e2/3) para ver la página desde dentro de la red.
