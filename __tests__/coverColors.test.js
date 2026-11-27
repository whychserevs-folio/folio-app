import { extractSpineColors, contrastHex, coverUrlForColours, isReadableAccent } from "../src/utils/coverColors";

// Build an RGBA image: fill(x, y) -> [r, g, b]
const image = (w, h, fill) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y);
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return data;
};

test("black cover with a red title: black spine, red title, cream text", () => {
  const w = 60, h = 90;
  const data = image(w, h, (x, y) => (y > 30 && y < 45 && x > 10 && x < 50 ? [200, 20, 30] : [12, 12, 14]));
  const c = extractSpineColors(data, w, h);
  expect(c.bg).toBe("#0C0C0E");
  expect(c.text).toBe("#F6F0E6");
  expect(c.accent).toMatch(/^#C8141E$/);
});

test("white cover: dark text so the title is readable", () => {
  const w = 60, h = 90;
  const data = image(w, h, (x, y) => (y > 40 && y < 50 ? [180, 30, 40] : [250, 248, 245]));
  const c = extractSpineColors(data, w, h);
  expect(c.text).toBe("#17120F");
  expect(contrastHex(c.text, c.bg)).toBeGreaterThan(7);
});

test("spine colour comes from the cover's left edge, not the middle", () => {
  const w = 100, h = 150;
  const data = image(w, h, x => (x < 12 ? [30, 60, 120] : [240, 200, 40])); // blue edge, yellow art
  expect(extractSpineColors(data, w, h).bg).toBe("#1E3C78");
});

test("no accent when nothing stands out", () => {
  const w = 40, h = 60;
  const data = image(w, h, () => [90, 90, 90]);
  expect(extractSpineColors(data, w, h).accent).toBeNull();
});

test("Open Library covers are fetched at medium size", () => {
  expect(coverUrlForColours("https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg"))
    .toBe("https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg");
  expect(coverUrlForColours("https://x.supabase.co/a.jpeg")).toBe("https://x.supabase.co/a.jpeg");
});

test("accent titles: vivid red on black is used, dull brown on black is not", () => {
  expect(isReadableAccent("#C8141E", "#0C0C0E")).toBe(true); // red title, common on covers
  expect(isReadableAccent("#765A39", "#06080B")).toBe(false); // dark brown: too dim
  expect(isReadableAccent("#FBD68A", "#1E3237")).toBe(true); // gold on teal
});
