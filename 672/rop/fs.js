// Sources i used to comment the system calls is:
// https://man.freebsd.org/cgi/man.cgi?query=<system call name here>&apropos=0&sektion=2&manpath=FreeBSD+9.0-RELEASE+and+Ports&arch=default&format=html
// ..............................................

/**
 * Helper function to print out info on the page
 * rather than in console
 * @param {string} data - message you want to print
 **/
let _printf = (data) => (document.body.innerHTML += "<h3>" + data + "</h3>");


var getdents_buf = malloc(0x1000);
var path_buf = malloc(0x1000);

/**
 * HELPER FUNCTION:
 * Converts a plain text into (decimal value type) byte array and returns it
 * @param {string} plain - The plain text that you want to be converted
 * @returns {array} The byte array form of the plain text
 **/
function text2bytearray(plain) {
  let result = [];
  // Convert each character of the plain text to decimal form
  // and append it to result
  for (let i = 0; i < plain.length; i++) result.push(plain.charCodeAt(i));

  // return the byte array
  return result;
}
/**
 * HELPER FUNCTION:
 * Calculates the decimal value of a little-endian byte array
 * @param {number[]} bytes - An array of bytes
 * @returns {number} The decimal value of the little-endian byte sequence
 **/
 function text2bytearray(plain) {
  let result = [];
  // Convert each character of the plain text to decimal form
  // and append it to result
  for (let i = 0; i < plain.length; i++) result.push(plain.charCodeAt(i));

  // return the byte array
  return result;
}function calcLittleEndian(bytes) {
  let result = 0; // Initialize the decimal value to 0

  // Iterate over the array <bytes> in reverse
  // order (from idx 7 to 0)
  for (let i = 7; i >= 0; i--) {
    // Multiply the current byte by 256 raised
    // to the power of its position
    result = result * 256 + bytes[i];
  }
  // Return the decimal value of the
  // little-endian byte sequence
  return result;
}

/**
 * Open a file using system call and return the file descriptor.
 * @param {string} path - The path to the file.
 * @returns {number} The file descriptor or -1 on failure.
 **/
function sys_open(path) {
  // Obtain the byte array version of <path>
  let bytes = text2bytearray(path);
  // Append a 0 at the end of the byte array
  // probably null terminator
  bytes.push(0);
  write_mem(path_buf, bytes);

  bytes = fcall(sys_5_addr, path_buf, 0);
  // Check the value of the converted byte array (string form)
  if (bytes.toString() == "255,255,255,255,255,255,255,255") return -1;

  // Calculate the pointer address
  return calcLittleEndian(bytes);
}
/**
 * Uses system call (close) to delete a descriptor
 * @param {number} d - The descriptor.
 **/
function sys_close(d) {
  fcall(sys_6_addr, d);
}
/**
 * Reads directory entries from the directory referenced by the file descriptor
 * @param {number} fd - file descriptor
 * @returns
 */
function sys_getdents(fd) {
  let q = fcall(sys_272_addr, fd, getdents_buf, 0x1000);
  if (q.toString() == "255,255,255,255,255,255,255,255") return null;

  // Calculate the pointer address
  let l = calcLittleEndian(q);
  var ans = [];
  for (let offset = 0; offset < l; ) {
    var ll = read_mem(getdents_buf + offset + 4, 2);
    var next = offset + ll[0] + 256 * ll[1];
    var ll = read_mem(getdents_buf + offset + 7, 1)[0];
    var name = read_mem(getdents_buf + offset + 8, ll);
    offset = next;
    let s = String.fromCharCode(...name);
    _printf("Converted: "+s);
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
