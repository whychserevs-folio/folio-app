import { Image, Pressable, Text, View } from "react-native";

import styles from "../../styles";
import { useFolio } from "../../state/FolioContext";

export default function TopBar() {
  const {
    profile,
    setShowProfile,
  } = useFolio();
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.brand}>folio</Text>
        <Text style={styles.brandSubtitle}>Your books, beautifully organised.</Text>
      </View>
      <Pressable
  onPress={() => setShowProfile(true)}
  style={styles.signOutButton}
>
  {profile?.avatar_url ? (
    <Image
      source={{ uri: profile.avatar_url }}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
      }}
    />
  ) : (
    <Text style={styles.signOutText}>👤</Text>
  )}
</Pressable>

    </View>
  );
}
