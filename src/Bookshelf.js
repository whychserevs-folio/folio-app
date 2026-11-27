import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import {
  GestureDetector,
  usePanGesture,
  useTapGesture,
  useExclusiveGestures,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";

/*
 * Folio bookshelf
 *
 * Shelves are real: each book remembers which shelf it is on
 * (editions.shelf_index) and its order (editions.sort_order). Books stay on
 * their shelf; only if a shelf is too full does its last book move along to
 * the next shelf, so nothing ever overflows. Lying ("stack") books next to
 * each other form a pile, up to 5 high.
 *
 * Drag and drop (when `onReorder` is passed):
 *   - long-press a book to lift it (scale, tilt, shadow, light haptic)
 *   - drag anywhere: any shelf, including a spare empty shelf at the bottom;
 *     other books slide aside with springs and a dashed outline shows exactly
 *     where it will land (for lying books: which level of a pile)
 *   - release to drop: it springs into place, a haptic confirms, and the whole
 *     layout is saved in one call (save_shelf_layout)
 *   - a quick tap still opens the book
 *
 * Read-only shelves (search results, TBR, collections) ignore shelf_index and
 * simply fill by width.
 */

const COLOURS = {
  bg: "#101012",
  shelf: "#22161B",
  shelfEdge: "#4B2733",
  text: "#F0EBE7",
  muted: "#A39B9B",
  line: "#302C30",
  drop: "rgba(240,235,231,0.55)",
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

// Shelf geometry (points)
const ROW_HEIGHT = 170; // space above each plank where books stand
const ROW_BASELINE = 164; // y (within a row) where book bottoms rest
const PLANK_TOP = 8;
const PLANK_FACE = 24;
const UNIT = ROW_HEIGHT + PLANK_TOP + PLANK_FACE; // one shelf, top to bottom
const ROW_PADDING = 8; // left/right inset inside the bookcase
const BOOK_MARGIN = 2; // gap each side of a book
const BOOKCASE_SIDES = 28;

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };
const LONG_PRESS_MS = 260;

function getBookId(item) {
  return item.book_id || item.bookRecord?.id || item.book?.id || item.id;
}

function getTitle(item) {
  return item.title || item.bookRecord?.title || item.book?.title || "Untitled";
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

const getStyle = item => item.editionRecord?.display_style || "spine";

// Placeholder colour sticks to the book (not its position), so colours don't
// shuffle while books slide around during a drag.
function placeholderColour(item) {
  const id = String(item.editionRecord?.id ?? item.id ?? getTitle(item));
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PLACEHOLDERS[Math.abs(h) % PLACEHOLDERS.length];
}

const itemKey = (item, index) =>
  String(item.editionRecord?.id ?? item.id ?? `${getBookId(item)}-${index}`);

// Visual size of a book, matching what <BookVisual> draws.
function getBookSize(item) {
  const style = getStyle(item);
  if (style === "cover") return getCover(item) ? { w: 65, h: 110 } : { w: 80, h: 140 };
  if (style === "stack") return { w: 90, h: 26 };
  if (style === "edge") return { w: 40, h: 140 };
  return { w: 30, h: 140 };
}

const MAX_PILE = 5; // lying ("stack") books per pile

// Width one item adds to a shelf: 0 when it lies on top of the pile before it.
// `pileState` is threaded through a shelf left to right.
function slotWidth(item, pileState) {
  const isStack = getStyle(item) === "stack";
  if (isStack && pileState.count > 0 && pileState.count < MAX_PILE) {
    pileState.count += 1;
    return 0;
  }
  pileState.count = isStack ? 1 : 0;
  return getBookSize(item).w + BOOK_MARGIN * 2;
}

// Books grouped by the shelf they are on (editions.shelf_index), in order.
// Read-only shelves (search, TBR, collections) ignore shelf_index and flow.
function groupByShelf(items, useShelfIndex) {
  if (!useShelfIndex) return [items];
  const shelves = [];
  items.forEach(item => {
    const s = Math.max(0, Number(item.editionRecord?.shelf_index) || 0);
    while (shelves.length <= s) shelves.push([]);
    shelves[s].push(item);
  });
  return shelves.length ? shelves : [[]];
}

// Keep every shelf within its width: books that no longer fit move to the
// start of the next shelf (like pushing books along a real shelf).
function settleShelves(shelves, availableWidth) {
  const out = shelves.map(s => [...s]);
  for (let r = 0; r < out.length; r++) {
    let used = 0;
    const pileState = { count: 0 };
    let fit = 0;
    for (; fit < out[r].length; fit++) {
      const w = slotWidth(out[r][fit], pileState);
      if (fit > 0 && used + w > availableWidth) break;
      used += w;
    }
    if (fit < out[r].length) {
      const overflow = out[r].splice(fit);
      if (r + 1 >= out.length) out.push([]);
      out[r + 1] = [...overflow, ...out[r + 1]];
    }
  }
  while (out.length > 1 && out[out.length - 1].length === 0) out.pop();
  return out;
}

// Positions for every book. Consecutive "stack" books pile up on top of each
// other in one slot (bottom = earliest in the order).
function layoutShelves(shelves) {
  const positions = new Map();
  shelves.forEach((books, row) => {
    let x = 0;
    let pile = null; // { slotX, slotW, count, topY }
    books.forEach((item, i) => {
      const { w, h } = getBookSize(item);
      const isStack = getStyle(item) === "stack";
      if (isStack && pile && pile.count < MAX_PILE) {
        const y = pile.topY - h;
        positions.set(itemKey(item, i), {
          row, index: i, slotX: pile.slotX, slotW: pile.slotW, pile: true,
          x: ROW_PADDING + pile.slotX + BOOK_MARGIN, y, w, h,
        });
        pile.count += 1;
        pile.topY = y;
        return;
      }
      const slot = w + BOOK_MARGIN * 2;
      const y = row * UNIT + ROW_BASELINE - h;
      positions.set(itemKey(item, i), {
        row, index: i, slotX: x, slotW: slot, pile: isStack,
        x: ROW_PADDING + x + BOOK_MARGIN, y, w, h,
      });
      pile = isStack ? { slotX: x, slotW: slot, count: 1, topY: y } : null;
      x += slot;
    });
  });
  return positions;
}

const removeFromShelves = (shelves, key) =>
  shelves.map(s => s.filter((it, i) => itemKey(it, i) !== key));

const insertIntoShelves = (shelves, item, row, index) => {
  const out = shelves.map(s => [...s]);
  while (out.length <= row) out.push([]);
  out[row].splice(index, 0, item);
  return out;
};

const haptic = kind => {
  if (Platform.OS === "web") return;
  try {
    if (kind === "lift") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === "drop") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.selectionAsync();
  } catch {
    // haptics are a nicety; never let them break a drag
  }
};

// The book itself: spine, cover, sprayed edge, a lying "stack" book, or a
// coloured placeholder with the title when there is no image.
function BookVisual({ item, index }) {
  const style = getStyle(item);
  const spine = getSpine(item);
  const cover = getCover(item);
  const edge = getEdge(item);
  const { w, h } = getBookSize(item);

  if (style === "cover" && cover) {
    return (
      <Image
        source={{ uri: cover }}
        contentFit="cover" transition={150}
        style={{ width: 65, height: 110, borderRadius: 6 }}
      />
    );
  }
  if (style === "stack") {
    // A book lying flat. With a spine photo, show the spine rotated to lie
    // horizontally; otherwise a coloured book block with the title. (The old
    // version cropped a thin strip out of the front cover, which looked broken.)
    return (
      <View style={{ width: 90, height: 26 }}>
        {spine ? (
          <View style={styles.lyingBook}>
            <Image
              source={{ uri: spine }}
              contentFit="fill"
              style={styles.lyingSpineImage}
            />
          </View>
        ) : (
          <View style={[styles.lyingBook, { backgroundColor: placeholderColour(item) }]}>
            <Text numberOfLines={1} style={styles.stackText}>
              {getTitle(item)}
            </Text>
          </View>
        )}
      </View>
    );
  }
  if (style === "edge" && edge) {
    return (
      <Image
        source={{ uri: edge }}
        contentFit="cover" transition={150}
        style={{ width: 40, height: 140, borderRadius: 2 }}
      />
    );
  }
  if (style === "spine" && spine) {
    return (
      <Image
        source={{ uri: spine }}
        contentFit="fill"
        style={{ width: 30, height: 140, borderRadius: 2 }}
      />
    );
  }
  return (
    <View
      style={{
        width: w,
        height: h,
        backgroundColor: placeholderColour(item),
        borderLeftWidth: 2,
        borderLeftColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 3,
        justifyContent: "center",
      }}
    >
      <Text numberOfLines={4} style={styles.placeholderText}>
        {getTitle(item)}
      </Text>
    </View>
  );
}

// A book that can be long-pressed and dragged.
function DraggableBook({ item, index, pos, onPress, onLift, onMove, onDrop }) {
  const x = useSharedValue(pos.x);
  const y = useSharedValue(pos.y);
  const targetX = useSharedValue(pos.x);
  const targetY = useSharedValue(pos.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragging = useSharedValue(0);
  const lift = useSharedValue(0);

  // Follow layout changes (other books moving, final drop slot) with a spring.
  useEffect(() => {
    targetX.value = pos.x;
    targetY.value = pos.y;
    if (!dragging.value) {
      x.value = withSpring(pos.x, SPRING);
      y.value = withSpring(pos.y, SPRING);
    }
  }, [pos.x, pos.y, x, y, targetX, targetY, dragging]);

  const key = itemKey(item, index);
  const halfW = pos.w / 2;
  const halfH = pos.h / 2;

  const pan = usePanGesture({
    activateAfterLongPress: LONG_PRESS_MS,
    onActivate: () => {
      "worklet";
      dragging.value = 1;
      startX.value = x.value;
      startY.value = y.value;
      lift.value = withSpring(1, SPRING);
      scheduleOnRN(onLift, key);
    },
    onUpdate: e => {
      "worklet";
      if (!dragging.value) return;
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
      scheduleOnRN(onMove, key, x.value + halfW, y.value + halfH);
    },
    onFinalize: () => {
      "worklet";
      if (!dragging.value) return;
      dragging.value = 0;
      lift.value = withTiming(0, { duration: 180 });
      x.value = withSpring(targetX.value, SPRING);
      y.value = withSpring(targetY.value, SPRING);
      scheduleOnRN(onDrop, key);
    },
  });

  const tap = useTapGesture({
    onActivate: () => {
      "worklet";
      scheduleOnRN(onPress, item);
    },
  });

  const gesture = useExclusiveGestures(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
    zIndex: dragging.value || lift.value > 0.01 ? 1000 : 1,
    transform: [
      { scale: 1 + lift.value * 0.1 },
      { rotate: `${lift.value * -3}deg` },
    ],
    shadowOpacity: lift.value * 0.45,
    elevation: lift.value * 12,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.book, { width: pos.w, height: pos.h }, animatedStyle]}>
        <BookVisual item={item} index={index} />
      </Animated.View>
    </GestureDetector>
  );
}

