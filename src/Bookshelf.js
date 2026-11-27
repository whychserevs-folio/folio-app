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
import { Image } from "./components/Image";
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
import {
  ROW_HEIGHT,
  PLANK_TOP,
  PLANK_FACE,
  UNIT,
  ROW_PADDING,
  BOOKCASE_SIDES,
  getTitle,
  getCover,
  getSpine,
  getEdge,
  getStyle,
  itemKey,
  getBookSize,
  groupByShelf,
  settleShelves,
  layoutShelves,
  removeFromShelves,
  insertIntoShelves,
} from "./utils/shelfLayout";

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

const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };
const LONG_PRESS_MS = 260;

// Placeholder colour sticks to the book (not its position), so colours don't
// shuffle while books slide around during a drag.
function placeholderColour(item) {
  const id = String(item.editionRecord?.id ?? item.id ?? getTitle(item));
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PLACEHOLDERS[Math.abs(h) % PLACEHOLDERS.length];
}

const haptic = kind => {
  if (Platform.OS === "web") return;
  try {
    // Older app builds without expo-haptics reject here; ignore quietly.
    const done =
      kind === "lift"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : kind === "drop"
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        : Haptics.selectionAsync();
    done?.catch?.(() => {});
  } catch {
    // haptics are a nicety; never let them break a drag
  }
};

// The book itself: spine, cover, sprayed edge, a lying "stack" book, or a
// coloured placeholder with the title when there is no image.
function getAuthorSurname(item) {
  const author = item.author || item.bookRecord?.author || item.book?.author || "";
  const first = String(author).split(/[,&]| and /i)[0].trim();
  return first.split(/\s+/).pop() || "";
}

/*
 * Book info lookups (Open Library etc.) only provide front covers, never
 * spines or edges. When a book has no spine/edge photo but does have a cover,
 * build one from the cover so each book still looks like itself on the shelf.
 * Real photos, when added, always win.
 */

// Standing spine (30 x 140): a centre slice of the cover, shaded, with the
// title running down the spine and the author's surname at the foot.
function CoverSpine({ item, cover }) {
  return (
    <View style={[styles.genSpine, { backgroundColor: placeholderColour(item) }]}>
      <Image source={{ uri: cover }} contentFit="cover" style={styles.genSpineArt} />
      <View style={styles.genShade} />
      <View style={styles.genSpineHighlight} />
      <View style={styles.genSpineLabel}>
        <Text numberOfLines={1} style={styles.genSpineTitle}>
          {getTitle(item)}
        </Text>
        <Text numberOfLines={1} style={styles.genSpineAuthor}>
          {getAuthorSurname(item)}
        </Text>
      </View>
    </View>
  );
}

// Lying book (90 x 26): the same idea turned sideways.
function CoverLying({ item, cover }) {
  return (
    <View style={[styles.lyingBook, { backgroundColor: placeholderColour(item) }]}>
      <Image source={{ uri: cover }} contentFit="cover" style={styles.genLyingArt} />
      <View style={styles.genShade} />
      <View style={styles.genLyingLabel}>
        <Text numberOfLines={1} style={styles.genLyingTitle}>
          {getTitle(item)}
        </Text>
        <Text numberOfLines={1} style={styles.genSpineAuthor}>
          {getAuthorSurname(item)}
        </Text>
      </View>
    </View>
  );
}

