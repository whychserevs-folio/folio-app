import { Text, TextInput, View } from "react-native";

import styles from "../styles";
import { C } from "../theme";
import { Heading } from "../components/ui";
import LibraryBookshelf from "../Bookshelf";
import { useFolio } from "../state/FolioContext";

export default function ReadingListScreen() {
  const {
    search,
    seriesByBook,
    setSearch,
    setSelectedBook,
    tab,
    visibleItems,
  } = useFolio();
  return (
  <>
    <Heading
      kicker="READING JOURNAL"
      title={tab === "TBR" ? "To Be Read" : "Did Not Finish"}
      subtitle={
        tab === "TBR"
          ? "Your next stories, waiting patiently."
          : "Books you've set aside. Your library remains untouched."
      }
    />
    <View style={styles.searchBox}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search titles..."
        placeholderTextColor={C.faint}
        style={styles.searchInput}
      />
    </View>
    <LibraryBookshelf
      items={visibleItems}
      onBookPress={setSelectedBook}
      seriesByBook={seriesByBook}
    />
  </>
  );
}
