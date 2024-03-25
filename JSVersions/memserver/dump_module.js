const fs = require('fs');
const readline = require('readline');

console.log('Navigate the PS4 web browser to port 8080 on this PC');
console.log('(or just press OK if you are already on error screen)');
console.log('When you hit the error screen (again), press Enter on this PC.');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = require('./client.js');
const { read_mem, read_ptr, tarea } = client;

const some_func = read_ptr(read_ptr(read_ptr(tarea + 0x18)));

let idx, offset0;

if (process.argv[2].includes(',')) {
    idx = parseInt(process.argv[2].split(',')[0]);
    offset0 = parseInt(process.argv[2].split(',')[1], 16);
} else {
    idx = parseInt(process.argv[2]);
    offset0 = 0;
}

let got_func;

if (idx < 0) {
    got_func = some_func;
} else {
    const plt = some_func - 10063176;
    const plt_entry = plt + idx * 16;
    const q = read_mem(plt_entry, 6);
    if (!q.slice(0, 2).equals(Buffer.from([0xff, 0x25]))) {
        throw new Error("Assertion failed");
    }
    const got_entry = plt_entry + 6 + q.readUIntLE(2, 4);
    got_func = read_ptr(got_entry);
}

got_func += offset0;

let data = Buffer.alloc(0);
let chunk_sz = 1;

const watchdog_thread = () => {
    rl.question('', () => {
        process.kill(process.pid, 'SIGINT');
    });
};

setInterval(watchdog_thread, 1000);

try {
    while (true) {
        data = Buffer.concat([data, read_mem(got_func + data.length, chunk_sz)]);
        if (chunk_sz < 1024) {
            chunk_sz *= 2;
        }
        process.stdout.write(`${data.length} bytes loaded\r`);
    }
} catch (error) {
    if (error.message !== 'SIGINT') {
        console.log('\n' + error.message);
    }
}

if (process.argv.length > 3) {
    console.log('saving to', process.argv[3]);
    fs.writeFileSync(process.argv[3], data);
}
