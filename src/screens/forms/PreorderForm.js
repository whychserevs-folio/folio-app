import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import styles from "../../styles";
import { C } from "../../theme";
import { CURRENCIES, FORMATS } from "../../constants";
import { AppButton, Chip, Field } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function PreorderForm() {
  const {
    editingPreorderId,
    pickPreorderCover,
    preForm,
    savePreorder,
    saving,
    setPreForm,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>
          {editingPreorderId ? "Edit pre-order" : "New pre-order"}
        </Text>
        <Field
          label="Book title"
          value={preForm.title}
          onChangeText={v => setPreForm(p => ({ ...p, title: v }))}
        />
        <Field
          label="Author"
          value={preForm.author}
          onChangeText={v => setPreForm(p => ({ ...p, author: v }))}
        />
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Book cover</Text>
          <Pressable
            onPress={pickPreorderCover}
            style={{
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
            }}
          >
           {preForm.cover_url ? (
  <Image
    source={{
      uri: preForm.cover_url,
    }}
    style={{
      width: 110,
      height: 155,
      borderRadius: 8,
    }}
    contentFit="cover" transition={150}
    onLoad={() => console.log("IMAGE LOADED")}
    onError={(e) =>
      console.log(
        "IMAGE ERROR",
        JSON.stringify(e.nativeEvent, null, 2)
      )
    }
  />
) : (
  <Text style={{ color: C.text }}>
    + Choose book cover image
  </Text>
)}
          </Pressable>

        </View>
        <Field
          label="Retailer"
          value={preForm.retailer}
          onChangeText={v => setPreForm(p => ({ ...p, retailer: v }))}
        />
        <Field
          label="ISBN"
          value={preForm.isbn}
          onChangeText={v => setPreForm(p => ({ ...p, isbn: v }))}
        />

        <Text style={styles.fieldLabel}>Format</Text>
        <View style={styles.chipRow}>
          {FORMATS.map(format => (
            <Chip
              key={format}
              label={format}
              selected={preForm.format === format}
              onPress={() => setPreForm(p => ({ ...p, format }))}
            />
          ))}
        </View>

        <Field
          label="Book price"
          value={preForm.price}
          keyboardType="decimal-pad"
          onChangeText={v => setPreForm(p => ({ ...p, price: v }))}
        />
        <Field
          label="Shipping cost"
          value={preForm.shipping_cost}
          keyboardType="decimal-pad"
          onChangeText={v =>
            setPreForm(p => ({ ...p, shipping_cost: v }))
          }
        />

        <Text style={styles.fieldLabel}>Currency</Text>
        <View style={styles.chipRow}>
          {CURRENCIES.map(currency => (
            <Chip
              key={currency}
              label={currency}
              selected={preForm.currency === currency}
              onPress={() => setPreForm(p => ({ ...p, currency }))}
            />
          ))}
        </View>

        <Field
          label="Order date (DD/MM/YYYY)"
          value={preForm.order_date}
          onChangeText={v => setPreForm(p => ({ ...p, order_date: v }))}
        />
        <Text style={styles.fieldLabel}>
          Expected Shipping (MM / YYYY)
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Field
              label="MM"
              value={preForm.expected_shipping_month}
              onChangeText={v =>
                setPreForm(p => ({
                  ...p,
                  expected_shipping_month: v,
                }))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Field
              label="YYYY"
              value={preForm.expected_shipping_year}
              onChangeText={v =>
                setPreForm(p => ({
                  ...p,
                  expected_shipping_year: v,
                }))
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <Field
          label="Notes"
          value={preForm.notes}
          onChangeText={v => setPreForm(p => ({ ...p, notes: v }))}
          multiline
        />
        <AppButton
          label={saving ? "Saving..." : "Save pre-order"}
          disabled={saving}
          onPress={savePreorder}
        />
      </>
    );
}
