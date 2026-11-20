$TTL 3600
@   IN  SOA dns1.pamplona.local. admin.pamplona.local. ( 2026111901 3600 900 604800 3600 )
@   IN  NS  dns1.pamplona.local.
@   IN  A   192.168.30.2
www IN  A   192.168.30.2
