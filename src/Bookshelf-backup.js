
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const C = {
  card: "#1C1B1E",
  ink: "#F0EBE7",
  muted: "#A39B9B",
  burgundy: "#702D3B",
  wine: "#3B2028",
  line: "#302C30",
};

const PLACEHOLDERS = [
  "#702D3B",
  "#3B2028",
  "#343036",
  "#49313A",
  "#29272C",
  "#56333D",
];

const HEIGHTS = [151, 163, 155, 169, 158, 165, 153];
const WIDTHS = [49, 53, 47, 55, 50, 46, 52];

function Book({ item, index, onPress }) {
  const edition = item.editionRecord || {};
  const spineImage = edition.spine_image_url || item.spine_image_url || "";
  const coverImage = edition.cover_url || item.cover_url || "";

  const title = item.title || "Untitled";
  const author = item.author || "";

  // Mix front covers into the upright books.
  const showCover = index % 4 === 1 && !!coverImage;

  const height = HEIGHTS[index % HEIGHTS.length];
  const width = WIDTHS[index % WIDTHS.length];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
      style={{
        width: showCover ? 76 : width,
        height: showCover ? 132 : height,
        marginHorizontal: 2,
        marginBottom: 0,
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.line,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      }}
    >
      {showCover ? (
        <View style={{ flex: 1, width: "100%" }}>
          <Image
            source={{ uri: coverImage }}
            resizeMode="cover"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: C.card,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 4,
              backgroundColor: "rgba(0,0,0,0.16)",
            }}
          />
        </View>
      ) : spineImage ? (
        <Image
          source={{ uri: spineImage }}
          resizeMode="contain"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: C.card,
          }}
        />
      ) : (
        <View
          style={{
            flex: 1,
            width: "100%",
            backgroundColor: PLACEHOLDERS[index % PLACEHOLDERS.length],
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
            borderLeftWidth: 3,
            borderLeftColor: "rgba(240,235,231,0.10)",
            borderRightWidth: 2,
            borderRightColor: "rgba(0,0,0,0.22)",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 5,
              right: 5,
              height: 1,
              backgroundColor: "rgba(240,235,231,0.24)",
            }}
          />

          <View
            style={{
              position: "absolute",
              top: 12,
              left: 8,
              right: 8,
              height: 1,
              backgroundColor: "rgba(240,235,231,0.10)",
            }}
          />

          <Text
            numberOfLines={5}
            style={{
              color: C.ink,
              fontSize: 9,
              fontWeight: "600",
              textAlign: "center",
              lineHeight: 13,
            }}
          >
            {title}
          </Text>

          {author ? (
            <Text
              numberOfLines={2}
              style={{
                color: "rgba(240,235,231,0.68)",
                fontSize: 6,
                textAlign: "center",
                marginTop: 6,
              }}
            >
              {author}
            </Text>
          ) : null}

          <View
            style={{
              position: "absolute",
              bottom: 12,
              left: 8,
              right: 8,
              height: 1,
              backgroundColor: "rgba(240,235,231,0.10)",
            }}
          />

          <View
            style={{
              position: "absolute",
              bottom: 8,
              left: 5,
              right: 5,
              height: 1,
              backgroundColor: "rgba(240,235,231,0.24)",
            }}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

function ShelfRow({ books, startIndex, onPress }) {
  return (
    <View style={{ marginBottom: 25 }}>
      <View
        style={{
          minHeight: 184,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingHorizontal: 5,
          paddingBottom: 9,
          paddingTop: 8,
        }}
      >
        {books.map((item, index) => (
          <Book
            key={String(item.itemId || item.id || startIndex + index)}
            item={item}
            index={startIndex + index}
            onPress={onPress}
          />
        ))}
      </View>

      {/* Shelf surface and front edge */}
      <View
        style={{
          height: 5,
          backgroundColor: "#30272B",
          borderTopWidth: 1,
          borderTopColor: "#59404A",
        }}
      />

      <View
        style={{
          height: 11,
          backgroundColor: C.card,
          borderTopWidth: 2,
          borderTopColor: C.burgundy,
          borderBottomWidth: 2,
          borderBottomColor: "#09090A",
          borderRadius: 2,
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      />

      <View
        style={{
          height: 2,
          marginHorizontal: 5,
          backgroundColor: C.line,
        }}
      />
    </View>
  );
}

export default function Bookshelf({
  items = [],
  onBookPress,
  emptyTitle = "Your shelves are waiting",
  emptyMessage = "Add your first book and it will find its place here.",
}) {
  const shelves = [];

  for (let i = 0; i < items.length; i += 4) {
    shelves.push(items.slice(i, i + 4));
  }

  if (shelves.length === 0) {
    return (
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 24,
          paddingBottom: 30,
        }}
      >
        <View
          style={{
            minHeight: 150,
            backgroundColor: C.card,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: C.line,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              color: C.ink,
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {emptyTitle}
          </Text>

          <Text
            style={{
              color: C.muted,
              fontSize: 13,
              textAlign: "center",
              marginTop: 7,
              lineHeight: 19,
            }}
          >
            {emptyMessage}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 10,
        paddingTop: 12,
        paddingBottom: 110,
      }}
    >
      {shelves.map((books, index) => (
        <ShelfRow
          key={`shelf-${index}`}
          books={books}
          startIndex={index * 4}
          onPress={onBookPress}
        />
      ))}
    </ScrollView>
  );
}
