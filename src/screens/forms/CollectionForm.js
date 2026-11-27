import { Text } from "react-native";

import styles from "../../styles";
import { AppButton, Field } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function CollectionForm() {
  const {
    addCollection,
    collectionForm,
    setCollectionForm,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>{collectionForm.id ? "Edit collection" : "New collection"}</Text>
        <Field
          label="Collection name"
          value={collectionForm.name}
          onChangeText={v => setCollectionForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={collectionForm.description}
          onChangeText={v =>
            setCollectionForm(p => ({ ...p, description: v }))
          }
          multiline
        />
        <AppButton label={collectionForm.id ? "Save changes" : "Create collection"} onPress={addCollection} />
      </>
    );
}
