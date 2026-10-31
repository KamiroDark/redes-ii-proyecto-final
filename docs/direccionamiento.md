# Direccionamiento — Bloque 1 (RIP + VLAN + control de acceso)

## Equipos de red

| Equipo | Interfaz | IP | Máscara | Descripción | Estado |
|---|---|---|---|---|---|
| R1-PAMPLONA | e0/0 | 20.20.20.1 | /30 | Enlace a R2 (RIP) | Pendiente |
| R1-PAMPLONA | e0/1 | 192.168.25.2 | /30 | Enlace a S3 | Pendiente |
| R2-PAMPLONA | e0/0 | 20.20.20.2 | /30 | Enlace a R1 (RIP) | Pendiente |
| R2-PAMPLONA | e0/1.10 | 192.168.10.1 | /24 | Gateway VLAN 10 | Configurado |
| R2-PAMPLONA | e0/1.20 | 192.168.20.1 | /24 | Gateway VLAN 20 | Configurado |
| R2-PAMPLONA | e0/2.30 | 192.168.30.1 | /24 | Gateway VLAN 30 | Configurado |
| R2-PAMPLONA | e0/2.40 | 192.168.40.1 | /24 | Gateway VLAN 40 | Configurado |
| R2-PAMPLONA | e0/3 | DHCP | - | Salida a Internet (NAT) | Recibe IP |
| S1 | Vlan40 | 192.168.40.253 | /24 | Gestión | Pendiente |
| S2 | Vlan40 | 192.168.40.254 | /24 | Gestión | Pendiente |
| S3 | e0/0 | 192.168.25.1 | /30 | Enlace a R1 (requiere capa 3) | Pendiente |

## Hosts y servidores

| Host | Switch/puerto | VLAN | IP | Gateway |
|---|---|---|---|---|
| PC14 | S1 e0/3 | 10 | 192.168.10.12 | 192.168.10.1 |
| PC15 | S1 e1/2 | 10 | 192.168.10.11 | 192.168.10.1 |
| PC4 | S2 e0/3 | 10 | 192.168.10.10 | 192.168.10.1 |
| DHCP | S2 e1/2 | 10 | por definir | 192.168.10.1 |
| PC2 | S1 e2/0 | 20 | 192.168.20.11 | 192.168.20.1 |
| PC5 | S2 e1/0 | 20 | 192.168.20.10 | 192.168.20.1 |
| DNS1 | S1 e2/2 | 20 | 192.168.20.3 | 192.168.20.1 |
| PC10 | S1 e1/0 | 30 | 192.168.30.12 | 192.168.30.1 |
| PC13 | S1 e1/1 | 30 | 192.168.30.32 | 192.168.30.1 |
| PC11 | S2 e0/1 | 30 | 192.168.30.11 | 192.168.30.1 |
| Servidor Web | S2 e1/1 | 30 | 192.168.30.2 | 192.168.30.1 |
| PC3 | S1 e1/3 | 40 | 192.168.40.3 | 192.168.40.1 |
| PC12 | S2 e0/2 | 40 | 192.168.40.11 | 192.168.40.1 |
| PC32 | S1 e2/1 | sin VLAN | sin IP | - |
| PC20 | S3 e0/1 | LAN S3 | 192.168.15.x (por definir) | por definir |