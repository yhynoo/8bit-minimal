class Memory {
    constructor(size) {
        this.memory = new Uint8Array(size);
    }

    read(address) {
            return this.memory[address];
    }

    write(address, value) {
        this.memory[address] = value & 0xFF; // Keep it a byte
    }

    load(startAddress, program) {
        if (program.length > 0xEF) return

        for (let i = 0; i < program.length; i++) {
            this.write(startAddress + i, program[i] & 0xFF)
        }
    }
}

class CPU {
    constructor() {
        this.ram = new Memory(0x100)
        this.screen = document.getElementsByClassName('screen')[0]
        
        this.running = false
        this.reset()
    }

    reset() {
        this.A = 0;
        this.X = 0;
        this.Counter = 0;
        this.Equal = true;
        this.Overflow = false;
        
        // restart monitor
        this.screen.textContent = ':) \n\n'
        this.startClock()
    }

    execute(opcode) {
        const operations = [
            this.LDXv, this.LDXa, this.LDXi, this.LDAv, this.STAa, this.STAi,
            this.ADD,
            this.AND, this.OR, this.ASL,
            this.JUM, this.JUX, this.JCO, this.JOV, 
            this.OUT, this.CLA
        ];

        if (opcode < operations.length) {
            operations[opcode].call(this); // Use call to bind `this` correctly
        }
    }

    // clock

    startClock() {
        this.running = true;
    
        const step = () => {
            if (!this.running) return;
            const stepsPerFrame = 128

            for (let i = 0; i < stepsPerFrame; i++) {
                this.execute(this.ram.read(this.Counter));
                this.checkFlags()
                if (!this.running) break;
            }

            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    step() {
        console.log(`X: ${this.X}, A: ${this.A}, step: ${this.Counter}, opcode: ${this.ram.read(this.Counter)}`, this.ram.memory)
        this.execute(this.ram.read(this.Counter))
        this.checkFlags()
    }

    // -- OPERATIONS

    // LDX value
    LDXv() {
        this.Counter++
        this.X = this.ram.read(this.Counter++)
    }

    // LDX address
    LDXa() {
        this.Counter++
        this.X = this.ram.read(this.ram.read(this.Counter++))
    }

    // LDX indexed by A
    LDXi() {
        this.X = this.ram.read(this.A)
        this.Counter++
    }

    // LDA value
    LDAv() {
        this.Counter++
        this.A = this.ram.read(this.Counter++)
        this.Equal = (this.A === 0)
    }

    // STA address
    STAa() {
        this.Counter++
        this.ram.write(this.ram.read(this.Counter++), this.A);
    }

    // STA indexed by X
    STAi() {
        this.Counter++
        this.ram.write(this.X, this.A);
    }

    // ADD (A = A + X)
    ADD() {
        this.A += this.X
        this.Counter++
    }

    // AND (modifies A)
    AND() {
        this.A &= this.X
        this.Counter++
    }

    // OR (modifies A; useful for combining bits)
    OR() {
        this.A |= this.X
        this.Counter++
    }

    // ASL (modifies A, moves it up a bit - so 1 becomes 10, and 11 becomes 110.)
    ASL() {
        this.A = (this.A << 1) & 0xFF
        this.Counter++
    }

    // JUMP (saving the starting point in stack)
    JUM() {
        this.Counter++              
        this.Counter = this.ram.read(this.Counter++)        // jumps
    }

    // JUX: jump to X
    JUX() {  
        this.Counter = this.X               // jumps
    }

    // CONDITIONAL JUMP (if A and X are equal; saving the starting point in stack)
    JCO() {
        this.Counter++
        if (this.Equal) {
            this.Counter = this.ram.read(this.Counter++)    // jumps
            return
        }      
        this.Counter++               // or moves on.           
    }

    // OVERFLOW JUMP (if A and X are equal; saving the starting point in stack)
    JOV() {
        this.Counter++
        if (this.Overflow) {
            this.Counter = this.ram.read(this.Counter++)    // jumps
            return
        }      
        this.Counter++               // or moves on.           
    }

    // OUT
    OUT() {
        this.screen.innerHTML += String.fromCharCode(this.ram.read(0xFD))
        this.Counter++
    }

    // CLA: clear the A
    CLA() {
        this.A = 0
        this.Counter++
    }
    
    // helper:
    checkFlags() {
        this.Equal = (this.A === this.X)
        this.Overflow = (this.A > 0xFF); 
        this.A &= 0xFF
    }
}