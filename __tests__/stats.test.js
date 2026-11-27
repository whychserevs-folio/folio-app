import { computeStats } from "../src/state/stats";

const base = {
  books: [{ id: "b1", title: "A" }, { id: "b2", title: "B" }],
  editions: [
    { id: "e1", book_id: "b1", format: "Hardback", signed: true },
    { id: "e2", book_id: "b1", format: "Paperback" },
    { id: "e3", book_id: "b2", format: "paperback" },
    { id: "e4", book_id: "b2", format: "Audiobook" },
  ],
  physicalCopies: [
    { edition_id: "e2" },
    { edition_id: "e2" }, // two copies of the same paperback edition
    { edition_id: "e3" },
    { edition_id: "e1" },
  ],
  preorders: [{ id: "p1", status: "preordered", price: 10 }, { id: "p2", status: "received", price: 5 }],
  subscriptions: [{ id: "s1", status: "Active", price: 30 }, { id: "s2", status: "Paused", price: 20 }],
  tbrIds: ["b2"],
  dnfIds: [],
};
const card = (r, key) => r.statCards.find(c => c.key === key);

test("format cards count editions and their physical copies", () => {
  const r = computeStats(base);
  expect(card(r, "paperback")).toMatchObject({ value: 2, copies: 3 });
  expect(card(r, "paperback").items.map(e => e.id)).toEqual(["e2", "e3"]);
  expect(card(r, "hardback")).toMatchObject({ value: 1, copies: 1 });
  expect(card(r, "audioEbook").value).toBe(1);
  expect(card(r, "special").items.map(e => e.id)).toEqual(["e1"]);
  expect(card(r, "all")).toMatchObject({ value: 4, copies: 4 });
});

test("lists for titles, TBR, pre-orders and subscriptions", () => {
  const r = computeStats(base);
  expect(card(r, "titles").value).toBe(2);
  expect(card(r, "tbr").items.map(b => b.id)).toEqual(["b2"]);
  expect(card(r, "preorders").items.map(p => p.id)).toEqual(["p1"]);
  expect(card(r, "subscriptions").items.map(s => s.id)).toEqual(["s1"]);
  expect(card(r, "preorderSpend").items).toBeUndefined(); // money cards aren't tappable
});
