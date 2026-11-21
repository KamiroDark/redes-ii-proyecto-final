# Crea grupos y hosts en Zabbix 4.4 por API (ejecutado desde la VM de PnetLab)
import json, urllib.request

URL = "http://192.168.224.131:8080/api_jsonrpc.php"
COMMUNITY = "redes2mon"

def api(method, params, auth=None):
    body = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
    if auth: body["auth"] = auth
    req = urllib.request.Request(URL, json.dumps(body).encode(), {"Content-Type": "application/json-rpc"})
    r = json.load(urllib.request.urlopen(req, timeout=20))
    if "error" in r: raise Exception(method + ": " + json.dumps(r["error"]))
    return r["result"]

auth = api("user.login", {"user": "Admin", "password": "zabbix"})
print("Zabbix version:", api("apiinfo.version", {}))

def group(name):
    g = api("hostgroup.get", {"filter": {"name": [name]}}, auth)
    return g[0]["groupid"] if g else api("hostgroup.create", {"name": name}, auth)["groupids"][0]

def template(name):
    t = api("template.get", {"filter": {"host": [name]}}, auth)
    if not t: raise Exception("No existe la plantilla " + name)
    return t[0]["templateid"]

T_ICMP = template("Template Module ICMP Ping")
T_CISCO = template("Template Net Cisco IOS SNMPv2")   # ya incluye ICMP Ping

HOSTS = [
    ("R1-PAMPLONA", "20.20.20.1", "Routers RIP", True),
    ("R2-PAMPLONA", "192.168.40.1", "Routers RIP", True),
    ("S1", "192.168.40.253", "Switches", True),
    ("S2", "192.168.40.254", "Switches", True),
    ("S3", "192.168.25.1", "Switches", True),
    ("R3-PAIPA", "192.168.16.1", "Routers EIGRP", True),
    ("R4-BUCARAMANGA", "192.168.16.2", "Routers EIGRP", True),
    ("R5-BARRANCABERMEJA", "192.168.21.2", "Routers EIGRP", True),
    ("R6-CUCUTA", "192.168.22.2", "Routers EIGRP", True),
    ("R7-BOGOTA", "192.168.19.1", "Routers EIGRP", True),
    ("R8-MEDELLIN", "192.168.50.1", "Routers EIGRP", True),
    ("R9-TUNJA", "192.168.24.1", "Routers OSPF", True),
    ("R10-DUITAMA", "10.0.0.2", "Routers OSPF", True),
    ("R11-SOGAMOSO", "10.0.0.6", "Routers OSPF", True),
    ("SRV-DHCP", "192.168.10.2", "Servidores", False),
    ("SRV-DNS", "192.168.20.3", "Servidores", False),
    ("SRV-WEB", "192.168.30.2", "Servidores", False),
]

for name, ip, gname, snmp in HOSTS:
    if api("host.get", {"filter": {"host": [name]}}, auth):
        print("Ya existe:", name); continue
    iface = {"type": 2, "main": 1, "useip": 1, "ip": ip, "dns": "", "port": "161", "bulk": 1} if snmp \
        else {"type": 1, "main": 1, "useip": 1, "ip": ip, "dns": "", "port": "10050"}
    tpl = [{"templateid": T_CISCO}] if snmp else [{"templateid": T_ICMP}]
    api("host.create", {"host": name, "groups": [{"groupid": group(gname)}], "interfaces": [iface],
        "templates": tpl, "macros": [{"macro": "{$SNMP_COMMUNITY}", "value": COMMUNITY}]}, auth)
    print("Creado:", name, ip)

web = api("host.get", {"filter": {"host": ["SRV-WEB"]}, "selectInterfaces": ["interfaceid"]}, auth)[0]
if not api("item.get", {"hostids": web["hostid"], "filter": {"key_": "net.tcp.service[http]"}}, auth):
    api("item.create", {"hostid": web["hostid"], "name": "Servicio HTTP (Apache)", "key_": "net.tcp.service[http]",
        "type": 3, "value_type": 3, "delay": "30s", "interfaceid": web["interfaces"][0]["interfaceid"]}, auth)
    api("trigger.create", {"description": "Servidor web caido (HTTP no responde)",
        "expression": "{SRV-WEB:net.tcp.service[http].last()}=0", "priority": 4}, auth)
    print("Creado chequeo HTTP en SRV-WEB")
print("Listo")
