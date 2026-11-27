// Shared presentational components.
import { Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";

import styles from "../styles";
import { C } from "../theme";

export function AppButton({
  label,
  onPress,
  secondary = false,
  danger = false,
  compact = false,
  disabled = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        compact && styles.buttonCompact,
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          secondary && styles.buttonLabelSecondary,
          danger && styles.buttonLabelDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value == null ? "" : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={C.faint}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

export function Heading({ kicker = "YOUR COLLECTION", title, subtitle }) {
  return (
    <View style={styles.headingWrap}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function Cover({ uri, title, size = "normal" }) {
  const dimensions =
    size === "large"
      ? { width: 112, height: 166 }
      : size === "small"
      ? { width: 52, height: 76 }
      : { width: 72, height: 106 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        contentFit="cover" transition={150}
        style={[
          styles.coverImage,
          {
            width: dimensions.width,
            height: dimensions.height,
          },
        ]}
      />
    );
  }

  return (
    <View style={[styles.coverFallback, dimensions]}>
      <View style={styles.coverFallbackRule} />
      <Text
        style={styles.coverFallbackTitle}
        numberOfLines={5}
      >
        {title || "Untitled"}
      </Text>
      <View style={styles.coverFallbackRule} />
    </View>
  );
}

export function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}
