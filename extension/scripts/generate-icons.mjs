/**
 * Generates extension icons as PNGs using only Node built-ins.
 * The mark mirrors the web app logo: an indigo rounded square with a
 * white card and an orange flame.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist', 'icons');

// ---- minimal PNG writer ----------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- drawing ---------------------------------------------------------------

const INDIGO = [79, 70, 229];
const WHITE = [255, 255, 255];
const ORANGE = [249, 115, 22];
const AMBER = [251, 191, 36];

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.max(x0 + r, Math.min(x, x1 - r));
  const cy = Math.max(y0 + r, Math.min(y, y1 - r));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inTriangle(x, y, ax, ay, bx, by, cx, cy) {
  const sign = (p1x, p1y, p2x, p2y, p3x, p3y) =>
    (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
  const d1 = sign(x, y, ax, ay, bx, by);
  const d2 = sign(x, y, bx, by, cx, cy);
  const d3 = sign(x, y, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** Draws the logo at `size` (samples per side) into an RGBA buffer. */
function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const S = size / 128; // scale from a 128-unit design space

  const blend = (dst, src, alpha) => {
    dst[0] = Math.round(src[0] * alpha + dst[0] * (1 - alpha));
    dst[1] = Math.round(src[1] * alpha + dst[1] * (1 - alpha));
    dst[2] = Math.round(src[2] * alpha + dst[2] * (1 - alpha));
    dst[3] = Math.round(255 * alpha + dst[3] * (1 - alpha));
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / S;
      const py = (y + 0.5) / S;
      const dst = buf.subarray((y * size + x) * 4, (y * size + x) * 4 + 4);
      dst[3] = 0;

      // Background: indigo rounded square
      if (inRoundedRect(px, py, 4, 4, 124, 124, 30)) {
        blend(dst, INDIGO, 1);
      }

      // White card
      if (inRoundedRect(px, py, 26, 34, 102, 94, 12)) {
        blend(dst, WHITE, 1);
      }

      // Flame: teardrop (triangle + circle) + inner core
      if (
        inTriangle(px, py, 64, 34, 46, 72, 82, 72) ||
        inCircle(px, py, 64, 62, 17)
      ) {
        blend(dst, ORANGE, 1);
      }
      if (inCircle(px, py, 64, 68, 8)) {
        blend(dst, AMBER, 1);
      }
    }
  }
  return buf;
}

/** Simple box downsample from a 128px buffer. */
function downsample(source, size) {
  const out = Buffer.alloc(size * size * 4);
  const step = 128 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      for (let sy = Math.floor(y * step); sy < Math.floor((y + 1) * step); sy++) {
        for (let sx = Math.floor(x * step); sx < Math.floor((x + 1) * step); sx++) {
          const i = (sy * 128 + sx) * 4;
          r += source[i]; g += source[i + 1]; b += source[i + 2]; a += source[i + 3];
          count++;
        }
      }
      const i = (y * size + x) * 4;
      out[i] = Math.round(r / count);
      out[i + 1] = Math.round(g / count);
      out[i + 2] = Math.round(b / count);
      out[i + 3] = Math.round(a / count);
    }
  }
  return out;
}

mkdirSync(OUT, { recursive: true });
const master = drawIcon(128);

for (const size of [16, 32, 48, 128]) {
  const rgba = size === 128 ? master : downsample(master, size);
  writeFileSync(join(OUT, `icon${size}.png`), encodePng(size, size, rgba));
  console.log(`icon${size}.png`);
}
