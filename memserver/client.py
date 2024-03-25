import socketserver
import http.server
import threading
import queue
import socket

INDEX_HTML = """
<!DOCTYPE html>
<html lang='en-US'>
    <head>
        <meta charset='utf-8' />
        <title>Dumper | Client Page</title>
    </head>
    <body>
        <script src='/exploit.js' type='text/javascript'></script>
        <script src='/helpers.js' type='text/javascript'></script>
        <script src='/server.js' type='text/javascript'></script>
    </body>
</html>
"""

in_q   = queue.Queue()
out_q  = queue.Queue()
leak_q = queue.Queue()


class RequestHandler(http.server.BaseHTTPRequestHandler):
    def respond(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    
    # For GET Requests
    def do_GET(self):
        if self.path == '/':
            ans = INDEX_HTML
        elif self.path in ('/exploit.js', '/helpers.js'):
            ans = open('..' + self.path, 'rb').read()
        elif self.path == '/server.js':
            ans = open('server.js', 'rb').read()
        else:
            self.send_error(404)
            return
        self.respond(ans)
    
    # For POST Requests
    def do_POST(self):
        data = self.rfile.read(int(self.headers.get('Content-Length')))
        if self.path == '/leak':
            leak_q.put(data)
            self.respond(b'')
        elif self.path == '/push':
            in_q.put(data)
            self.respond(b'a'*512)
        elif self.path == '/pull':
            try:
                query = out_q.get(timeout=5)
            except queue.Empty:
                self.respond(b'null')
            else:
                self.respond(('{"offset": %d, "size": %d}' % tuple(query)).encode('ascii'))
        else:
            self.send_error(404)

    def log_request(self, *args): 
        pass

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    pass


_client_server = Server(('', 81), RequestHandler)
threading.Thread(target=_client_server.serve_forever, daemon=True).start()

def getServerIPAddress():
    try:
        # Create a temporary socket to get the host's IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Use Google's DNS server as a target
        s.connect(('8.8.8.8', 80))
        host_ip = s.getsockname()[0]
        # Close the temporarly opened socket
        s.close()
        return host_ip
    except Exception:
        return None

def read_mem(offset, size):
    out_q.put((offset, size))
    ans = in_q.get()
    return ans

def read_ptr(offset):
    return int.from_bytes(read_mem(offset, 8), 'little')

tarea = int(leak_q.get().decode('ascii'), 16)

# Get and print the host's IP address and port
print("Please visit following URL on your PS4 Browser:")
print(f"http://{getServerIPAddress()}:5001")
