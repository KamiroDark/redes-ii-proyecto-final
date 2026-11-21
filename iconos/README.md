# Iconos de la topología

Iconos propios para los nodos de PnetLab. Se generaron con Gemini (Google) a partir de prompts escritos para el proyecto y se procesaron con `procesar.py`, que quita el fondo blanco, recorta el equipo y lo deja en PNG transparente.

- `originales/`: imágenes tal como salieron de Gemini.
- `pnetlab/`: iconos de 64 x 64 (el tamaño de los iconos de color de PnetLab), con prefijo `Pamplona_` para que queden agrupados en el menú. Se suben a `/opt/unetlab/html/images/icons/`.
- `alta-resolucion/`: los mismos iconos en 128 x 128, para documentos y presentaciones.

## Criterio de diseño

Cada equipo lleva un círculo o cuadrado de color en la tapa, que es lo único que se distingue cuando el icono se ve pequeño en la topología.

| Color | Significado |
| --- | --- |
| Verde | Dominio RIP |
| Azul | Dominio EIGRP |
| Naranja | Dominio OSPF |
| Dos colores | ASBR: router que redistribuye entre dos dominios |
| Gris | Switch de capa 2 |
| Verde azulado | Servicios de usuario (DHCP, DNS, Web) |
| Morado | Monitoreo y automatización (Zabbix, Grafana, n8n) |

Los routers llevan el símbolo clásico de router (círculo con cuatro flechas) y los switches el de switch (cuadrado con flechas horizontales).

## Asignación a los nodos

| Icono | Nodos |
| --- | --- |
| `Pamplona_router-borde.png` | R2 (borde, NAT y ACL) |
| `Pamplona_router-asbr-rip-eigrp.png` | R1 |
| `Pamplona_router-asbr-eigrp-ospf.png` | R3 |
| `Pamplona_router-eigrp.png` | R4, R5, R6, R7, R8 |
| `Pamplona_router-ospf.png` | R9, R10, R11 |
| `Pamplona_router-rip.png` | Base del estilo; disponible para cualquier router RIP |
| `Pamplona_switch-l2.png` | S1, S2 y los switches de acceso de los demás dominios |
| `Pamplona_switch-l3.png` | S3 (multicapa, corre RIP) |
| `Pamplona_pc.png` | Todos los VPCS |
| `Pamplona_server-dhcp.png` | Servidor DHCP |

## Regenerar un icono

```
python3 procesar.py originales/<nombre>.jpg <nombre>
```
