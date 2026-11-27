import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import styles from "../styles";
import { displayDate, money, monthYear, todayISO } from "../utils/format";
import { AppButton, Heading } from "../components/ui";
import { useFolio } from "../state/FolioContext";

export default function PreordersScreen() {
  const {
    advancePreorder,
    outstandingPreorders,
    preorders,
    setEditingPreorderId,
    setModal,
    setPreForm,
    totalPreorderSpend,
  } = useFolio();
  return (
  <>
    <Heading
      kicker="ON THEIR WAY"
      title="Pre-orders"
      subtitle="Keep your upcoming editions and order costs in one place."
    />

    <View style={styles.preorderSummary}>
      <View>
        <Text style={styles.summaryLabel}>OUTSTANDING ORDERS</Text>
        <Text style={styles.summaryValue}>{outstandingPreorders.length}</Text>
      </View>
      <View>
        <Text style={styles.summaryLabel}>TOTAL COMMITTED</Text>
        <Text style={styles.summaryValue}>
          {money(totalPreorderSpend)}
        </Text>
      </View>
    </View>

    <AppButton
      label="+ Add pre-order"
      onPress={() => {
        setPreForm({
          title: "",
          author: "",
          cover_url: "",
          format: "Hardback",
          isbn: "",
          retailer: "",
          price: "",
          shipping_cost: "",
          currency: "GBP",
          order_date: displayDate(todayISO()),
          expected_shipping_month: "",
          expected_shipping_year: "",
          notes: "",
        });
        setEditingPreorderId(null);
        setModal("preorder");
      }}
    />

    {preorders.map(item => {
      const total =
        Number(item.price || 0) + Number(item.shipping_cost || 0);

      return (
        <Pressable
          key={item.id}
          style={styles.preorderCard}
          onPress={() => {
            setPreForm({
              title: item.title || "",
              author: item.author || "",
              retailer: item.retailer || "",
              isbn: item.isbn || "",
              cover_url: item.cover_url || "",
              notes: item.notes || "",
              order_date: item.order_date || "",
              expected_shipping_month:
                item.expected_shipping_month?.toString() || "",
              expected_shipping_year:
                item.expected_shipping_year?.toString() || "",
              price: item.price?.toString() || "",
              shipping_cost: item.shipping_cost?.toString() || "",
              currency: item.currency || "GBP",
              format: item.format || "Hardback",
            });

            setEditingPreorderId(item.id);

            setModal("preorder");
          }}

        >
          <View style={styles.preorderBook}>
         <Image
  source={{ uri: item.cover_url }}
  style={{
    width: 72,
    height: 106,
  }}
/>
            <View style={{ flex: 1 }}>
              <Text style={styles.preorderTitle}>{item.title}</Text>
              <Text style={styles.mutedText}>{item.author}</Text>
              <Text style={styles.goldSmall}>
                {item.retailer || "Retailer not recorded"}
              </Text>
              <Text style={styles.mutedText}>
                Ordered {displayDate(item.order_date)}
              </Text>
              <Text style={styles.mutedText}>
                Expected{" "}
                {monthYear(
                  item.expected_shipping_month,
                  item.expected_shipping_year
                ) || "Not specified"}
              </Text>
            </View>
          </View>

          <View style={styles.preorderCost}>
            <View style={styles.costRow}>
              <Text style={styles.mutedText}>Book</Text>
              <Text style={styles.bodyText}>
                {money(item.price, item.currency)}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.mutedText}>Shipping</Text>
              <Text style={styles.bodyText}>
                {money(item.shipping_cost, item.currency)}
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.goldSmall}>TOTAL</Text>
              <Text style={styles.costTotal}>
                {money(total, item.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.preorderFooter}>
            <Text style={styles.statusPill}>
              {String(item.status || "preordered").toUpperCase()}
            </Text>
            {item.status !== "received" &&
              item.status !== "cancelled" && (
                <AppButton
                  label={
                    item.status === "preordered"
                      ? "Update shipment"
                      : "Mark received"
                  }
                  compact
                  onPress={() => advancePreorder(item)}
                />
              )}
          </View>
        </Pressable>
      );
    })}
  </>
  );
}
