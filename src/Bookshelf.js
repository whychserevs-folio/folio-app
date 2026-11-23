import React, { useState, useEffect } from "react";
import DraggableFlatList from "react-native-draggable-flatlist";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

const COLOURS = {
 bg: "#101012",
  shelf: "#22161B",
  shelfEdge: "#4B2733",
  text: "#F0EBE7",
  muted: "#A39B9B",
  line: "#302C30",
  placeholder1: "#702D3B",
  placeholder2: "#3B2028",
  placeholder3: "#343036",
  placeholder4: "#49313A",
};

const PLACEHOLDERS = [
  COLOURS.placeholder1,
  COLOURS.placeholder2,
  COLOURS.placeholder3,
  COLOURS.placeholder4,
];

function getBookId(item) {
  return (
    item.book_id ||
    item.bookRecord?.id ||
    item.book?.id ||
    item.id
  );
}

function getTitle(item) {
  return (
    item.title ||
    item.bookRecord?.title ||
    item.book?.title ||
    "Untitled"
  );
}

function getAuthor(item) {
  return (
    item.author ||
    item.bookRecord?.author ||
    item.book?.author ||
    ""
  );
}

function getCover(item) {
  return (
    item.editionRecord?.cover_url ||
    item.cover_url ||
    item.bookRecord?.cover_url ||
    item.book?.cover_url ||
    null
  );
}

function getSpine(item) {
  return (
    item.editionRecord?.spine_image_url ||
    item.spine_image_url ||
    item.bookRecord?.spine_image_url ||
    item.book?.spine_image_url ||
    null
  );
}
function getEdge(item) {
  return (
    item.editionRecord?.sprayed_edge_url ||
    item.sprayed_edge_url ||
    item.bookRecord?.sprayed_edge_url ||
    item.book?.sprayed_edge_url ||
    null
  );
}
function getDisplayWidth(book) {
  const displayStyle =
    book.editionRecord?.display_style || "spine";

  switch (displayStyle) {
    case "cover":
      return 70; // 65 width + margins

    case "stack":
      return 100; // 90 width + margins

    case "edge":
      return 45; // 40 width + margins

    case "spine":
    default:
      return 35; // 30 width + margins
  }
}
function Book({
  item,
  index,
  onBookPress,
  onLongPress,
}) {
  const spine = getSpine(item);
  const cover = getCover(item);
  const edge = getEdge(item);
const positionX = item.position_x ?? 0;
const positionY = item.position_y ?? 0;
  const displayStyle =
    item.editionRecord?.display_style || "spine";

const spineSource = spine || null;

 const width =
  displayStyle === "cover"
    ? 80
    : displayStyle === "edge"
    ? 40
    : 30;

  const height = 140

  return (
<Pressable
  onPress={() => onBookPress?.(item)}
  onLongPress={onLongPress}
  delayLongPress={300}
     style={{
  marginHorizontal: 2,
  alignItems: "flex-end",
}}
    >
{displayStyle === "cover" && cover ? (
  <Image
    source={{ uri: cover }}
    resizeMode="cover"
    style={{
      width: 65,
      height: 110,
      borderRadius: 6,
    }}
  />
) : displayStyle === "stack" ? (
  <View
    style={{
      width: 90,
      height: 90,
      justifyContent: "flex-end",
      alignItems: "center",
    }}
  >
    <Image
      source={{
        uri: spine || edge || cover,
      }}
      resizeMode="cover"
      style={{
        width: 90,
        height: 22,
        borderRadius: 2,
      }}
    />
  </View>
  ) : displayStyle === "edge" && edge ? (
  <Image
    source={{ uri: edge }}
    resizeMode="cover"
    style={{
      width: 40,
      height: 140,
      borderRadius: 2,
    }}
  />
) : displayStyle === "spine" && spineSource ? (
  <Image
    source={{ uri: spineSource }}
    resizeMode="stretch"
    style={{
      width,
      height: 140,
      borderRadius: 2,
    }}
  />
  
) : (
   <View
  style={{
    width,
    height,
    backgroundColor:
      PLACEHOLDERS[
        index % PLACEHOLDERS.length
      ],
    borderLeftWidth: 2,
    borderLeftColor:
      "rgba(255,255,255,0.08)",
    paddingHorizontal: 3,
    justifyContent: "center",
  }}
>
  <Text
    numberOfLines={4}
    style={{
      color: COLOURS.text,
      fontSize: 7,
      textAlign: "center",
    }}
  >
    {getTitle(item)}
  </Text>
</View>
      )}
    </Pressable>
        );
}

function Shelf({
  books,
  shelfIndex,
  onBookPress,
  onDragEnd,
}) {
  return (
    <View style={styles.shelfContainer}>
     <View style={styles.bookRow}>
  {books.map((book, index) => (
    <Book
      key={`${getBookId(book)}-${index}`}
      item={book}
      index={index}
      onBookPress={onBookPress}
    />
  ))}
  </View>
      <View style={styles.shelfTop} />
      <View style={styles.shelfFace} />
    </View>
  );
}

export default function Bookshelf({
  items = [],
  onBookPress,
  emptyTitle = "Your library is waiting",
  emptyMessage = "Add books to start building your collection.",
}) {
  const [bookData, setBookData] = useState(items);
const { width: screenWidth } = useWindowDimensions();
useEffect(() => {
  setBookData(items);
}, [items]);

const handleShelfDragEnd = () => {};
 const shelves = [];

const BOOKS_PER_SHELF = 5;

for (
  let i = 0;
  i < bookData.length;
  i += BOOKS_PER_SHELF
) {
  shelves.push(
    bookData.slice(i, i + BOOKS_PER_SHELF)
  );
}
  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>
          {emptyTitle}
        </Text>
        <Text style={styles.emptyText}>
          {emptyMessage}
        </Text>
      </View>
    );
  }
  return (
  <View style={styles.bookcase}>
    <View style={styles.bookcaseSideLeft} />

    <View style={styles.container}>
   {shelves.map((shelf, index) => (
 <Shelf
  key={`shelf-${index}`}
  books={shelf}
  shelfIndex={index}
  onBookPress={onBookPress}
  onDragEnd={(data) =>
    handleShelfDragEnd(index, data)
  }
/>
))}
    </View>

    <View style={styles.bookcaseSideRight} />
  </View>
);
}

const styles = StyleSheet.create({
  container: {
     flex: 1,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  shelfContainer: {
  marginBottom: 0,
  position: "relative",
},

bookRow: {
  minHeight: 170,
  flexDirection: "row",
  alignItems: "flex-end",
  justifyContent: "flex-start",
  paddingBottom: 6,
  paddingHorizontal: 8,
},

shelfTop: {
  height: 8,
  backgroundColor: COLOURS.shelfEdge,
 
},

  shelfFace: {
  height: 24,
  backgroundColor: COLOURS.shelf,
  borderTopWidth: 1,
  borderTopColor: "#5B3240",
  borderBottomWidth: 3,
  borderBottomColor: "#09090A",
},
bookcase: {
  flexDirection: "row",
  alignItems: "stretch",
},

bookcaseSideLeft: {
  width: 14,
  backgroundColor: COLOURS.shelfEdge,
},

bookcaseSideRight: {
  width: 14,
  backgroundColor: COLOURS.shelfEdge,
},
  empty: {
    backgroundColor: "#1C1B1E",
    borderWidth: 1,
    borderColor: COLOURS.line,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginVertical: 20,
  },

  emptyTitle: {
    color: COLOURS.text,
    fontSize: 18,
    marginBottom: 8,
  },

  emptyText: {
    color: COLOURS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});