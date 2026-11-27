import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import styles from "../styles";
import { C } from "../theme";
import { money } from "../utils/format";
import { Cover, Heading } from "../components/ui";
import { useFolio } from "../state/FolioContext";

// Remember the open card while a book from the list is being viewed, so
// "Back" returns to the same list.
let lastOpenKey = null;

// Tap a card to list what it counts (e.g. which editions are Hardbacks);
// tap a book in the list to open it.
export default function StatsScreen() {
  const {
    books,
    editions,
    physicalCopies,
    setSelectedBook,
    setSelectedPreorder,
    setSelectedSubscription,
    setTab,
    statCards,
  } = useFolio();
  const [openKey, setOpenKeyState] = useState(lastOpenKey);
  const setOpenKey = key => {
    lastOpenKey = key;
    setOpenKeyState(key);
  };
  const open = statCards.find(c => c.key === openKey && c.items);

  const bookById = useMemo(() => new Map(books.map(b => [b.id, b])), [books]);
  const copiesByEdition = useMemo(() => {
    const m = new Map();
    physicalCopies.forEach(c => m.set(c.edition_id, (m.get(c.edition_id) || 0) + 1));
    return m;
  }, [physicalCopies]);

  // Library item shape that BookDetailScreen expects
  const openBook = (book, edition) => {
    if (!book) return;
    const ed = edition || editions.find(e => e.book_id === book.id) || null;
    setSelectedBook({
      ...book,
      book_id: book.id,
      bookRecord: book,
      ...(ed ? { id: `${book.id}-${ed.id}`, editionRecord: ed } : {}),
    });
  };

  const rows = !open
    ? []
    : open.kind === "editions"
    ? open.items
        .map(ed => ({ ed, book: bookById.get(ed.book_id) }))
        .filter(r => r.book)
        .sort((a, b) => a.book.title.localeCompare(b.book.title))
        .map(({ ed, book }) => ({
          key: ed.id,
          cover: ed.cover_url || book.cover_url,
          title: book.title,
          line1: book.author,
          line2: [ed.format, ed.edition_name, ed.signed ? "Signed" : null].filter(Boolean).join(" · "),
          badge: `${copiesByEdition.get(ed.id) || 0} ${copiesByEdition.get(ed.id) === 1 ? "copy" : "copies"}`,
          onPress: () => openBook(book, ed),
        }))
    : open.kind === "books"
    ? [...open.items]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(book => ({
          key: book.id,
          cover: book.cover_url,
          title: book.title,
          line1: book.author,
          onPress: () => openBook(book),
        }))
    : open.kind === "preorders"
    ? open.items.map(p => ({
        key: p.id,
        cover: p.cover_url,
        title: p.title,
        line1: p.author,
        line2: [p.retailer, p.status].filter(Boolean).join(" · "),
        badge: p.price ? money(p.price, p.currency) : null,
        onPress: () => setSelectedPreorder(p),
      }))
    : open.items.map(s => ({
        key: s.id,
        title: s.name,
        line1: [s.frequency, s.status].filter(Boolean).join(" · "),
        badge: money(s.price, s.currency),
        onPress: () => {
          setTab("Subscriptions");
          setSelectedSubscription(s);
        },
      }));

  return (
    <>
      <Heading
        kicker="YOUR COLLECTION"
        title="Collection Statistics"
        subtitle="Tap a number to see what it includes."
      />

      <View style={styles.statsGrid}>
        {statCards.map((card, index) => {
          const tappable = !!card.items;
          const active = card.key === openKey;
          return (
            <Pressable
              key={card.key}
              disabled={!tappable}
              onPress={() => setOpenKey(active ? null : card.key)}
              style={[styles.statCard, active && local.cardActive]}
            >
              <Text style={styles.statIndex}>{String(index + 1).padStart(2, "0")}</Text>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
              {card.kind === "editions" && (
                <Text style={local.copies}>
                  {card.copies} physical {card.copies === 1 ? "copy" : "copies"}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {open && (
        <View style={local.list}>
          <View style={local.listHeader}>
            <Text style={styles.sectionTitle}>
              {open.label} · {open.value}
              {open.kind === "editions" ? ` editions, ${open.copies} copies` : ""}
            </Text>
            <Pressable onPress={() => setOpenKey(null)} hitSlop={10}>
              <Text style={local.close}>Close ×</Text>
            </Pressable>
          </View>

          {!rows.length && <Text style={styles.mutedText}>Nothing here yet.</Text>}

          {rows.map(r => (
            <Pressable key={r.key} onPress={r.onPress} style={local.row}>
              {r.cover !== undefined && <Cover uri={r.cover} title={r.title} size="small" />}
              <View style={{ flex: 1 }}>
                <Text style={local.title} numberOfLines={2}>{r.title}</Text>
                {!!r.line1 && <Text style={styles.mutedText} numberOfLines={1}>{r.line1}</Text>}
                {!!r.line2 && <Text style={local.meta} numberOfLines={1}>{r.line2}</Text>}
              </View>
              {!!r.badge && <Text style={local.badge}>{r.badge}</Text>}
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const local = StyleSheet.create({
  cardActive: {
    borderColor: C.goldDim,
    backgroundColor: C.surface3,
  },
  copies: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  list: {
    marginTop: 18,
    borderTopWidth: 1,
    borderColor: C.line,
    paddingTop: 12,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  close: {
    color: C.muted,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  title: {
    color: C.text,
    fontSize: 14,
    marginBottom: 2,
  },
  meta: {
    color: C.goldDim,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    color: C.muted,
    fontSize: 11,
  },
});
