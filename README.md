<div align="center">

# Redes II · Proyecto final

**Infraestructura de red multiprotocolo con monitoreo y automatización**

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-blue.svg)](LICENSE)
![Estado](https://img.shields.io/badge/estado-en%20progreso-yellow)
![Laboratorio](https://img.shields.io/badge/laboratorio-PnetLab-orange)
![Enrutamiento](https://img.shields.io/badge/enrutamiento-RIP%20%7C%20EIGRP%20%7C%20OSPF-informational)

</div>

## 📌 Resumen

Proyecto final de la asignatura Redes II: integración de tres dominios de enrutamiento dinámico (**RIP, EIGRP y OSPF multimarca**) con redistribución de rutas, NAT, EtherChannel y salida a Internet. La red está protegida con listas de control de acceso, monitoreada con **Zabbix y Grafana**, y se puede consultar desde un bot de **Telegram** automatizado con **n8n**. Todo el laboratorio se construye y documenta en PnetLab.

## 🧩 Alcance técnico

- Enrutamiento dinámico con RIPv2, EIGRP y OSPF multiárea
- Interconexión de dominios heterogéneos mediante redistribución de rutas
- Segmentación con VLAN, troncales 802.1Q y routing entre VLAN
- Control de acceso con ACLs y administración remota restringida (SSH y Telnet)
- Salida a Internet con NAT y alta disponibilidad con EtherChannel
- Monitoreo con ICMP y SNMP en Zabbix, y dashboards en Grafana
- Automatización de consultas del estado de la red por Telegram con n8n
- Documentación técnica y control de versiones con Git

## 🗺️ Arquitectura por bloques

| Bloque | Contenido | Estado |
|---|---|---|
| 1. RIP + VLAN + control de acceso | R1/R2, Switch1/Switch2/S3, VLAN 10/20/30/40, ACLs, SSH/Telnet restringido, salida a Internet con NAT | 🔄 En progreso |
| 2. EIGRP regional | Routers R3 a R8 | ⏳ Pendiente |
| 3. OSPF multiárea (multimarca) | Routers R9, R10 y R11 | ⏳ Pendiente |
| 4. Integración | Redistribución entre RIP, EIGRP y OSPF, ruta por defecto | ⏳ Pendiente |
| 5. EtherChannel | Agregación de enlaces y pruebas de redundancia | ⏳ Pendiente |
| 6. Monitoreo | Zabbix + Grafana | ⏳ Pendiente |
| 7. Automatización | n8n + bot de Telegram | ⏳ Pendiente |

## 🛠️ Tecnologías

PnetLab (sobre VMware) · Cisco IOL / IOL L2 · VPCS · Docker · Zabbix · Grafana · n8n · Telegram Bot API · MobaXterm · Git y GitHub

## 📁 Estructura del repositorio

```
.
|-- configs/         Configuraciones por bloque, un .txt por equipo
|-- topologia/       Diagramas y exports del laboratorio de PnetLab
|-- servicios/       Docker, Zabbix y Grafana
|-- automatizacion/  Flujos de n8n y scripts
|-- evidencias/      Capturas numeradas de pruebas y verificaciones
|-- docs/            Informe técnico y documentación
```

## 🧪 Cómo reproducir el laboratorio

1. Tener PnetLab con las plantillas Cisco IOL, IOL L2, VPCS y Docker, y una licencia IOL propia. Las imágenes no se incluyen en este repositorio.
2. Importar el export del laboratorio desde `topologia/` (disponible cuando se publique el primer export).
3. Pegar las configuraciones de `configs/` en cada equipo, por ejemplo con MobaXterm.

## 🔐 Seguridad

El repositorio es público y no contiene tokens ni credenciales reales. Las contraseñas de las configuraciones son de práctica y exclusivas del laboratorio. Los secretos se manejan con variables de entorno (`.env`, excluido por `.gitignore`) y se documentan en `.env.example`.

## 👤 Autor

**[Tu nombre completo]**

- GitHub: [@KamiroDark](https://github.com/KamiroDark)
- LinkedIn: [tu perfil](https://www.linkedin.com/in/TU-PERFIL)
- [Tu universidad] · Asignatura Redes II · 2026

## 📄 Licencia

MIT. Ver [LICENSE](LICENSE).
