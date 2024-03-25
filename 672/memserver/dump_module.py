import sys
import threading
import signal
import os
from client import read_mem, read_ptr, tarea

ourlogo = """
         ___      _                _           _                                 
   __ _ / _ \ ___| |__   __ _ _ __( )___    __| |_   _ _ __ ___  _ __   ___ _ __ 
  / _` | | | |_  / '_ \ / _` | '__|// __|  / _` | | | | '_ ` _ \| '_ \ / _ \ '__|
 | (_| | |_| |/ /| | | | (_| | |    \__ \ | (_| | |_| | | | | | | |_) |  __/ |   
  \__,_|\___//___|_| |_|\__,_|_|    |___/  \__,_|\__,_|_| |_| |_| .__/ \___|_|   
    For dumping modules needed to build ropchains               |_|              
"""
print(ourlogo)
print('Instructions:')
print('Navigate the PS4 web browser to port 8080 on this PC')
print('(or just press OK if you are already on error screen)')
print('When you hit the error screen (again), press Enter on this PC.')

some_func = read_ptr(read_ptr(read_ptr(tarea+0x18)))

dumperArg1 = sys.argv[1]

if ',' in dumperArg1:
    idx     = int(dumperArg1.split(',')[0])
    offset0 = int(dumperArg1.split(',')[1], 16)
else:
    idx     = int(dumperArg1)
    offset0 = 0

if idx < 0:
    got_func = some_func
else:
    plt = some_func - 10063176
    plt_entry = plt + idx * 16
    q = read_mem(plt_entry, 6)
    assert q[:2] == b'\xff%', q
    got_entry = plt_entry + 6 + int.from_bytes(q[2:], 'little')
    got_func = read_ptr(got_entry)

got_func += offset0

# Contains the Dumped Data of the Module Recived from the PS4
dump_data = b''

# The Maximum Chunk Size 
chunk_sz = 1024

# Function used to write the dumped data to its file
def SaveDumpedData():
    # Create/Open new file from provided name
    destFile = open(sys.argv[2], "wb")
    # Write the dumped (module data) to file
    destFile.write(dump_data)
    # Then close the file
    destFile.close()

# Function to allow for listening for user input
def watchdog_thread():
    input()
    SaveDumpedData()
    os.kill(os.getpid(), signal.SIGINT)


# Create a new thread for the watchdog function
threading.Thread(target=watchdog_thread, daemon=True).start()
data_offst=0

# Begin receiving data, and printing how much has been dumped
# this will continue till, u press a button on keyboard
while True:
    try:
        # Read an additional 1024 bytes from the module
        dump_data += read_mem(got_func + data_offst, chunk_sz)
        data_offst = len(dump_data)
        # Print the total number of bytes dumped
        print(data_offst, end=' Bytes Dumped!\r')
    except KeyboardInterrupt:
        break

