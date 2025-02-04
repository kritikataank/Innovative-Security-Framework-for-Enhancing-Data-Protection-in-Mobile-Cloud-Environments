// presentCipher.js

// Define the PRESENT block cipher parameters
const BLOCK_SIZE = 64; // Block size in bits
const KEY_SIZE = 80; // Key size in bits
const ROUNDS = 31; // Number of rounds for PRESENT

// S-box for PRESENT
const S_BOX = [
    0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7,
    0x8, 0x9, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf,
];

// P-box for PRESENT
const P_BOX = [
    0, 16, 32, 48, 1, 17, 33, 49,
    2, 18, 34, 50, 3, 19, 35, 51,
    4, 20, 36, 52, 5, 21, 37, 53,
    6, 22, 38, 54, 7, 23, 39, 55,
    8, 24, 40, 56, 9, 25, 41, 57,
    10, 26, 42, 58, 11, 27, 43, 59,
    12, 28, 44, 60, 13, 29, 45, 61,
    14, 30, 46, 62, 15, 31, 47, 63,
];

// Key schedule generation
function keySchedule(key) {
    const roundKeys = [];
    
    // Convert key to BigInt explicitly, handling Buffer or other types
    if (Buffer.isBuffer(key)) {
        key = BigInt('0x' + key.toString('hex')); // Convert Buffer to BigInt
    } else {
        key = BigInt(key); // Convert key to BigInt explicitly
    }

    for (let i = 0; i < ROUNDS + 1; i++) {
        roundKeys.push(key);
        key = ((key << BigInt(61)) | (key >> BigInt(19))) ^ (i < 26 ? BigInt(1) << BigInt(i % 26) : BigInt(0)); // Rotate and add round constant
    }
    return roundKeys;
}

// Helper function to convert a string to a BigInt
function stringToBigInt(str) {
    if (typeof str !== 'string') {
        throw new TypeError('Input must be a string');
    }

    let bigIntValue = BigInt(0);
    for (let i = 0; i < str.length; i++) {
        bigIntValue = (bigIntValue << BigInt(8)) | BigInt(str.charCodeAt(i));
    }
    return bigIntValue;
}

// Encrypt function
function encryptPresent(plainText, key) {
    if (typeof plainText !== 'string') {
        throw new TypeError('plainText must be a string');
    }

    let block = stringToBigInt(plainText); // Convert plainText to BigInt
    const roundKeys = keySchedule(key);
    
    for (let i = 0; i < ROUNDS; i++) {
        block ^= roundKeys[i]; // Add round key
        // S-box substitution
        let temp = BigInt(0);
        for (let j = 0; j < 16; j++) {
            temp |= BigInt(S_BOX[Number((block >> BigInt(j * 4)) & BigInt(0xF))]) << BigInt(j * 4);
        }
        block = temp; // Update block after S-box
        // Permutation
        let permutedBlock = BigInt(0);
        for (let j = 0; j < BLOCK_SIZE; j++) {
            permutedBlock |= ((block >> BigInt(j)) & BigInt(0x1)) << BigInt(P_BOX[j]);
        }
        block = permutedBlock; // Update block after P-box
    }
    return block; // Return encrypted block
}

// Encrypt function
function encryptPresent(plainText, key) {
    console.log('Input to encryptPresent:', plainText, 'Type:', typeof plainText); // Debugging line

    if (typeof plainText !== 'string') {
        throw new TypeError('plainText must be a string');
    }

    let block = stringToBigInt(plainText); // Convert plainText to BigInt
    const roundKeys = keySchedule(key);
    
    for (let i = 0; i < ROUNDS; i++) {
        block ^= roundKeys[i]; // Add round key
        // S-box substitution
        let temp = BigInt(0);
        for (let j = 0; j < 16; j++) {
            temp |= BigInt(S_BOX[Number((block >> BigInt(j * 4)) & BigInt(0xF))]) << BigInt(j * 4);
        }
        block = temp; // Update block after S-box
        // Permutation
        let permutedBlock = BigInt(0);
        for (let j = 0; j < BLOCK_SIZE; j++) {
            permutedBlock |= ((block >> BigInt(j)) & BigInt(0x1)) << BigInt(P_BOX[j]);
        }
        block = permutedBlock; // Update block after P-box
    }
    return block; // Return encrypted block
}

// Decrypt function
function decryptPresent(cipherText, key) {
    let block = cipherText;
    const roundKeys = keySchedule(key).reverse();
    
    for (let i = 0; i < ROUNDS; i++) {
        // Inverse permutation
        let permutedBlock = BigInt(0);
        for (let j = 0; j < BLOCK_SIZE; j++) {
            permutedBlock |= ((block >> BigInt(j)) & BigInt(0x1)) << BigInt(P_BOX.indexOf(j));
        }
        block = permutedBlock; // Update block after inverse P-box
        // Inverse S-box substitution
        let temp = BigInt(0);
        for (let j = 0; j < 16; j++) {
            temp |= BigInt(S_BOX.indexOf(Number((block >> BigInt(j * 4)) & BigInt(0xF)))) << BigInt(j * 4);
        }
        block = temp; // Update block after inverse S-box
 block ^= roundKeys[i]; // Add round key
    }
    return block; // Return decrypted block
}

function stringToBigInt(str) {
    let bigIntValue = BigInt(0);
    for (let i = 0; i < str.length; i++) {
        bigIntValue = (bigIntValue << BigInt(8)) | BigInt(str.charCodeAt(i));
    }
    return bigIntValue;
}

function bigIntToString(bigIntValue) {
    let str = '';
    while (bigIntValue > 0) {
        const byte = Number(bigIntValue & BigInt(0xFF));
        str = String.fromCharCode(byte) + str;
        bigIntValue >>= BigInt(8);
    }
    return str;
}

// Export functions
module.exports = { encryptPresent, decryptPresent, keySchedule, bigIntToString };