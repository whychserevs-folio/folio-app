import { Image as RNImage, Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

/*
 * Image that uses expo-image (disk cache, fade-in) when the app binary
 * includes it, and falls back to React Native's Image when it doesn't.
 *
 * expo-image has native code. A development build made before it was added
 * would otherwise crash on start with "Cannot find native module 'ExpoImage'".
 * With this wrapper old builds keep working (without caching) until rebuilt.
 *
 * Accepts expo-image props: contentFit ("cover" | "contain" | "fill"),
 * transition, plus the usual source / style.
 */

const hasExpoImage =
  Platform.OS === "web" || !!requireOptionalNativeModule("ExpoImage");

// Only load expo-image when its native module is present.
const ExpoImage = hasExpoImage ? require("expo-image").Image : null;

const RESIZE_MODE = { cover: "cover", contain: "contain", fill: "stretch" };

export function Image({ contentFit = "cover", transition, ...props }) {
  if (ExpoImage) {
    return <ExpoImage contentFit={contentFit} transition={transition} {...props} />;
  }
  return <RNImage resizeMode={RESIZE_MODE[contentFit] || "cover"} {...props} />;
}
