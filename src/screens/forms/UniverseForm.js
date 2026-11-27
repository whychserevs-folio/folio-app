import { Text } from "react-native";

import styles from "../../styles";
import { AppButton, Field } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function UniverseForm() {
  const {
    addUniverse,
    setUniverseForm,
    universeForm,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>{universeForm.id ? "Edit universe" : "New universe"}</Text>
        <Field
          label="Universe name"
          value={universeForm.name}
          onChangeText={v => setUniverseForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={universeForm.description}
          onChangeText={v => setUniverseForm(p => ({ ...p, description: v }))}
          multiline
        />
        <AppButton label={universeForm.id ? "Save changes" : "Create universe"} onPress={addUniverse} />
      </>
    );
}
