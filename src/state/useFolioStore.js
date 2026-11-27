import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, BackHandler } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useCameraPermissions } from "expo-camera";

import { supabase } from "../supabase";
import {
  todayISO,
  money,
  displayDate,
  isoDate,
  num,
  bookId,
} from "../utils/format";
import { notify } from "../components/Toast";

// All Folio state, data loading and actions. App.js renders the UI and
// passes this object to every screen through FolioContext.
export default function useFolioStore() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  // The user whose data has finished loading at least once. Later reloads for
  // that user refresh in the background instead of replacing the whole screen
  // with a spinner; a different user gets the full loading screen again.
  const [loadedForUser, setLoadedForUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [tab, setTab] = useState("Library");
  const [search, setSearch] = useState("");

  const [books, setBooks] = useState([]);
  const [editions, setEditions] = useState([]);
  const [physicalCopies, setPhysicalCopies] = useState([]);
  const [tbrIds, setTbrIds] = useState([]);
  const [dnfIds, setDnfIds] = useState([]);
  const [preorders, setPreorders] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionBooks, setCollectionBooks] = useState([]);
  const [universes, setUniverses] = useState([]);
  const [series, setSeries] = useState([]);
  const [seriesBooks, setSeriesBooks] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionBooks, setSubscriptionBooks] = useState([]);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedPreorder, setSelectedPreorder] = useState(null);
  const [editingPreorderId, setEditingPreorderId] = useState(null);
 useEffect(() => {
  const subscription = BackHandler.addEventListener(
    "hardwareBackPress",
    () => {
      if (selectedBook) {
        setSelectedBook(null);
        return true;
      }

      return false;
    }
  );

  return () => subscription.remove();
}, [selectedBook]);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    social_enabled: false,
    library_public: false,
    collections_public: false,
  });

  const [modal, setModal] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingEditionId, setEditingEditionId] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

 const pickCoverImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    notify(
      "Permission needed",
      "Please allow Folio to access your photos."
    );
    return;
  }
const pickEditionCoverImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    notify(
      "Permission needed",
      "Please allow Folio to access your photos."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.length) {
    setBookForm(p => ({
      ...p,
      edition_cover_url: result.assets[0].uri,
    }));
  }
};
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.length) {
    setBookForm(p => ({
      ...p,
      cover_url: result.assets[0].uri,
    }));
  }
};


const pickProfileImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    notify(
      "Permission needed",
      "Please allow Folio to access your photos."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  console.log("PROFILE PICKER RESULT:", result);

  if (!result.canceled && result.assets?.length) {
    console.log(
      "SETTING PROFILE URL:",
      result.assets[0].uri
    );

    setProfile(p => ({
      ...p,
      avatar_url: result.assets[0].uri,
    }));
  }
};

const pickSpineImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    notify(
      "Permission needed",
      "Please allow Folio to access your photos."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.length) {
    setBookForm(p => ({
      ...p,
      spine_image_url: result.assets[0].uri,
    }));
  }
};

const pickEdgeImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    notify(
      "Permission needed",
      "Please allow Folio to access your photos."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.length) {
    setBookForm(p => ({
      ...p,
      sprayed_edge_url: result.assets[0].uri,
    }));
  }
};

const [bookForm, setBookForm] = useState({
  title: "",
  author: "",
  description: "",
  genre: "",
  cover_url: "",
  format: "Hardback",
  edition_name: "",
  isbn: "",
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
  position_x: 0,
  position_y: 0,
  shelf_index: 0,
});

const [collectionForm, setCollectionForm] = useState({
  name: "",
  description: "",
});

const [universeForm, setUniverseForm] = useState({
  name: "",
  description: "",
});

const [seriesForm, setSeriesForm] = useState({
  name: "",
  description: "",
  universe_id: "",
});

const [preForm, setPreForm] = useState({
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
  mime_type: "",
});

const [subscriptionForm, setSubscriptionForm] = useState({
  name: "",
  price: "",
  currency: "GBP",
  renewal_date: "",
  frequency: "Monthly",
  status: "Active",
  notes: "",
});

const [monthlyBookForm, setMonthlyBookForm] = useState({
  title: "",
  author: "",
  cover_url: "",
  edition_name: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
});

const userId = session?.user?.id;
const [cameraPermission, requestCameraPermission] = useCameraPermissions();
const [scannerOpen, setScannerOpen] = useState(false);

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

