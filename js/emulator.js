const cpu = new CPU()
cpu.ram.load(0x00, io)
cpu.ram.load(0x30, memory_display)
// cpu.ram.load(0x60, make_hex)
cpu.ram.load(0x80, hex_converter)

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

    cpu.ram.write(0xF0, event.key.charCodeAt(0))
})