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
    setSeriesForm,
    setUniverseForm,
    universeForm,
    userId,
  } = deps;
  const addCollection = async () => {
    if (!collectionForm.name.trim()) return;
  
    try {
      const { error: insertError } = await supabase
        .from("collections")
        .insert({
          user_id: userId,
          name: collectionForm.name.trim(),
          description: collectionForm.description.trim() || null,
          collection_type: "standard",
        });
  
      if (insertError) throw insertError;
      setCollectionForm({ name: "", description: "" });
      setModal("");
      await loadData(["collections"]);
    } catch (e) {
      notify("Couldn't create collection", e.message);
    }
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
  
    try {
      const { error: insertError } = await supabase.from("universes").insert({
        user_id: userId,
        name: universeForm.name.trim(),
        description: universeForm.description.trim() || null,
      });
  
      if (insertError) throw insertError;
      setUniverseForm({ name: "", description: "" });
      setModal("");
      await loadData(["universes"]);
    } catch (e) {
      notify("Couldn't create universe", e.message);
    }
  };

  const createSeries = async () => {
    if (!seriesForm.name.trim()) return;
  
    try {
      const { error: insertError } = await supabase.from("series").insert({
        user_id: userId,
        name: seriesForm.name.trim(),
        description: seriesForm.description.trim() || null,
        universe_id: seriesForm.universe_id || null,
      });
  
      if (insertError) throw insertError;
      setSeriesForm({ name: "", description: "", universe_id: "" });
      setModal("");
      await loadData(["series"]);
    } catch (e) {
      notify("Couldn't create series", e.message);
    }
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

  return { addCollection, addBookToCollection, removeBookFromCollection, addUniverse, createSeries, addExistingSeriesToUniverse, addBookToSeries, removeBookFromSeries, moveSeriesBook };
}
