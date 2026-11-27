import {
  displayDate,
  isoDate,
  monthYear,
  num,
  bookId,
  ordinal,
  money,
} from "../src/utils/format";

describe("dates", () => {
  test("displayDate shows UK day/month/year", () => {
    expect(displayDate("2026-11-27")).toBe("27/11/2026");
    expect(displayDate("2026-11-27T10:00:00Z")).toBe("27/11/2026");
    expect(displayDate("")).toBe("");
  });

  test("isoDate accepts ISO or UK input and rejects nonsense", () => {
    expect(isoDate("2026-11-27")).toBe("2026-11-27");
    expect(isoDate("7/3/2027")).toBe("2027-03-07");
    expect(isoDate("31/13/2027")).toBeNull();
    expect(isoDate("next week")).toBeNull();
    expect(isoDate("")).toBeNull();
  });

  test("monthYear pads the month", () => {
    expect(monthYear(3, 2027)).toBe("03/2027");
    expect(monthYear(null, 2027)).toBe("");
  });
});

describe("numbers", () => {
  test("num parses or returns null", () => {
    expect(num("12.5")).toBe(12.5);
    expect(num("")).toBeNull();
    expect(num("abc")).toBeNull();
    expect(num(0)).toBe(0);
  });

  test("ordinal suffixes", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st",
    ]);
  });

  test("money formats GBP by default", () => {
    expect(money(8.99)).toMatch(/£\s?8\.99/);
    expect(money(10, "EUR")).toMatch(/€\s?10\.00/);
  });
});

test("bookId works for books, library items and editions", () => {
  expect(bookId({ book_id: "b1", id: "x" })).toBe("b1");
  expect(bookId({ bookRecord: { id: "b2" } })).toBe("b2");
  expect(bookId({ id: "b3" })).toBe("b3");
  expect(bookId(null)).toBeUndefined();
});
