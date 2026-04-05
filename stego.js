/**
 * Entropy Vault - Ghost Layer (Steganography)
 * LSB Encoding/Decoding with Channel Selection
 */

const LSBSteganography = {
    /**
     * Calculate max capacity for a message in characters
     * @param {Uint8ClampedArray} data 
     * @returns {number}
     */
    calculateCapacity(data) {
        // 8 bits per character, 1 bit per pixel channel
        // Each pixel has 4 channels (R, G, B, A)
        // We use 1 channel per pixel to minimize visual impact
        return Math.floor(data.length / 32); 
    },

    /**
     * Encode a message into pixel data
     * @param {Uint8ClampedArray} data 
     * @param {string} message 
     * @param {string} channel - 'blue' or 'alpha'
     * @returns {Uint8ClampedArray}
     */
    encode(data, message, channel = 'blue') {
        const binary = this.textToBinary(message + '\0'); // Null terminator
        const channelOffset = channel === 'alpha' ? 3 : 2; // 0=R, 1=G, 2=B, 3=A
        
        if (binary.length > data.length / 4) {
            throw new Error('Message too large for this image.');
        }

        for (let i = 0; i < binary.length; i++) {
            const pixelIdx = i * 4 + channelOffset;
            // Clear LSB and set to binary bit
            data[pixelIdx] = (data[pixelIdx] & 0xFE) | parseInt(binary[i]);
        }

        return data;
    },

    /**
     * Decode a message from pixel data
     * @param {Uint8ClampedArray} data 
     * @param {string} channel - 'blue' or 'alpha'
     * @returns {string}
     */
    decode(data, channel = 'blue') {
        let binary = '';
        const channelOffset = channel === 'alpha' ? 3 : 2;
        
        for (let i = 0; i < data.length; i += 4) {
            binary += (data[i + channelOffset] & 1).toString();
            
            // Check for null terminator every 8 bits
            if (binary.length % 8 === 0) {
                const charCode = parseInt(binary.slice(-8), 2);
                if (charCode === 0) break;
            }
        }

        return this.binaryToText(binary);
    },

    textToBinary(text) {
        return text.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    },

    binaryToText(binary) {
        let text = '';
        for (let i = 0; i < binary.length; i += 8) {
            const charCode = parseInt(binary.slice(i, i + 8), 2);
            if (charCode === 0) break;
            text += String.fromCharCode(charCode);
        }
        return text;
    }
};
