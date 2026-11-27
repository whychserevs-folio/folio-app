import { Text, View } from "react-native";

import styles from "../styles";
import { Heading } from "../components/ui";
import { useFolio } from "../state/FolioContext";

export default function StatsScreen() {
  const {
    stats,
  } = useFolio();
  return (
  <>
    <Heading
      kicker="YOUR COLLECTION"
      title="Collection Statistics"
      subtitle="A snapshot of your library, editions, subscriptions and pre-orders."
    />

    <View style={styles.statsGrid}>
      {stats.map(([label, value], index) => (
        <View key={label} style={styles.statCard}>
          <Text style={styles.statIndex}>
            {String(index + 1).padStart(2, "0")}
          </Text>

          <Text style={styles.statValue}>
            {value}
          </Text>

          <Text style={styles.statLabel}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  </>
  );
}
