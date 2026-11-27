import { Alert } from "react-native";

import { supabase } from "../../supabase";
import { notify } from "../../components/Toast";
import { todayISO, displayDate, isoDate, num } from "../../utils/format";

// Subscriptions and their monthly books.
// Plain functions (no hooks): useFolioStore calls this every render with the
// current state, setters and other actions it needs.
export function createSubscriptionsActions(deps) {
  const {
    addReceivedBookToLibrary,
    editingId,
    editingPreorderId,
    loadData,
    monthlyBookForm,
    selectedSubscription,
    setEditingId,
    setModal,
    setSaving,
    setSelectedSubscription,
    setSubscriptionForm,
    subscriptionForm,
    userId,
  } = deps;
  const saveSubscription = async () => {
    if (!String(subscriptionForm.name || "").trim()) {
      notify("Name required", "Enter a subscription name.");
      return;
    }
  
    setSaving(true);
  
    try {
      // Keep the existing renewal_date column compatible with the current
      // database while treating it as a day-of-month value in the UI.
      const renewalDate = isoDate(subscriptionForm.renewal_date);
      console.log("EDITING PREORDER ID:", editingPreorderId);
      const payload = {
        user_id: userId,
        name: String(subscriptionForm.name || "").trim(),
        price: num(subscriptionForm.price),
        currency: subscriptionForm.currency,
        renewal_date: renewalDate,
        frequency: subscriptionForm.frequency,
        status: subscriptionForm.status,
        notes: String(subscriptionForm.notes || "").trim() || null,
      };
  
      const request = editingId
        ? supabase
          .from("subscriptions")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId)
        : supabase.from("subscriptions").insert(payload);
  
      const { error: saveError } = await request;
      if (saveError) throw saveError;
  
      setModal("");
      setEditingId(null);
      setSubscriptionForm({
        name: "",
        price: "",
        currency: "GBP",
        renewal_date: "",
        frequency: "Monthly",
        status: "Active",
        notes: "",
      });
      await loadData();
    } catch (e) {
      notify("Couldn't save subscription", e.message);
    } finally {
      setSaving(false);
    }
  };

  const editSubscription = item => {
    setEditingId(item.id);
  
    setSubscriptionForm({
      name: item.name || "",
      price: String(item.price ?? ""),
      currency: item.currency || "GBP",
      renewal_date: item.renewal_date
        ? displayDate(item.renewal_date)
        : "",
      frequency: item.frequency || "Monthly",
      status: item.status || "Active",
      notes: item.notes || "",
    });
  
    setModal("subscription");
  };

  const deleteSubscription = item => {
    Alert.alert(
      "Delete subscription",
      `Delete ${item.name} and its monthly book records?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await supabase
              .from("subscriptions")
              .delete()
              .eq("id", item.id)
              .eq("user_id", userId);
  
            if (deleteError) notify("Couldn't delete", deleteError.message);
            else {
              setSelectedSubscription(null);
              await loadData();
            }
          },
        },
      ]
    );
  };

  const addMonthlyBook = async () => {
    if (!selectedSubscription || !monthlyBookForm.title.trim()) {
      notify("Title required", "Enter the monthly book title.");
      return;
    }
  
    const month = num(monthlyBookForm.month);
    const year = num(monthlyBookForm.year);
  
    if (!month || month < 1 || month > 12 || !year || year < 2000) {
      notify("Invalid month or year", "Please check the month and year.");
      return;
    }
  
    try {
      const { error: insertError } = await supabase
        .from("subscription_books")
        .insert({
          user_id: userId,
          subscription_id: selectedSubscription.id,
          title: monthlyBookForm.title.trim(),
          author: monthlyBookForm.author.trim() || null,
          edition_name: monthlyBookForm.edition_name.trim() || null,
          cover_url: monthlyBookForm.cover_url.trim() || null,
          month,
          year,
          status: "Ordered",
        });
  
      if (insertError) throw insertError;
  
      setModal("");
      await loadData();
    } catch (e) {
      notify("Couldn't add monthly book", e.message);
    }
  };

  const updateMonthlyBook = item => {
    if (item.status === "Received") return;
  
    const nextStatus = item.status === "Ordered" ? "Shipped" : "Received";
  
    if (nextStatus === "Received") {
      Alert.alert(
        "Monthly book received",
        "Would you like to add this book to your library?",
        [
          {
            text: "Not now",
            onPress: async () => {
              const { error: updateError } = await supabase
                .from("subscription_books")
                .update({ status: "Received" })
                .eq("id", item.id)
                .eq("user_id", userId);
  
              if (updateError) notify("Couldn't update", updateError.message);
              else await loadData();
            },
          },
          {
            text: "Add to Library",
            onPress: async () => {
              const added = await addReceivedBookToLibrary({
                ...item,
                order_date: todayISO(),
                retailer: selectedSubscription?.name,
              });
  
              if (!added) return;
  
              const { error: updateError } = await supabase
                .from("subscription_books")
                .update({ status: "Received" })
                .eq("id", item.id)
                .eq("user_id", userId);
  
              if (updateError) notify("Couldn't update", updateError.message);
              else await loadData();
            },
          },
        ]
      );
      return;
    }
  
    Alert.alert("Update monthly book", "Mark this book as shipped?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark shipped",
        onPress: async () => {
          const { error: updateError } = await supabase
            .from("subscription_books")
            .update({ status: "Shipped" })
            .eq("id", item.id)
            .eq("user_id", userId);
  
          if (updateError) notify("Couldn't update", updateError.message);
          else await loadData();
        },
      },
    ]);
  };

  const removeMonthlyBook = item => {
    Alert.alert("Remove monthly book?", item.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const { error: deleteError } = await supabase
            .from("subscription_books")
            .delete()
            .eq("id", item.id)
            .eq("user_id", userId);
  
          if (deleteError) notify("Couldn't remove", deleteError.message);
          else await loadData();
        },
      },
    ]);
  };

  return { saveSubscription, editSubscription, deleteSubscription, addMonthlyBook, updateMonthlyBook, removeMonthlyBook };
}
