# Direccionamiento — Bloque 1 (RIP + VLAN + control de acceso)

## Equipos de red

| Equipo | Interfaz | IP | Máscara | Descripción | Estado |
|---|---|---|---|---|---|
| R1-PAMPLONA | e0/0 | 20.20.20.1 | /30 | Enlace a R2 (RIP) | Configurado |
| R1-PAMPLONA | e0/1 | 192.168.25.2 | /30 | Enlace a S3 (RIP) | Configurado |
| R2-PAMPLONA | e0/0 | 20.20.20.2 | /30 | Enlace a R1 (RIP) | Configurado |
| R2-PAMPLONA | e0/1.10 | 192.168.10.1 | /24 | Gateway VLAN 10 | Configurado |
| R2-PAMPLONA | e0/1.20 | 192.168.20.1 | /24 | Gateway VLAN 20 | Configurado |
| R2-PAMPLONA | e0/2.30 | 192.168.30.1 | /24 | Gateway VLAN 30 | Configurado |
| R2-PAMPLONA | e0/2.40 | 192.168.40.1 | /24 | Gateway VLAN 40 | Configurado |
| R2-PAMPLONA | e0/3 | DHCP | - | Salida a Internet (NAT) | Recibe IP |
| S1 | Vlan40 | 192.168.40.253 | /24 | Gestión | Pendiente |
| S2 | Vlan40 | 192.168.40.254 | /24 | Gestión | Pendiente |
| S3 | e0/0 | 192.168.25.1 | /30 | Enlace a R1 (puerto enrutado, RIP) | Configurado |
| S3 | Vlan15 | 192.168.15.1 | /24 | Gateway LAN PC20 (SVI) | Configurado |

## Hosts y servidores

| Host | Switch/puerto | VLAN | IP | Gateway |
|---|---|---|---|---|
| PC14 | S1 e0/3 | 10 | 192.168.10.12 | 192.168.10.1 |
| PC15 | S1 e1/2 | 10 | 192.168.10.11 | 192.168.10.1 |
| PC4 | S2 e0/3 | 10 | 192.168.10.10 | 192.168.10.1 |
| DHCP | S2 e1/2 | 10 | 192.168.10.2 | 192.168.10.1 |
| PC2 | S1 e2/0 | 20 | 192.168.20.11 | 192.168.20.1 |
| PC5 | S2 e1/0 | 20 | 192.168.20.10 | 192.168.20.1 |
| DNS1 | S1 e2/2 | 20 | 192.168.20.3 | 192.168.20.1 |
| PC10 | S1 e1/0 | 30 | 192.168.30.12 | 192.168.30.1 |
| PC13 | S1 e1/1 | 30 | 192.168.30.32 | 192.168.30.1 |
| PC11 | S2 e0/1 | 30 | 192.168.30.11 | 192.168.30.1 |
| Servidor Web | S2 e1/1 | 30 | 192.168.30.2 | 192.168.30.1 |
| PC3 | S1 e1/3 | 40 | 192.168.40.3 | 192.168.40.1 |
| PC12 | S2 e0/2 | 40 | 192.168.40.11 | 192.168.40.1 |
| PC32 | S1 e2/1 | 10 | DHCP (192.168.10.100) | 192.168.10.1 |
| PC20 | S3 e0/1 | 15 | 192.168.15.10 | 192.168.15.1 |

## Decisiones de diseño

- **RIP v2** entre R1 y R2 sobre el enlace 20.20.20.0/30, con `no auto-summary`. Las subinterfaces de las VLAN en R2 son `passive-interface`: se anuncian a R1, pero no se envían actualizaciones RIP hacia los usuarios, para no exponer información de enrutamiento.
- **Direccionamiento mixto (estático + DHCP):** los PCs con IP definida en la topología del docente y los servidores (DNS, Web, DHCP) usan IP fija. El servidor DHCP entrega el rango `.100`–`.200` de cada VLAN (sin chocar con las fijas) para equipos nuevos, como PC32. Para las VLAN 20, 30 y 40 se usará DHCP relay (`ip helper-address`) en R2, porque el broadcast DHCP no cruza VLANs.
- **S3 como switch multicapa:** S3 une dos redes distintas (192.168.25.0/30 hacia R1 y 192.168.15.0/24 de PC20), así que debe enrutar. `e0/0` es puerto enrutado (`no switchport`) y la LAN usa VLAN 15 con SVI, para poder agregar más equipos sin rediseñar. S3 también participa en RIP.
- `no service config` en R2 para desactivar la autoinstalación por TFTP.

