DUMP_OUTPUT := ../dumps

all: $(DUMP_OUTPUT)/webkit.elf $(DUMP_OUTPUT)/libc.elf $(DUMP_OUTPUT)/libkernel.elf

$(DUMP_OUTPUT)/webkit.bin:
	@echo 'Dumping $<, please wait...'
	@mkdir -p $(DUMP_OUTPUT)
	@echo 'Estimated download size: 25 MB'
	@python3 dump_module.py -1 $(DUMP_OUTPUT)/webkit.bin

$(DUMP_OUTPUT)/libc.bin:
	@echo 'Dumping $<, please wait...'
	@mkdir -p $(DUMP_OUTPUT)
	@echo 'Estimated download size: 1.2 MB'
	@python3 dump_module.py 582 $(DUMP_OUTPUT)/libc.bin

$(DUMP_OUTPUT)/libkernel.bin:
	@echo 'Dumping $<, please wait...'
	@mkdir -p $(DUMP_OUTPUT)
	@echo 'Estimated download size: 300 KB'
	@python3 dump_module.py 705,-0x10000 $(DUMP_OUTPUT)/libkernel.bin

$(DUMP_OUTPUT)/%.asm: $(DUMP_OUTPUT)/%.bin
	@printf 'section .text\nuse64\nincbin "$<"' > $@

$(DUMP_OUTPUT)/%.o: $(DUMP_OUTPUT)/%.asm
	@yasm -f elf64 $< -o $@

$(DUMP_OUTPUT)/%.elf: $(DUMP_OUTPUT)/%.o
	@ld --no-check-sections -nostdlib -static -Ttext=0 $< -o $@
