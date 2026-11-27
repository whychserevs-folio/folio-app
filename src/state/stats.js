import { money } from "../utils/format";

const fmt = e => String(e.format || "").toLowerCase();
const isHardback = e => fmt(e) === "hardback";
const isPaperback = e => fmt(e) === "paperback";
const isAudio = e => ["audio", "audiobook"].some(v => fmt(e).includes(v));
const isEbook = e => ["ebook", "e-book", "kindle", "digital"].some(v => fmt(e).includes(v));
const isSpecial = e => !!e.signed || !!e.special_features;
const isActive = s => String(s.status || "").toLowerCase() === "active";

// Numbers for the Stats tab and pre-order totals, derived from loaded data.
// Each card says what it counts and, where it makes sense, which records, so
// the Stats screen can list them when the card is tapped.
export function computeStats(deps) {
  const {
    books,
    dnfIds,
    editions,
    physicalCopies = [],
    preorders,
    subscriptions,
    tbrIds,
  } = deps;

  const outstandingPreorders = preorders.filter(
    p => !["received", "cancelled"].includes(String(p.status).toLowerCase())
  );

  const totalPreorderSpend = outstandingPreorders.reduce(
    (total, p) => total + Number(p.price || 0) + Number(p.shipping_cost || 0),
    0
  );

  const activeSubscriptions = subscriptions.filter(isActive);
  const monthlySubscriptionSpend = activeSubscriptions.reduce(
    (total, s) => total + Number(s.price || 0),
    0
  );

  // physical copies per edition
  const copiesByEdition = new Map();
  physicalCopies.forEach(c =>
    copiesByEdition.set(c.edition_id, (copiesByEdition.get(c.edition_id) || 0) + 1)
  );
  const copiesOf = list =>
    list.reduce((n, e) => n + (copiesByEdition.get(e.id) || 0), 0);

  const editionCard = (key, label, list) => ({
    key,
    label,
    value: list.length,
    kind: "editions",
    items: list,
    copies: copiesOf(list),
  });

  const tbrSet = new Set(tbrIds);
  const dnfSet = new Set(dnfIds);

  const statCards = [
    editionCard("all", "Total Books", editions),
    { key: "titles", label: "Unique Titles", value: books.length, kind: "books", items: books },
    { key: "tbr", label: "Books On TBR", value: tbrIds.length, kind: "books", items: books.filter(b => tbrSet.has(b.id)) },
    { key: "dnf", label: "Books DNF'd", value: dnfIds.length, kind: "books", items: books.filter(b => dnfSet.has(b.id)) },
    { key: "preorders", label: "Total Preorders", value: outstandingPreorders.length, kind: "preorders", items: outstandingPreorders },
    { key: "preorderSpend", label: "Preorder Spend", value: money(totalPreorderSpend) },
    { key: "subscriptions", label: "Total Subscriptions", value: activeSubscriptions.length, kind: "subscriptions", items: activeSubscriptions },
    { key: "subscriptionSpend", label: "Subscription Spend", value: money(monthlySubscriptionSpend) },
    editionCard("special", "Special Editions", editions.filter(isSpecial)),
    editionCard("hardback", "Hardbacks", editions.filter(isHardback)),
    editionCard("paperback", "Paperbacks", editions.filter(isPaperback)),
    editionCard("audioEbook", "Audio / Ebooks", editions.filter(e => isAudio(e) || isEbook(e))),
  ];

  // kept for anything still reading the simple [label, value] list
  const stats = statCards.map(c => [c.label, c.value]);

  return { outstandingPreorders, totalPreorderSpend, stats, statCards };
}
