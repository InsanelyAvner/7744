// lib/crypto.ts

/**
 * Converts a string to a byte array using UTF-8 encoding.
 * @param str The input string.
 * @returns An array of bytes.
 */
function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

/**
 * Converts a byte array to a string using UTF-8 decoding.
 * @param bytes The array of bytes.
 * @returns The decoded string.
 */
function bytesToString(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Generates unique B values for padding cells based on the key and index.
 * Ensures that B is within the 200-255 range.
 * @param key The encryption key.
 * @param index The padding index.
 * @returns A B value between 200-255.
 */
function generatePaddingB(key: string, index: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Generate a unique B value within 200-255
  return 200 + Math.abs((hash + index * 17) % 56); // 200-255
}

/**
 * Encodes a message into an 88x88 grid filled with pure light blue shades.
 * @param message The message to encode.
 * @param key The encryption key.
 * @param canvas The HTMLCanvasElement where the grid will be drawn.
 */
export function encodeMessage(message: string, key: string, canvas: HTMLCanvasElement) {
  const messageBytes = stringToBytes(message);
  const keyBytes = stringToBytes(key);

  if (messageBytes.length > 3871) {
    throw new Error("Message is too long. Maximum 3,871 bytes allowed.");
  }

  const dataBytes: number[] = [];

  const messageLength = messageBytes.length;
  const messageLengthHigh = Math.floor(messageLength / 256);
  const messageLengthLow = messageLength % 256;

  const highNibble_high = Math.floor(messageLengthHigh / 16);
  const highNibble_low = messageLengthHigh % 16;

  const lowNibble_high = Math.floor(messageLengthLow / 16);
  const lowNibble_low = messageLengthLow % 16;

  const B_high_length = 200 + highNibble_high; // 200-215
  const B_low_length = 200 + highNibble_low;   // 200-215
  const B_high_low = 200 + lowNibble_high;     // 200-215
  const B_low_low = 200 + lowNibble_low;       // 200-215

  dataBytes.push(B_high_length, B_low_length, B_high_low, B_low_low);

  for (let i = 0; i < messageBytes.length; i++) {
    const byte = messageBytes[i];
    const highNibble = (byte >> 4) & 0x0F;
    const lowNibble = byte & 0x0F;

    const key_byte_high = keyBytes[(i * 2) % keyBytes.length] % 16;
    const key_byte_low = keyBytes[(i * 2 + 1) % keyBytes.length] % 16;

    const encoded_high = (highNibble + key_byte_high) % 16;
    const encoded_low = (lowNibble + key_byte_low) % 16;

    const B_high = 200 + encoded_high;
    const B_low = 200 + encoded_low;

    dataBytes.push(B_high, B_low);
  }

  const totalDataBytes = 4 + messageBytes.length * 2;
  const totalGridCells = 88 * 88;
  const paddingLength = totalGridCells - totalDataBytes;

  for (let i = 0; i < paddingLength; i++) {
    const paddingByte = generatePaddingB(key, i);
    dataBytes.push(paddingByte);
  }

  while (dataBytes.length < totalGridCells) {
    dataBytes.push(200);
  }

  const grid: number[][] = [];
  for (let i = 0; i < 88; i++) {
    const row: number[] = [];
    for (let j = 0; j < 88; j++) {
      row.push(dataBytes[i * 88 + j]);
    }
    grid.push(row);
  }

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cellSize = Math.floor(canvas.width / 88);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < 88; i++) {
      for (let j = 0; j < 88; j++) {
        const byte = grid[i][j];
        const R = 0;
        const G = 0;
        const B = byte;

        ctx.fillStyle = `rgb(${R}, ${G}, ${B})`;
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }
}


/**
 * Decodes a message from an uploaded 88x88 grid image.
 * @param file The image file to decode.
 * @param key The encryption key used during encoding.
 * @returns A promise that resolves to the decoded message.
 */
export async function decodeMessage(file: File, key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // Create a canvas to extract pixel data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Disable antialiasing for pixel-perfect sampling
          ctx.imageSmoothingEnabled = false;

          // Extract B components from each cell
          const cellSize = Math.floor(canvas.width / 88);
          const transformedBytes: number[] = [];
          const validBlueRange = [200, 255]; // Expected range for valid blue values

          for (let i = 0; i < 88; i++) {
            for (let j = 0; j < 88; j++) {
              const x = Math.floor(j * cellSize + cellSize / 2); // Center of each cell
              const y = Math.floor(i * cellSize + cellSize / 2);
              const pixel = ctx.getImageData(x, y, 1, 1).data; // Get pixel at the center
              let blueValue = pixel[2]; // Blue component (B)

              // Check if the blue value is within the valid range (200-255)
              if (blueValue < validBlueRange[0] || blueValue > validBlueRange[1]) {
                // Ignore or treat as padding if outside the valid range
                console.warn(`Invalid blue value detected at (${i}, ${j}): ${blueValue}`);
                continue;
              }

              transformedBytes.push(blueValue);
            }
          }

          // Retrieve message length from the first four cells
          const messageLengthHigh = (transformedBytes[0] - 200) * 16 + (transformedBytes[1] - 200);
          const messageLengthLow = (transformedBytes[2] - 200) * 16 + (transformedBytes[3] - 200);
          const messageLength = messageLengthHigh * 256 + messageLengthLow;

          if (messageLength < 0 || messageLength > 3871) {
            reject(new Error("Invalid message length detected. Decoding failed."));
            return;
          }

          // Extract message bytes based on the length
          const messageBytes: number[] = [];
          for (let i = 0; i < messageLength; i++) {
            const highB = transformedBytes[4 + i * 2];
            const lowB = transformedBytes[5 + i * 2];

            const encoded_high = highB - 200;
            const encoded_low = lowB - 200;

            if (encoded_high < 0 || encoded_high > 15 || encoded_low < 0 || encoded_low > 15) {
              reject(new Error("Invalid blue shade detected. Decoding failed."));
              return;
            }

            // Retrieve original nibbles by subtracting key nibbles and modulo 16
            const key_byte_high = key.charCodeAt((i * 2) % key.length) % 16;
            const key_byte_low = key.charCodeAt((i * 2 + 1) % key.length) % 16;

            const original_high = (encoded_high - key_byte_high + 16) % 16;
            const original_low = (encoded_low - key_byte_low + 16) % 16;

            const original_byte = (original_high << 4) | original_low;
            messageBytes.push(original_byte);
          }

          const message = bytesToString(messageBytes);
          resolve(message);
        } else {
          reject(new Error("Failed to create canvas context"));
        }
      };
      img.onerror = function() {
        reject(new Error("Invalid image file. Please upload a valid grid image."));
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error("Failed to load image"));
      }
    };

    reader.readAsDataURL(file);
  });
}
