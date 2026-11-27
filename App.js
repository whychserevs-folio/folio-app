import "react-native-gesture-handler";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  BackHandler,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "./src/supabase";
import AuthScreen from "./src/AuthScreen";
import LibraryBookshelf from "./src/Bookshelf";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";

import styles from "./src/styles";
import { C } from "./src/theme";
import { TABS, FORMATS, CURRENCIES } from "./src/constants";
import {
  todayISO,
  money,
  displayDate,
  isoDate,
  monthYear,
  num,
  bookId,
} from "./src/utils/format";
import { AppButton, Field, Heading, Cover, Chip } from "./src/components/ui";

export default function App() {
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
    Alert.alert(
      "Permission needed",
      "Please allow Folio to access your photos."
    );
    return;
  }
const pickEditionCoverImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
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
    Alert.alert(
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
    Alert.alert(
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
    Alert.alert(
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
      Alert.alert(
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
    Alert.alert("Not an ISBN", `The scanned barcode (${type || "barcode"}) is not an ISBN.`);
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
    Alert.alert("Error", error.message);
    return;
  }

  Alert.alert("Profile Saved");
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

// Persist a drag-and-drop shelf order. Optimistic: update local editions
// first, then save in one RPC call; reload from the server if the save fails.
const reorderLibrary = useCallback(
  async orderedItems => {
    const editionIds = orderedItems
      .map(item => item.editionRecord?.id)
      .filter(Boolean);
    if (!editionIds.length) return;

    const position = new Map(editionIds.map((id, i) => [id, i + 1]));
    setEditions(current =>
      current.map(e =>
        position.has(e.id) ? { ...e, sort_order: position.get(e.id) } : e
      )
    );

    const { error } = await supabase.rpc("reorder_editions", {
      p_edition_ids: editionIds,
    });

    if (error) {
      Alert.alert("Could not save shelf order", error.message);
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
      Alert.alert(
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

      Alert.alert(
        "Book Lookup Failed",
        `Open Library returned ${response.status}`
      );

      return;
    }
    console.log("URL:", url);
    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));

    if (!data.docs?.length) {
      Alert.alert("Book not found");
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

    Alert.alert(
      "Find Book Error",
      String(error)
    );
  } finally {
    setLookupLoading(false);
  }
};
const saveBook = async () => {
  if (!String(bookForm.title || "").trim()) {
    Alert.alert("Title required", "Please enter a book title.");
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

    Alert.alert(
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
    Alert.alert("Couldn't save book", e?.message || String(e));
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
    Alert.alert("Copy added", "A new physical copy has been recorded.");
  } catch (e) {
    Alert.alert("Couldn't add copy", e.message);
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
    Alert.alert("Couldn't update list", e.message);
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
    Alert.alert("Couldn't create collection", e.message);
  }
};

const addBookToCollection = async (id, collectionId) => {
  if (
    collectionBooks.some(
      row => row.book_id === id && row.collection_id === collectionId
    )
  ) {
    Alert.alert("Already in collection", "This book is already here.");
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
    Alert.alert("Couldn't add book", e.message);
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
    Alert.alert("Couldn't remove book", e.message);
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
    Alert.alert("Couldn't create universe", e.message);
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
    Alert.alert("Couldn't create series", e.message);
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
    Alert.alert("Couldn't add series", e.message);
  }
};

const addBookToSeries = async (id, seriesId) => {
  if (
    seriesBooks.some(
      row => row.book_id === id && row.series_id === seriesId
    )
  ) {
    Alert.alert("Already in series", "This book is already in this series.");
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
    Alert.alert("Couldn't add book to series", e.message);
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
    Alert.alert("Couldn't remove book", e.message);
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
    Alert.alert("Couldn't reorder series", e.message);
  }
};

const savePreorder = async () => {
  console.log("SAVE PREORDER STARTED");
  if (!String(preForm.title || "").trim()) {
    Alert.alert("Title required", "Enter the book title.");
    return;
  }

  const orderDate = isoDate(preForm.order_date);

  if (preForm.order_date && !orderDate) {
    Alert.alert("Invalid date", "Use DD/MM/YYYY for the order date.");
    return;
  }

  const month = num(preForm.expected_shipping_month);
  const year = num(preForm.expected_shipping_year);

  if (
    (month !== null && (month < 1 || month > 12)) ||
    (year !== null && (year < 2000 || year > 2200)) ||
    (!!month !== !!year)
  ) {
    Alert.alert(
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

    Alert.alert(
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
    Alert.alert(
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
    Alert.alert("Couldn't add book to library", e.message);
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

          if (updateError) Alert.alert("Couldn't update", updateError.message);
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

            if (updateError) Alert.alert("Couldn't update", updateError.message);
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
              Alert.alert("Couldn't update pre-order", updateError.message);
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
    Alert.alert("Name required", "Enter a subscription name.");
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
    Alert.alert("Couldn't save subscription", e.message);
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

          if (deleteError) Alert.alert("Couldn't delete", deleteError.message);
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
    Alert.alert("Title required", "Enter the monthly book title.");
    return;
  }

  const month = num(monthlyBookForm.month);
  const year = num(monthlyBookForm.year);

  if (!month || month < 1 || month > 12 || !year || year < 2000) {
    Alert.alert("Invalid month or year", "Please check the month and year.");
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
    Alert.alert("Couldn't add monthly book", e.message);
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

            if (updateError) Alert.alert("Couldn't update", updateError.message);
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

            if (updateError) Alert.alert("Couldn't update", updateError.message);
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

        if (updateError) Alert.alert("Couldn't update", updateError.message);
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

        if (deleteError) Alert.alert("Couldn't remove", deleteError.message);
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

const renderBookDetail = () => {
  if (!currentBook) return null;

  const bookEditions = editions.filter(e => e.book_id === currentBook.id);
  const inTbr = tbrIds.includes(currentBook.id);
  const inDnf = dnfIds.includes(currentBook.id);

  return (
    <View>
      <AppButton
        label="← Back to library"
        secondary
        compact
        onPress={() => setSelectedBook(null)}
      />

      <View style={styles.detailHero}>
        <Cover
          uri={
            selectedBook.editionRecord?.cover_url ||
            currentBook.cover_url
          }
          title={currentBook.title}
          size="large"
        />

        <View style={styles.detailHeroText}>
          <Text style={styles.detailKicker}>BOOK DETAILS</Text>
          <Text style={styles.detailTitle}>{currentBook.title}</Text>
          <Text style={styles.detailAuthor}>
            {currentBook.author || "Author not recorded"}
          </Text>
          {!!currentBook.genre && (
            <Text style={styles.detailGenre}>{currentBook.genre}</Text>
          )}
        </View>
      </View>

      {!!currentBook.description && (
        <Text style={styles.detailDescription}>
          {currentBook.description}
        </Text>
      )}

      <View style={styles.detailActions}>
        <AppButton
          label={inTbr ? "Remove from TBR" : "Add to TBR"}
          secondary
          compact
          onPress={() => toggleList(currentBook.id, "TBR")}
        />
        <AppButton
          label={inDnf ? "Remove from DNF" : "Mark as DNF"}
          secondary
          compact
          onPress={() => toggleList(currentBook.id, "DNF")}
        />
        <AppButton
          label="Edit book"
          compact
          onPress={() => openEditBook(selectedBook)}
        />
        <AppButton
  label="Delete Book"
  compact
  danger
  onPress={async () => {
    Alert.alert(
      "Delete Book",
      "Are you sure you want to delete this book?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("books")
              .delete()
              .eq("id", currentBook.id);

            setSelectedBook(null);
            await loadData();
          },
        },
      ]
    );
  }}
/>
      </View>

      <View style={styles.sectionDivider} />
      <View style={styles.sectionTitleRow}>
        <View>
          <Text style={styles.sectionKicker}>THE COLLECTION</Text>
          <Text style={styles.sectionTitle}>Editions & copies</Text>
        </View>
        <AppButton
          label="+ Add edition"
          compact
          onPress={addAnotherEdition}
        />
      </View>

      {bookEditions.length === 0 && (
        <Text style={styles.mutedText}>
          No editions have been recorded for this title yet.
        </Text>
      )}

      {bookEditions.map(edition => {
        const copies = physicalCopies.filter(
          copy => copy.edition_id === edition.id
        );

        return (
          <View key={edition.id} style={styles.editionPanel}>
            <View style={styles.editionTop}>
              <Cover
                uri={edition.cover_url || currentBook.cover_url}
                title={currentBook.title}
                size="small"
              />

              <View style={styles.editionText}>
                <Text style={styles.editionName}>
                  {edition.format || "Edition"}
                </Text>
                <Text style={styles.mutedText}>
                  {edition.format || "Format not specified"}
                </Text>
                {!!edition.publisher && (
                  <Text style={styles.mutedText}>{edition.publisher}</Text>
                )}
                {!!edition.publication_date && (
                  <Text style={styles.mutedText}>
                    Published {edition.publication_date.slice(0, 4)}
                  </Text>
                )}
                {!!edition.isbn && (
                  <Text style={styles.mutedText}>ISBN {edition.isbn}</Text>
                )}
                {!!edition.signed && (
                  <Text style={styles.goldSmall}>SIGNED EDITION</Text>
                )}
                {!!edition.special_features && (
                  <Text style={styles.goldSmall}>
                    {edition.special_features}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.editionActions}>
              <AppButton
                label="Edit edition"
                compact
                secondary
                onPress={() => openEditBook({
                  ...currentBook,
                  book_id: currentBook.id,
                  editionRecord: edition,
                })}
              />
              <AppButton
                label="+ Physical copy"
                compact
                onPress={() => addPhysicalCopy(edition)}
              />
            </View>

            <View style={styles.copyList}>
              <Text style={styles.copyListHeading}>
                PHYSICAL COPIES · {copies.length}
              </Text>

              {copies.length === 0 && (
                <Text style={styles.mutedText}>No physical copies recorded.</Text>
              )}

              {copies.map((copy, index) => (
                <View key={copy.id} style={styles.copyRow}>
                  <View style={styles.copyNumber}>
                    <Text style={styles.copyNumberText}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.copyCondition}>
                      {copy.condition || "Condition not recorded"}
                      {copy.signed ? " · Signed" : ""}
                    </Text>
                    {!!copy.notes && (
                      <Text style={styles.mutedText}>{copy.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Add to collections</Text>

      {collections.map(collection => {
        const alreadyAdded = collectionBooks.some(
          row =>
            row.collection_id === collection.id &&
            row.book_id === currentBook.id
        );

        return (
          <View key={collection.id} style={styles.collectionAddRow}>
            <Text style={styles.bodyText}>{collection.name}</Text>
            <AppButton
              label={alreadyAdded ? "Added" : "Add"}
              compact
              secondary
              disabled={alreadyAdded}
              onPress={() =>
                addBookToCollection(currentBook.id, collection.id)
              }
            />
          </View>
        );
      })}

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Series</Text>

      {series.map(s => {
        const alreadyAdded = seriesBooks.some(
          row => row.series_id === s.id && row.book_id === currentBook.id
        );

        return (
          <View key={s.id} style={styles.collectionAddRow}>
            <Text style={styles.bodyText}>{s.name}</Text>
            <AppButton
              label={alreadyAdded ? "Added" : "Add"}
              compact
              secondary
              disabled={alreadyAdded}
              onPress={() => addBookToSeries(currentBook.id, s.id)}
            />
          </View>
        );
      })}
    </View>
  );
};

const renderLibrary = () => (
  <>
    <View style={styles.libraryActions}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your library"
          placeholderTextColor={C.faint}
          style={styles.searchInput}
        />
      </View>
    </View>

    <LibraryBookshelf
      items={visibleItems}
      onBookPress={setSelectedBook}
      seriesByBook={seriesByBook}
      // Only the full, unfiltered library has a complete order to save.
      onReorder={search.trim() ? undefined : reorderLibrary}
    />
  </>
);

const renderCollections = () => {
  if (selectedSeries) {
    const links = seriesBooks
      .filter(row => row.series_id === selectedSeries.id)
      .sort(
        (a, b) =>
          Number(a.reading_order || 999) -
          Number(b.reading_order || 999)
      );

    return (
      <>
        <AppButton
          label="← All collections"
          compact
          secondary
          onPress={() => setSelectedSeries(null)}
        />
        <Heading
          kicker="SERIES"
          title={selectedSeries.name}
          subtitle="Arrange the books in your preferred reading order."
        />

        {links.map((link, index) => {
          const book = books.find(b => b.id === link.book_id);
          const bookEditions = editions.filter(
  e => e.book_id === book.id
);
          if (!book) return null;

          return (
            <View key={link.id} style={styles.seriesBookRow}>
              <View style={styles.seriesOrder}>
                <Text style={styles.seriesOrderText}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>
              <Pressable
                style={styles.seriesBookInfo}
                onPress={() => setSelectedBook(book)}
              >
                <View style={{ flex: 1 }}>
  <Text style={styles.cardTitle}>
    {book.title}
  </Text>

  <Text style={styles.mutedText}>
    {book.author}
  </Text>

  {bookEditions.map(edition => (
    <View
      key={edition.id}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <Image
        source={{
          uri: edition.cover_url || book.cover_url,
        }}
        style={{
          width: 45,
          height: 65,
          borderRadius: 4,
          marginRight: 10,
        }}
      />

      <View>
        <Text
          style={{
            color: "#F0EBE7",
            fontSize: 12,
          }}
        >
          {edition.format}
        </Text>

        {!!edition.signed && (
          <Text
            style={{
              color: "#A39B9B",
              fontSize: 10,
            }}
          >
            Signed Edition
          </Text>
        )}

        {!!edition.edition_name && (
          <Text
            style={{
              color: "#A39B9B",
              fontSize: 10,
            }}
          >
            {edition.edition_name}
          </Text>
        )}
      </View>
    </View>
  ))}
                </View>
              </Pressable>
              <View style={styles.seriesMoveButtons}>
                <AppButton
                  label="↑"
                  compact
                  secondary
                  disabled={index === 0}
                  onPress={() => moveSeriesBook(link, -1)}
                />
                <AppButton
                  label="↓"
                  compact
                  secondary
                  disabled={index === links.length - 1}
                  onPress={() => moveSeriesBook(link, 1)}
                />
                <AppButton
                  label="×"
                  compact
                  danger
                  onPress={() => removeBookFromSeries(link)}
                />
              </View>
            </View>
          );
        })}
       <AppButton
  label="+ Add Book To Series"
  compact
  onPress={() =>
    Alert.alert(
      "Coming Soon",
      "Book search for series is coming next."
    )
  }
/>
      </>
    );
  }

  if (selectedCollection) {
    const links = collectionBooks.filter(
      row => row.collection_id === selectedCollection.id
    );

    const items = links
      .map(link => {
        const book = books.find(b => b.id === link.book_id);
        if (!book) return [];
        const bookEditions = editions.filter(e => e.book_id === book.id);

        if (!bookEditions.length) return [book];

        return bookEditions.map(edition => ({
          ...book,
          book_id: book.id,
          editionRecord: edition,
          cover_url: edition.cover_url || book.cover_url,
        }));
      })
      .flat();

    return (
      <>
        <AppButton
          label="← All collections"
          compact
          secondary
          onPress={() => setSelectedCollection(null)}
        />
        <Heading
          kicker="CURATED COLLECTION"
          title={selectedCollection.name}
          subtitle={selectedCollection.description}
        />

        <LibraryBookshelf
          items={items}
          onBookPress={setSelectedBook}
          seriesByBook={seriesByBook}
        />
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>Add books</Text>

        {books
          .filter(book => !links.some(link => link.book_id === book.id))
          .map(book => (
            <Pressable
              key={book.id}
              style={styles.simpleAddRow}
              onPress={() =>
                addBookToCollection(book.id, selectedCollection.id)
              }
            >
              <Text style={styles.goldSmall}>＋</Text>
              <Text style={styles.bodyText}>{book.title}</Text>
            </Pressable>
          ))}

        <Text style={styles.sectionTitle}>Books in this collection</Text>
        {links.map(link => {
          const book = books.find(b => b.id === link.book_id);
          if (!book) return null;

          return (
            <View key={link.id} style={styles.collectionAddRow}>
              <Text style={styles.bodyText}>{book.title}</Text>
              <AppButton
                label="Remove"
                compact
                danger
                onPress={() => removeBookFromCollection(link)}
              />
            </View>
          );
        })}
      </>
    );
  }

  if (selectedUniverse) {
    const universeSeries = series.filter(
      s => s.universe_id === selectedUniverse.id
    );

    return (
      <>
        <AppButton
          label="← All collections"
          compact
          secondary
          onPress={() => setSelectedUniverse(null)}
        />
        <Heading
          kicker="UNIVERSE"
          title={selectedUniverse.name}
          subtitle={selectedUniverse.description}
        />

        {universeSeries.map(s => (
          <Pressable
            key={s.id}
            style={styles.featureCard}
            onPress={() => setSelectedSeries(s)}
          >
            <Text style={styles.featureCardKicker}>SERIES</Text>
            <Text style={styles.featureCardTitle}>{s.name}</Text>
            <Text style={styles.mutedText}>
              {seriesBooks.filter(row => row.series_id === s.id).length} books
            </Text>
            <Text style={styles.featureArrow}>↗</Text>
          </Pressable>
        ))}

        <View style={styles.collectionActions}>
          <AppButton
            label="+ Add existing series"
            secondary
            onPress={() => setModal("existingSeries")}
          />
          <AppButton
            label="+ New series"
            onPress={() => {
              setSeriesForm({
                name: "",
                description: "",
                universe_id: selectedUniverse.id,
              });
              setModal("series");
            }}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Heading
        kicker="READING WORLDS"
        title="Universes & Series"
        subtitle="Explore connected books, universes, and reading order."
      />

      <View style={styles.detailActions}>

        <AppButton
          label="+ Universe"
          compact
          secondary
          onPress={() => setModal("universe")}
        />

        <AppButton
          label="+ Series"
          compact
          secondary
          onPress={() => {
            setSeriesForm({
              name: "",
              description: "",
              universe_id: "",
            });
            setModal("series");
          }}
        />
      </View>

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionKicker}>
        UNIVERSES
      </Text>
      <Text style={styles.sectionTitle}>Universes</Text>

      {universes.map(universe => (
        <Pressable
          key={universe.id}
          style={styles.featureCard}
          onPress={() => setSelectedUniverse(universe)}
        >
          <Text style={styles.featureCardKicker}>UNIVERSE</Text>
          <Text style={styles.featureCardTitle}>{universe.name}</Text>
          <Text style={styles.mutedText}>
            {series.filter(
              s => s.universe_id === universe.id
            ).length} series
          </Text>

          <View style={{ marginTop: 12 }}>
            {series
              .filter(s => s.universe_id === universe.id)
              .slice(0, 4)
              .map(s => (
                <Text
                  key={s.id}
                  style={styles.goldSmall}
                >
                  • {s.name}
                </Text>
              ))}
          </View>
          <Text style={styles.featureArrow}>↗</Text>
        </Pressable>
      ))}

      <View style={styles.sectionDivider} />
      <Text style={styles.sectionKicker}>
        SERIES
      </Text>
      <Text style={styles.sectionTitle}>series</Text>

      {series
        .filter(s => !s.universe_id)
        .map(s => (
          <Pressable
            key={s.id}
            style={styles.featureCard}
            onPress={() => setSelectedSeries(s)}
          >
            <Text style={styles.featureCardKicker}>SERIES</Text>
            <Text style={styles.featureCardTitle}>{s.name}</Text>
            <Text style={styles.mutedText}>
              {seriesBooks.filter(row => row.series_id === s.id).length} books
            </Text>
            <Text style={styles.featureArrow}>↗</Text>
          </Pressable>
        ))}
    </>
  );
};

const renderTbrOrDnf = () => (
  <>
    <Heading
      kicker="READING JOURNAL"
      title={tab === "TBR" ? "To Be Read" : "Did Not Finish"}
      subtitle={
        tab === "TBR"
          ? "Your next stories, waiting patiently."
          : "Books you've set aside. Your library remains untouched."
      }
    />
    <View style={styles.searchBox}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search titles..."
        placeholderTextColor={C.faint}
        style={styles.searchInput}
      />
    </View>
    <LibraryBookshelf
      items={visibleItems}
      onBookPress={setSelectedBook}
      seriesByBook={seriesByBook}
    />
  </>
);

const renderPreorders = () => (
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

const renderSubscriptions = () => (
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

        </View>
      );
    })}
  </>
);

const renderStats = () => (
  <>
    <Heading
      kicker="YOUR COLLECTION"
      title="Collection Statistics"
      subtitle="A snapshot of your library, editions, subscriptions and pre-orders."
    />

    <View style={styles.statsGrid}>
      {stats.map(([label, value], index) => (
        <View key={label} style={styles.statCard}>
          <Text style={styles.statIndex}>
            {String(index + 1).padStart(2, "0")}
          </Text>

          <Text style={styles.statValue}>
            {value}
          </Text>

          <Text style={styles.statLabel}>
            {label}
          </Text>
        </View>
      ))}
    </View>
  </>
);

const renderMain = () => {
  if (selectedBook) return renderBookDetail();
  if (selectedPreorder) return renderPreorderDetail();
  if (tab === "Library") return renderLibrary();
  if (tab === "Collections") return renderCollections();
  if (tab === "TBR" || tab === "DNF") return renderTbrOrDnf();
  if (tab === "Pre-orders") return renderPreorders();
  if (tab === "Subscriptions") return renderSubscriptions();
  if (tab === "Stats") return renderStats();
  return null;
};
const renderPreorderDetail = () => {
  if (!selectedPreorder) return null;

  return (
    <>
      <AppButton
        label="← Back to pre-orders"
        secondary
        compact
        onPress={() => setSelectedPreorder(null)}
      />

      <Heading
        kicker="PREORDER"
        title={selectedPreorder.title}
        subtitle={selectedPreorder.retailer}
      />

      <Cover
        uri={selectedPreorder.cover_url}
        title={selectedPreorder.title}
      />
      <Text style={styles.bodyText}>
        Retailer: {selectedPreorder.retailer}
      </Text>

      <Text style={styles.bodyText}>
        Order Date: {displayDate(selectedPreorder.order_date)}
      </Text>

      <Text style={styles.bodyText}>
        Expected Shipping: {
          monthYear(
            selectedPreorder.expected_shipping_month,
            selectedPreorder.expected_shipping_year
          ) || "Not specified"
        }
      </Text>
      <AppButton
        label="Change Cover"
        onPress={pickPreorderCover}
      />

      <AppButton
        label="Edit Details"
        secondary
        onPress={() => {
          setPreForm({
            title: selectedPreorder.title || "",
            author: selectedPreorder.author || "",
            retailer: selectedPreorder.retailer || "",
            isbn: selectedPreorder.isbn || "",
            cover_url: selectedPreorder.cover_url || "",
            notes: selectedPreorder.notes || "",
          });

          setModal("preorder");
        }}
      />
    </>
  );
};

const closeModal = () => {
  setModal("");
  setEditingId(null);
  setEditingEditionId(null);
};

const renderModal = () => {
  if (modal === "book") {
    return (
      <>
        <Text style={styles.modalTitle}>
          {editingId
            ? editingEditionId
              ? "Edit Book & Edition"
              : "Add Edition"
            : "Add Book"}
        </Text>

        <Text style={styles.modalIntro}>
          Record the book itself separately from the edition you own.
        </Text>

        <View style={styles.coverHero}>
          {bookForm.cover_url ? (
            <Pressable onPress={pickCoverImage}>
  <Image
    source={{ uri: bookForm.cover_url }}
    style={styles.coverHeroImage}
    resizeMode="cover"
  />
</Pressable>
          ) : (
            
            <Pressable
              style={styles.coverHeroPlaceholder}
              onPress={pickCoverImage}
            >
              <Text style={styles.goldSmall}>
                Auto-found cover will appear here
              </Text>

              <AppButton
                label="Add Cover Image"
                onPress={pickCoverImage}
              />

              <Text style={styles.mutedText}>
                Tap to add your own cover
              </Text>
            </Pressable>
          )}
        </View>

        <Field
          label="Title"
          value={bookForm.title}
          onChangeText={v =>
            setBookForm(p => ({ ...p, title: v }))
          }
        />

        <Field
          label="Author"
          value={bookForm.author}
          onChangeText={v =>
            setBookForm(p => ({ ...p, author: v }))
          }
        />
        <Field
          label="ISBN"
          value={bookForm.isbn}
          onChangeText={v =>
            setBookForm(p => ({ ...p, isbn: v }))
          }
        />

        <AppButton
          label={
            lookupLoading
              ? "Finding..."
              : "Find Book"
          }
          onPress={() => findBook()}
        />

        <AppButton
          label="Scan Barcode"
          onPress={scanBarcode}
        />

        <Field
          label="Description"
          value={bookForm.description}
          multiline
          onChangeText={v =>
            setBookForm(p => ({ ...p, description: v }))
          }
        />

        <Field
          label="Genre"
          value={bookForm.genre}
          onChangeText={v =>
            setBookForm(p => ({ ...p, genre: v }))
          }
        />

        <Field
          label="Publication Year"
          value={bookForm.publication_year}
          keyboardType="numeric"
          onChangeText={v =>
            setBookForm(p => ({
              ...p,
              publication_year: v,
            }))
          }
        />
        <Text style={styles.modalSectionTitle}>
          DISPLAY STYLE
        </Text>

        <View style={styles.chipRow}>
          {["spine", "cover", "edge", "stack"].map(style => (
            <Chip
              key={style}
              label={style}
              selected={bookForm.display_style === style}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  display_style: style,
                }))
              }
            />
          ))}
        </View>

        <View style={styles.modalSection}>
          <Text style={styles.modalSectionTitle}>
            EDITION
          </Text>

          <Text style={styles.fieldLabel}>
            Format
          </Text>

          <View style={styles.chipRow}>
            {FORMATS.map(format => (
              <Chip
                key={format}
                label={format}
                selected={bookForm.format === format}
                onPress={() =>
                  setBookForm(p => ({
                    ...p,
                    format,
                  }))
                }
              />
            ))}
          </View>

          <Field
            label="Edition name"
            value={bookForm.edition_name}
            onChangeText={v =>
              setBookForm(p => ({
                ...p,
                edition_name: v,
              }))
            }
          />

        <View style={styles.imageActionRow}>
  <AppButton
    label={
      bookForm.edition_cover_url
        ? "Change Edition Cover"
        : "Add Edition Cover"
    }
    secondary
    onPress={pickCoverImage}
    compact
  />

  <AppButton
    label={
      bookForm.spine_image_url
        ? "Change Spine"
        : "Add Spine Image"
    }
    secondary
    onPress={pickSpineImage}
    compact
  />

  <AppButton
    label={
      bookForm.sprayed_edge_url
        ? "Change Edges"
        : "Add Edge Image"
    }
    secondary
    onPress={pickEdgeImage}
    compact
  />
</View>

          {bookForm.spine_image_url ? (
            <View style={styles.imagePreviewRow}>
              <Image
                source={{ uri: bookForm.spine_image_url }}
                resizeMode="cover"
                style={styles.spinePreview}
              />
              <Text style={styles.mutedText}>Spine image selected</Text>
            </View>
          ) : null}

          {bookForm.sprayed_edge_url ? (
            <View style={styles.imagePreviewRow}>
              <Image
                source={{ uri: bookForm.sprayed_edge_url }}
                resizeMode="cover"
                style={styles.edgePreview}
              />
              <Text style={styles.mutedText}>Sprayed-edge image selected</Text>
            </View>
          ) : null}

          <Field
            label="Condition"
            value={bookForm.condition}
            onChangeText={v =>
              setBookForm(p => ({
                ...p,
                condition: v,
              }))
            }
          />

          <Field
            label="Notes"
            value={bookForm.notes}
            multiline
            onChangeText={v =>
              setBookForm(p => ({
                ...p,
                notes: v,
              }))
            }
          />

          <Text style={styles.modalSectionTitle}>
            COLLECTOR STATUS
          </Text>

          <View style={styles.chipRow}>
            <Chip
              label="Signed"
              selected={bookForm.signed}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  signed: !p.signed,
                }))
              }
            />

            <Chip
              label="TBR"
              selected={bookForm.is_tbr}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  is_tbr: !p.is_tbr,
                }))
              }
            />

            <Chip
              label="DNF"
              selected={bookForm.is_dnf}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  is_dnf: !p.is_dnf,
                }))
              }
            />
          </View>

        </View>

        <AppButton
          label={saving ? "Saving..." : "Save"}
          disabled={saving}
          onPress={saveBook}
        />

      </>
    );
  }

  if (modal === "collectionChooser") {
    return (
      <>
        <Text style={styles.modalTitle}>What would you like to add?</Text>
        <Text style={styles.modalIntro}>
          Choose the type of collection record you want to create.
        </Text>
        <AppButton
          label="Collection"
          onPress={() => setModal("collection")}
        />
        <AppButton
          label="Universe"
          secondary
          onPress={() => setModal("universe")}
        />
        <AppButton
          label="Series"
          secondary
          onPress={() => {
            setSeriesForm({
              name: "",
              description: "",
              universe_id: "",
            });
            setModal("series");
          }}
        />
      </>
    );
  }

  if (modal === "existingSeries") {
    const availableSeries = series
      .filter(s => s.universe_id !== selectedUniverse?.id)
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );

    return (
      <>
        <Text style={styles.modalTitle}>Add existing series</Text>
        <Text style={styles.modalIntro}>
          Choose a series that already exists in Folio to add it to{" "}
          {selectedUniverse?.name || "this universe"}.
        </Text>
        {availableSeries.length ? (
          availableSeries.map(item => (
            <Pressable
              key={item.id}
              style={styles.selectCard}
              onPress={() => addExistingSeriesToUniverse(item.id)}
            >
              <Text style={styles.selectCardTitle}>{item.name}</Text>
              {!!item.description && (
                <Text style={styles.mutedText}>{item.description}</Text>
              )}
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No other series available</Text>
            <Text style={styles.emptyText}>
              Create a new series or move one here from another universe.
            </Text>
          </View>
        )}
      </>
    );
  }

  if (modal === "collection") {
    return (
      <>
        <Text style={styles.modalTitle}>New collection</Text>
        <Field
          label="Collection name"
          value={collectionForm.name}
          onChangeText={v => setCollectionForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={collectionForm.description}
          onChangeText={v =>
            setCollectionForm(p => ({ ...p, description: v }))
          }
          multiline
        />
        <AppButton label="Create collection" onPress={addCollection} />
      </>
    );
  }

  if (modal === "universe") {
    return (
      <>
        <Text style={styles.modalTitle}>New universe</Text>
        <Field
          label="Universe name"
          value={universeForm.name}
          onChangeText={v => setUniverseForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={universeForm.description}
          onChangeText={v => setUniverseForm(p => ({ ...p, description: v }))}
          multiline
        />
        <AppButton label="Create universe" onPress={addUniverse} />
      </>
    );
  }

  if (modal === "series") {
    return (
      <>
        <Text style={styles.modalTitle}>New series</Text>
        <Field
          label="Series name"
          value={seriesForm.name}
          onChangeText={v => setSeriesForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={seriesForm.description}
          onChangeText={v => setSeriesForm(p => ({ ...p, description: v }))}
          multiline
        />
        <Text style={styles.fieldLabel}>
          Add to Existing Universe
        </Text>


        <View style={styles.chipRow}>
          {universes.map(u => (
            <Chip
              key={u.id}
              label={u.name}
              selected={seriesForm.universe_id === u.id}
              onPress={() =>
                setSeriesForm(p => ({
                  ...p,
                  universe_id: u.id,
                }))
              }
            />
          ))}
        </View>

        <AppButton
          label="Create New Universe"
          onPress={() => setModal("universe")}
        />

        <AppButton label="Create series" onPress={createSeries} />
      </>
    );
  }

  if (modal === "preorder") {
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
    resizeMode="cover"
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

  if (modal === "subscription") {
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

  if (modal === "monthlyBook") {
    return (
      <>
        <Text style={styles.modalTitle}>Add monthly book</Text>
        <Field
          label="Book title"
          value={monthlyBookForm.title}
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, title: v }))}
        />
        <Field
          label="Author"
          value={monthlyBookForm.author}
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, author: v }))}
        />
        <Field
          label="Edition name"
          value={monthlyBookForm.edition_name}
          onChangeText={v =>
            setMonthlyBookForm(p => ({ ...p, edition_name: v }))
          }
        />
        <Field
          label="Cover URL"
          value={monthlyBookForm.cover_url}
          onChangeText={v =>
            setMonthlyBookForm(p => ({ ...p, cover_url: v }))
          }
        />
        <Field
          label="Month (1–12)"
          value={monthlyBookForm.month}
          keyboardType="numeric"
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, month: v }))}
        />
        <Field
          label="Year"
          value={monthlyBookForm.year}
          keyboardType="numeric"
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, year: v }))}
        />
        <AppButton label="Add monthly book" onPress={addMonthlyBook} />
      </>
    );
  }

  return null;
};

