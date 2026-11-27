import { Alert, Image, Pressable, Text, View } from "react-native";

import styles from "../styles";
import { AppButton, Heading } from "../components/ui";
import LibraryBookshelf from "../Bookshelf";
import { useFolio } from "../state/FolioContext";

export default function CollectionsScreen() {
  const {
    addBookToCollection,
    books,
    collectionBooks,
    editions,
    moveSeriesBook,
    removeBookFromCollection,
    removeBookFromSeries,
    selectedCollection,
    selectedSeries,
    selectedUniverse,
    series,
    seriesBooks,
    seriesByBook,
    setModal,
    setSelectedBook,
    setSelectedCollection,
    setSelectedSeries,
    setSelectedUniverse,
    setSeriesForm,
    universes,
  } = useFolio();
  if (selectedSeries) {
    const links = seriesBooks
      .filter(row => row.series_id === selectedSeries.id)
      .sort(
        (a, b) =>
          Number(a.reading_order || 999) -
          Number(b.reading_order || 999)
      );

    return (
      <>
        <AppButton
          label="← All collections"
          compact
          secondary
          onPress={() => setSelectedSeries(null)}
        />
        <Heading
          kicker="SERIES"
          title={selectedSeries.name}
          subtitle="Arrange the books in your preferred reading order."
        />

        {links.map((link, index) => {
          const book = books.find(b => b.id === link.book_id);
          const bookEditions = editions.filter(
  e => e.book_id === book.id
);
          if (!book) return null;

          return (
            <View key={link.id} style={styles.seriesBookRow}>
              <View style={styles.seriesOrder}>
                <Text style={styles.seriesOrderText}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>
              <Pressable
                style={styles.seriesBookInfo}
                onPress={() => setSelectedBook(book)}
              >
                <View style={{ flex: 1 }}>
  <Text style={styles.cardTitle}>
    {book.title}
  </Text>

  <Text style={styles.mutedText}>
    {book.author}
  </Text>

  {bookEditions.map(edition => (
    <View
      key={edition.id}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <Image
        source={{
          uri: edition.cover_url || book.cover_url,
        }}
        style={{
          width: 45,
          height: 65,
          borderRadius: 4,
          marginRight: 10,
        }}
      />

      <View>
        <Text
          style={{
            color: "#F0EBE7",
            fontSize: 12,
          }}
        >
          {edition.format}
        </Text>

        {!!edition.signed && (
          <Text
            style={{
              color: "#A39B9B",
              fontSize: 10,
            }}
          >
            Signed Edition
          </Text>
        )}

        {!!edition.edition_name && (
          <Text
            style={{
              color: "#A39B9B",
              fontSize: 10,
            }}
          >
            {edition.edition_name}
          </Text>
        )}
      </View>
    </View>
  ))}
                </View>
              </Pressable>
              <View style={styles.seriesMoveButtons}>
                <AppButton
                  label="↑"
                  compact
                  secondary
                  disabled={index === 0}
                  onPress={() => moveSeriesBook(link, -1)}
                />
                <AppButton
                  label="↓"
                  compact
                  secondary
                  disabled={index === links.length - 1}
                  onPress={() => moveSeriesBook(link, 1)}
                />
                <AppButton
                  label="×"
                  compact
                  danger
                  onPress={() => removeBookFromSeries(link)}
                />
              </View>
            </View>
          );
        })}
       <AppButton
  label="+ Add Book To Series"
  compact
  onPress={() =>
    Alert.alert(
      "Coming Soon",
      "Book search for series is coming next."
    )
  }
/>
      </>
    );
  }

  if (selectedCollection) {
    const links = collectionBooks.filter(
      row => row.collection_id === selectedCollection.id
    );

    const items = links
      .map(link => {
        const book = books.find(b => b.id === link.book_id);
        if (!book) return [];
        const bookEditions = editions.filter(e => e.book_id === book.id);

        if (!bookEditions.length) return [book];

        return bookEditions.map(edition => ({
          ...book,
          book_id: book.id,
          editionRecord: edition,
          cover_url: edition.cover_url || book.cover_url,
        }));
      })
      .flat();

    return (
      <>
        <AppButton
          label="← All collections"
          compact
          secondary
          onPress={() => setSelectedCollection(null)}
        />
        <Heading
          kicker="CURATED COLLECTION"
          title={selectedCollection.name}
          subtitle={selectedCollection.description}
        />

        <LibraryBookshelf
          items={items}
          onBookPress={setSelectedBook}
          seriesByBook={seriesByBook}
        />
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Add books</Text>

        {books
          .filter(book => !links.some(link => link.book_id === book.id))
          .map(book => (
            <Pressable
              key={book.id}
              style={styles.simpleAddRow}
              onPress={() =>
                addBookToCollection(book.id, selectedCollection.id)
              }
            >
              <Text style={styles.goldSmall}>＋</Text>
              <Text style={styles.bodyText}>{book.title}</Text>
            </Pressable>
          ))}

        <Text style={styles.sectionTitle}>Books in this collection</Text>
        {links.map(link => {
          const book = books.find(b => b.id === link.book_id);
          if (!book) return null;

          return (
            <View key={link.id} style={styles.collectionAddRow}>
              <Text style={styles.bodyText}>{book.title}</Text>
              <AppButton
                label="Remove"
                compact
                danger
                onPress={() => removeBookFromCollection(link)}
              />
            </View>
          );
        })}
      </>
    );
  }

  if (selectedUniverse) {
    const universeSeries = series.filter(
      s => s.universe_id === selectedUniverse.id
    );

    return (
      <>
        <AppButton
          label="← All collections"
          compact
          secondary
          onPress={() => setSelectedUniverse(null)}
        />
        <Heading
          kicker="UNIVERSE"
          title={selectedUniverse.name}
          subtitle={selectedUniverse.description}
        />

        {universeSeries.map(s => (
          <Pressable
            key={s.id}
            style={styles.featureCard}
            onPress={() => setSelectedSeries(s)}
          >
            <Text style={styles.featureCardKicker}>SERIES</Text>
            <Text style={styles.featureCardTitle}>{s.name}</Text>
            <Text style={styles.mutedText}>
              {seriesBooks.filter(row => row.series_id === s.id).length} books
            </Text>
            <Text style={styles.featureArrow}>↗</Text>
          </Pressable>
        ))}

        <View style={styles.collectionActions}>
          <AppButton
            label="+ Add existing series"
            secondary
            onPress={() => setModal("existingSeries")}
          />
          <AppButton
            label="+ New series"
            onPress={() => {
              setSeriesForm({
                name: "",
                description: "",
                universe_id: selectedUniverse.id,
              });
              setModal("series");
            }}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Heading
        kicker="READING WORLDS"
        title="Universes & Series"
        subtitle="Explore connected books, universes, and reading order."
      />

      <View style={styles.detailActions}>

        <AppButton
          label="+ Universe"
          compact
          secondary
          onPress={() => setModal("universe")}
        />

        <AppButton
          label="+ Series"
          compact
          secondary
          onPress={() => {
            setSeriesForm({
              name: "",
              description: "",
              universe_id: "",
            });
            setModal("series");
          }}
        />
      </View>

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionKicker}>
        UNIVERSES
      </Text>
      <Text style={styles.sectionTitle}>Universes</Text>

      {universes.map(universe => (
        <Pressable
          key={universe.id}
          style={styles.featureCard}
          onPress={() => setSelectedUniverse(universe)}
        >
          <Text style={styles.featureCardKicker}>UNIVERSE</Text>
          <Text style={styles.featureCardTitle}>{universe.name}</Text>
          <Text style={styles.mutedText}>
            {series.filter(
              s => s.universe_id === universe.id
            ).length} series
          </Text>

          <View style={{ marginTop: 12 }}>
            {series
              .filter(s => s.universe_id === universe.id)
              .slice(0, 4)
              .map(s => (
                <Text
                  key={s.id}
                  style={styles.goldSmall}
                >
                  • {s.name}
                </Text>
              ))}
          </View>
          <Text style={styles.featureArrow}>↗</Text>
        </Pressable>
      ))}

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionKicker}>
        SERIES
      </Text>
      <Text style={styles.sectionTitle}>series</Text>

      {series
        .filter(s => !s.universe_id)
        .map(s => (
          <Pressable
            key={s.id}
            style={styles.featureCard}
            onPress={() => setSelectedSeries(s)}
          >
            <Text style={styles.featureCardKicker}>SERIES</Text>
            <Text style={styles.featureCardTitle}>{s.name}</Text>
            <Text style={styles.mutedText}>
              {seriesBooks.filter(row => row.series_id === s.id).length} books
            </Text>
            <Text style={styles.featureArrow}>↗</Text>
          </Pressable>
        ))}
    </>
  );
}
