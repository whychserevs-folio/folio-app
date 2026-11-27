import { Text, View } from "react-native";

import styles from "../../styles";
import { AppButton, Chip, Field } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function SeriesForm() {
  const {
    createSeries,
    seriesForm,
    setModal,
    setSeriesForm,
    universes,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>{seriesForm.id ? "Edit series" : "New series"}</Text>
        <Field
          label="Series name"
          value={seriesForm.name}
          onChangeText={v => setSeriesForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={seriesForm.description}
          onChangeText={v => setSeriesForm(p => ({ ...p, description: v }))}
          multiline
        />
        <Text style={styles.fieldLabel}>
          Add to Existing Universe
        </Text>


        <View style={styles.chipRow}>
          {universes.map(u => (
            <Chip
              key={u.id}
              label={u.name}
              selected={seriesForm.universe_id === u.id}
              onPress={() =>
                setSeriesForm(p => ({
                  ...p,
                  universe_id: u.id,
                }))
              }
            />
          ))}
        </View>

        <AppButton
          label="Create New Universe"
          onPress={() => setModal("universe")}
        />

        <AppButton label={seriesForm.id ? "Save changes" : "Create series"} onPress={createSeries} />
      </>
    );
}