if (authLoading) {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={styles.mutedText}>Opening Folio...</Text>
    </SafeAreaView>
  );
}

if (!session) return <AuthScreen />;

return (
  <GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor={C.bg} />

    <View style={styles.topBar}>
      <View>
        <Text style={styles.brand}>folio</Text>
        <Text style={styles.brandSubtitle}>Your books, beautifully organised.</Text>
      </View>
      <Pressable
  onPress={() => setShowProfile(true)}
  style={styles.signOutButton}
>
  {profile?.avatar_url ? (
    <Image
      source={{ uri: profile.avatar_url }}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
      }}
    />
  ) : (
    <Text style={styles.signOutText}>👤</Text>
  )}
</Pressable>

    </View>

    <View style={styles.navBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {TABS.map(item => (
          <Pressable
            key={item}
            onPress={() => {
              setTab(item);
              setSearch("");
              setSelectedBook(null);
              setSelectedCollection(null);
              setSelectedUniverse(null);
              setSelectedSeries(null);
              setSelectedSubscription(null);
            }}
            style={[styles.navItem, tab === item && styles.navItemActive]}
          >
            <Text
              style={[
                styles.navText,
                tab === item && styles.navTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>

    {!!error && (
      <Pressable style={styles.errorBanner} onPress={() => setError("")}>
        <Text style={styles.errorText}>{error} ×</Text>
      </Pressable>
    )}
    {loading && loadedForUser !== userId ? (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.mutedText}>
          Loading your collection...
        </Text>
      </View>
    ) : (
      <>
        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.mainContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderMain()}
        </ScrollView>

        {tab === "Library" && (
          <View style={styles.libraryFabWrap}>
            <Pressable
              onPress={openNewBook}
              style={styles.libraryFab}
            >
              <Text style={styles.libraryFabText}>+</Text>
            </Pressable>

            <Text style={styles.libraryFabLabel}>
              Add Book
            </Text>
          </View>
        )}
      </>
    )}

    <Modal
      visible={scannerOpen}
      animationType="slide"
      onRequestClose={closeScanner}
    >
      <View style={styles.scannerScreen}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
            ],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerTop}>
            <Text style={styles.scannerTitle}>Scan ISBN</Text>
            <Pressable onPress={closeScanner} style={styles.scannerClose}>
              <Text style={styles.scannerCloseText}>Close ×</Text>
            </Pressable>
          </View>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>
            Place the ISBN barcode inside the frame.
          </Text>
        </View>
      </View>
    </Modal>
    <Modal
      visible={showProfile}
      transparent
      animationType="slide"
      onRequestClose={() => setShowProfile(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <View style={styles.modalTopBar}>
            <Text style={styles.kicker}>
              FOLIO · PROFILE
            </Text>

            <Pressable
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.modalClose}>
                Close ×
              </Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">

            <View style={styles.profileHeader}>

              <Pressable onPress={pickProfileImage}>
               {profile?.avatar_url ? (
  <>
    {console.log("RENDERING AVATAR:", profile.avatar_url)}

    <Image
      source={{ uri: profile.avatar_url }}
      style={styles.profileAvatar}
      onLoad={() => console.log("AVATAR LOADED")}
      onError={(e) =>
        console.log(
          "AVATAR ERROR",
          JSON.stringify(e.nativeEvent, null, 2)
        )
      }
    />
  </>
) : (
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarLetter}>
                      {(profile?.display_name ||
                        profile?.username ||
                        "F")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.profileDisplayName}>
                {profile?.display_name || "Display Name"}
              </Text>

              <Text style={styles.profileUsername}>
                @{profile?.username}
              </Text>

              {!!profile?.bio && (
                <Text style={styles.profileBio}>
                  {profile.bio}
                </Text>
              )}
            </View>

            <Text style={styles.modalSectionTitle}>
              PROFILE
            </Text>

            <Field
              label="Display Name"
              value={profile.display_name || ""}
              onChangeText={v =>
                setProfile(p => ({
                  ...p,
                  display_name: v,
                }))
              }
            />

            <Field
              label="Username"
              value={profile.username || ""}
              onChangeText={() => { }}
            />

            <Text style={styles.mutedText}>
              Username cannot currently be changed.
            </Text>

            <Field
              label="Bio"
              value={profile.bio || ""}
              multiline
              onChangeText={v =>
                setProfile(p => ({
                  ...p,
                  bio: v,
                }))
              }
            />

            <Text style={styles.modalSectionTitle}>
              PRIVACY
            </Text>

            <View style={styles.chipRow}>

              <Chip
                label="Social Features"
                selected={profile.social_enabled}
                onPress={() =>
                  setProfile(p => ({
                    ...p,
                    social_enabled: !p.social_enabled,
                  }))
                }
              />

              <Chip
                label="Public Library"
                selected={profile.library_public}
                onPress={() =>
                  setProfile(p => ({
                    ...p,
                    library_public: !p.library_public,
                  }))
                }
              />

              <Chip
                label="Public Collections"
                selected={profile.collections_public}
                onPress={() =>
                  setProfile(p => ({
                    ...p,
                    collections_public: !p.collections_public,
                  }))
                }
              />

            </View>

            <Text style={styles.modalSectionTitle}>
              ACCOUNT
            </Text>

            <Text style={styles.bodyText}>
              {session?.user?.email}
            </Text>

            <AppButton
              label="Save Profile"
              onPress={saveProfile}
            />

            <AppButton
              label="Sign Out"
              danger
              onPress={() => supabase.auth.signOut()}
            />

          </ScrollView>
        </View>
      </View>
    </Modal>
    <Modal
      visible={!!modal}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalPanel}>
          <View style={styles.modalTopBar}>
            <Text style={styles.kicker}>FOLIO · COLLECTION RECORD</Text>
            <Pressable onPress={closeModal}>
              <Text style={styles.modalClose}>Close ×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: 350,
            }}
          >
            {renderModal()}
            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>
   </GestureHandlerRootView>
);
}
