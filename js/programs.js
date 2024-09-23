const IO = 0xF0
const TEXT_MEMORY_START = 0xF2
const TEXT_MEMORY_INDEX = 0xFF

const RESET_INDEX = 0x20
const OUT = 0

const io = [
        // check if anything was typed
        0xF,
        0x1, IO,
        0xB, 0,

    // if not, then continue by printing and passing the character to buffer:
    0xE,

        // if index is 0, set it to the start of the buffer
        0x1, TEXT_MEMORY_INDEX,
        0xF,
        0xB, RESET_INDEX,

        // if index is equal to 0xFA -> prevent overflow by resetting it. X already contains the index, so no need to put it there again.
        0x3, 0xFA,
        0xB, RESET_INDEX,

    // if all is fine : load character into X and pass to A
    0x1, IO,
    0xF,
    0x6,
    
    // we get the index into X, and send the character from A there
    0x1, TEXT_MEMORY_INDEX,
    0x5,

    // pass index to A while incrementing (set A to 1 and add index from X) and then save it on 0xFF
    0x3, 1,
    0x6,
    0x4, TEXT_MEMORY_INDEX,

    // clear the I/O byte and jump to beginning
    0xF,
    0x4, IO,

    0xA, 0,

    // RESET_INDEX subroutine:
    0x3, TEXT_MEMORY_START,
    0x4, TEXT_MEMORY_INDEX,
    0x11                       
]

// this program runs from 0x30; shows the memory wrong.
const START_MEMORY_LOOP = 0x33

memory_display = [
    0xF, 
    0x4, 0xFF,              // set index to 0.

    // loop
    0x2,                    // load the value into X, pass to A, and to the IO bit, then print.
    0xF,
    0x6,
    0x4, IO,
    0xE,

    0x3, 0x20,              // add the spacebar
    0x4, IO,
    0xE,

    0x1, 0xFF,
    0x3, 0xFF,              // set A to 0xFF and compare: are we at the end of memory?
    0xB, OUT,               // if yes, jump out of the program.

    // if not, increment the index at 0xFF and jump to the start of the loop.
    0x3, 1,
    0x6,
    0x4, 0xFF,

    0xA, START_MEMORY_LOOP,
]

// this program runs from 0x80 and assumes your value is in X already.
END = 0x8F
LETTER = 0x8A
const hex_converter = [
    // we set A to 191, so the letters overflow and numbers don't
    0x3, 0xBF,
    0x1, 0xFA,
    0x6,
    0xD, LETTER,        // letters should overflow
    
    // if it's a digit, we set A to -48.
    0x3, 0xD0,
    0xA, END,           // skip the 'letter' option

    // if it's a letter, to -54.
    0x12,               // drops the last jump from the stack so we can return to the original entry point.
    0x3, 0xC9,
    0xA, END,

    // and we finish by adding the numbers, so A has the right value.
    0x12,               // again, stack hygiene.
    0x6,
    0x4, 0xFF,
    0x11
]