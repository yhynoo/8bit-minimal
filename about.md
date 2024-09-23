This is a small fun project to understand how microprocessors work.

# architecture

- X (general) and A (arithmetic) registers
- equal (A = X) and overflow flag

- program counter
- 8 byte stack

# special addresses

0x00 - 0xF7     user memory

0xF8            return output for converter
0xF9            "external input"
0xFA - 0xFC     text memory (for three-byte commands)
0xFD            I/O byte

0xFE            system loop: working address
0xFF            index

# opcodes (16)

0x0 v       Load a value into X.
0x1 a       Load a value from address into X.
0x2         Load a value from the address pointed to by A into X.

0x3 v       Load a value into A.
0x4 a       Store the value from A into memory.
0x5         Store the value from A at the location pointed by X.

0x6         A = A + X

0x7         Perform a bitwise AND between X and A (modifies A).
0x8         Perform a bitwise OR between X and A (modifies A).
0x9         ASL (modifies A)

0xA a       Store return address in stack and jump to the address a.
0xB a       Store return address in stack and jump to the address a if the equal flag is on.
0xD a       Store return address in stack and jump to the address a if the overflow flag is on.

0xE         Output the value of the I/O byte (0xF0).
0xF         Set A to 0.

0x10        Store return address in stack and jump to the address in X.
0x11        Return.
0x12        Remove top item from stack.