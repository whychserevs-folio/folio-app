import { Text, View } from "react-native";

import styles from "../../styles";
import { CURRENCIES } from "../../constants";
import { AppButton, Chip, Field } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function SubscriptionForm() {
  const {
    editingId,
    saveSubscription,
    saving,
    setSubscriptionForm,
    subscriptionForm,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>
          {editingId ? "Edit subscription" : "New subscription"}
        </Text>
        <Field
          label="Subscription name"
          value={subscriptionForm.name}
          onChangeText={v => setSubscriptionForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Cost"
          value={subscriptionForm.price}
          keyboardType="decimal-pad"
          onChangeText={v => setSubscriptionForm(p => ({ ...p, price: v }))}
        />
        <Text style={styles.fieldLabel}>Currency</Text>
        <View style={styles.chipRow}>
          {CURRENCIES.map(currency => (
            <Chip
              key={currency}
              label={currency}
              selected={subscriptionForm.currency === currency}
              onPress={() =>
                setSubscriptionForm(p => ({ ...p, currency }))
              }
            />
          ))}
        </View>
        <Field
          label="Next Renewal Date"
          value={subscriptionForm.renewal_date}
          placeholder="DD/MM/YYYY"
          onChangeText={v =>
            setSubscriptionForm(p => ({
              ...p,
              renewal_date: v,
            }))
          }
        />

        <Text style={styles.fieldLabel}>
          Frequency
        </Text>

        <View style={styles.chipRow}>
          {[
            "Monthly",
            "Bi-Monthly",
            "Quarterly",
          ].map(frequency => (
            <Chip
              key={frequency}
              label={frequency}
              selected={
                subscriptionForm.frequency === frequency
              }
              onPress={() =>
                setSubscriptionForm(p => ({
                  ...p,
                  frequency,
                }))
              }
            />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.chipRow}>
          {["Active", "Paused", "Cancelled"].map(status => (
            <Chip
              key={status}
              label={status}
              selected={subscriptionForm.status === status}
              onPress={() =>
                setSubscriptionForm(p => ({ ...p, status }))
              }
            />
          ))}
        </View>
        <Field
          label="Notes"
          value={subscriptionForm.notes}
          onChangeText={v => setSubscriptionForm(p => ({ ...p, notes: v }))}
          multiline
        />
        <AppButton
          label={saving ? "Saving..." : "Save subscription"}
          disabled={saving}
          onPress={saveSubscription}
        />
      </>
    );
}