const uploadImageUri = async (
  uri,
  folder = "books",
  mimeType = "image/jpeg"
) => {
  if (!uri || /^https?:\/\//i.test(uri)) {
    return uri || null;
  }

  const extension =
    uri
      .split("?")[0]
      .match(/\.([a-zA-Z0-9]+)$/)?.[1]
      ?.toLowerCase() || "jpg";

  const path =
    `${userId}/${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;
  console.log("IMAGE URI:", uri);
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  console.log("BASE64 CREATED");
  const arrayBuffer = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from("folio-images")
    .upload(path, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });
  console.log("UPLOAD RESULT:", uploadError);

  if (uploadError) {
    console.log("UPLOAD ERROR:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("folio-images")
    .getPublicUrl(path);

 console.log("PUBLIC URL:", data.publicUrl);
console.log("CONTENT TYPE:", mimeType);


  return data.publicUrl;
};

useEffect(() => {
  let active = true;

  supabase.auth.getSession().then(({ data, error: authError }) => {
    if (!active) return;
    if (authError) setError(authError.message);
    setSession(data?.session || null);
    setAuthLoading(false);
  });

  const { data: authListener } = supabase.auth.onAuthStateChange(
    (_event, nextSession) => setSession(nextSession)
  );

  return () => {
    active = false;
    authListener?.subscription?.unsubscribe();
  };
}, []);

const loadTable = useCallback(async (table, configure) => {
  let query = supabase.from(table).select("*");
  if (configure) query = configure(query);
  const { data, error: queryError } = await query;
  if (queryError) throw queryError;
  return data || [];
}, []);
const loadProfile = async () => {
  if (!userId) return;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!error && data) {
    setProfile(data);
  }
};
const saveProfile = async () => {
  const { error } = await supabase
    .from("profiles")
  .update({
  display_name: profile.display_name,
  bio: profile.bio,
  avatar_url: profile.avatar_url,
  social_enabled: profile.social_enabled,
  library_public: profile.library_public,
  collections_public: profile.collections_public,
  updated_at: new Date().toISOString(),
})
    .eq("id", userId);

  if (error) {
    notify("Error", error.message);
    return;
  }

  notify("Profile Saved");
  await loadProfile();
};
const loadData = useCallback(async () => {
  if (!userId) return;

  setLoading(true);
  setError("");

  try {
    const results = await Promise.all([
      loadTable("books", q => q.eq("user_id", userId)),
      loadTable(
  "editions",
  q => q
    .eq("user_id", userId)
    .order("sort_order")
),
      loadTable("physical_copies", q => q.eq("user_id", userId)),
      loadTable("tbr_books", q => q.eq("user_id", userId)),
      loadTable("dnf_books", q => q.eq("user_id", userId)),
      loadTable("preorders", q => q.eq("user_id", userId)),
      loadTable("collections", q => q.eq("user_id", userId)),
      loadTable("collection_books", q => q.eq("user_id", userId)),
      loadTable("universes", q => q.eq("user_id", userId)),
      loadTable("series", q => q.eq("user_id", userId)),
      loadTable("series_books", q => q.eq("user_id", userId)),
      loadTable("subscriptions", q => q.eq("user_id", userId)),
      loadTable("subscription_books", q => q.eq("user_id", userId)),
    ]);

    const [
      bookRows,
      editionRows,
      copyRows,
      tbrRows,
      dnfRows,
      preorderRows,
      collectionRows,
      collectionBookRows,
      universeRows,
      seriesRows,
      seriesBookRows,
      subscriptionRows,
      subscriptionBookRows,
    ] = results;

    setBooks(bookRows);
    setEditions(editionRows);
    setPhysicalCopies(copyRows);
    setTbrIds(tbrRows.map(row => row.book_id));
    setDnfIds(dnfRows.map(row => row.book_id));
    setPreorders(preorderRows);
    setCollections(collectionRows);
    setCollectionBooks(collectionBookRows);
    setUniverses(universeRows);
    setSeries(seriesRows);
    setSeriesBooks(seriesBookRows);
    setSubscriptions(subscriptionRows);
setSubscriptionBooks(subscriptionBookRows);

} catch (e) {
  console.log("LOAD DATA ERROR:", e);
  setError(e.message || "Unable to load Folio data.");
} finally {
  setLoading(false);
  setLoadedForUser(userId);
}

}, [userId, loadTable]);

useEffect(() => {
  if (userId) {
    loadData();
    loadProfile();
  }
}, [userId, loadData]);

const seriesByBook = useMemo(() => {
  const result = {};
  seriesBooks.forEach(link => {
    const found = series.find(s => s.id === link.series_id);
    if (found) {
      result[link.book_id] = {
        ...found,
        reading_order: link.reading_order,
      };
    }
  });
  return result;
}, [seriesBooks, series]);

const libraryItems = useMemo(() => {
  // Group once instead of filtering all editions per book (was O(books × editions)).
  const editionsByBook = new Map();
  editions.forEach(e => {
    const list = editionsByBook.get(e.book_id);
    if (list) list.push(e);
    else editionsByBook.set(e.book_id, [e]);
  });
  const tbrSet = new Set(tbrIds);
  const dnfSet = new Set(dnfIds);

  return books.flatMap(book => {
    const bookEditions = editionsByBook.get(book.id) || [];
    const common = {
      ...book,
      book_id: book.id,
      bookRecord: book,
      isTbr: tbrSet.has(book.id),
      isDnf: dnfSet.has(book.id),
    };

    if (!bookEditions.length) return [common];

  return bookEditions.map(edition => ({
  ...common,
  id: `${book.id}-${edition.id}`,
  editionRecord: edition,
  cover_url: edition.cover_url || book.cover_url,

  sort_order: edition.sort_order ?? 9999,
}));
  });
}, [books, editions, tbrIds, dnfIds]);

// Persist the bookshelf layout after a drag: every book's order and which
// shelf it is on. `layout` is [{ item, shelf }] in display order.
// Optimistic: update local editions first, then save in one RPC call;
// reload from the server if the save fails.
const reorderLibrary = useCallback(
  async layout => {
    const placed = layout.filter(({ item }) => item.editionRecord?.id);
    if (!placed.length) return;
    const editionIds = placed.map(({ item }) => item.editionRecord.id);
    const shelfIndexes = placed.map(({ shelf }) => shelf);

    const slot = new Map(
      placed.map(({ item, shelf }, i) => [item.editionRecord.id, { sort_order: i + 1, shelf_index: shelf }])
    );
    setEditions(current =>
      current.map(e => (slot.has(e.id) ? { ...e, ...slot.get(e.id) } : e))
    );

    const { error } = await supabase.rpc("save_shelf_layout", {
      p_edition_ids: editionIds,
      p_shelf_indexes: shelfIndexes,
    });

    if (error) {
      notify("Could not save shelf order", error.message);
      loadData();
    }
  },
  [loadData]
);

// Typing stays responsive: the shelf re-filters with the deferred value,
// so React can skip intermediate keystrokes on slower phones.
const deferredSearch = useDeferredValue(search);

const visibleItems = useMemo(() => {
  const query = deferredSearch.trim().toLowerCase();

  return libraryItems
    .filter(item => {
      // isTbr / isDnf are precomputed in libraryItems (same as tbrIds.includes(bookId(item))).
      if (tab === "TBR" && !item.isTbr) return false;
      if (tab === "DNF" && !item.isDnf) return false;

      if (!query) return true;

      return [
        item.title,
        item.author,
        item.genre,
        item.editionRecord?.edition_name,
        item.editionRecord?.format,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort(
      (a, b) =>
        (a.sort_order ?? 9999) -
        (b.sort_order ?? 9999)
    );
}, [libraryItems, deferredSearch, tab]);

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
    await loadData();
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
    await loadData();
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
    await loadData();
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
    await loadData();
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
    await loadData();
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
    await loadData();
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
    await loadData();
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
    await loadData();
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
    await loadData();
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

    await loadData();
  } catch (e) {
    notify("Couldn't reorder series", e.message);
  }
};

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
const pickPreorderCover = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    notify(
      "Permission needed",
      "Please allow Folio to access your photos."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.8,
  });

  console.log("PICKER RESULT:", result);

  if (!result.canceled && result.assets?.length) {
   setPreForm(prev => ({
  ...prev,
  cover_url: result.assets[0].uri,
  mime_type: result.assets[0].mimeType,
}));
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

const outstandingPreorders = preorders.filter(
  p => !["received", "cancelled"].includes(String(p.status).toLowerCase())
);

const totalPreorderSpend = outstandingPreorders.reduce(
  (total, p) =>
    total + Number(p.price || 0) + Number(p.shipping_cost || 0),
  0
);

const hardbacks = editions.filter(
  e => String(e.format || "").toLowerCase() === "hardback"
).length;

const paperbacks = editions.filter(
  e => String(e.format || "").toLowerCase() === "paperback"
).length;

const audio = editions.filter(e =>
  ["audio", "audiobook"].some(v =>
    String(e.format || "").toLowerCase().includes(v)
  )
).length;

const ebooks = editions.filter(e =>
  ["ebook", "e-book", "kindle", "digital"].some(v =>
    String(e.format || "").toLowerCase().includes(v)
  )
).length;

const specialEditions = editions.filter(
  e => !!e.signed || !!e.special_features
).length;

const totalBooks = editions.length;

const totalUniqueTitles = books.length;

const totalSubscriptions = subscriptions.filter(
  s => String(s.status || "").toLowerCase() === "active"
).length;

const monthlySubscriptionSpend = subscriptions
  .filter(
    s => String(s.status || "").toLowerCase() === "active"
  )
  .reduce(
    (total, s) => total + Number(s.price || 0),
    0
  );

const totalAudioEbooks = audio + ebooks;

const stats = [
  ["Total Books", totalBooks],
  ["Unique Titles", totalUniqueTitles],
  ["Books On TBR", tbrIds.length],
  ["Books DNF'd", dnfIds.length],
  ["Total Preorders", outstandingPreorders.length],
  ["Preorder Spend", money(totalPreorderSpend)],
  ["Total Subscriptions", totalSubscriptions],
  ["Subscription Spend", money(monthlySubscriptionSpend)],
  ["Special Editions", specialEditions],
  ["Hardbacks", hardbacks],
  ["Paperbacks", paperbacks],
  ["Audio / Ebooks", totalAudioEbooks],
];

const currentBook = selectedBook
  ? books.find(b => b.id === bookId(selectedBook))
  : null;









const closeModal = () => {
  setModal("");
  setEditingId(null);
  setEditingEditionId(null);
};


// Everything screens and the app shell read or call (via useFolio()).
return {
  closeScanner,
  handleBarcodeScanned,
  pickProfileImage,
  profile,
  saveProfile,
  scannerOpen,
  session,
  setProfile,
  setShowProfile,
  setTab,
  showProfile,
  addAnotherEdition,
  addBookToCollection,
  addBookToSeries,
  addCollection,
  addExistingSeriesToUniverse,
  addMonthlyBook,
  addPhysicalCopy,
  addUniverse,
  advancePreorder,
  bookForm,
  books,
  collectionBooks,
  collectionForm,
  collections,
  createSeries,
  currentBook,
  deleteSubscription,
  dnfIds,
  editSubscription,
  editingEditionId,
  editingId,
  editingPreorderId,
  editions,
  findBook,
  loadData,
  lookupLoading,
  modal,
  monthlyBookForm,
  moveSeriesBook,
  openEditBook,
  outstandingPreorders,
  physicalCopies,
  pickCoverImage,
  pickEdgeImage,
  pickPreorderCover,
  pickSpineImage,
  preForm,
  preorders,
  removeBookFromCollection,
  removeBookFromSeries,
  reorderLibrary,
  resetBookForm,
  saveBook,
  savePreorder,
  saveSubscription,
  saving,
  scanBarcode,
  search,
  selectedBook,
  selectedCollection,
  selectedPreorder,
  selectedSeries,
  selectedSubscription,
  selectedUniverse,
  series,
  seriesBooks,
  seriesByBook,
  seriesForm,
  setBookForm,
  setCollectionForm,
  setEditingEditionId,
  setEditingId,
  setEditingPreorderId,
  setModal,
  setMonthlyBookForm,
  setPreForm,
  setSearch,
  setSelectedBook,
  setSelectedCollection,
  setSelectedPreorder,
  setSelectedSeries,
  setSelectedSubscription,
  setSelectedUniverse,
  setSeriesForm,
  setSubscriptionForm,
  setUniverseForm,
  stats,
  subscriptionBooks,
  subscriptionForm,
  subscriptions,
  tab,
  tbrIds,
  toggleList,
  totalPreorderSpend,
  universeForm,
  universes,
  visibleItems,
  authLoading,
  closeModal,
  error,
  loadedForUser,
  loading,
  openNewBook,
  setError,
  userId,
};
}
