import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "../supabase";
import styles from "../styles";
import { C } from "../theme";
import { AppButton, Cover } from "../components/ui";
import { useFolio } from "../state/FolioContext";

export default function BookDetailScreen() {
  const {
    addAnotherEdition,
    addPhysicalCopy,
    collectionBooks,
    collections,
    currentBook,
    dnfIds,
    editions,
    loadData,
    openEditBook,
    physicalCopies,
    removeBookFromCollection,
    removeBookFromSeries,
    selectedBook,
    series,
    seriesBooks,
    setModal,
    setSelectedBook,
    tbrIds,
    toggleList,
  } = useFolio();
  if (!currentBook) return null;

  const bookEditions = editions.filter(e => e.book_id === currentBook.id);
  const inTbr = tbrIds.includes(currentBook.id);
  const inDnf = dnfIds.includes(currentBook.id);

  return (
    <View>
      <AppButton
        label="← Back to library"
        secondary
        compact
        onPress={() => setSelectedBook(null)}
      />

      <View style={styles.detailHero}>
        <Cover
          uri={
            selectedBook.editionRecord?.cover_url ||
            currentBook.cover_url
          }
          title={currentBook.title}
          size="large"
        />

        <View style={styles.detailHeroText}>
          <Text style={styles.detailKicker}>BOOK DETAILS</Text>
          <Text style={styles.detailTitle}>{currentBook.title}</Text>
          <Text style={styles.detailAuthor}>
            {currentBook.author || "Author not recorded"}
          </Text>
          {!!currentBook.genre && (
            <Text style={styles.detailGenre}>{currentBook.genre}</Text>
          )}
        </View>
      </View>

      {!!currentBook.description && (
        <Text style={styles.detailDescription}>
          {currentBook.description}
        </Text>
      )}

      <View style={styles.detailActions}>
        <AppButton
          label={inTbr ? "Remove from TBR" : "Add to TBR"}
          secondary
          compact
          onPress={() => toggleList(currentBook.id, "TBR")}
        />
        <AppButton
          label={inDnf ? "Remove from DNF" : "Mark as DNF"}
          secondary
          compact
          onPress={() => toggleList(currentBook.id, "DNF")}
        />
        <AppButton
          label="Edit book"
          compact
          onPress={() => openEditBook(selectedBook)}
        />
        <AppButton
  label="Delete Book"
  compact
  danger
  onPress={async () => {
    Alert.alert(
      "Delete Book",
      "Are you sure you want to delete this book?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("books")
              .delete()
              .eq("id", currentBook.id);

            setSelectedBook(null);
            await loadData(["books"]);
          },
        },
      ]
    );
  }}
/>
      </View>

      <View style={styles.sectionDivider} />
      <View style={styles.sectionTitleRow}>
        <View>
          <Text style={styles.sectionKicker}>THE COLLECTION</Text>
          <Text style={styles.sectionTitle}>Editions & copies</Text>
        </View>
        <AppButton
          label="+ Add edition"
          compact
          onPress={addAnotherEdition}
        />
      </View>

      {bookEditions.length === 0 && (
        <Text style={styles.mutedText}>
          No editions have been recorded for this title yet.
        </Text>
      )}

      {bookEditions.map(edition => {
        const copies = physicalCopies.filter(
          copy => copy.edition_id === edition.id
        );

        return (
          <View key={edition.id} style={styles.editionPanel}>
            <View style={styles.editionTop}>
              <Cover
                uri={edition.cover_url || currentBook.cover_url}
                title={currentBook.title}
                size="small"
              />

              <View style={styles.editionText}>
                <Text style={styles.editionName}>
                  {edition.format || "Edition"}
                </Text>
                <Text style={styles.mutedText}>
                  {edition.format || "Format not specified"}
                </Text>
                {!!edition.publisher && (
                  <Text style={styles.mutedText}>{edition.publisher}</Text>
                )}
                {!!edition.publication_date && (
                  <Text style={styles.mutedText}>
                    Published {edition.publication_date.slice(0, 4)}
                  </Text>
                )}
                {!!edition.isbn && (
                  <Text style={styles.mutedText}>ISBN {edition.isbn}</Text>
                )}
                {!!edition.signed && (
                  <Text style={styles.goldSmall}>SIGNED EDITION</Text>
                )}
                {!!edition.special_features && (
                  <Text style={styles.goldSmall}>
                    {edition.special_features}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.editionActions}>
              <AppButton
                label="Edit edition"
                compact
                secondary
                onPress={() => openEditBook({
                  ...currentBook,
                  book_id: currentBook.id,
                  editionRecord: edition,
                })}
              />
              <AppButton
                label="+ Physical copy"
                compact
                onPress={() => addPhysicalCopy(edition)}
              />
            </View>

            <View style={styles.copyList}>
              <Text style={styles.copyListHeading}>
                PHYSICAL COPIES · {copies.length}
              </Text>

              {copies.length === 0 && (
                <Text style={styles.mutedText}>No physical copies recorded.</Text>
              )}

              {copies.map((copy, index) => (
                <View key={copy.id} style={styles.copyRow}>
                  <View style={styles.copyNumber}>
                    <Text style={styles.copyNumberText}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.copyCondition}>
                      {copy.condition || "Condition not recorded"}
                      {copy.signed ? " · Signed" : ""}
                    </Text>
                    {!!copy.notes && (
                      <Text style={styles.mutedText}>{copy.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Collections & series</Text>

      {/* What this book is in, as chips (tap × to remove) */}
      {(() => {
        const inCollections = collectionBooks
          .filter(row => row.book_id === currentBook.id)
          .map(row => ({ row, kind: "collection", name: collections.find(c => c.id === row.collection_id)?.name }))
          .filter(x => x.name);
        const inSeries = seriesBooks
          .filter(row => row.book_id === currentBook.id)
          .map(row => {
            const s = series.find(x => x.id === row.series_id);
            const order = Number(row.reading_order);
            return { row, kind: "series", name: s?.name, order: order > 0 ? order : null };
          })
          .filter(x => x.name);
        const memberships = [...inSeries, ...inCollections];

        return memberships.length ? (
          <View style={local.chips}>
            {memberships.map(m => (
              <View key={m.row.id} style={local.chip}>
                <Text style={local.chipKind}>{m.kind === "series" ? "SERIES" : "COLLECTION"}</Text>
                <Text style={local.chipName} numberOfLines={1}>
                  {m.name}
                  {m.order ? ` · #${m.order}` : ""}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    m.kind === "series" ? removeBookFromSeries(m.row) : removeBookFromCollection(m.row)
                  }
                  accessibilityLabel={`Remove from ${m.name}`}
                >
                  <Text style={local.chipRemove}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.mutedText, { marginBottom: 12 }]}>
            Not in any collection or series yet.
          </Text>
        );
      })()}

      <View style={local.addRow}>
        <AppButton label="+ Collection" compact secondary onPress={() => setModal("addToCollection")} />
        <AppButton label="+ Series" compact secondary onPress={() => setModal("addToSeries")} />
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 7,
  },
  chipKind: {
    color: C.goldDim,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  chipName: {
    flexShrink: 1,
    color: C.text,
    fontSize: 13,
  },
  chipRemove: {
    color: C.muted,
    fontSize: 16,
    lineHeight: 18,
  },
  addRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
});
