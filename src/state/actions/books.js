import { supabase } from "../../supabase";
import { notify } from "../../components/Toast";
import { todayISO, bookId } from "../../utils/format";

// Books, editions, copies, TBR/DNF, ISBN lookup and barcode scanning.
// Plain functions (no hooks): useFolioStore calls this every render with the
// current state, setters and other actions it needs.
export function createBooksActions(deps) {
  const {
    bookForm,
    books,
    cameraPermission,
    dnfIds,
    editingEditionId,
    editingId,
    editions,
    loadData,
    requestCameraPermission,
    selectedBook,
    setBookForm,
    setEditingEditionId,
    setEditingId,
    setLookupLoading,
    setModal,
    setSaving,
    setScannerOpen,
    tbrIds,
    uploadImageUri,
    userId,
  } = deps;
  const scanBarcode = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        notify(
          "Camera permission needed",
          "Please allow Folio to use the camera so it can scan ISBN barcodes."
        );
        return;
      }
    }
    setScannerOpen(true);
  };

  const closeScanner = () => setScannerOpen(false);

  const handleBarcodeScanned = async ({ data, type }) => {
    if (!data) return;
  
    const isbn = String(data).replace(/[^0-9Xx]/g, "");
    if (isbn.length !== 10 && isbn.length !== 13) {
      notify("Not an ISBN", `The scanned barcode (${type || "barcode"}) is not an ISBN.`);
      return;
    }
  
    setScannerOpen(false);
    setBookForm(prev => ({ ...prev, isbn }));
    setTimeout(() => findBook(isbn), 0);
  };

  const resetBookForm = () => ({
    title: "",
    author: "",
    description: "",
    genre: "",
    cover_url: "",
    format: "Hardback",
    edition_name: "",
    isbn: "",
    publisher: "",
    publication_year: "",
    edition_cover_url: "",
    spine_image_url: "",
    sprayed_edge_url: "",
    display_style: "spine",
    signed: false,
    special_features: "",
    condition: "Good",
    copy_notes: "",
    on_tbr: false,
    source: "",
    notes: "",
    is_tbr: false,
    is_dnf: false,
    series_id: "",
  
  });

  const openNewBook = () => {
    setEditingId(null);
    setEditingEditionId(null);
    setBookForm(resetBookForm());
    setModal("book");
  };

  const openEditBook = item => {
    const id = bookId(item);
    const record = books.find(b => b.id === id);
    if (!record) return;
  
    const edition =
      item.editionRecord ||
      editions.find(e => e.book_id === id) ||
      null;
  
    setEditingId(id);
    setEditingEditionId(edition?.id || null);
    setBookForm({
      title: record.title || "",
      author: record.author || "",
      description: record.description || "",
      genre: record.genre || "",
      cover_url: record.cover_url || "",
      format: edition?.format || "Hardback",
      edition_name: edition?.edition_name || "",
      isbn: edition?.isbn || "",
      publication_year: edition?.publication_date?.slice(0, 4) || "",
      edition_cover_url: edition?.cover_url || "",
      spine_image_url: edition?.spine_image_url || "",
      sprayed_edge_url: edition?.sprayed_edge_url || "",
      position_x: edition?.position_x ?? 0,
      position_y: edition?.position_y ?? 0,
      shelf_index: edition?.shelf_index ?? 0,
      display_style: edition?.display_style || "spine",
      signed: !!edition?.signed,
      special_features: edition?.special_features || "",
      condition: "Good",
      copy_notes: "",
      on_tbr: tbrIds.includes(id),
    });
    setModal("book");
  };

  const findBook = async (isbnOverride = "") => {
    try {
      setLookupLoading(true);
  
      console.log("FIND BOOK PRESSED");
  
      let url = "";
  
      const isbnValue = String(isbnOverride || bookForm.isbn || "").trim();
  
      if (isbnValue) {
        url =
          "https://openlibrary.org/search.json?isbn=" +
          encodeURIComponent(isbnValue);
      } else if (bookForm.title?.trim()) {
        url =
          "https://openlibrary.org/search.json?title=" +
          encodeURIComponent(bookForm.title.trim()) +
          "&author=" +
          encodeURIComponent(bookForm.author || "");
      } else {
        notify(
          "Search required",
          "Enter an ISBN or a title."
        );
        return;
      }
  
      console.log("URL:", url);
  
      const response = await fetch(url);
  
      console.log("Response status:", response.status);
  
      if (!response.ok) {
        const text = await response.text();
        console.log("OPENLIBRARY ERROR:", text);
  
        notify(
          "Book Lookup Failed",
          `Open Library returned ${response.status}`
        );
  
        return;
      }
      console.log("URL:", url);
      const data = await response.json();
  
      console.log(JSON.stringify(data, null, 2));
  
      if (!data.docs?.length) {
        notify("Book not found");
        return;
      }
  
      const book = data.docs[0];
      let description = "";
  
      if (book.key) {
        try {
          const workResponse = await fetch(
            `https://openlibrary.org${book.key}.json`
          );
  
          const workData = await workResponse.json();
  
          if (typeof workData.description === "string") {
            description = workData.description;
          } else if (
            workData.description?.value
          ) {
            description =
              workData.description.value;
          }
  
          console.log(
            "DESCRIPTION:",
            description
          );
        } catch (err) {
          console.log(
            "Could not load description"
          );
        }
      }
      console.log("BOOK KEY:", book.key);
  
      const coverUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : isbnValue
          ? `https://covers.openlibrary.org/isbn/${encodeURIComponent(isbnValue)}-L.jpg`
          : "";
  
      console.log("Cover URL:", coverUrl);
  
      setBookForm(prev => ({
        ...prev,
        title: book.title || prev.title,
        author:
          book.author_name?.join(", ") ||
          prev.author,
        genre:
          book.subject?.[0] ||
          prev.genre,
        publication_year:
          book.first_publish_year
            ? String(book.first_publish_year)
            : prev.publication_year,
        description:
          description || prev.description,
        cover_url:
          coverUrl || prev.cover_url,
      }));
  
      console.log("BOOK FORM UPDATED");
  
    } catch (error) {
      console.error("FIND BOOK ERROR:", error);
  
      notify(
        "Find Book Error",
        String(error)
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const saveBook = async () => {
    if (!String(bookForm.title || "").trim()) {
      notify("Title required", "Please enter a book title.");
      return;
    }
  
    setSaving(true);
  
    try {
      const bookIdToSave = editingId;
  
      let coverUrl = String(bookForm.cover_url || "").trim() || null;
      if (coverUrl && !/^https?:\/\//i.test(coverUrl)) {
        coverUrl = await uploadImageUri(coverUrl, "books");
      }
  
      let editionCoverUrl =
        String(bookForm.edition_cover_url || "").trim() || null;
      if (editionCoverUrl && !/^https?:\/\//i.test(editionCoverUrl)) {
        editionCoverUrl = await uploadImageUri(editionCoverUrl, "editions");
      }
  
      let spineImageUrl =
        String(bookForm.spine_image_url || "").trim() || null;
      if (spineImageUrl && !/^https?:\/\//i.test(spineImageUrl)) {
        spineImageUrl = await uploadImageUri(spineImageUrl, "spines");
      }
  
      let edgeImageUrl =
        String(bookForm.sprayed_edge_url || "").trim() || null;
      if (edgeImageUrl && !/^https?:\/\//i.test(edgeImageUrl)) {
        edgeImageUrl = await uploadImageUri(edgeImageUrl, "edges");
      }
  
      let bookData;
  
      if (bookIdToSave) {
        const { data, error: bookError } = await supabase
          .from("books")
          .update({
            title: String(bookForm.title || "").trim(),
            author: String(bookForm.author || "").trim() || null,
            description: String(bookForm.description || "").trim() || null,
            genre: String(bookForm.genre || "").trim() || null,
            cover_url: coverUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookIdToSave)
          .eq("user_id", userId)
          .select()
          .single();
  
        if (bookError) throw bookError;
        bookData = data;
      } else {
        const { data, error: bookError } = await supabase
          .from("books")
          .insert({
            user_id: userId,
            title: String(bookForm.title || "").trim(),
            author: String(bookForm.author || "").trim() || null,
            description: String(bookForm.description || "").trim() || null,
            genre: String(bookForm.genre || "").trim() || null,
            cover_url: coverUrl,
          })
          .select()
          .single();
  
        if (bookError) throw bookError;
        bookData = data;
      }
  
      const editionPayload = {
        user_id: userId,
        book_id: bookData.id,
        format: bookForm.format || null,
        edition_name: String(bookForm.edition_name || "").trim() || null,
        isbn: String(bookForm.isbn || "").trim() || null,
        publication_date: bookForm.publication_year
          ? `${String(bookForm.publication_year).slice(0, 4)}-01-01`
          : null,
        cover_url: editionCoverUrl || coverUrl,
        spine_image_url: spineImageUrl,
        sprayed_edge_url: edgeImageUrl,
        display_style: bookForm.display_style,
  
        signed: !!bookForm.signed,
        special_features:
          String(bookForm.special_features || "").trim() || null,
      };
  
      let editionId = editingEditionId;
  
      if (editionId) {
        const { error: editionError } = await supabase
          .from("editions")
          .update(editionPayload)
          .eq("id", editionId)
          .eq("user_id", userId);
  
        if (editionError) throw editionError;
      } else {
        const { data: editionData, error: editionError } = await supabase
          .from("editions")
          .insert(editionPayload)
          .select()
          .single();
  
        if (editionError) throw editionError;
        editionId = editionData.id;
      }
  
      if (!editingEditionId) {
        const { error: copyError } = await supabase
          .from("physical_copies")
          .insert({
            user_id: userId,
            edition_id: editionId,
            condition: bookForm.condition || "Good",
            signed: !!bookForm.signed,
            notes: String(bookForm.copy_notes || bookForm.notes || "").trim() || null,
          });
  
        if (copyError) throw copyError;
      }
  
      const wantsTbr = !!(bookForm.on_tbr || bookForm.is_tbr);
      const wantsDnf = !!bookForm.is_dnf;
  
      await toggleBookListAfterSave(bookData.id, "TBR", wantsTbr);
      await toggleBookListAfterSave(bookData.id, "DNF", wantsDnf);
  
      notify(
        "Saved",
        `"${String(bookForm.title || "").trim()}" has been saved to your library.`
      );
  
      setBookForm(resetBookForm());
      setEditingId(null);
      setEditingEditionId(null);
      setModal("");
      await loadData();
    } catch (e) {
      console.error("SAVE BOOK ERROR", e);
      notify("Couldn't save book", e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleBookListAfterSave = async (bookIdValue, list, shouldExist) => {
    const table = list === "TBR" ? "tbr_books" : "dnf_books";
  
    const { data: existingRows, error: findError } = await supabase
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", bookIdValue)
      .limit(1);
  
    if (findError) throw findError;
  
    const exists = (existingRows || []).length > 0;
  
    if (shouldExist && !exists) {
      const { error } = await supabase
        .from(table)
        .insert({ user_id: userId, book_id: bookIdValue });
  
      if (error) throw error;
    } else if (!shouldExist && exists) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", userId)
        .eq("book_id", bookIdValue);
  
      if (error) throw error;
    }
  };

  const addAnotherEdition = () => {
    if (!selectedBook) return;
    const record = books.find(b => b.id === bookId(selectedBook));
    if (!record) return;
  
    setEditingId(record.id);
    setEditingEditionId(null);
    setBookForm({
      ...resetBookForm(),
      title: record.title || "",
      author: record.author || "",
      description: record.description || "",
      genre: record.genre || "",
      cover_url: record.cover_url || "",
    });
    setModal("book");
  };

  const addPhysicalCopy = async edition => {
    try {
      const { error: copyError } = await supabase
        .from("physical_copies")
        .insert({
          user_id: userId,
          edition_id: edition.id,
          condition: "Good",
          signed: !!edition.signed,
        });
  
      if (copyError) throw copyError;
      await loadData(["physical_copies"]);
      notify("Copy added", "A new physical copy has been recorded.");
    } catch (e) {
      notify("Couldn't add copy", e.message);
    }
  };

  const toggleList = async (id, list) => {
    const table = list === "TBR" ? "tbr_books" : "dnf_books";
    const current = list === "TBR" ? tbrIds : dnfIds;
    const exists = current.includes(id);
  
    try {
      const request = exists
        ? supabase
          .from(table)
          .delete()
          .eq("user_id", userId)
          .eq("book_id", id)
        : supabase.from(table).insert({ user_id: userId, book_id: id });
  
      const { error: changeError } = await request;
      if (changeError) throw changeError;
      await loadData();
    } catch (e) {
      notify("Couldn't update list", e.message);
    }
  };

  const addReceivedBookToLibrary = async item => {
    try {
      let book = books.find(
        b => b.title.trim().toLowerCase() === item.title.trim().toLowerCase()
      );
  
      if (!book) {
        const { data, error: bookError } = await supabase
          .from("books")
          .insert({
            user_id: userId,
            title: item.title,
            author: item.author || null,
            cover_url: item.cover_url || null,
          })
          .select()
          .single();
  
        if (bookError) throw bookError;
        book = data;
      }
  
      let edition = editions.find(e => {
        if (e.book_id !== book.id) return false;
        if (item.isbn) return e.isbn === item.isbn;
  
        return (
          (e.format || "") === (item.format || "")
        );
      });
  
      if (!edition) {
        const { data, error: editionError } = await supabase
          .from("editions")
          .insert({
            user_id: userId,
            book_id: book.id,
            isbn: item.isbn || null,
            format: item.format || null,
            special_features: null,
            cover_url: item.cover_url || null,
          })
          .select()
          .single();
  
        if (editionError) throw editionError;
        edition = data;
      }
  
      const { error: copyError } = await supabase
        .from("physical_copies")
        .insert({
          user_id: userId,
          edition_id: edition.id,
          condition: "New",
          purchase_date: item.order_date || todayISO(),
        });
  
      if (copyError) throw copyError;
      return true;
    } catch (e) {
      notify("Couldn't add book to library", e.message);
      return false;
    }
  };

  return { scanBarcode, closeScanner, handleBarcodeScanned, resetBookForm, openNewBook, openEditBook, findBook, saveBook, toggleBookListAfterSave, addAnotherEdition, addPhysicalCopy, toggleList, addReceivedBookToLibrary };
}
