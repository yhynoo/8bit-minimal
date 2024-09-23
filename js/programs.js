// reference addresses
const IO_LOOP               = 0x00
const EXECUTION_LOOP        = 0x30
const COMMANDS              = 0x50
const HEX_MAKER             = 0x80
const HEX_CONVERTER         = 0x90

// system locations
const CONVERTER_OUTPUT      = 0xF8
const COMMAND_PARAMETER     = 0xF9
const TEXT_MEMORY_START     = 0xFA
const IO                    = 0xFD
const MEMORY_WORKING        = 0xFE
const MEMORY_INDEX          = 0xFF

// this is the basic I/O loop. it branches out to the execution loop when enter is pressed.
const RESET_INDEX = 0x28
const INDEX_CHECK = 0x0A
const io = [

        // check if anything was typed
        0xF,
        0x1, IO,
        0xC, IO_LOOP,           // if nothing, go back to start

        0x3, 69,                // check if ENTER was pressed
        0xC, EXECUTION_LOOP,

    // if not, then continue by printing and passing the character to buffer:
    0xE,

        // if index is 0, set it to the start of the buffer
        0x1, MEMORY_INDEX,
        0xF,
        0xC, RESET_INDEX,

        // if index is equal to 0xFD -> prevent memory overflow by resetting it. X already contains the index, so no need to put it there again.
        0x1, IO,
        0xC, RESET_INDEX,

    // if all is fine : load character into X, convert it to HEX and pass to A
    0x1, IO,
    0xA, HEX_CONVERTER, 
    0x1, CONVERTER_OUTPUT,  // pull the converted character from I/O again
    0xF,                    // clear A
    0x6,                    // pass character from X to A
    
    // we get the index into X, and send the character from A there
    0x1, MEMORY_INDEX,
    0x5,

    // pass index to A while incrementing (set A to 1 and add index from X) and then save it on 0xFF
    0x3, 1,
    0x6,
    0x4, MEMORY_INDEX,

    // clear the I/O byte and jump to beginning
    0xF,
    0x4, IO,

    0xA, IO_LOOP,

    // RESET_INDEX subroutine:
    0x3, TEXT_MEMORY_START,
    0x4, MEMORY_INDEX,
    0xA, INDEX_CHECK                      
]

// execution loop. runs from 0x30 to 0x47.
// ! WARNING: if it somehow doesn't get a right parameter, it might loop out of memory.
const MEMORY_LOOP_START = 0x38
const execution = [
    0xA, HEX_MAKER,                 // builds the hex we're gonna use for operations and saves it as COMMAND_PARAMETER.

    // set X to 0, pass the 0 to A, and save it as MEMORY_INDEX
    0x0, 0,
    0xF, 0x6,
    0x4, MEMORY_INDEX,

    // start looping
    0x1, MEMORY_INDEX,           
    0xF, 0x6,                       // pass the index from X to A
    0x1, COMMAND_PARAMETER,         // load command parameter into X for comparison
    0xC, COMMANDS,                  // jump to commands if there's a match.

    // otherwise, load 1 into X and add to the index; then save the new index, and reload the loop.
    0x0, 1,
    0x6,
    0x4, MEMORY_INDEX,
    0xA, MEMORY_LOOP_START
]

// the commands branch. runs from 0x50.
const COMMAND_JUMP = 0x5D
const COMMAND_END = 0x60
const commands = [
    0x1, TEXT_MEMORY_START,         // load the operator into X

    // if it's 37, then do the jump.
    0x3, 37,
    0xC, COMMAND_JUMP,

    // otherwise print + to show you are alive.
    0x3, 43,
    0x4, IO, 0xE,

    0xA, COMMAND_END,

            // COMMAND JUMP: simply reloads the parameter and jumps to the target address and starts executing from there.
            0x1, COMMAND_PARAMETER,
            0x10, 

    0xA, 0x23                  // jump into the IO loop, before erasing the IO byte.
]

// hex builder. runs from 0x80 to 0x8E.
const hex_maker = [
    // load the upper nibble into A through X
    0x1, 0xFB,
    0xF, 0x6,

    // do the shift five times (so we multiply it times 16)
    0x9, 0x9, 0x9, 0x9,

    // load the lower bit into X and add it to A
    0x1, 0xFC,
    0x6,

    // save the result in 0xF9 and go to the memory loop.
    0x4, COMMAND_PARAMETER,
    0xA, 0x32
]

// this program runs from 0x90 until 0x9F and assumes your value is in X already; the output is in F8.
const LETTER = 0x99
const CONVERT_END = 0x9B
const hex_converter = [
    // we set A to 191, so when added, letters will overflow, but numbers won't
    0x3, 0xCF,
    0x6,
    0xD, LETTER,

    // if it didn't overflow, it's a digit, so we set the A to -48
    0x3, 0xD0,
    0xA, CONVERT_END,

        // else, we set A to -54.
        0x3, 0xC9,

    // and we finish by adding the numbers, so A has the right value.
    0x6,
    0x4, CONVERTER_OUTPUT,
    0xA, 0x17
]