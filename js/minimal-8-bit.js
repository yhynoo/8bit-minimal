// Memory total: 256 bytes

// Map:
//      RAM:                0x00 - 0xEF
//      keyboard input:     0xF0

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

class Stack {
    constructor(size) {
        this.stack = new Uint8Array(size);
        this.pointer = 0
    }

    add(value) {
        if (this.pointer >= this.stack.length) {
            this.pointer = 0
        }
        this.stack[this.pointer++] = value;
    }

    drop() {
        if (this.pointer === 0) {
            return;
        }
        this.pointer--
        return this.stack[this.pointer]
    }
}

class CPU {
    constructor() {
        this.ram = new Memory(0x100)
        this.stack = new Stack(0x8)
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
        this.screen.textContent = 'ok.\n'
        this.startClock()
    }

    execute(opcode) {
        const operations = [
            this.LDXv, this.LDXa, this.LDXi, this.LDAv, this.STAa, this.STAi,
            this.ADD,
            this.AND, this.XOR, '',
            this.JUM, this.JCO, '', this.JOV, 
            this.OUT, this.CLA,
            '', this.RET, this.SDR
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
                if (!this.running) break;
            }

            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    stopClock() {
        this.running = false
    }

    step() {
        console.log(`X: ${this.X}, A: ${this.A}, step: ${this.Counter}, opcode: ${this.ram.read(this.Counter)}`, this.ram.memory)
        this.execute(this.ram.read(this.Counter))
    }

    // -- OPERATIONS

    // LDX value
    LDXv() {
        this.Counter++
        this.X = this.ram.read(this.Counter++)

        this.checkFlags()
    }

    // LDX address
    LDXa() {
        this.Counter++
        this.X = this.ram.read(this.ram.read(this.Counter++))

        this.checkFlags()
    }

    // LDX indexed by A
    LDXi() {
        this.X = this.ram.read(this.A)
        this.Counter++

        this.checkFlags()
    }

    // LDA value
    LDAv() {
        this.Counter++
        this.A = this.ram.read(this.Counter++)
        this.Equal = (this.A === 0)

        this.checkFlags()
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

        this.checkFlags()
    }

    // AND (modifies A)
    AND() {
        this.A &= this.X
        this.Counter++

        this.checkFlags()
    }

    // XOR (modifies A; useful for branching with the zero flag)
    XOR() {
        this.A ^= this.X
        this.Counter++

        this.checkFlags()
    }

    // JUMP (saving the starting point in stack)
    JUM() {
        this.stack.add(this.Counter)
        this.Counter++              
        this.Counter = this.ram.read(this.Counter++)        // jumps
    }

    // CONDITIONAL JUMP (if A and X are equal; saving the starting point in stack)
    JCO() {
        this.stack.add(this.Counter)
        this.Counter++

        if (this.Equal) {
            this.Counter = this.ram.read(this.Counter++)    // jumps
            return
        }      
        
        this.Counter ++               // or moves on.           
    }

    // OVERFLOW JUMP (if A and X are equal; saving the starting point in stack)
    JOV() {
        this.stack.add(this.Counter)
        this.Counter++

        if (this.Overflow) {
            this.Counter = this.ram.read(this.Counter++)    // jumps 
            return
        }      
        
        this.Counter ++               // or moves on.           
    }

    // OUT
    OUT() {
        this.screen.innerHTML += String.fromCharCode(this.ram.read(0xF0))
        this.Counter++
    }

    // CLA: clear the A
    CLA() {
        this.A = 0
        this.Counter++
    }

    // returns to the line *after* the last jump
    RET() {
        this.Counter = this.stack.drop() + 2
    }

    // drops the last value added to the stack without consequences
    SDR() {
        this.stack.drop()
    }

    // helper:
    checkFlags() {
        this.Equal = (this.A === this.X)
        this.Overflow = (this.A > 0xFF); 
        this.A &= 0xFF
    }
}