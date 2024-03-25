const http = require('http');
const fs = require('fs');
const { Worker, isMainThread } = require('worker_threads');

const INDEX_HTML = `
<html>
<body>
<script>
function print(){}
</script>
<script src="/exploit.js"></script>
<script src="/helpers.js"></script>
<script src="/server.js"></script>
</body>
</html>
`;

const in_q = [];
const out_q = [];
const leak_q = [];

class Server {
    constructor() {
        this.server = http.createServer(this.requestHandler);
    }

    requestHandler(req, res) {
        if (req.url === '/') {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(INDEX_HTML);
        } else if (['/exploit.js', '/helpers.js'].includes(req.url)) {
            fs.readFile('..' + req.url, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'application/javascript'});
                    res.end(data);
                }
            });
        } else if (req.url === '/server.js') {
            fs.readFile('server.js', (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end();
                } else {
                    res.writeHead(200, {'Content-Type': 'application/javascript'});
                    res.end(data);
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    }

    start() {
        this.server.listen(8080, () => {
            console.log('Server running at http://localhost:8080/');
        });
    }
}

const srv = new Server();
srv.start();

const read_mem = (offset, size) => {
    out_q.push([offset, size]);
    return new Promise(resolve => {
        const worker = new Worker('./read_mem_worker.js');
        worker.postMessage({ offset, size });
        worker.once('message', resolve);
    });
};

const read_ptr = async (offset) => {
    const buffer = await read_mem(offset, 8);
    return buffer.readBigUInt64LE();
};

const tarea = parseInt(leak_q[0], 16);

module.exports = { read_mem, read_ptr, tarea };