// Page edge (40 x 140): the cover's colours washed out, with fine page lines.
const PAGE_LINES = Array.from({ length: 9 }, (_, i) => i);
function CoverEdge({ item, cover }) {
  return (
    <View style={[styles.genEdge, { backgroundColor: placeholderColour(item) }]}>
      <Image source={{ uri: cover }} contentFit="cover" blurRadius={18} style={StyleSheet.absoluteFill} />
      <View style={styles.genEdgeWash} />
      {PAGE_LINES.map(i => (
        <View key={i} style={[styles.genEdgeLine, { left: 3 + i * 4 }]} />
      ))}
    </View>
  );
}

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
        ) : cover ? (
          <CoverLying item={item} cover={cover} />
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
  if (style === "spine" && cover) return <CoverSpine item={item} cover={cover} />;
  if (style === "edge" && cover) return <CoverEdge item={item} cover={cover} />;
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
function DraggableBook({ item, index, pos, scrollShift, onPress, onLift, onMove, onDrop }) {
  const x = useSharedValue(pos.x);
  const y = useSharedValue(pos.y);
  const targetX = useSharedValue(pos.x);
  const targetY = useSharedValue(pos.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragging = useSharedValue(0);
  const lift = useSharedValue(0);
  // How far the page had auto-scrolled when this drag started; the book is
  // moved by any scrolling since, so it stays under the finger.
  const startShift = useSharedValue(0);

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
      startShift.value = scrollShift.value;
      lift.value = withSpring(1, SPRING);
      scheduleOnRN(onLift, key);
    },
    onUpdate: e => {
      "worklet";
      if (!dragging.value) return;
      x.value = startX.value + e.translationX;
      y.value = startY.value + e.translationY;
      const shift = scrollShift.value - startShift.value;
      scheduleOnRN(onMove, key, x.value + halfW, y.value + shift + halfH, e.absoluteY);
    },
    onFinalize: () => {
      "worklet";
      if (!dragging.value) return;
      // fold any auto-scroll into the position before springing home
      y.value = y.value + (scrollShift.value - startShift.value);
      startShift.value = scrollShift.value;
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
    top: y.value + (dragging.value ? scrollShift.value - startShift.value : 0),
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
  scrollRef, // ref to { ref, y, contentH, viewportH, windowTop } of the page ScrollView
  emptyTitle = "Your library is waiting",
  emptyMessage = "Add books to start building your collection.",
}) {
  const draggable = !!onReorder;
  // Total auto-scroll (points) applied during drags; read by the lifted book.
  const scrollShift = useSharedValue(0);
  const autoScrollTimer = useRef(null);

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


  // Work out the drop target from the lifted book's centre: the shelf under
  // it, then the position along that shelf. Hit-testing uses the layout of the
  // *other* books, which does not change during the drag, so the target never
  // flickers between two slots.
  const updateTarget = useCallback((d, cx, cy) => {
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

  const handleMove = useCallback(
    (key, cx, cy, absY) => {
      const d = dragRef.current;
      if (!d || d.key !== key) return;
      d.last = { cx, cy, absY, shift: scrollShift.value };
      updateTarget(d, cx, cy);
    },
    [updateTarget, scrollShift]
  );

  // Auto-scroll: while a book is held near the top or bottom edge of the
  // visible page, scroll the page (faster nearer the edge). The lifted book is
  // shifted by the same amount so it stays under the finger, and the drop
  // target is re-computed as shelves scroll past.
  const AUTO_EDGE = 80;
  const AUTO_MAX_SPEED = 14; // points per frame
  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    autoScrollTimer.current = null;
  }, []);
  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const page = scrollRef?.current;
    if (!page?.ref) return;
    page.ref.measureInWindow?.((x, y, w, h) => {
      page.windowTop = y;
      if (h) page.viewportH = h;
    });
    autoScrollTimer.current = setInterval(() => {
      const d = dragRef.current;
      if (!d?.last || !page.ref) return;
      const top = page.windowTop;
      const bottom = top + page.viewportH;
      const { absY } = d.last;
      let v = 0;
      if (absY < top + AUTO_EDGE) v = -AUTO_MAX_SPEED * Math.min(1, (top + AUTO_EDGE - absY) / AUTO_EDGE);
      else if (absY > bottom - AUTO_EDGE) v = AUTO_MAX_SPEED * Math.min(1, (absY - (bottom - AUTO_EDGE)) / AUTO_EDGE);
      if (!v) return;
      const maxY = Math.max(0, page.contentH - page.viewportH);
      const nextY = Math.min(maxY, Math.max(0, page.y + v));
      const delta = nextY - page.y;
      if (Math.abs(delta) < 0.5) return;
      page.ref.scrollTo({ y: nextY, animated: false });
      page.y = nextY;
      scrollShift.value += delta;
      updateTarget(d, d.last.cx, d.last.cy + (scrollShift.value - d.last.shift));
    }, 16);
  }, [scrollRef, scrollShift, stopAutoScroll, updateTarget]);

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

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
    startAutoScroll();
  }, [startAutoScroll]);

  const handleDrop = useCallback(key => {
    const { shelves, availableWidth, onReorder } = latest.current;
    const d = dragRef.current;
    if (!d || d.key !== key) return;
    stopAutoScroll();
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
  }, [stopAutoScroll]);

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
                scrollShift={scrollShift}
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
  genSpine: {
    width: 30,
    height: 140,
    borderRadius: 2,
    overflow: "hidden",
  },
  // A 2:3 cover scaled to the spine height is ~93 wide; show its centre.
  genSpineArt: {
    position: "absolute",
    width: 94,
    height: 140,
    left: -32,
    top: 0,
  },
  genShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,8,10,0.42)",
  },
  genSpineHighlight: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  // Label row 132 x 30, rotated to run top-to-bottom down the 30 x 140 spine.
  genSpineLabel: {
    position: "absolute",
    width: 132,
    height: 30,
    left: -51,
    top: 55,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    transform: [{ rotate: "90deg" }],
  },
  genSpineTitle: {
    flex: 1,
    color: COLOURS.text,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 2,
  },
  genSpineAuthor: {
    color: COLOURS.text,
    opacity: 0.8,
    fontSize: 7,
    marginLeft: 4,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 2,
  },
  // A 2:3 cover 90 wide is 135 tall; show a band from its middle.
  genLyingArt: {
    position: "absolute",
    width: 90,
    height: 135,
    left: 0,
    top: -55,
  },
  genLyingLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  genLyingTitle: {
    flex: 1,
    color: COLOURS.text,
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 2,
  },
  genEdge: {
    width: 40,
    height: 140,
    borderRadius: 2,
    overflow: "hidden",
  },
  genEdgeWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(240,235,231,0.28)",
  },
  genEdgeLine: {
    position: "absolute",
    top: 2,
    bottom: 2,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
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
