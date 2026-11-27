import { Pressable, ScrollView, Text, View } from "react-native";

import styles from "../../styles";
import { TABS } from "../../constants";
import { useFolio } from "../../state/FolioContext";

export default function TabBar() {
  const {
    setSearch,
    setSelectedBook,
    setSelectedCollection,
    setSelectedSeries,
    setSelectedSubscription,
    setSelectedUniverse,
    setTab,
    tab,
  } = useFolio();
  return (
    <View style={styles.navBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {TABS.map(item => (
          <Pressable
            key={item}
            onPress={() => {
              setTab(item);
              setSearch("");
              setSelectedBook(null);
              setSelectedCollection(null);
              setSelectedUniverse(null);
              setSelectedSeries(null);
              setSelectedSubscription(null);
            }}
            style={[styles.navItem, tab === item && styles.navItemActive]}
          >
            <Text
              style={[
                styles.navText,
                tab === item && styles.navTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
