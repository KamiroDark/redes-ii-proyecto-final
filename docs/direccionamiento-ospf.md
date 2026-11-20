# Direccionamiento — Bloque 3 (OSPF multiárea, proceso 1)

| Enlace / LAN | Red | IPs | Área |
|---|---|---|---|
| R9 ↔ R3 | 192.168.24.0/30 | R9-TUNJA e0/0 .1 · R3-PAIPA e0/2 .2 | 1 |
| R9 ↔ R10 | 10.0.0.0/30 | R9 e0/1 .1 · R10-DUITAMA e0/0 .2 | 0 |
| R10 ↔ R11 | 10.0.0.4/30 | R10 e0/2 .5 · R11-SOGAMOSO e0/0 .6 | 0 |
| LAN Tunja (S4) | 192.168.5.0/24 | R9 e0/2 .1 · PC-9 .11 | 1 |
| LAN Duitama (S5) | 192.168.6.0/24 | R10 e0/1 .1 · PC-10 .12 | 0 |
| LAN Sogamoso (S6) | 192.168.7.0/24 | R11 e0/1 .1 · PC-11 .13 | 2 |

## Diseño

- **Área 0 (backbone):** enlaces 10.0.0.0/30 y 10.0.0.4/30 y la LAN de R10.
- **Área 1:** LAN de Tunja y enlace a R3. **R9 = ABR** (área 0/1).
- **Área 2:** LAN de Sogamoso. **R11 = ABR** (área 0/2).
- **R3 = ASBR:** `redistribute eigrp 100 subnets` en OSPF y `redistribute ospf 1 metric 10000 100 255 1 1500` en EIGRP, más `default-information originate` (OSPF no redistribuye la ruta por defecto por sí solo).
- Router-ID fijo (9.9.9.9, 10.10.10.10, 11.11.11.11, 3.3.3.3); LAN como `passive-interface`.
- **Conflicto corregido:** la imagen asigna 192.168.24.0/30 al enlace R9–R3; el enlace R6–R1 (sin IP en la imagen) se movió a 192.168.26.0/30.

## Pruebas (2026-11-20)

- R10 `show ip ospf neighbor`: R9 y R11 en FULL.
- R10 `show ip route ospf`: `O IA` 192.168.5.0, 192.168.7.0 y 192.168.24.0.
- R9 `show ip ospf database`: LSAs tipo 1, 2 y 3 en áreas 0 y 1.
- PC-11 → PC14 (192.168.10.12): OK, TTL 55; trace R11 → R10 → R9 → R3 → R8 → R7 → R6 → R1 → …
- PC-11 → PC-Medellín (192.168.50.10): OK, TTL 59.
- PC-11 → 8.8.8.8: OK (NAT en R2).
