// Small formatting / parsing helpers (no React).
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const money = (value, currency = "GBP") =>
  Number(value || 0).toLocaleString("en-GB", {
    style: "currency",
    currency: currency || "GBP",
  });

export const displayDate = value => {
  if (!value) return "";
  const parts = String(value).slice(0, 10).split("-");
  return parts.length === 3
    ? `${parts[2]}/${parts[1]}/${parts[0]}`
    : String(value);
};

export const isoDate = value => {
  if (!value) return null;
  const v = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const match = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, d, m, y] = match;
  const day = Number(d);
  const month = Number(m);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

export const monthYear = (month, year) =>
  month && year
    ? `${String(month).padStart(2, "0")}/${year}`
    : "";

export const num = value => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const bookId = item => item?.book_id || item?.bookRecord?.id || item?.id;

export const ordinal = (n) => {
  const num = Number(n);

  if (!num) return "";

  const mod10 = num % 10;
  const mod100 = num % 100;

  if (mod10 === 1 && mod100 !== 11) return `${num}st`;
  if (mod10 === 2 && mod100 !== 12) return `${num}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${num}rd`;

  return `${num}th`;
};
