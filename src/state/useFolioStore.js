import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BackHandler } from "react-native";
import { useCameraPermissions } from "expo-camera";

import { supabase } from "../supabase";
import { todayISO, displayDate, bookId } from "../utils/format";
import { notify } from "../components/Toast";

import { createImagesActions } from "./actions/images";
import { createBooksActions } from "./actions/books";
import { createCollectionsActions } from "./actions/collections";
import { createPreordersActions } from "./actions/preorders";
import { createSubscriptionsActions } from "./actions/subscriptions";
import { computeStats } from "./stats";

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

 

// Cover photo for one specific edition (e.g. a special edition), separate
// from the book's main cover. Was accidentally nested inside pickCoverImage,
// so the "Add Edition Cover" button set the book cover instead.


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


const currentBook = selectedBook
  ? books.find(b => b.id === bookId(selectedBook))
  : null;


// Actions, grouped by area (src/state/actions/*). Order matters: later
// groups use actions from earlier ones.
const {
  pickCoverImage,
  pickEditionCoverImage,
  pickProfileImage,
  pickSpineImage,
  pickEdgeImage,
  uploadImageUri,
  pickPreorderCover,
} = createImagesActions({
  setBookForm,
  setPreForm,
  setProfile,
  userId,
});

const {
  scanBarcode,
  closeScanner,
  handleBarcodeScanned,
  resetBookForm,
  openNewBook,
  openEditBook,
  findBook,
  saveBook,
  addAnotherEdition,
  addPhysicalCopy,
  toggleList,
  addReceivedBookToLibrary,
} = createBooksActions({
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
});

const {
  addCollection,
  addBookToCollection,
  removeBookFromCollection,
  addUniverse,
  createSeries,
  addExistingSeriesToUniverse,
  addBookToSeries,
  removeBookFromSeries,
  moveSeriesBook,
} = createCollectionsActions({
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
});

const {
  savePreorder,
  advancePreorder,
} = createPreordersActions({
  addReceivedBookToLibrary,
  editingPreorderId,
  loadData,
  preForm,
  setEditingPreorderId,
  setModal,
  setSaving,
  uploadImageUri,
  userId,
});

const {
  saveSubscription,
  editSubscription,
  deleteSubscription,
  addMonthlyBook,
  updateMonthlyBook,
  removeMonthlyBook,
} = createSubscriptionsActions({
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
});

const { outstandingPreorders, totalPreorderSpend, stats } = computeStats({
  books,
  dnfIds,
  editions,
  preorders,
  subscriptions,
  tbrIds,
});

const closeModal = () => {
  setModal("");
  setEditingId(null);
  setEditingEditionId(null);
};


// Everything screens and the app shell read or call (via useFolio()).
return {
  pickEditionCoverImage,
  removeMonthlyBook,
  updateMonthlyBook,
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
