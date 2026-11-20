# Direccionamiento — Bloque 2 (EIGRP AS 100)

| Enlace | Red | Extremo A | Extremo B |
|---|---|---|---|
| R3 ↔ R4 | 192.168.16.0/30 | R3-PAIPA e0/0 .1 | R4-BUCARAMANGA e0/1 .2 |
| R4 ↔ R5 | 192.168.21.0/30 | R4-BUCARAMANGA e0/0 .1 | R5-BARRANCABERMEJA e0/1 .2 |
| R5 ↔ R6 | 192.168.22.0/30 | R5-BARRANCABERMEJA e0/0 .1 | R6-CUCUTA e0/1 .2 |
| R7 ↔ R6 | 192.168.19.0/30 | R7-BOGOTA e0/1 .1 | R6-CUCUTA e0/2 .2 |
| R7 ↔ R8 | 192.168.18.0/30 | R7-BOGOTA e0/0 .1 | R8-MEDELLIN e0/1 .2 |
| R3 ↔ R8 | 192.168.17.0/30 | R3-PAIPA e0/1 .1 | R8-MEDELLIN e0/0 .2 |
| LAN Medellín | 192.168.50.0/24 | R8-MEDELLIN e0/2 .1 (gateway) | PC-Medellín .10 (vía S7) |
| R6 ↔ R1 | 192.168.26.0/30 | R6-CUCUTA e0/0 .1 | R1-PAMPLONA e0/2 .2 (ASBR RIP-EIGRP) |

## Decisiones

- **AS 100** y `router-id` fijo por router (3.3.3.3 … 8.8.8.8) para identificar vecinos fácilmente.
- `no auto-summary` y redes anunciadas con wildcard exacta (/30) para no activar EIGRP en interfaces no deseadas.
- La LAN de Medellín es `passive-interface`: se anuncia, pero no se forman vecindades hacia los hosts.
- La imagen del docente no siempre indica qué extremo lleva .1 o .2; se fijó un criterio consistente (no afecta el funcionamiento).
- Topología en anillo: cada red tiene dos caminos, y EIGRP guarda el alterno como sucesor factible (`show ip eigrp topology`).
- El enlace R6 ↔ R1 no tiene IP en la imagen del docente; se usó primero 192.168.24.0/30, pero esa red pertenece al enlace R9–R3 de OSPF según la imagen, así que se cambió a **192.168.26.0/30**.
- **Redistribución mutua solo en R1** (un único punto → sin bucles). RIP → EIGRP con seed metric `10000 100 255 1 1500` (rutas `D EX`); EIGRP → RIP con métrica 3. La ruta por defecto de R2 llega al anillo como `D*EX 0.0.0.0/0`.
- SSH con ACL `ACCESO_ADMIN` (solo VLAN 40) también en R3–R8.
