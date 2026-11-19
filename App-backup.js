import React, { useMemo, useState } from "react";
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView,
  StatusBar, Modal, Switch, StyleSheet, Platform
} from "react-native";

const initialBooks = [
  { id: "1", title: "The Midnight Library", author: "Matt Haig", format: "Physical", binding: "Hardback", tbr: true, edition: "Standard", special: [] },
  { id: "2", title: "A Court of Thorns and Roses", author: "Sarah J. Maas", format: "Physical", binding: "Paperback", tbr: false, edition: "Standard", special: [] },
  { id: "3", title: "The Very Secret Society of Irregular Witches", author: "Sangu Mandanna", format: "Ebook", binding: "", tbr: true, edition: "Standard", special: [] },
];

const ink = "#242722";
const muted = "#777D75";
const paper = "#F7F7F3";
const line = "#E7E8E1";
const accent = "#687B68";

function Pill({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function BookTile({ book, onToggleTbr }) {
  const initials = book.title.split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase();
  return (
    <View style={styles.bookCard}>
      <View style={[styles.cover, { backgroundColor: ["#DCE4D8", "#E8DDD1", "#DCE2E8", "#E8E3D2"][Number(book.id) % 4] }]}>
        <Text style={styles.coverMonogram}>{initials}</Text>
        <Text style={styles.coverTitle} numberOfLines={3}>{book.title}</Text>
        <Text style={styles.coverAuthor} numberOfLines={1}>{book.author}</Text>
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
      <Text style={styles.bookMeta} numberOfLines={1}>{book.author}</Text>
      <Text style={styles.bookMeta}>{book.format}{book.binding ? ` · ${book.binding}` : ""}</Text>
      {!!book.special?.length && <Text style={styles.specialLabel}>SPECIAL EDITION</Text>}
      <TouchableOpacity onPress={() => onToggleTbr(book.id)} style={styles.tbrToggle}>
        <Text style={styles.tbrToggleText}>{book.tbr ? "✓ On TBR" : "+ Add to TBR"}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [books, setBooks] = useState(initialBooks);
  const [tab, setTab] = useState("Library");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [format, setFormat] = useState("Physical");
  const [binding, setBinding] = useState("Hardback");
  const [edition, setEdition] = useState("Standard");
  const [tbr, setTbr] = useState(false);
  const [specialNote, setSpecialNote] = useState("");

  const visibleBooks = useMemo(() => {
    let list = books;
    if (tab === "TBR") list = list.filter(b => b.tbr);
    if (filter !== "All") list = list.filter(b => b.format === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(b => `${b.title} ${b.author}`.toLowerCase().includes(q));
    return list;
  }, [books, tab, filter, query]);

  const toggleTbr = id => setBooks(current => current.map(b => b.id === id ? { ...b, tbr: !b.tbr } : b));

  const addBook = () => {
    if (!title.trim()) return;
    const special = specialNote.trim() ? [specialNote.trim()] : [];
    setBooks(current => [{
      id: String(Date.now()), title: title.trim(), author: author.trim() || "Author not added",
      format, binding: format === "Physical" ? binding : "", tbr, edition, special
    }, ...current]);
    setTitle(""); setAuthor(""); setFormat("Physical"); setBinding("Hardback");
    setEdition("Standard"); setTbr(false); setSpecialNote(""); setModal(false); setTab("Library"); setFilter("All");
  };

  const totalCopies = books.length;
  const tbrCount = books.filter(b => b.tbr).length;
  const specialCount = books.filter(b => b.edition !== "Standard" || b.special.length).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={paper} />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR PERSONAL COLLECTION</Text>
          <Text style={styles.brand}>folio<Text style={styles.brandDot}>.</Text></Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModal(true)}>
          <Text style={styles.addButtonText}>＋ Add book</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {["Library", "TBR", "Collection"].map(item => (
          <TouchableOpacity key={item} onPress={() => { setTab(item); setFilter("All"); }} style={[styles.tab, tab === item && styles.tabSelected]}>
            <Text style={[styles.tabText, tab === item && styles.tabTextSelected]}>{item === "TBR" ? `My TBR (${tbrCount})` : item === "Library" ? "My Library" : "Collection"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "Collection" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>Your collection</Text>
          <Text style={styles.pageSub}>A little overview of the books you own.</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}><Text style={styles.statNumber}>{totalCopies}</Text><Text style={styles.statLabel}>TOTAL BOOKS</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{tbrCount}</Text><Text style={styles.statLabel}>ON YOUR TBR</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{specialCount}</Text><Text style={styles.statLabel}>SPECIAL EDITIONS</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{books.filter(b => b.format === "Physical").length}</Text><Text style={styles.statLabel}>PHYSICAL</Text></View>
          </View>
          <Text style={styles.sectionTitle}>Formats</Text>
          {["Physical", "Ebook", "Audiobook"].map(f => <View key={f} style={styles.formatRow}><Text style={styles.formatName}>{f}</Text><Text style={styles.formatCount}>{books.filter(b => b.format === f).length}</Text></View>)}
          <Text style={styles.note}>Your counts will grow as you add your own books. This starter uses sample entries so you can explore the layout.</Text>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>{tab === "TBR" ? "Your to-be-read shelf" : "Your library"}</Text>
          <Text style={styles.pageSub}>{tab === "TBR" ? "Books you own and have set aside to read." : "Every book in your collection, all in one place."}</Text>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search titles or authors" placeholderTextColor="#969B93" style={styles.search} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {["All", "Physical", "Ebook", "Audiobook"].map(f => <Pill key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />)}
          </ScrollView>
          {visibleBooks.length ? (
            <View style={styles.bookGrid}>{visibleBooks.map(book => <BookTile key={book.id} book={book} onToggleTbr={toggleTbr} />)}</View>
          ) : (
            <View style={styles.empty}><Text style={styles.emptyTitle}>Nothing here just yet</Text><Text style={styles.emptyText}>Try another search or add a book to your collection.</Text><TouchableOpacity onPress={() => setModal(true)}><Text style={styles.emptyAction}>＋ Add your first book</Text></TouchableOpacity></View>
          )}
        </ScrollView>
      )}

      <View style={styles.bottomHint}><Text style={styles.bottomHintText}>A HOME FOR THE BOOKS YOU OWN</Text></View>

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTop}><Text style={styles.modalTitle}>Add to your library</Text><TouchableOpacity onPress={() => setModal(false)}><Text style={styles.close}>✕</Text></TouchableOpacity></View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>BOOK TITLE *</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Enter the book title" style={styles.input} />
              <Text style={styles.fieldLabel}>AUTHOR</Text>
              <TextInput value={author} onChangeText={setAuthor} placeholder="Enter the author" style={styles.input} />
              <Text style={styles.fieldLabel}>FORMAT</Text>
              <View style={styles.choiceRow}>{["Physical", "Ebook", "Audiobook"].map(f => <Pill key={f} label={f} active={format === f} onPress={() => setFormat(f)} />)}</View>
              {format === "Physical" && <><Text style={styles.fieldLabel}>PHYSICAL TYPE</Text><View style={styles.choiceRow}>{["Hardback", "Paperback"].map(f => <Pill key={f} label={f} active={binding === f} onPress={() => setBinding(f)} />)}</View></>}
              <Text style={styles.fieldLabel}>EDITION</Text>
              <View style={styles.choiceRow}>{["Standard", "Special", "Limited", "Signed", "First edition"].map(f => <Pill key={f} label={f} active={edition === f} onPress={() => setEdition(f)} />)}</View>
              <Text style={styles.fieldLabel}>EDITION DETAILS (OPTIONAL)</Text>
              <TextInput value={specialNote} onChangeText={setSpecialNote} placeholder="e.g. sprayed edges, foil cover, shop exclusive" style={styles.input} />
              <View style={styles.switchRow}><View style={{ flex: 1 }}><Text style={styles.switchTitle}>Add to My TBR</Text><Text style={styles.switchSub}>Tick if you haven't read this book yet.</Text></View><Switch value={tbr} onValueChange={setTbr} trackColor={{ true: accent, false: "#D7D9D2" }} /></View>
              <TouchableOpacity style={[styles.saveButton, !title.trim() && { opacity: 0.45 }]} onPress={addBook} disabled={!title.trim()}><Text style={styles.saveButtonText}>Add book to library</Text></TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: paper, paddingTop: Platform.OS === "android" ? 8 : 0 },
  header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 9, letterSpacing: 2, color: muted, fontWeight: "700" },
  brand: { color: ink, fontSize: 31, fontWeight: "800", letterSpacing: -1.5, marginTop: 1 },
  brandDot: { color: accent },
  addButton: { backgroundColor: ink, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 22 },
  addButtonText: { color: "white", fontWeight: "600", fontSize: 12 },
  tabs: { flexDirection: "row", paddingHorizontal: 18, borderBottomWidth: 1, borderColor: line },
  tab: { paddingHorizontal: 9, paddingVertical: 12, marginRight: 10, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabSelected: { borderBottomColor: accent },
  tabText: { fontSize: 12, color: muted, fontWeight: "600" },
  tabTextSelected: { color: ink },
  content: { padding: 20, paddingBottom: 36 },
  pageTitle: { fontSize: 25, color: ink, fontWeight: "700", letterSpacing: -0.7 },
  pageSub: { color: muted, fontSize: 12, marginTop: 5, marginBottom: 17, lineHeight: 18 },
  search: { backgroundColor: "white", borderWidth: 1, borderColor: line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, marginBottom: 12, color: ink },
  filterRow: { gap: 7, paddingBottom: 16 },
  pill: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: line, backgroundColor: "white" },
  pillActive: { backgroundColor: "#E5EBE2", borderColor: "#CBD7C8" },
  pillText: { color: muted, fontSize: 11, fontWeight: "600" },
  pillTextActive: { color: "#435743" },
  bookGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  bookCard: { width: "47.5%", marginBottom: 22 },
  cover: { width: "100%", aspectRatio: 0.72, borderRadius: 7, padding: 13, justifyContent: "space-between", marginBottom: 9, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 5, elevation: 1 },
  coverMonogram: { color: "#596458", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  coverTitle: { color: "#30392F", fontSize: 16, fontWeight: "700", lineHeight: 19 },
  coverAuthor: { color: "#596458", fontSize: 9 },
  bookTitle: { color: ink, fontSize: 12, fontWeight: "700", lineHeight: 16 },
  bookMeta: { color: muted, fontSize: 10, marginTop: 3 },
  specialLabel: { color: accent, fontSize: 8, fontWeight: "800", letterSpacing: 1, marginTop: 5 },
  tbrToggle: { alignSelf: "flex-start", backgroundColor: "#EEF1EA", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, marginTop: 8 },
  tbrToggleText: { color: "#4E654E", fontSize: 9, fontWeight: "700" },
  bottomHint: { borderTopWidth: 1, borderColor: line, paddingVertical: 10, alignItems: "center", backgroundColor: paper },
  bottomHintText: { fontSize: 8, letterSpacing: 1.7, color: "#9A9E96", fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 10 },
  statCard: { width: "48%", backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: line, padding: 17, marginBottom: 10 },
  statNumber: { fontSize: 28, color: ink, fontWeight: "700" },
  statLabel: { color: muted, fontSize: 9, letterSpacing: 1, marginTop: 6, fontWeight: "700" },
  sectionTitle: { fontSize: 15, color: ink, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  formatRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderColor: line },
  formatName: { color: ink, fontSize: 13 }, formatCount: { color: accent, fontSize: 13, fontWeight: "700" },
  note: { color: muted, fontSize: 11, lineHeight: 17, marginTop: 22 },
  empty: { alignItems: "center", paddingVertical: 50, paddingHorizontal: 24 },
  emptyTitle: { color: ink, fontSize: 17, fontWeight: "700" },
  emptyText: { color: muted, fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 7 },
  emptyAction: { color: accent, fontSize: 12, fontWeight: "700", marginTop: 16 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20,24,20,0.35)" },
  modalSheet: { maxHeight: "92%", backgroundColor: paper, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 20 },
  modalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 17 },
  modalTitle: { color: ink, fontSize: 20, fontWeight: "700" },
  close: { color: muted, fontSize: 19, padding: 5 },
  fieldLabel: { color: muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2, marginTop: 15, marginBottom: 8 },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: line, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontSize: 13, color: ink },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  switchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: line, borderRadius: 12, padding: 13, marginTop: 20 },
  switchTitle: { color: ink, fontSize: 13, fontWeight: "700" },
  switchSub: { color: muted, fontSize: 10, marginTop: 3 },
  saveButton: { backgroundColor: ink, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 18 },
  saveButtonText: { color: "white", fontSize: 13, fontWeight: "700" },
});
