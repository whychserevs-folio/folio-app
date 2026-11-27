import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import styles from "../../styles";
import { C } from "../../theme";
import { AppButton } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

/*
 * Bottom-sheet picker opened from a book's page: "+ Collection" or
 * "+ Series". Search, then tap a row to add the book (tap again to remove).
 * Keeps the book page short no matter how many collections/series exist.
 */
export default function MembershipPicker({ kind }) {
  const {
    addBookToCollection,
    addBookToSeries,
    collectionBooks,
    collections,
    currentBook,
    removeBookFromCollection,
    removeBookFromSeries,
    series,
    seriesBooks,
    setModal,
    setSeriesForm,
  } = useFolio();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  if (!currentBook) return null;

  const isCollection = kind === "collection";
  const lists = isCollection ? collections : series;
  const links = isCollection ? collectionBooks : seriesBooks;
  const linkKey = isCollection ? "collection_id" : "series_id";

  const q = query.trim().toLowerCase();
  const rows = [...lists]
    .filter(l => !q || String(l.name || "").toLowerCase().includes(q))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const toggle = async list => {
    const link = links.find(r => r[linkKey] === list.id && r.book_id === currentBook.id);
    setBusyId(list.id);
    try {
      if (link) {
        await (isCollection ? removeBookFromCollection(link) : removeBookFromSeries(link));
      } else {
        await (isCollection
          ? addBookToCollection(currentBook.id, list.id)
          : addBookToSeries(currentBook.id, list.id));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Text style={styles.modalTitle}>
        {isCollection ? "Add to a collection" : "Add to a series"}
      </Text>
      <Text style={styles.modalIntro}>{currentBook.title}</Text>

      {lists.length > 6 && (
        <View style={[styles.searchBox, local.search]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={isCollection ? "Search collections" : "Search series"}
            placeholderTextColor={C.faint}
            style={styles.searchInput}
            autoCorrect={false}
          />
        </View>
      )}

      {!lists.length && (
        <Text style={styles.mutedText}>
          {isCollection ? "You haven't made any collections yet." : "You haven't made any series yet."}
        </Text>
      )}
      {!!lists.length && !rows.length && <Text style={styles.mutedText}>No matches.</Text>}

      <View style={local.list}>
        {rows.map(list => {
          const added = links.some(r => r[linkKey] === list.id && r.book_id === currentBook.id);
          const count = links.filter(r => r[linkKey] === list.id).length;
          return (
            <Pressable
              key={list.id}
              onPress={() => toggle(list)}
              disabled={busyId === list.id}
              style={({ pressed }) => [local.row, added && local.rowAdded, pressed && local.rowPressed]}
            >
              <View style={{ flex: 1 }}>
                <Text style={local.name} numberOfLines={1}>{list.name}</Text>
                <Text style={local.count}>
                  {count} {count === 1 ? "book" : "books"}
                </Text>
              </View>
              <View style={[local.mark, added && local.markAdded]}>
                <Text style={[local.markText, added && local.markTextAdded]}>
                  {busyId === list.id ? "…" : added ? "✓" : "+"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppButton
        label={isCollection ? "+ New collection" : "+ New series"}
        secondary
        onPress={() => {
          if (isCollection) {
            setModal("collection");
          } else {
            setSeriesForm({ name: "", description: "", universe_id: "" });
            setModal("series");
          }
        }}
      />
      <AppButton label="Done" onPress={() => setModal("")} />
    </>
  );
}

const local = StyleSheet.create({
  search: {
    marginBottom: 10,
  },
  list: {
    marginTop: 6,
    marginBottom: 14,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: C.line,
    gap: 12,
  },
  rowAdded: {
    backgroundColor: "rgba(112,45,59,0.12)",
  },
  rowPressed: {
    opacity: 0.6,
  },
  name: {
    color: C.text,
    fontSize: 15,
  },
  count: {
    color: C.muted,
    fontSize: 11,
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
