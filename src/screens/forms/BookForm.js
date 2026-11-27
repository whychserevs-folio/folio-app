import { Pressable, Text, View } from "react-native";
import { Image } from "../../components/Image";

import styles from "../../styles";
import { FORMATS } from "../../constants";
import { AppButton, Chip, Field } from "../../components/ui";
import { useFolio } from "../../state/FolioContext";

export default function BookForm() {
  const {
    bookForm,
    editingEditionId,
    editingId,
    findBook,
    lookupLoading,
    pickCoverImage,
    pickEdgeImage,
    pickEditionCoverImage,
    pickSpineImage,
    saveBook,
    saving,
    scanBarcode,
    setBookForm,
  } = useFolio();
    return (
      <>
        <Text style={styles.modalTitle}>
          {editingId
            ? editingEditionId
              ? "Edit Book & Edition"
              : "Add Edition"
            : "Add Book"}
        </Text>

        <Text style={styles.modalIntro}>
          Record the book itself separately from the edition you own.
        </Text>

        <View style={styles.coverHero}>
          {bookForm.cover_url ? (
            <Pressable onPress={pickCoverImage}>
  <Image
    source={{ uri: bookForm.cover_url }}
    style={styles.coverHeroImage}
    contentFit="cover" transition={150}
  />
</Pressable>
          ) : (
            
            <Pressable
              style={styles.coverHeroPlaceholder}
              onPress={pickCoverImage}
            >
              <Text style={styles.goldSmall}>
                Auto-found cover will appear here
              </Text>

              <AppButton
                label="Add Cover Image"
                onPress={pickCoverImage}
              />

              <Text style={styles.mutedText}>
                Tap to add your own cover
              </Text>
            </Pressable>
          )}
        </View>

        <Field
          label="Title"
          value={bookForm.title}
          onChangeText={v =>
            setBookForm(p => ({ ...p, title: v }))
          }
        />

        <Field
          label="Author"
          value={bookForm.author}
          onChangeText={v =>
            setBookForm(p => ({ ...p, author: v }))
          }
        />
        <Field
          label="ISBN"
          value={bookForm.isbn}
          onChangeText={v =>
            setBookForm(p => ({ ...p, isbn: v }))
          }
        />

        <AppButton
          label={
            lookupLoading
              ? "Finding..."
              : "Find Book"
          }
          onPress={() => findBook()}
        />

        <AppButton
          label="Scan Barcode"
          onPress={scanBarcode}
        />

        <Field
          label="Description"
          value={bookForm.description}
          multiline
          onChangeText={v =>
            setBookForm(p => ({ ...p, description: v }))
          }
        />

        <Field
          label="Genre"
          value={bookForm.genre}
          onChangeText={v =>
            setBookForm(p => ({ ...p, genre: v }))
          }
        />

        <Field
          label="Publication Year"
          value={bookForm.publication_year}
          keyboardType="numeric"
          onChangeText={v =>
            setBookForm(p => ({
              ...p,
              publication_year: v,
            }))
          }
        />
        <Text style={styles.modalSectionTitle}>
          DISPLAY STYLE
        </Text>

        <View style={styles.chipRow}>
          {["spine", "cover", "edge", "stack"].map(style => (
            <Chip
              key={style}
              label={style}
              selected={bookForm.display_style === style}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  display_style: style,
                }))
              }
            />
          ))}
        </View>

        <View style={styles.modalSection}>
          <Text style={styles.modalSectionTitle}>
            EDITION
          </Text>

          <Text style={styles.fieldLabel}>
            Format
          </Text>

          <View style={styles.chipRow}>
            {FORMATS.map(format => (
              <Chip
                key={format}
                label={format}
                selected={bookForm.format === format}
                onPress={() =>
                  setBookForm(p => ({
                    ...p,
                    format,
                  }))
                }
              />
            ))}
          </View>

          <Field
            label="Edition name"
            value={bookForm.edition_name}
            onChangeText={v =>
              setBookForm(p => ({
                ...p,
                edition_name: v,
              }))
            }
          />

        <View style={styles.imageActionRow}>
  <AppButton
    label={
      bookForm.edition_cover_url
        ? "Change Edition Cover"
        : "Add Edition Cover"
    }
    secondary
    onPress={pickEditionCoverImage}
    compact
  />

  <AppButton
    label={
      bookForm.spine_image_url
        ? "Change Spine"
        : "Add Spine Image"
    }
    secondary
    onPress={pickSpineImage}
    compact
  />

  <AppButton
    label={
      bookForm.sprayed_edge_url
        ? "Change Edges"
        : "Add Edge Image"
    }
    secondary
    onPress={pickEdgeImage}
    compact
  />
</View>

          {bookForm.spine_image_url ? (
            <View style={styles.imagePreviewRow}>
              <Image
                source={{ uri: bookForm.spine_image_url }}
                contentFit="cover" transition={150}
                style={styles.spinePreview}
              />
              <Text style={styles.mutedText}>Spine image selected</Text>
            </View>
          ) : null}

          {bookForm.sprayed_edge_url ? (
            <View style={styles.imagePreviewRow}>
              <Image
                source={{ uri: bookForm.sprayed_edge_url }}
                contentFit="cover" transition={150}
                style={styles.edgePreview}
              />
              <Text style={styles.mutedText}>Sprayed-edge image selected</Text>
            </View>
          ) : null}

          <Field
            label="Condition"
            value={bookForm.condition}
            onChangeText={v =>
              setBookForm(p => ({
                ...p,
                condition: v,
              }))
            }
          />

          <Field
            label="Notes"
            value={bookForm.notes}
            multiline
            onChangeText={v =>
              setBookForm(p => ({
                ...p,
                notes: v,
              }))
            }
          />

          <Text style={styles.modalSectionTitle}>
            COLLECTOR STATUS
          </Text>

          <View style={styles.chipRow}>
            <Chip
              label="Signed"
              selected={bookForm.signed}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  signed: !p.signed,
                }))
              }
            />

            <Chip
              label="TBR"
              selected={bookForm.is_tbr}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  is_tbr: !p.is_tbr,
                }))
              }
            />

            <Chip
              label="DNF"
              selected={bookForm.is_dnf}
              onPress={() =>
                setBookForm(p => ({
                  ...p,
                  is_dnf: !p.is_dnf,
                }))
              }
            />
          </View>

        </View>

        <AppButton
          label={saving ? "Saving..." : "Save"}
          disabled={saving}
          onPress={saveBook}
        />

      </>
    );
}
