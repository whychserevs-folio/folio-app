import { Pressable, Text, View } from "react-native";

import styles from "../../styles";
import { useFolio } from "../../state/FolioContext";

export default function ExistingSeriesForm() {
  const {
    addExistingSeriesToUniverse,
    selectedUniverse,
    series,
  } = useFolio();
    const availableSeries = series
      .filter(s => s.universe_id !== selectedUniverse?.id)
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );

    return (
      <>
        <Text style={styles.modalTitle}>Add existing series</Text>
        <Text style={styles.modalIntro}>
          Choose a series that already exists in Folio to add it to{" "}
          {selectedUniverse?.name || "this universe"}.
        </Text>
        {availableSeries.length ? (
          availableSeries.map(item => (
            <Pressable
              key={item.id}
              style={styles.selectCard}
              onPress={() => addExistingSeriesToUniverse(item.id)}
            >
              <Text style={styles.selectCardTitle}>{item.name}</Text>
              {!!item.description && (
                <Text style={styles.mutedText}>{item.description}</Text>
              )}
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No other series available</Text>
            <Text style={styles.emptyText}>
              Create a new series or move one here from another universe.
            </Text>
          </View>
        )}
      </>
    );
}
