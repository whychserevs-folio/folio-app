// Pure bookshelf layout logic (no React), shared by src/Bookshelf.js and tests.
// Books are grouped by shelf (editions.shelf_index), kept within the shelf
// width (overflow moves to the next shelf), and lying "stack" books pile up.

// Shelf geometry (points)
export const ROW_HEIGHT = 170; // space above each plank where books stand
export const ROW_BASELINE = 164; // y (within a row) where book bottoms rest
export const PLANK_TOP = 8;
export const PLANK_FACE = 24;
export const UNIT = ROW_HEIGHT + PLANK_TOP + PLANK_FACE; // one shelf, top to bottom
export const ROW_PADDING = 8; // left/right inset inside the bookcase
export const BOOK_MARGIN = 2; // gap each side of a book
export const BOOKCASE_SIDES = 28;

export function getBookId(item) {
  return item.book_id || item.bookRecord?.id || item.book?.id || item.id;
}

export function getTitle(item) {
  return item.title || item.bookRecord?.title || item.book?.title || "Untitled";
}

export function getCover(item) {
  return (
    item.editionRecord?.cover_url ||
    item.cover_url ||
    item.bookRecord?.cover_url ||
    item.book?.cover_url ||
    null
  );
}

export function getSpine(item) {
  return (
    item.editionRecord?.spine_image_url ||
    item.spine_image_url ||
    item.bookRecord?.spine_image_url ||
    item.book?.spine_image_url ||
    null
  );
}

export function getEdge(item) {
  return (
    item.editionRecord?.sprayed_edge_url ||
    item.sprayed_edge_url ||
    item.bookRecord?.sprayed_edge_url ||
    item.book?.sprayed_edge_url ||
    null
  );
}

export const getStyle = item => item.editionRecord?.display_style || "spine";


export const itemKey = (item, index) =>
  String(item.editionRecord?.id ?? item.id ?? `${getBookId(item)}-${index}`);

// Visual size of a book, matching what <BookVisual> draws.
export function getBookSize(item) {
  const style = getStyle(item);
  if (style === "cover") return getCover(item) ? { w: 65, h: 110 } : { w: 80, h: 140 };
  if (style === "stack") return { w: 90, h: 26 };
  if (style === "edge") return { w: 40, h: 140 };
  return { w: 30, h: 140 };
}

export const MAX_PILE = 5; // lying ("stack") books per pile

// Width one item adds to a shelf: 0 when it lies on top of the pile before it.
// `pileState` is threaded through a shelf left to right.
export function slotWidth(item, pileState) {
  const isStack = getStyle(item) === "stack";
  if (isStack && pileState.count > 0 && pileState.count < MAX_PILE) {
    pileState.count += 1;
    return 0;
  }
  pileState.count = isStack ? 1 : 0;
  return getBookSize(item).w + BOOK_MARGIN * 2;
}

// Books grouped by the shelf they are on (editions.shelf_index), in order.
// Read-only shelves (search, TBR, collections) ignore shelf_index and flow.
export function groupByShelf(items, useShelfIndex) {
  if (!useShelfIndex) return [items];
  const shelves = [];
  items.forEach(item => {
    const s = Math.max(0, Number(item.editionRecord?.shelf_index) || 0);
    while (shelves.length <= s) shelves.push([]);
    shelves[s].push(item);
  });
  return shelves.length ? shelves : [[]];
}

// Keep every shelf within its width: books that no longer fit move to the
// start of the next shelf (like pushing books along a real shelf).
export function settleShelves(shelves, availableWidth) {
  const out = shelves.map(s => [...s]);
  for (let r = 0; r < out.length; r++) {
    let used = 0;
    const pileState = { count: 0 };
    let fit = 0;
    for (; fit < out[r].length; fit++) {
      const w = slotWidth(out[r][fit], pileState);
      if (fit > 0 && used + w > availableWidth) break;
      used += w;
    }
    if (fit < out[r].length) {
      const overflow = out[r].splice(fit);
      if (r + 1 >= out.length) out.push([]);
      out[r + 1] = [...overflow, ...out[r + 1]];
    }
  }
  while (out.length > 1 && out[out.length - 1].length === 0) out.pop();
  return out;
}

// Positions for every book. Consecutive "stack" books pile up on top of each
// other in one slot (bottom = earliest in the order).
export function layoutShelves(shelves) {
  const positions = new Map();
  shelves.forEach((books, row) => {
    let x = 0;
    let pile = null; // { slotX, slotW, count, topY }
    books.forEach((item, i) => {
      const { w, h } = getBookSize(item);
      const isStack = getStyle(item) === "stack";
      if (isStack && pile && pile.count < MAX_PILE) {
        const y = pile.topY - h;
        positions.set(itemKey(item, i), {
          row, index: i, slotX: pile.slotX, slotW: pile.slotW, pile: true,
          x: ROW_PADDING + pile.slotX + BOOK_MARGIN, y, w, h,
        });
        pile.count += 1;
        pile.topY = y;
        return;
      }
      const slot = w + BOOK_MARGIN * 2;
      const y = row * UNIT + ROW_BASELINE - h;
      positions.set(itemKey(item, i), {
        row, index: i, slotX: x, slotW: slot, pile: isStack,
        x: ROW_PADDING + x + BOOK_MARGIN, y, w, h,
      });
      pile = isStack ? { slotX: x, slotW: slot, count: 1, topY: y } : null;
      x += slot;
    });
  });
  return positions;
}

export const removeFromShelves = (shelves, key) =>
  shelves.map(s => s.filter((it, i) => itemKey(it, i) !== key));

export const insertIntoShelves = (shelves, item, row, index) => {
  const out = shelves.map(s => [...s]);
  while (out.length <= row) out.push([]);
  out[row].splice(index, 0, item);
  return out;
};
