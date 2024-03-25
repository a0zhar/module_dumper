# ALARM will be called each time user interaction is needed
ALARM ?= beep

# Default target to build all dumps
all: info always_run dumps/gadgets.txt dumps/syscalls.txt

# Always run this target
always_run: info
	@echo "Running always_run target..."

# Create the dumps directory if it doesn't exist
dumps:
	@echo "Creating dumps directory..."
	@mkdir -p dumps

# Extract ROP gadgets from webkit.elf
dumps/webkit-gadgets.txt: dumps
	@echo "Extracting ROP gadgets from webkit.elf..."
	@ROPgadget --binary dumps/webkit.elf --dump > dumps/webkit-gadgets.txt

# Extract ROP gadgets from libc.elf
dumps/libc-gadgets.txt: dumps
	@echo "Extracting ROP gadgets from libc.elf..."
	@ROPgadget --binary dumps/libc.elf --dump > dumps/libc-gadgets.txt

# Merge ROP gadgets from webkit and libc into one file
dumps/gadgets.txt: dumps/webkit-gadgets.txt dumps/libc-gadgets.txt
	@echo "Merging ROP gadgets from webkit and libc..."
	@cd dumps && grep '' webkit-gadgets.txt libc-gadgets.txt > gadgets.txt

# Extract system call information from libkernel.elf
dumps/syscalls.txt: dumps
	@echo "Extracting syscall info from libkernel.elf..."
	@objdump -D dumps/libkernel.elf | python3 rop/syscalls.py > dumps/syscalls.txt

# Clean up generated dumps
clean: info
	@echo "Cleaning up dumps directory..."
	@rm -rf dumps

# Info message
info:
	@echo "Executing Makefile..."

# Prevent make from confusing this with a file named "info"
.PHONY: all always_run dumps clean info
