import {
  UNIT,
  ROW_PADDING,
  BOOK_MARGIN,
  getBookSize,
  groupByShelf,
  settleShelves,
  layoutShelves,
  insertIntoShelves,
  removeFromShelves,
  itemKey,
} from "../src/utils/shelfLayout";

// Minimal library items as built in useFolioStore.libraryItems
let n = 0;
// spines/lying books get a photo here so their size is the fixed standard one
const book = (style = "spine", shelf = 0, extra = {}) => {
  n += 1;
  const photo = style === "spine" ? { spine_image_url: "x" } : {};
  return {
    id: `b${n}`,
    title: `Book ${n}`,
    editionRecord: { id: `e${n}`, display_style: style, shelf_index: shelf, ...photo, ...extra },
  };
};
const keys = shelves => shelves.map(s => s.map(it => it.editionRecord.id));
const slot = style =>
  getBookSize({ editionRecord: { display_style: style, spine_image_url: "x" } }).w + BOOK_MARGIN * 2;

beforeEach(() => {
  n = 0;
});

describe("getBookSize", () => {
  test("matches what the bookshelf draws", () => {
    // spine photo -> standard size
    expect(getBookSize({ editionRecord: { display_style: "spine", spine_image_url: "x" } })).toEqual({ w: 30, h: 140 });
    expect(getBookSize({ editionRecord: { display_style: "edge" } })).toEqual({ w: 40, h: 140 });
    // generated spines and lying books vary, within limits, stably per book
    const gen = { id: "b1", editionRecord: { id: "ed-42", display_style: "spine" } };
    const s1 = getBookSize(gen);
    expect(s1.w).toBeGreaterThanOrEqual(26);
    expect(s1.w).toBeLessThanOrEqual(32);
    expect(s1.h).toBeGreaterThanOrEqual(128);
    expect(s1.h).toBeLessThanOrEqual(140);
    expect(getBookSize(gen)).toEqual(s1);
    const lying = getBookSize({ editionRecord: { id: "ed-7", display_style: "stack" } });
    expect(lying.w).toBe(90);
    expect(lying.h).toBeGreaterThanOrEqual(22);
    expect(lying.h).toBeLessThanOrEqual(28);
    // cover with an image vs. placeholder
    expect(getBookSize({ editionRecord: { display_style: "cover", cover_url: "x" } })).toEqual({ w: 65, h: 110 });
    expect(getBookSize({ editionRecord: { display_style: "cover" } })).toEqual({ w: 80, h: 140 });
  });
});

describe("groupByShelf", () => {
  test("groups by editions.shelf_index, keeping order", () => {
    const a = book("spine", 0), b = book("spine", 2), c = book("spine", 0);
    expect(keys(groupByShelf([a, b, c], true))).toEqual([["e1", "e3"], [], ["e2"]]);
  });

  test("read-only shelves ignore shelf_index", () => {
    const a = book("spine", 3), b = book("spine", 1);
    expect(keys(groupByShelf([a, b], false))).toEqual([["e1", "e2"]]);
  });
});

describe("settleShelves", () => {
  test("a shelf that fits stays as it is", () => {
    const shelves = [[book(), book()], [book()]];
    expect(keys(settleShelves(shelves, 1000))).toEqual(keys(shelves));
  });

  test("overflow moves to the START of the next shelf, nothing else moves", () => {
    const width = slot("spine") * 2; // room for exactly two spines
    const shelves = [[book(), book(), book()], [book()]];
    expect(keys(settleShelves(shelves, width))).toEqual([["e1", "e2"], ["e3", "e4"]]);
  });

  test("overflow cascades and can create a new shelf", () => {
    const width = slot("spine") * 2;
    const shelves = [[book(), book(), book(), book(), book()]];
    expect(keys(settleShelves(shelves, width))).toEqual([["e1", "e2"], ["e3", "e4"], ["e5"]]);
  });

  test("removing a book never pulls books up from the next shelf", () => {
    // the bug the user hit with the old flow layout
    const width = slot("spine") * 2;
    const shelves = settleShelves([[book(), book()], [book(), book()]], width);
    const after = settleShelves(removeFromShelves(shelves, "e1"), width);
    expect(keys(after)).toEqual([["e2"], ["e3", "e4"]]);
  });

  test("lying books pile up (up to 5) and take one slot", () => {
    const width = slot("stack") + slot("spine");
    const shelves = [[book("stack"), book("stack"), book("stack"), book("spine")]];
    expect(keys(settleShelves(shelves, width))).toEqual([["e1", "e2", "e3", "e4"]]);
  });

  test("a sixth lying book starts a new pile", () => {
    const width = slot("stack"); // only one pile fits
    const six = Array.from({ length: 6 }, () => book("stack"));
    expect(keys(settleShelves([six], width))).toEqual([
      ["e1", "e2", "e3", "e4", "e5"],
      ["e6"],
    ]);
  });

  test("trailing empty shelves are dropped", () => {
    expect(settleShelves([[book()], [], []], 1000)).toHaveLength(1);
  });
});

describe("layoutShelves", () => {
  test("positions books left to right on their shelf", () => {
    const shelves = [[book("spine"), book("cover", 0, { cover_url: "x" })], [book("edge")]];
    const pos = layoutShelves(shelves);
    const p1 = pos.get("e1"), p2 = pos.get("e2"), p3 = pos.get("e3");
    expect(p1.row).toBe(0);
    expect(p1.x).toBe(ROW_PADDING + BOOK_MARGIN);
    expect(p2.x).toBe(ROW_PADDING + slot("spine") + BOOK_MARGIN);
    expect(p3.row).toBe(1);
    // books stand on the shelf: same bottom edge
    expect(p1.y + p1.h).toBe(p2.y + p2.h);
    expect(p3.y).toBeGreaterThan(UNIT);
  });

  test("piles stack upwards in one slot", () => {
    const pos = layoutShelves([[book("stack"), book("stack")]]);
    const bottom = pos.get("e1"), top = pos.get("e2");
    expect(top.x).toBe(bottom.x);
    expect(top.y + top.h).toBe(bottom.y); // rests exactly on the book below
    expect(top.pile && bottom.pile).toBe(true);
  });
});

describe("insertIntoShelves", () => {
  test("can drop onto a new, empty shelf", () => {
    const shelves = [[book(), book()]];
    const item = book();
    expect(keys(insertIntoShelves(shelves, item, 2, 0))).toEqual([["e1", "e2"], [], ["e3"]]);
  });

  test("does not mutate the input", () => {
    const shelves = [[book()]];
    insertIntoShelves(shelves, book(), 0, 0);
    expect(shelves[0]).toHaveLength(1);
  });
});

test("itemKey prefers the edition id", () => {
  expect(itemKey({ id: "book-1", editionRecord: { id: "ed-9" } }, 0)).toBe("ed-9");
  expect(itemKey({ id: "book-1" }, 0)).toBe("book-1");
});
