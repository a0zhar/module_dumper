# Default target to build all ELF files
all: info ../dumps/webkit.elf ../dumps/libc.elf ../dumps/libkernel.elf

# Generate webkit.bin and convert it to webkit.asm
../dumps/webkit.bin:
	@echo "Generating webkit.bin..."
	@mkdir -p ../dumps
	@echo 'Estimated download size: 20 MB'
	@CHUNK_SIZE=20971520 python3 dump_module.py -1 ../dumps/webkit.bin

# Generate libc.bin and convert it to libc.asm
../dumps/libc.bin:
	@echo "Generating libc.bin..."
	@mkdir -p ../dumps
	@echo 'Estimated download size: 1.2 MB'
	@CHUNK_SIZE=300000 python3 dump_module.py 573 ../dumps/libc.bin

# Generate libkernel.bin and convert it to libkernel.asm
../dumps/libkernel.bin:
	@echo "Generating libkernel.bin..."
	@mkdir -p ../dumps
	@echo 'Estimated download size: 400 KB'
	@CHUNK_SIZE=100000 python3 dump_module.py 789 ../dumps/libkernel.bin

# Convert binary file to assembly file
../dumps/%.asm: ../dumps/%.bin
	@echo "Converting $< to $@..."
	@printf 'section .text\nuse64\nincbin "$<"' > $@

# Assemble assembly file to object file
../dumps/%.o: ../dumps/%.asm
	@echo "Assembling $< to $@..."
	@yasm -f elf64 $< -o $@

# Link object file to generate ELF file
../dumps/%.elf: ../dumps/%.o
	@echo "Linking $< to $@..."
	@ld --no-check-sections -nostdlib -static -Ttext=0 $< -o $@

# Info message
info:
	@echo "Executing Makefile..."

# Prevent make from confusing this with a file named "info"
.PHONY: all info