// A book in a read-only shelf (collections, TBR, search results).
function StaticBook({ item, index, pos, onPress }) {
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[styles.book, { left: pos.x, top: pos.y, width: pos.w, height: pos.h }]}
    >
      <BookVisual item={item} index={index} />
    </Pressable>
  );
}

export default function Bookshelf({
  items = [],
  onBookPress,
  onReorder,
  emptyTitle = "Your library is waiting",
  emptyMessage = "Add books to start building your collection.",
}) {
  const draggable = !!onReorder;

  // Shelves after a drop are shown immediately (optimistic) until the parent
  // passes new items; then the parent's data wins again.
  const [localShelves, setLocalShelves] = useState(null);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setLocalShelves(null);
  }

  // Shelf width: measured on layout, estimated from the screen until then.
  const { width: screenWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(null);
  const innerWidth = measuredWidth ?? screenWidth - 40 - BOOKCASE_SIDES;
  const availableWidth = innerWidth - ROW_PADDING * 2;

  const shelves = useMemo(
    () => localShelves ?? settleShelves(groupByShelf(items, draggable), availableWidth),
    [localShelves, items, draggable, availableWidth]
  );

  // Drag state. drag = { key, item, others, othersLayout, shelfCount }.
  const [drag, setDrag] = useState(null);
  const [target, setTarget] = useState(null); // { row, index }
  const dragRef = useRef(null); // drag + target, for the gesture handlers

  // Gesture worklets keep the callbacks they were created with, so the
  // handlers below are stable and read the latest values from this ref.
  const latest = useRef({ shelves, availableWidth, onReorder });
  useLayoutEffect(() => {
    latest.current = { shelves, availableWidth, onReorder };
  });

  // What is on screen: while dragging, the lifted book sits at `target`.
  const displayShelves = useMemo(() => {
    if (!drag || !target) return shelves;
    return settleShelves(
      insertIntoShelves(drag.others, drag.item, target.row, target.index),
      availableWidth
    );
  }, [shelves, drag, target, availableWidth]);

  const positions = useMemo(() => layoutShelves(displayShelves), [displayShelves]);

  const handleLift = useCallback(key => {
    const { shelves } = latest.current;
    let from = null;
    shelves.forEach((s, r) =>
      s.forEach((it, i) => {
        if (itemKey(it, i) === key) from = { row: r, index: i, item: it };
      })
    );
    if (!from) return;
    const others = removeFromShelves(shelves, key);
    const d = {
      key,
      item: from.item,
      others,
      othersLayout: layoutShelves(others),
      // existing shelves + one spare empty shelf to drop onto
      shelfCount: shelves.length + 1,
    };
    const t = { row: from.row, index: from.index };
    dragRef.current = { ...d, target: t };
    setDrag(d);
    setTarget(t);
    haptic("lift");
  }, []);

  // Work out the drop target from the lifted book's centre: the shelf under
  // it, then the position along that shelf. Hit-testing uses the layout of the
  // *other* books, which does not change during the drag, so the target never
  // flickers between two slots.
  const handleMove = useCallback((key, cx, cy) => {
    const d = dragRef.current;
    if (!d || d.key !== key) return;
    const row = Math.min(Math.max(0, Math.floor(cy / UNIT)), d.shelfCount - 1);
    const localX = cx - ROW_PADDING;
    const books = d.others[row] ?? [];
    const draggingStack = getStyle(d.item) === "stack";

    let index = books.length;
    for (let i = 0; i < books.length; i++) {
      const p = d.othersLayout.get(itemKey(books[i], i));
      if (!p) continue;
      // A lying book dropped over a pile slots in at the height of the finger
      // (piles go bottom-up, so "below this book" means "before it").
      const overPile =
        draggingStack && p.pile && localX >= p.slotX && localX < p.slotX + p.slotW;
      if (overPile) {
        if (cy > p.y + p.h / 2) {
          index = i;
          break;
        }
        index = i + 1;
        continue;
      }
      if (p.slotX + p.slotW / 2 > localX) {
        index = i;
        break;
      }
      index = i + 1;
    }

    const prev = d.target;
    if (!prev || prev.row !== row || prev.index !== index) {
      d.target = { row, index };
      setTarget(d.target);
      haptic("tick");
    }
  }, []);

  const handleDrop = useCallback(key => {
    const { shelves, availableWidth, onReorder } = latest.current;
    const d = dragRef.current;
    if (!d || d.key !== key) return;
    const next = settleShelves(
      insertIntoShelves(d.others, d.item, d.target.row, d.target.index),
      availableWidth
    );
    const changed =
      next.length !== shelves.length ||
      next.some((s, r) => s.length !== shelves[r].length || s.some((it, i) => it !== shelves[r][i]));
    dragRef.current = null;
    setLocalShelves(next);
    setDrag(null);
    setTarget(null);
    haptic("drop");
    if (changed) {
      onReorder?.(next.flatMap((books, shelf) => books.map(item => ({ item, shelf }))));
    }
  }, []);

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const dropSlot = drag ? positions.get(drag.key) : null;
  // Draggable shelves always show one spare empty shelf to drop onto.
  const shelfCount = draggable
    ? Math.max(displayShelves.length + 1, drag?.shelfCount ?? 0)
    : displayShelves.length;

  return (
    <View style={styles.bookcase}>
      <View style={styles.bookcaseSide} />

      <View
        style={[styles.container, { height: shelfCount * UNIT }]}
        onLayout={e => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w && w !== measuredWidth) setMeasuredWidth(w);
        }}
      >
        {Array.from({ length: shelfCount }, (_, r) => (
          <View
            key={`plank-${r}`}
            style={{ position: "absolute", left: 0, right: 0, top: r * UNIT + ROW_HEIGHT }}
          >
            <View style={styles.shelfTop} />
            <View style={styles.shelfFace} />
          </View>
        ))}

        {dropSlot && (
          <View
            pointerEvents="none"
            style={[
              styles.dropSlot,
              { left: dropSlot.x - 1, top: dropSlot.y - 1, width: dropSlot.w + 2, height: dropSlot.h + 2 },
            ]}
          />
        )}

        {displayShelves.flatMap((books, r) =>
          books.map((item, i) => {
            const key = itemKey(item, i);
            const pos = positions.get(key);
            if (!pos) return null;
            return draggable ? (
              <DraggableBook
                key={key}
                item={item}
                index={i}
                pos={pos}
                onPress={onBookPress}
                onLift={handleLift}
                onMove={handleMove}
                onDrop={handleDrop}
              />
            ) : (
              <StaticBook key={key} item={item} index={i} pos={pos} onPress={onBookPress} />
            );
          })
        )}
      </View>

      <View style={styles.bookcaseSide} />
    </View>
  );
}

