import { Pressable, Text, View } from "react-native";

import styles from "../styles";
import { displayDate, money, monthYear } from "../utils/format";
import { AppButton, Cover, Heading } from "../components/ui";
import { useFolio } from "../state/FolioContext";

export default function SubscriptionsScreen() {
  const {
    deleteSubscription,
    editSubscription,
    removeMonthlyBook,
    setMonthlyBookForm,
    updateMonthlyBook,
    resetBookForm,
    selectedSubscription,
    setBookForm,
    setEditingEditionId,
    setEditingId,
    setModal,
    setSelectedSubscription,
    setSubscriptionForm,
    subscriptionBooks,
    subscriptions,
  } = useFolio();
  return (
  <>
    <Heading
      kicker="MONTHLY BOOK CLUBS"
      title="Subscriptions"
      subtitle="Track renewals, monthly picks and the books arriving at your door."
    />

    <AppButton
      label="+ Add subscription"
      onPress={() => {
        setEditingId(null);
        setSubscriptionForm({
          name: "",
          price: "",
          currency: "GBP",
          renewal_date: "",
          status: "Active",
          notes: "",
        });
        setModal("subscription");
      }}
    />

    {subscriptions.map(subscription => {
      const monthly = subscriptionBooks.filter(
        b => b.subscription_id === subscription.id
      );
      const expanded = selectedSubscription?.id === subscription.id;

      return (
        <View key={subscription.id} style={styles.subscriptionCard}>
          <Pressable
            onPress={() =>
              setSelectedSubscription(expanded ? null : subscription)
            }
            style={styles.subscriptionHeader}
          >
            <View style={styles.subscriptionMonogram}>
              <Text style={styles.subscriptionMonogramText}>
                {subscription.name?.slice(0, 1)?.toUpperCase() || "F"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subscriptionName}>{subscription.name}</Text>
              <Text style={styles.goldSmall}>
                {money(subscription.price, subscription.currency)}
              </Text>

              <Text style={styles.mutedText}>
                {subscription.frequency || "Monthly"} · {subscription.status}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setEditingId(null);
                setEditingEditionId(null);

                setBookForm({
                  ...resetBookForm(),
                  source: subscription.name || "",
                });

                setModal("book");
              }}
            >
              <Text style={styles.expandMark}>+</Text>
            </Pressable>
          </Pressable>

          <Text style={styles.mutedText}>
            Next Renewal: {
              subscription.renewal_date
                ? displayDate(subscription.renewal_date)
                : "Not set"
            }
          </Text>

          <View style={styles.detailActions}>
            <AppButton
              label="Edit"
              compact
              secondary
              onPress={() => editSubscription(subscription)}
            />
            <AppButton
              label="Delete"
              compact
              danger
              onPress={() => deleteSubscription(subscription)}
            />
          </View>

          {expanded && (
            <View style={styles.monthlyArea}>
              <Text style={styles.sectionTitle}>Monthly books</Text>

              {!monthly.length && (
                <Text style={styles.mutedText}>
                  No monthly books yet. Add this month's pick to track it from
                  ordered to on your shelf.
                </Text>
              )}

              {[...monthly]
                .sort((a, b) => (b.year - a.year) || (b.month - a.month))
                .map(item => {
                  const next =
                    item.status === "Ordered"
                      ? "Mark shipped"
                      : item.status === "Shipped"
                      ? "Mark received"
                      : null;
                  return (
                    <View key={item.id} style={styles.monthlyBookRow}>
                      <Cover uri={item.cover_url} title={item.title} size="small" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goldSmall}>
                          {monthYear(item.month, item.year)}
                        </Text>
                        <Text style={styles.subscriptionName}>{item.title}</Text>
                        {!!item.author && (
                          <Text style={styles.mutedText}>{item.author}</Text>
                        )}
                        {!!item.edition_name && (
                          <Text style={styles.mutedText}>{item.edition_name}</Text>
                        )}
                        <View style={styles.detailActions}>
                          <Text style={styles.statusPill}>
                            {String(item.status || "Ordered").toUpperCase()}
                          </Text>
                          {next && (
                            <AppButton
                              label={next}
                              compact
                              secondary
                              onPress={() => updateMonthlyBook(item)}
                            />
                          )}
                          <AppButton
                            label="Remove"
                            compact
                            danger
                            onPress={() => removeMonthlyBook(item)}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}

              <AppButton
                label="+ Add monthly book"
                compact
                onPress={() => {
                  setMonthlyBookForm({
                    title: "",
                    author: "",
                    cover_url: "",
                    edition_name: "",
                    month: String(new Date().getMonth() + 1),
                    year: String(new Date().getFullYear()),
                  });
                  setModal("monthlyBook");
                }}
              />
            </View>
          )}

        </View>
      );
    })}
  </>
  );
}
