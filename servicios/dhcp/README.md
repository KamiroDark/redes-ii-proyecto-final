# Servidor DHCP (DHCP-VLAN 10)

| Dato | Valor |
|---|---|
| Nodo PnetLab | Docker `pnetlab/ubuntu_sv` (Ubuntu 20.04), 2 interfaces |
| IP (eth1) | 192.168.10.2/24, gateway 192.168.10.1 (campos *Eth1 Static IP* y *Default Route* del nodo) |
| Software | `isc-dhcp-server` 4.4.1 |
| Configuración | [`dhcpd.conf`](dhcpd.conf) → `/etc/dhcp/dhcpd.conf` |

## Pools

| Red | Rango | Gateway | Cómo llega la petición |
|---|---|---|---|
| VLAN 10 (192.168.10.0/24) | .100–.200 | 192.168.10.1 | Directo (misma VLAN) |
| VLAN 20 (192.168.20.0/24) | .100–.200 | 192.168.20.1 | Relay en R2 `e0/1.20` |
| VLAN 30 (192.168.30.0/24) | .100–.200 | 192.168.30.1 | Relay en R2 `e0/2.30` |
| VLAN 40 (192.168.40.0/24) | .100–.200 | 192.168.40.1 | Relay en R2 `e0/2.40` |
| VLAN 15 (192.168.15.0/24) | .100–.200 | 192.168.15.1 | Relay en S3 `Vlan15` (cruza R1 y R2 por RIP) |

Todos entregan DNS `192.168.20.3` y dominio `pamplona.local`.

## Arranque

El contenedor no tiene systemd (su proceso 1 es `bash`). Lo instalado y `/etc/dhcp/dhcpd.conf` **sí sobreviven** a Stop/Start del nodo, pero `dhcpd` no arranca solo.

### Arranque automático (agregado a `/root/.bashrc`)

Como el proceso 1 es un `bash` interactivo, lee `~/.bashrc` al encender. El bloque espera a que `eth1` tenga IP (PnetLab la asigna un instante después), asegura la ruta por defecto y arranca `dhcpd` solo si no está corriendo:

```
# === Arranque automatico del servidor DHCP (Proyecto Redes II) ===
if ! pgrep -x dhcpd >/dev/null; then
  (
    for i in $(seq 1 30); do
      ip -4 addr show eth1 | grep -q 192.168.10.2 && break
      sleep 1
    done
    ip route replace default via 192.168.10.1 dev eth1 2>/dev/null
    touch /var/lib/dhcp/dhcpd.leases
    dhcpd -4 -q -cf /etc/dhcp/dhcpd.conf -lf /var/lib/dhcp/dhcpd.leases eth1
  ) &
fi
```

Verificado: tras Stop/Start del nodo, `dhcpd` corre y la ruta `default via 192.168.10.1` está presente.

### Arranque manual

```
dhcpd -t -cf /etc/dhcp/dhcpd.conf            # validar sintaxis
touch /var/lib/dhcp/dhcpd.leases
dhcpd -4 -cf /etc/dhcp/dhcpd.conf -lf /var/lib/dhcp/dhcpd.leases eth1
ps aux | grep [d]hcpd                        # confirmar que corre
cat /var/lib/dhcp/dhcpd.leases               # ver préstamos
```

## Pruebas (2026-11-19)

- PC32 en VLAN 10: `ip dhcp` → 192.168.10.100/24, GW .10.1, DNS 192.168.20.3, dominio pamplona.local.
- PC32 movido a VLAN 30 (relay): `ip dhcp` → 192.168.30.100/24, GW .30.1, DHCP server 192.168.10.2.

## Problemas encontrados durante la instalación

1. **Sin Internet por eth0:** la red Docker de PnetLab (10.177.0.0/16) no tiene salida. Se usó ruta por defecto por eth1 → R2.
2. **NAT en R2 fallaba por memoria:** `%SYS-2-MALLOCFAIL` y `%NBAR-2-NOMEMORY` al activar `ip nat inside`. Se resolvió guardando, reiniciando R2 y aumentando su RAM.
3. **TCP desde el contenedor no funcionaba** (`apt` quedaba en `Waiting for headers`), aunque ping y DNS sí, y R2 sí lograba HTTP hacia Ubuntu (`telnet 91.189.91.82 80`). Se descartó MTU (pings con DF de 1400 pasan) y el checksum offload (`nsenter -t <PID> -n ethtool -K eth1 tx off`) no lo resolvió.
4. **Solución aplicada:** instalación offline. Los `.deb` se descargaron fuera del lab, se subieron a la VM de PnetLab por SFTP (MobaXterm), se copiaron con `docker cp` y se instalaron con `dpkg -i`. Los `.deb` no se versionan (`*.deb` en `.gitignore`).
