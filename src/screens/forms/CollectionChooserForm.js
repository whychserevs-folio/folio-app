import { Text } from "react-native";

import styles from "../../styles";
import { AppButton } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function CollectionChooserForm() {
  const {
    setModal,
    setSeriesForm,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>What would you like to add?</Text>
        <Text style={styles.modalIntro}>
          Choose the type of collection record you want to create.
        </Text>
        <AppButton
          label="Collection"
          onPress={() => setModal("collection")}
        />
        <AppButton
          label="Universe"
          secondary
          onPress={() => setModal("universe")}
        />
        <AppButton
          label="Series"
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
      </>
    );
}
