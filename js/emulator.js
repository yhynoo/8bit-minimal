const cpu = new CPU()
cpu.ram.load(0x00, io)
cpu.ram.load(0x30, execution)
cpu.ram.load(0x50, commands)
cpu.ram.load(0x80, hex_maker)
cpu.ram.load(0x90, hex_converter)

// I/O and reset processing

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        cpu.reset();
        return;
    }

    if (event.key === ' ') {
        cpu.step()
        return
    }

    cpu.ram.write(IO, event.key.toUpperCase().charCodeAt(0))
})