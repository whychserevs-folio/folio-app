import { Alert } from "react-native";

import { supabase } from "../../supabase";
import { notify } from "../../components/Toast";

// Collections, universes, series and reading order.
// Plain functions (no hooks): useFolioStore calls this every render with the
// current state, setters and other actions it needs.
export function createCollectionsActions(deps) {
  const {
    collectionBooks,
    collectionForm,
    loadData,
    selectedUniverse,
    seriesBooks,
    seriesForm,
    setCollectionForm,
    setModal,
    setSelectedCollection,
    setSelectedSeries,
    setSelectedUniverse,
    setSeriesForm,
    setUniverseForm,
    universeForm,
    userId,
  } = deps;
  // Creates a collection, or saves changes when the form has an id.
  const addCollection = async () => {
    if (!collectionForm.name.trim()) {
      notify("Name required", "Give the collection a name.");
      return;
    }
    const fields = {
      name: collectionForm.name.trim(),
      description: String(collectionForm.description || "").trim() || null,
    };

    try {
      const { data, error: saveError } = collectionForm.id
        ? await supabase
            .from("collections")
            .update(fields)
            .eq("id", collectionForm.id)
            .eq("user_id", userId)
            .select()
            .single()
        : await supabase
            .from("collections")
            .insert({ ...fields, user_id: userId, collection_type: "standard" })
            .select()
            .single();

      if (saveError) throw saveError;
      if (collectionForm.id) setSelectedCollection?.(data);
      setCollectionForm({ name: "", description: "" });
      setModal("");
      await loadData(["collections"]);
    } catch (e) {
      notify(collectionForm.id ? "Couldn't save collection" : "Couldn't create collection", e.message);
    }
  };

  const deleteCollection = collection => {
    Alert.alert(
      "Delete collection?",
      `"${collection.name}" will be deleted. The books stay in your library.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await supabase
              .from("collections")
              .delete()
              .eq("id", collection.id)
              .eq("user_id", userId);
            if (deleteError) {
              notify("Couldn't delete collection", deleteError.message);
              return;
            }
            setSelectedCollection?.(null);
            notify("Collection deleted", collection.name);
            await loadData(["collections"]);
          },
        },
      ]
    );
  };

  const addBookToCollection = async (id, collectionId) => {
    if (
      collectionBooks.some(
        row => row.book_id === id && row.collection_id === collectionId
      )
    ) {
      notify("Already in collection", "This book is already here.");
      return;
    }
  
    try {
      const { error: insertError } = await supabase
        .from("collection_books")
        .insert({
          user_id: userId,
          collection_id: collectionId,
          book_id: id,
        });
  
      if (insertError) throw insertError;
      await loadData(["collection_books"]);
    } catch (e) {
      notify("Couldn't add book", e.message);
    }
  };

  const removeBookFromCollection = async row => {
    try {
      const { error: deleteError } = await supabase
        .from("collection_books")
        .delete()
        .eq("id", row.id)
        .eq("user_id", userId);
  
      if (deleteError) throw deleteError;
      await loadData(["collection_books"]);
    } catch (e) {
      notify("Couldn't remove book", e.message);
    }
  };

  const addUniverse = async () => {
    if (!universeForm.name.trim()) return;
  
    const fields = {
      name: universeForm.name.trim(),
      description: String(universeForm.description || "").trim() || null,
    };
    try {
      const { data, error: saveError } = universeForm.id
        ? await supabase
            .from("universes")
            .update(fields)
            .eq("id", universeForm.id)
            .eq("user_id", userId)
            .select()
            .single()
        : await supabase
            .from("universes")
            .insert({ ...fields, user_id: userId })
            .select()
            .single();

      if (saveError) throw saveError;
      if (universeForm.id) setSelectedUniverse?.(data);
      setUniverseForm({ name: "", description: "" });
      setModal("");
      await loadData(["universes"]);
    } catch (e) {
      notify(universeForm.id ? "Couldn't save universe" : "Couldn't create universe", e.message);
    }
  };

  const deleteUniverse = universe => {
    Alert.alert(
      "Delete universe?",
      `"${universe.name}" will be deleted. Its series and books are kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await supabase
              .from("universes")
              .delete()
              .eq("id", universe.id)
              .eq("user_id", userId);
            if (deleteError) {
              notify("Couldn't delete universe", deleteError.message);
              return;
            }
            setSelectedUniverse?.(null);
            notify("Universe deleted", universe.name);
            await loadData(["universes", "series"]);
          },
        },
      ]
    );
  };

  const createSeries = async () => {
    if (!seriesForm.name.trim()) return;
  
    const fields = {
      name: seriesForm.name.trim(),
      description: String(seriesForm.description || "").trim() || null,
      universe_id: seriesForm.universe_id || null,
    };
    try {
      const { data, error: saveError } = seriesForm.id
        ? await supabase
            .from("series")
            .update(fields)
            .eq("id", seriesForm.id)
            .eq("user_id", userId)
            .select()
            .single()
        : await supabase
            .from("series")
            .insert({ ...fields, user_id: userId })
            .select()
            .single();

      if (saveError) throw saveError;
      if (seriesForm.id) setSelectedSeries?.(data);
      setSeriesForm({ name: "", description: "", universe_id: "" });
      setModal("");
      await loadData(["series"]);
    } catch (e) {
      notify(seriesForm.id ? "Couldn't save series" : "Couldn't create series", e.message);
    }
  };

  const deleteSeries = s => {
    Alert.alert(
      "Delete series?",
      `"${s.name}" will be deleted. The books stay in your library.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error: deleteError } = await supabase
              .from("series")
              .delete()
              .eq("id", s.id)
              .eq("user_id", userId);
            if (deleteError) {
              notify("Couldn't delete series", deleteError.message);
              return;
            }
            setSelectedSeries?.(null);
            notify("Series deleted", s.name);
            await loadData(["series"]);
          },
        },
      ]
    );
  };

  const addExistingSeriesToUniverse = async seriesId => {
    if (!selectedUniverse?.id || !seriesId) return;
  
    try {
      const { error: updateError } = await supabase
        .from("series")
        .update({ universe_id: selectedUniverse.id })
        .eq("id", seriesId)
        .eq("user_id", userId);
  
      if (updateError) throw updateError;
  
      setModal("");
      await loadData(["series"]);
    } catch (e) {
      notify("Couldn't add series", e.message);
    }
  };

  const addBookToSeries = async (id, seriesId) => {
    if (
      seriesBooks.some(
        row => row.book_id === id && row.series_id === seriesId
      )
    ) {
      notify("Already in series", "This book is already in this series.");
      return;
    }
  
    const orders = seriesBooks
      .filter(row => row.series_id === seriesId)
      .map(row => Number(row.reading_order) || 0);
  
    try {
      const { error: insertError } = await supabase
        .from("series_books")
        .insert({
          user_id: userId,
          series_id: seriesId,
          book_id: id,
          reading_order: Math.max(0, ...orders) + 1,
        });
  
      if (insertError) throw insertError;
      await loadData(["series_books"]);
    } catch (e) {
      notify("Couldn't add book to series", e.message);
    }
  };

  const removeBookFromSeries = async row => {
    try {
      const { error: deleteError } = await supabase
        .from("series_books")
        .delete()
        .eq("id", row.id)
        .eq("user_id", userId);
  
      if (deleteError) throw deleteError;
      await loadData(["series_books"]);
    } catch (e) {
      notify("Couldn't remove book", e.message);
    }
  };

  const moveSeriesBook = async (link, direction) => {
    const ordered = seriesBooks
      .filter(row => row.series_id === link.series_id)
      .sort(
        (a, b) =>
          Number(a.reading_order || 999) - Number(b.reading_order || 999)
      );
  
    const index = ordered.findIndex(row => row.id === link.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ordered.length) return;
  
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
  
    try {
      for (let i = 0; i < ordered.length; i++) {
        const { error: updateError } = await supabase
          .from("series_books")
          .update({ reading_order: i + 1 })
          .eq("id", ordered[i].id)
          .eq("user_id", userId);
  
        if (updateError) throw updateError;
      }
  
      await loadData(["series_books"]);
    } catch (e) {
      notify("Couldn't reorder series", e.message);
    }
  };

  return { addCollection, addBookToCollection, removeBookFromCollection, addUniverse, createSeries, addExistingSeriesToUniverse, addBookToSeries, removeBookFromSeries, moveSeriesBook, deleteCollection, deleteSeries, deleteUniverse };
}
