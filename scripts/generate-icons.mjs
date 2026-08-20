import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../src/public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Simple CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crcBuf]);
}

function clampByte(val) {
  return Math.max(0, Math.min(255, Math.round(val)));
}

function createPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // deflate
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw scanlines: each line starts with filter byte 0x00, followed by RGBA bytes
  const rawBytes = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;

  const center = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    rawBytes.writeUInt8(0, offset++); // Filter byte 0 (None)
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Outer badge background: Deep Indigo / Violet (#4F46E5 -> #4338CA)
        const t = y / size;
        let r = 79 * (1 - t * 0.2);
        let g = 70 * (1 - t * 0.2);
        let b = 229 * (1 - t * 0.1);
        let a = 255;

        // Anti-aliased border
        if (dist > radius - 1) {
          a = 255 * (radius - dist + 1);
        }

        // Inner radar / shield / magnifying glyph in Amber (#F59E0B) and White (#FFFFFF)
        const innerDist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        // Stylized filter/radar wave
        if (
          (innerDist >= radius * 0.45 &&
            innerDist <= radius * 0.65 &&
            y <= center + radius * 0.3) ||
          (innerDist >= radius * 0.15 && innerDist <= radius * 0.28)
        ) {
          r = 245;
          g = 158;
          b = 11;
        } else if (Math.abs(dx + dy) < size * 0.08 && dist < radius * 0.75) {
          // Diagonal slash (detecting slop) in bright amber/white
          r = 255;
          g = 255;
          b = 255;
        }

        rawBytes.writeUInt8(clampByte(r), offset);
        rawBytes.writeUInt8(clampByte(g), offset + 1);
        rawBytes.writeUInt8(clampByte(b), offset + 2);
        rawBytes.writeUInt8(clampByte(a), offset + 3);
      } else {
        // Transparent
        rawBytes.writeUInt8(0, offset);
        rawBytes.writeUInt8(0, offset + 1);
        rawBytes.writeUInt8(0, offset + 2);
        rawBytes.writeUInt8(0, offset + 3);
      }
      offset += 4;
    }
  }

  const compressedData = zlib.deflateSync(rawBytes);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

for (const size of [16, 32, 48, 128]) {
  const png = createPng(size);
  const filepath = path.join(outputDir, `icon-${size}.png`);
  fs.writeFileSync(filepath, png);
  console.log(`Generated ${filepath} (${size}x${size})`);
}
