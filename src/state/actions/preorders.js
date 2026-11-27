import { Alert } from "react-native";

import { supabase } from "../../supabase";
import { notify } from "../../components/Toast";
import { isoDate, num } from "../../utils/format";

// Pre-orders: save, advance status, receive into the library.
// Plain functions (no hooks): useFolioStore calls this every render with the
// current state, setters and other actions it needs.
export function createPreordersActions(deps) {
  const {
    addReceivedBookToLibrary,
    editingPreorderId,
    loadData,
    preForm,
    setEditingPreorderId,
    setModal,
    setSaving,
    uploadImageUri,
    userId,
  } = deps;
  const savePreorder = async () => {
    console.log("SAVE PREORDER STARTED");
    if (!String(preForm.title || "").trim()) {
      notify("Title required", "Enter the book title.");
      return;
    }
  
    const orderDate = isoDate(preForm.order_date);
  
    if (preForm.order_date && !orderDate) {
      notify("Invalid date", "Use DD/MM/YYYY for the order date.");
      return;
    }
  
    const month = num(preForm.expected_shipping_month);
    const year = num(preForm.expected_shipping_year);
  
    if (
      (month !== null && (month < 1 || month > 12)) ||
      (year !== null && (year < 2000 || year > 2200)) ||
      (!!month !== !!year)
    ) {
      notify(
        "Check expected shipping date",
        "Enter both a valid month and year, or leave both blank."
      );
      return;
    }
  
    setSaving(true);
  
    try {
      /*
       * The image picker stores cover_url as a local URI string.
       * If it is already an http/https URL, leave it alone.
       * If it is a local file URI, upload it to Supabase first.
       */
      let coverUrl = String(preForm.cover_url || "").trim() || null;
  
     console.log("ABOUT TO UPLOAD:", coverUrl);
  
  coverUrl = await uploadImageUri(
    coverUrl,
    "preorders",
    preForm.mime_type || "image/jpeg"
  );
  
  console.log("UPLOAD FINISHED:", coverUrl);
  console.log("FINAL COVER URL:", coverUrl);
      const payload = {
        user_id: userId,
        title: String(preForm.title || "").trim(),
        author: String(preForm.author || "").trim() || null,
        cover_url: coverUrl,
        format: preForm.format,
        isbn: String(preForm.isbn || "").trim() || null,
        retailer: String(preForm.retailer || "").trim() || null,
        price: num(preForm.price),
        shipping_cost: num(preForm.shipping_cost),
        currency: preForm.currency,
        order_date: orderDate,
        expected_shipping_month: month,
        expected_shipping_year: year,
        notes: String(preForm.notes || "").trim() || null,
        status: "preordered",
      };
      console.log(
        "SAVE PREORDER",
        editingPreorderId,
        payload.title
      );
      let result;
  
      if (editingPreorderId) {
        result = await supabase
          .from("preorders")
          .update(payload)
          .eq("id", editingPreorderId)
          .select();
  
        console.log("UPDATE RESULT:", result);
      } else {
        result = await supabase
          .from("preorders")
          .insert(payload)
          .select();
  
        console.log("INSERT RESULT:", result);
      }
  
      if (result.error) {
        throw result.error;
      }
  
      setEditingPreorderId(null);
      setModal("");
      await loadData();
  
    } catch (e) {
      console.error("SAVE PREORDER ERROR:", e);
  
      notify(
        "Couldn't save pre-order",
        e?.message || String(e)
      );
  
    } finally {
      setSaving(false);
    }
  };

  const advancePreorder = preorder => {
    if (preorder.status === "preordered") {
      Alert.alert("Update pre-order", "Has this order been shipped?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark shipped",
          onPress: async () => {
            const { error: updateError } = await supabase
              .from("preorders")
              .update({ status: "shipped" })
              .eq("id", preorder.id)
              .eq("user_id", userId);
  
            if (updateError) notify("Couldn't update", updateError.message);
            else await loadData();
          },
        },
      ]);
      return;
    }
  
    if (preorder.status === "shipped") {
      Alert.alert(
        "Pre-order received",
        "Would you like to add this book to your library?",
        [
          {
            text: "Not now",
            onPress: async () => {
              const { error: updateError } = await supabase
                .from("preorders")
                .update({ status: "received" })
                .eq("id", preorder.id)
                .eq("user_id", userId);
  
              if (updateError) notify("Couldn't update", updateError.message);
              else await loadData();
            },
          },
          {
            text: "Add to Library",
            onPress: async () => {
              const added = await addReceivedBookToLibrary(preorder);
              if (!added) return;
  
              const { error: updateError } = await supabase
                .from("preorders")
                .update({ status: "received" })
                .eq("id", preorder.id)
                .eq("user_id", userId);
  
              if (updateError) {
                notify("Couldn't update pre-order", updateError.message);
                return;
              }
  
              await loadData();
            },
          },
        ]
      );
    }
  };

  return { savePreorder, advancePreorder };
}
