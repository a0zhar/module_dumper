import http.server, queue, threading, sys

q1 = queue.Queue()
q2 = queue.Queue()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/':
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        self.send_back(b'''\
<html>
<head>
<title>RemoteJS</title>
</head>
<body onload="go()">
<script>
window.postExploit = function()
{
var pre = document.createElement('pre');
pre.id = 'data';
document.body.appendChild(pre);

function print(s, local)
{
    document.getElementById('data').appendChild(document.createTextNode(s+(local?'':'\\n')));
    if(!local)
        xhr(''+s+'\\n', '/log');
}

window.print = print;

function handle(s)
{
    print('> '+s, true);
    var ans = '';
    try
    {
        ans = eval.call(window, s);
    }
    catch(e)
    {
        ans = e+'\\n'+e.stack;
    }
    print(''+ans);
    xhr('\\n', '/');
}

function xhr(s, p)
{
    var x = new XMLHttpRequest();
    x.open('POST', p, p == '/');
    x.send(s);
    if(p == '/')
    {
        x.onload = function()
        {
            if(x.responseText)
                handle(x.responseText);
            else
                xhr('', '/');
        }
    }
}

xhr('', '/');
}
</script>
<script src="external/utils.js"></script>
<script src="external/int64.js"></script>
<script src="external/ps4.js"></script>
<button id="input1" onfocus="handle2()"></button>
<button id="input2"></button>
<button id="input3" onfocus="handle2()"></button>
<select id="select1">
<option value="value1">Value1</option>
</select>
</body>
</html>''')
    def do_POST(self):
        is_final = self.path == '/'
        body = self.rfile.read(int(self.headers.get('Content-Length')))
        q2.put((body.decode('utf-8'), is_final))
        if is_final:
            try: self.send_back(q1.get(timeout=5).encode('utf-8'))
            except queue.Empty: self.send_back(b'')
        else: self.send_back(b'')
    def send_back(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    def log_request(self, *args): pass

threading.Thread(target=http.server.HTTPServer(('', 8080), Handler).serve_forever, daemon=True).start()

def get_brlevel(s):
    s = iter(s)
    l = 0
    for c in s:
        if c == '"' or c == "'":
            for c2 in s:
                if c2 == '\\': next(s)
                elif c2 == c or c2 == '\n': break
        elif c in ('(', '[', '{'): l += 1
        elif c in (')', ']', '}'): l -= 1
    return l


def read_stdin():
    import readline
    lev = 0
    code = ''
    while True:
        s = input('> ' if lev == 0 else '- ') + '\n'
        lev += get_brlevel(s)
        code += s
        if lev <= 0:
            yield code
            code = ''
            lev = 0

def read_files():
    it = iter(sys.argv)
    next(it)
    q = next(it)
    if q != '-i':
        yield open(q).read()
    for i in it:
        yield open(i).read()
    if q == '-i':
        for i in read_stdin(): yield i

for code in (read_files() if len(sys.argv) > 1 else read_stdin()):
    q1.put(code)
    while True:
        ans, final = q2.get()
        if not ans: continue
        if not final: print(ans[:-1])
        else: break
