import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "../Image";

import { supabase } from "../../supabase";
import styles from "../../styles";
import { AppButton, Chip, Field } from "../ui";
import { useFolio } from "../../state/FolioContext";
import { ToastHost } from "../Toast";

export default function ProfileModal() {
  const {
    pickProfileImage,
    profile,
    saveProfile,
    session,
    setProfile,
    setShowProfile,
    showProfile,
  } = useFolio();
  return (
    <Modal
      visible={showProfile}
      transparent
      animationType="slide"
      onRequestClose={() => setShowProfile(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <View style={styles.modalTopBar}>
            <Text style={styles.kicker}>
              FOLIO · PROFILE
            </Text>

            <Pressable
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.modalClose}>
                Close ×
              </Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">

            <View style={styles.profileHeader}>

              <Pressable onPress={pickProfileImage}>
               {profile?.avatar_url ? (
  <>
    {console.log("RENDERING AVATAR:", profile.avatar_url)}

    <Image
      source={{ uri: profile.avatar_url }}
      style={styles.profileAvatar}
      onLoad={() => console.log("AVATAR LOADED")}
      onError={(e) =>
        console.log(
          "AVATAR ERROR",
          JSON.stringify(e.nativeEvent, null, 2)
        )
      }
    />
  </>
) : (
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarLetter}>
                      {(profile?.display_name ||
                        profile?.username ||
                        "F")
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.profileDisplayName}>
                {profile?.display_name || "Display Name"}
              </Text>

              <Text style={styles.profileUsername}>
                @{profile?.username}
              </Text>

              {!!profile?.bio && (
                <Text style={styles.profileBio}>
                  {profile.bio}
                </Text>
              )}
            </View>

            <Text style={styles.modalSectionTitle}>
              PROFILE
            </Text>

            <Field
              label="Display Name"
              value={profile.display_name || ""}
              onChangeText={v =>
                setProfile(p => ({
                  ...p,
                  display_name: v,
                }))
              }
            />

            <Field
              label="Username"
              value={profile.username || ""}
              onChangeText={() => { }}
            />

            <Text style={styles.mutedText}>
              Username cannot currently be changed.
            </Text>

            <Field
              label="Bio"
              value={profile.bio || ""}
              multiline
              onChangeText={v =>
                setProfile(p => ({
                  ...p,
                  bio: v,
                }))
              }
            />

            <Text style={styles.modalSectionTitle}>
              PRIVACY
            </Text>

            <View style={styles.chipRow}>

              <Chip
                label="Social Features"
                selected={profile.social_enabled}
                onPress={() =>
                  setProfile(p => ({
                    ...p,
                    social_enabled: !p.social_enabled,
                  }))
                }
              />

              <Chip
                label="Public Library"
                selected={profile.library_public}
                onPress={() =>
                  setProfile(p => ({
                    ...p,
                    library_public: !p.library_public,
                  }))
                }
              />

              <Chip
                label="Public Collections"
                selected={profile.collections_public}
                onPress={() =>
                  setProfile(p => ({
                    ...p,
                    collections_public: !p.collections_public,
                  }))
                }
              />

            </View>

            <Text style={styles.modalSectionTitle}>
              ACCOUNT
            </Text>

            <Text style={styles.bodyText}>
              {session?.user?.email}
            </Text>

            <AppButton
              label="Save Profile"
              onPress={saveProfile}
            />

            <AppButton
              label="Sign Out"
              danger
              onPress={() => supabase.auth.signOut()}
            />

          </ScrollView>
        </View>
      </View>
      <ToastHost />
    </Modal>
  );
}
