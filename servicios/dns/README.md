# Servidor DNS (DNS1-VLAN20)

| Dato | Valor |
|---|---|
| Nodo PnetLab | Docker `pnetlab/ubuntu_sv` (Ubuntu 20.04) |
| IP (eth1) | 192.168.20.3/24, gateway 192.168.20.1 (campos del nodo) |
| Software | BIND 9.16.1 |
| Zona | `pamplona.local` (master) |

## Archivos

| Repo | En el contenedor | Contenido |
|---|---|---|
| [`named.conf.options`](named.conf.options) | `/etc/bind/named.conf.options` | ACL de redes internas, forwarders, recursión |
| [`named.conf.local`](named.conf.local) | `/etc/bind/named.conf.local` | Declaración de la zona |
| [`db.pamplona.local`](db.pamplona.local) | `/etc/bind/db.pamplona.local` | Registros SOA, NS, A y CNAME |

## Decisiones de diseño

- **ACL `redes_internas`:** solo las redes del proyecto pueden consultar y usar recursión. Evita un *resolver abierto* (usable para ataques de amplificación DNS).
- **`listen-on`:** solo 127.0.0.1 y 192.168.20.3 (no la red de gestión Docker).
- **`named -u bind`:** el proceso corre sin privilegios de root.
- **`forward only` + `dnssec-validation no`:** los forwarders (8.8.8.8 y 1.1.1.1) ya validan DNSSEC. Con validación local, BIND pedía respuestas grandes que caen a TCP, y TCP desde los contenedores del lab no funciona → `SERVFAIL`. Con estos ajustes la resolución externa funciona.

## Instalación (offline)

Los 10 paquetes (bind9, bind9-libs, bind9-utils, bind9-dnsutils, bind9-host, libuv1, liblmdb0, libmaxminddb0, dns-root-data, python3-ply) se calcularon contra la lista de paquetes de la imagen, se descargaron fuera del lab, se subieron por SFTP a la VM de PnetLab y se copiaron con `docker cp <ID> ...`. Instalación: `dpkg -i /tmp/debs-dns/*.deb`.

## Arranque

```
named-checkconf                                    # sin salida = OK
named-checkzone pamplona.local /etc/bind/db.pamplona.local
named -u bind
rndc reload                                        # releer configuración sin reiniciar
```

Arranque automático en `/root/.bashrc` (el proceso 1 del contenedor es `bash`):

```
# === Arranque automatico del servidor DNS BIND9 (Proyecto Redes II) ===
if ! pgrep -x named >/dev/null; then
  (
    for i in $(seq 1 30); do
      ip -4 addr show eth1 | grep -q 192.168.20.3 && break
      sleep 1
    done
    ip route replace default via 192.168.20.1 dev eth1 2>/dev/null
    echo "nameserver 127.0.0.1" > /etc/resolv.conf
    named -u bind
  ) &
fi
```

## Pruebas (2026-11-19)

- En el servidor: `dig +short web.pamplona.local` → 192.168.30.2; `www` → CNAME `web`; `google.com` → IP pública.
- Desde PC32 (DNS recibido por DHCP): `ping dns1.pamplona.local` → resuelve 192.168.20.3, TTL 63; `ping google.com` → resuelve y responde a través del NAT de R2.
