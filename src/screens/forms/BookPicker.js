import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import styles from "../../styles";
import { C } from "../../theme";
import { AppButton, Cover } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

/*
 * Bottom-sheet book picker opened from a collection or series page
 * ("+ Add books"). Search your library, tap a book to add it (✓), tap
 * again to remove it. Books already in the list are shown first.
 */
export default function BookPicker({ kind }) {
  const {
    addBookToCollection,
    addBookToSeries,
    books,
    collectionBooks,
    editions,
    removeBookFromCollection,
    removeBookFromSeries,
    selectedCollection,
    selectedSeries,
    seriesBooks,
    setModal,
  } = useFolio();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  const isCollection = kind === "collection";
  const target = isCollection ? selectedCollection : selectedSeries;
  if (!target) return null;

  const links = (isCollection ? collectionBooks : seriesBooks).filter(r =>
    isCollection ? r.collection_id === target.id : r.series_id === target.id
  );
  const linkFor = bookId => links.find(r => r.book_id === bookId);

  const coverOf = book =>
    book.cover_url || editions.find(e => e.book_id === book.id && e.cover_url)?.cover_url || null;

  const q = query.trim().toLowerCase();
  const rows = books
    .filter(b => !q || `${b.title} ${b.author || ""}`.toLowerCase().includes(q))
    .sort((a, b) => {
      const ia = linkFor(a.id) ? 0 : 1;
      const ib = linkFor(b.id) ? 0 : 1;
      return ia - ib || String(a.title).localeCompare(String(b.title));
    });

  const toggle = async book => {
    const link = linkFor(book.id);
    setBusyId(book.id);
    try {
      if (link) {
        await (isCollection ? removeBookFromCollection(link) : removeBookFromSeries(link));
      } else {
        await (isCollection ? addBookToCollection(book.id, target.id) : addBookToSeries(book.id, target.id));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Text style={styles.modalTitle}>Add books</Text>
      <Text style={styles.modalIntro}>
        {target.name} · {links.length} {links.length === 1 ? "book" : "books"}
      </Text>

      <View style={[styles.searchBox, local.search]}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your library"
          placeholderTextColor={C.faint}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>

      {!books.length && <Text style={styles.mutedText}>Your library is empty.</Text>}
      {!!books.length && !rows.length && <Text style={styles.mutedText}>No books match “{query}”.</Text>}

      <View style={local.list}>
        {rows.map(book => {
          const added = !!linkFor(book.id);
          return (
            <Pressable
              key={book.id}
              onPress={() => toggle(book)}
              disabled={busyId === book.id}
              style={({ pressed }) => [local.row, added && local.rowAdded, pressed && local.rowPressed]}
            >
              <Cover uri={coverOf(book)} title={book.title} size="small" />
              <View style={{ flex: 1 }}>
                <Text style={local.title} numberOfLines={2}>{book.title}</Text>
                {!!book.author && <Text style={local.author} numberOfLines={1}>{book.author}</Text>}
              </View>
              <View style={[local.mark, added && local.markAdded]}>
                <Text style={[local.markText, added && local.markTextAdded]}>
                  {busyId === book.id ? "…" : added ? "✓" : "+"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppButton label="Done" onPress={() => setModal("")} />
    </>
  );
}

const local = StyleSheet.create({
  search: {
    marginBottom: 10,
  },
  list: {
    marginTop: 4,
    marginBottom: 14,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  rowAdded: {
    backgroundColor: "rgba(112,45,59,0.12)",
  },
  rowPressed: {
    opacity: 0.6,
  },
  title: {
    color: C.text,
    fontSize: 14,
  },
  author: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
  mark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  markAdded: {
    backgroundColor: C.goldDim,
    borderColor: C.goldDim,
  },
  markText: {
    color: C.muted,
    fontSize: 16,
  },
  markTextAdded: {
    color: C.text,
  },
});
