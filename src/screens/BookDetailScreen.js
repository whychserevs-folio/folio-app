import { Alert, Text, View } from "react-native";

import { supabase } from "../supabase";
import styles from "../styles";
import { AppButton, Cover } from "../components/ui";
import { useFolio } from "../state/FolioContext";

export default function BookDetailScreen() {
  const {
    addAnotherEdition,
    addBookToCollection,
    addBookToSeries,
    addPhysicalCopy,
    collectionBooks,
    collections,
    currentBook,
    dnfIds,
    editions,
    loadData,
    openEditBook,
    physicalCopies,
    selectedBook,
    series,
    seriesBooks,
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
            await loadData();
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
      <Text style={styles.sectionTitle}>Add to collections</Text>

      {collections.map(collection => {
        const alreadyAdded = collectionBooks.some(
          row =>
            row.collection_id === collection.id &&
            row.book_id === currentBook.id
        );

        return (
          <View key={collection.id} style={styles.collectionAddRow}>
            <Text style={styles.bodyText}>{collection.name}</Text>
            <AppButton
              label={alreadyAdded ? "Added" : "Add"}
              compact
              secondary
              disabled={alreadyAdded}
              onPress={() =>
                addBookToCollection(currentBook.id, collection.id)
              }
            />
          </View>
        );
      })}

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Series</Text>

      {series.map(s => {
        const alreadyAdded = seriesBooks.some(
          row => row.series_id === s.id && row.book_id === currentBook.id
        );

        return (
          <View key={s.id} style={styles.collectionAddRow}>
            <Text style={styles.bodyText}>{s.name}</Text>
            <AppButton
              label={alreadyAdded ? "Added" : "Add"}
              compact
              secondary
              disabled={alreadyAdded}
              onPress={() => addBookToSeries(currentBook.id, s.id)}
            />
          </View>
        );
      })}
    </View>
  );
}
