/*
 * Spine colours from a book's cover.
 *
 * On a real book the spine continues the front cover, so:
 *   - background: the dominant colour of the cover's LEFT edge (where the
 *     cover wraps round onto the spine)
 *   - title: the cover's accent colour (e.g. the red of a red title on a
 *     black cover) when it stands out from the background, else the text colour
 *   - text: cream or near-black, whichever reads better on the background
 *
 * extractSpineColors() is pure (RGBA pixels in, colours out) and unit tested.
 * computeSpineColors(url) downloads and decodes a JPEG cover in plain JS
 * (jpeg-js), so no native module or app rebuild is needed.
 */

const LIGHT_TEXT = "#F6F0E6";
const DARK_TEXT = "#17120F";

const toHex = ([r, g, b]) =>
  "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

const fromHex = hex => {
  const n = parseInt(String(hex).replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// WCAG relative luminance and contrast ratio
const channel = v => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
export const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
export const contrastHex = (a, b) => contrast(fromHex(a), fromHex(b));

const saturation = ([r, g, b]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
};

// Can this accent colour be used for the title on this background?
// High contrast always works; a vivid colour (e.g. a red title on black, very
// common on covers) also reads well at moderate contrast. Dull colours at
// moderate contrast (e.g. dark brown on black) don't.
export function isReadableAccent(accent, bg) {
  const a = Array.isArray(accent) ? accent : fromHex(accent);
  const b = Array.isArray(bg) ? bg : fromHex(bg);
  const c = contrast(a, b);
  return c >= 4.5 || (c >= 2.6 && saturation(a) >= 0.75);
}

// Group pixels into colour buckets (4 bits per channel) and average each.
function buckets(data, width, height, { x0, x1, y0, y1, step }) {
  const map = new Map();
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * width + x) * 4;
      if (data[i + 3] !== undefined && data[i + 3] < 128) continue; // transparent
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const e = map.get(key);
      if (e) {
        e.n += 1; e.r += r; e.g += g; e.b += b;
      } else {
        map.set(key, { n: 1, r, g, b });
      }
    }
  }
  return [...map.values()].map(e => ({ n: e.n, rgb: [e.r / e.n, e.g / e.n, e.b / e.n] }));
}

export function extractSpineColors(data, width, height) {
  if (!data || !width || !height) return null;
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 6000)));

  // 1) background: dominant colour of the left edge strip
  const edge = buckets(data, width, height, {
    x0: Math.floor(width * 0.01),
    x1: Math.max(2, Math.floor(width * 0.1)),
    y0: Math.floor(height * 0.04),
    y1: Math.floor(height * 0.96),
    step,
  }).sort((a, b) => b.n - a.n);
  if (!edge.length) return null;
  const bg = edge[0].rgb;

  // 2) text colour with the best contrast on that background
  const text = contrast(fromHex(LIGHT_TEXT), bg) >= contrast(fromHex(DARK_TEXT), bg) ? LIGHT_TEXT : DARK_TEXT;

  // 3) accent: a reasonably common, saturated colour from the whole cover
  //    that clearly stands out from the background
  const all = buckets(data, width, height, { x0: 0, x1: width, y0: 0, y1: height, step });
  const total = all.reduce((s, b) => s + b.n, 0) || 1;
  let accent = null;
  let best = 0;
  for (const b of all) {
    if (b.n / total < 0.012) continue;
    const c = contrast(b.rgb, bg);
    const s = saturation(b.rgb);
    if (s < 0.35 || !isReadableAccent(b.rgb, bg)) continue;
    const score = s * 0.6 + Math.min(c, 10) / 10 * 0.4 + Math.min(b.n / total, 0.2);
    if (score > best) {
      best = score;
      accent = b.rgb;
    }
  }

  return { v: 1, bg: toHex(bg), text, accent: accent ? toHex(accent) : null };
}

// Smaller files decode much faster; Open Library serves several sizes.
export function coverUrlForColours(url) {
  return String(url).replace(/(covers\.openlibrary\.org\/.+)-L\.jpg/i, "$1-M.jpg");
}

const MAX_BYTES = 2.5 * 1024 * 1024;

// Download + decode a cover and extract colours. Returns null when it can't
// (not a JPEG, too big, network error); callers keep the generic design then.
export async function computeSpineColors(url) {
  try {
    const res = await fetch(coverUrlForColours(url));
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    const size = Number(res.headers.get("content-length") || 0);
    if (size > MAX_BYTES) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const isJpeg = /jpe?g/i.test(type) || (bytes[0] === 0xff && bytes[1] === 0xd8);
    if (!isJpeg || bytes.length > MAX_BYTES) return null;
    const decode = require("jpeg-js/lib/decoder");
    const img = decode(bytes, { useTArray: true, formatAsRGBA: true, maxResolutionInMP: 6, maxMemoryUsageInMB: 64 });
    return extractSpineColors(img.data, img.width, img.height);
  } catch {
    return null;
  }
}
