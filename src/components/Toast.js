import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C } from "../theme";

/*
 * Non-blocking messages ("Saved", "Login unsuccessful: ...").
 *
 * notify(title, message?) replaces Alert.alert for anything that is not a
 * question. Alert.alert stays for real choices ("Delete this book?").
 * Works on iOS, Android and web (where Alert.alert does nothing).
 *
 * <ToastHost /> is mounted at the app root and inside each Modal (a native
 * Modal is its own window, so a root toast would be hidden behind it).
 */

const ERROR_WORDS = /unsuccessful|could not|couldn't|can't|cannot|error|failed|missing|invalid|check your|too short|do not match|taken|required|not found|unable/i;
const DURATION_MS = 4000;

let nextId = 1;
let current = null;
const listeners = new Set();

export function notify(title, message) {
  const text = [title, message].filter(Boolean).join(" ");
  current = {
    id: nextId++,
    title: String(title ?? ""),
    message: message ? String(message) : "",
    kind: ERROR_WORDS.test(text) ? "error" : "info",
  };
  listeners.forEach(fn => fn(current));
}

function dismiss(id) {
  if (current && current.id === id) {
    current = null;
    listeners.forEach(fn => fn(null));
  }
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(current);

  useEffect(() => {
    listeners.add(setToast);
    return () => listeners.delete(setToast);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => dismiss(toast.id), DURATION_MS);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <Animated.View key={toast.id} entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(180)}>
        <Pressable
          onPress={() => dismiss(toast.id)}
          accessibilityRole="alert"
          style={[styles.toast, toast.kind === "error" && styles.toastError]}
        >
          {!!toast.title && <Text style={styles.title}>{toast.title}</Text>}
          {!!toast.message && <Text style={styles.message}>{toast.message}</Text>}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 10000,
    elevation: 30,
  },
  toast: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderLeftWidth: 4,
    borderLeftColor: C.goldDim,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  toastError: {
    borderLeftColor: C.danger,
  },
  title: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
  },
  message: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
});
