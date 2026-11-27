import { money } from "../utils/format";

// Numbers for the Stats tab and pre-order totals, derived from loaded data.
export function computeStats(deps) {
  const {
    books,
    dnfIds,
    editions,
    preorders,
    subscriptions,
    tbrIds,
  } = deps;
  const outstandingPreorders = preorders.filter(
    p => !["received", "cancelled"].includes(String(p.status).toLowerCase())
  );

  const totalPreorderSpend = outstandingPreorders.reduce(
    (total, p) =>
      total + Number(p.price || 0) + Number(p.shipping_cost || 0),
    0
  );

  const hardbacks = editions.filter(
    e => String(e.format || "").toLowerCase() === "hardback"
  ).length;

  const paperbacks = editions.filter(
    e => String(e.format || "").toLowerCase() === "paperback"
  ).length;

  const audio = editions.filter(e =>
    ["audio", "audiobook"].some(v =>
      String(e.format || "").toLowerCase().includes(v)
    )
  ).length;

  const ebooks = editions.filter(e =>
    ["ebook", "e-book", "kindle", "digital"].some(v =>
      String(e.format || "").toLowerCase().includes(v)
    )
  ).length;

  const specialEditions = editions.filter(
    e => !!e.signed || !!e.special_features
  ).length;

  const totalBooks = editions.length;

  const totalUniqueTitles = books.length;

  const totalSubscriptions = subscriptions.filter(
    s => String(s.status || "").toLowerCase() === "active"
  ).length;

  const monthlySubscriptionSpend = subscriptions
    .filter(
      s => String(s.status || "").toLowerCase() === "active"
    )
    .reduce(
      (total, s) => total + Number(s.price || 0),
      0
    );

  const totalAudioEbooks = audio + ebooks;

  const stats = [
    ["Total Books", totalBooks],
    ["Unique Titles", totalUniqueTitles],
    ["Books On TBR", tbrIds.length],
    ["Books DNF'd", dnfIds.length],
    ["Total Preorders", outstandingPreorders.length],
    ["Preorder Spend", money(totalPreorderSpend)],
    ["Total Subscriptions", totalSubscriptions],
    ["Subscription Spend", money(monthlySubscriptionSpend)],
    ["Special Editions", specialEditions],
    ["Hardbacks", hardbacks],
    ["Paperbacks", paperbacks],
    ["Audio / Ebooks", totalAudioEbooks],
  ];

  return { outstandingPreorders, totalPreorderSpend, stats };
}
