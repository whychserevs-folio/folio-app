import { Text, TextInput, View } from "react-native";

import styles from "../styles";
import { C } from "../theme";
import LibraryBookshelf from "../Bookshelf";
import { useFolio } from "../state/FolioContext";

export default function LibraryScreen() {
  const {
    reorderLibrary,
    search,
    seriesByBook,
    setSearch,
    setSelectedBook,
    visibleItems,
  } = useFolio();
  return (
  <>
    <View style={styles.libraryActions}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your library"
          placeholderTextColor={C.faint}
          style={styles.searchInput}
        />
      </View>
    </View>

    <LibraryBookshelf
      items={visibleItems}
      onBookPress={setSelectedBook}
      seriesByBook={seriesByBook}
      // Only the full, unfiltered library has a complete order to save.
      onReorder={search.trim() ? undefined : reorderLibrary}
    />
  </>
  );
}