const styles = StyleSheet.create({
  bookcase: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  bookcaseSide: {
    width: 14,
    backgroundColor: COLOURS.shelfEdge,
  },
  container: {
    flex: 1,
    position: "relative",
    marginBottom: 40,
  },
  book: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    shadowOpacity: 0,
  },
  dropSlot: {
    position: "absolute",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLOURS.drop,
    borderRadius: 4,
    backgroundColor: "rgba(240,235,231,0.06)",
  },
  shelfTop: {
    height: PLANK_TOP,
    backgroundColor: COLOURS.shelfEdge,
  },
  shelfFace: {
    height: PLANK_FACE,
    backgroundColor: COLOURS.shelf,
    borderTopWidth: 1,
    borderTopColor: "#5B3240",
    borderBottomWidth: 3,
    borderBottomColor: "#09090A",
  },
  placeholderText: {
    color: COLOURS.text,
    fontSize: 7,
    textAlign: "center",
  },
  lyingBook: {
    width: 90,
    height: 26,
    borderRadius: 2,
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  // A vertical spine photo (26 wide × 90 tall) rotated to lie flat in 90 × 26.
  lyingSpineImage: {
    position: "absolute",
    width: 26,
    height: 90,
    left: 32,
    top: -32,
    transform: [{ rotate: "-90deg" }],
  },
  stackText: {
    color: COLOURS.text,
    fontSize: 8,
    letterSpacing: 0.3,
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
