import { useEffect, useRef, useState } from "react";

import { supabase } from "../supabase";
import { computeSpineColors } from "../utils/coverColors";

// Background job: editions shown as a generated spine or lying book (spine /
// stack style, no spine photo) get their colours extracted from the cover,
// one at a time, and saved to editions.spine_colors. Each cover is only
// processed once; a changed cover is processed again.
export default function useSpineColors({ userId, books, editions, setEditions }) {
  const attempted = useRef(new Set());
  const busy = useRef(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId || busy.current || !editions.length) return;

    const bookCover = new Map(books.map(b => [b.id, b.cover_url]));
    const coverOf = e => e.cover_url || bookCover.get(e.book_id) || null;

    const next = editions.find(e => {
      const style = e.display_style || "spine";
      if ((style !== "spine" && style !== "stack") || e.spine_image_url) return false;
      const cover = coverOf(e);
      if (!cover || e.spine_colors?.src === cover) return false;
      return !attempted.current.has(`${e.id}|${cover}`);
    });
    if (!next) return;

    const cover = coverOf(next);
    attempted.current.add(`${next.id}|${cover}`);
    busy.current = true;

    (async () => {
      const colors = await computeSpineColors(cover);
      busy.current = false;
      if (!colors) {
        setTick(t => t + 1); // move on to the next edition
        return;
      }
      const value = { ...colors, src: cover };
      setEditions(current =>
        current.map(e => (e.id === next.id ? { ...e, spine_colors: value } : e))
      );
      await supabase
        .from("editions")
        .update({ spine_colors: value })
        .eq("id", next.id)
        .eq("user_id", userId);
    })();
  }, [userId, books, editions, setEditions, tick]);
}
