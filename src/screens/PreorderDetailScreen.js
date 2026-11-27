import { Text } from "react-native";

import styles from "../styles";
import { displayDate, monthYear } from "../utils/format";
import { AppButton, Cover, Heading } from "../components/ui";
import { useFolio } from "../state/FolioContext";

export default function PreorderDetailScreen() {
  const {
    pickPreorderCover,
    selectedPreorder,
    setModal,
    setPreForm,
    setSelectedPreorder,
  } = useFolio();
  if (!selectedPreorder) return null;

  return (
    <>
      <AppButton
        label="← Back to pre-orders"
        secondary
        compact
        onPress={() => setSelectedPreorder(null)}
      />

      <Heading
        kicker="PREORDER"
        title={selectedPreorder.title}
        subtitle={selectedPreorder.retailer}
      />

      <Cover
        uri={selectedPreorder.cover_url}
        title={selectedPreorder.title}
      />
      <Text style={styles.bodyText}>
        Retailer: {selectedPreorder.retailer}
      </Text>

      <Text style={styles.bodyText}>
        Order Date: {displayDate(selectedPreorder.order_date)}
      </Text>

      <Text style={styles.bodyText}>
        Expected Shipping: {
          monthYear(
            selectedPreorder.expected_shipping_month,
            selectedPreorder.expected_shipping_year
          ) || "Not specified"
        }
      </Text>
      <AppButton
        label="Change Cover"
        onPress={pickPreorderCover}
      />

      <AppButton
        label="Edit Details"
        secondary
        onPress={() => {
          setPreForm({
            title: selectedPreorder.title || "",
            author: selectedPreorder.author || "",
            retailer: selectedPreorder.retailer || "",
            isbn: selectedPreorder.isbn || "",
            cover_url: selectedPreorder.cover_url || "",
            notes: selectedPreorder.notes || "",
          });

          setModal("preorder");
        }}
      />
    </>
  );
}
