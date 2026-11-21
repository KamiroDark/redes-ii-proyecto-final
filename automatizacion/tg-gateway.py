# Pasarela HTTP -> Telegram para el bot de n8n (Proyecto Redes II)
# Corre en la VM de PnetLab (192.168.224.128, lado externo de R2).
# El camino contenedor -> NAT de R2 -> NAT de VMware -> Internet es inestable para HTTPS,
# asi que n8n llama a esta pasarela por HTTP y la VM (con Internet directo) reenvia a Telegram.
# Solo reenvia rutas /bot... (no es un proxy abierto).
import http.server, socketserver, urllib.request, urllib.error, socket
_orig = socket.getaddrinfo
def _gai(host, *a, **k):
    if host == 'api.telegram.org':      # DNS fijo: la VM a veces pierde su DNS
        host = '149.154.166.110'
    return _orig(host, *a, **k)
socket.getaddrinfo = _gai
UP = 'https://api.telegram.org'
class H(http.server.BaseHTTPRequestHandler):
    def _go(self):
        if not self.path.startswith('/bot'):
            self.send_error(403); return
        n = int(self.headers.get('Content-Length', 0) or 0)
        body = self.rfile.read(n) if n else None
        req = urllib.request.Request(UP + self.path, data=body, method=self.command,
              headers={'Content-Type': self.headers.get('Content-Type', 'application/json')})
        try:
            r = urllib.request.urlopen(req, timeout=20); code, data = r.status, r.read()
        except urllib.error.HTTPError as e:
            code, data = e.code, e.read()
        except Exception as e:
            code, data = 502, ('{"ok":false,"description":"%s"}' % e).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers(); self.wfile.write(data)
    do_GET = _go; do_POST = _go
    def log_message(self, *a): pass
class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
S(('192.168.224.128', 8081), H).serve_forever()
