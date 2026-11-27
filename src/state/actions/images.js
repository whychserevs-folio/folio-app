import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "../../supabase";
import { notify } from "../../components/Toast";

// Image picking and uploads (covers, spines, edges, profile, pre-orders).
// Plain functions (no hooks): useFolioStore calls this every render with the
// current state, setters and other actions it needs.
export function createImagesActions(deps) {
  const {
    setBookForm,
    setPreForm,
    setProfile,
    userId,
  } = deps;
  const pickCoverImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permission.granted) {
      notify(
        "Permission needed",
        "Please allow Folio to access your photos."
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets?.length) {
      setBookForm(p => ({
        ...p,
        cover_url: result.assets[0].uri,
      }));
    }
  };

  const pickEditionCoverImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permission.granted) {
      notify(
        "Permission needed",
        "Please allow Folio to access your photos."
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets?.length) {
      setBookForm(p => ({
        ...p,
        edition_cover_url: result.assets[0].uri,
      }));
    }
  };

  const pickProfileImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permission.granted) {
      notify(
        "Permission needed",
        "Please allow Folio to access your photos."
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  
    console.log("PROFILE PICKER RESULT:", result);
  
    if (!result.canceled && result.assets?.length) {
      console.log(
        "SETTING PROFILE URL:",
        result.assets[0].uri
      );
  
      setProfile(p => ({
        ...p,
        avatar_url: result.assets[0].uri,
      }));
    }
  };

  const pickSpineImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permission.granted) {
      notify(
        "Permission needed",
        "Please allow Folio to access your photos."
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets?.length) {
      setBookForm(p => ({
        ...p,
        spine_image_url: result.assets[0].uri,
      }));
    }
  };

  const pickEdgeImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permission.granted) {
      notify(
        "Permission needed",
        "Please allow Folio to access your photos."
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets?.length) {
      setBookForm(p => ({
        ...p,
        sprayed_edge_url: result.assets[0].uri,
      }));
    }
  };

  const uploadImageUri = async (
    uri,
    folder = "books",
    mimeType = "image/jpeg"
  ) => {
    if (!uri || /^https?:\/\//i.test(uri)) {
      return uri || null;
    }
  
    const extension =
      uri
        .split("?")[0]
        .match(/\.([a-zA-Z0-9]+)$/)?.[1]
        ?.toLowerCase() || "jpg";
  
    const path =
      `${userId}/${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;
    console.log("IMAGE URI:", uri);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("BASE64 CREATED");
    const arrayBuffer = decode(base64);
  
    const { error: uploadError } = await supabase.storage
      .from("folio-images")
      .upload(path, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });
    console.log("UPLOAD RESULT:", uploadError);
  
    if (uploadError) {
      console.log("UPLOAD ERROR:", uploadError);
      throw uploadError;
    }
  
    const { data } = supabase.storage
      .from("folio-images")
      .getPublicUrl(path);
  
   console.log("PUBLIC URL:", data.publicUrl);
  console.log("CONTENT TYPE:", mimeType);
  
  
    return data.publicUrl;
  };

  const pickPreorderCover = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (!permission.granted) {
      notify(
        "Permission needed",
        "Please allow Folio to access your photos."
      );
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
  
    console.log("PICKER RESULT:", result);
  
    if (!result.canceled && result.assets?.length) {
     setPreForm(prev => ({
    ...prev,
    cover_url: result.assets[0].uri,
    mime_type: result.assets[0].mimeType,
  }));
    }
  };

  return { pickCoverImage, pickEditionCoverImage, pickProfileImage, pickSpineImage, pickEdgeImage, uploadImageUri, pickPreorderCover };
}
