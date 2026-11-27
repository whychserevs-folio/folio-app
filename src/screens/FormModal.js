import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import styles from "../styles";
import { C } from "../theme";
import { CURRENCIES, FORMATS } from "../constants";
import { AppButton, Chip, Field } from "../components/ui";
import { useFolio } from "../state/FolioContext";

export default function FormModal() {
  const {
    addCollection,
    addExistingSeriesToUniverse,
    addMonthlyBook,
    addUniverse,
    bookForm,
    collectionForm,
    createSeries,
    editingEditionId,
    editingId,
    editingPreorderId,
    findBook,
    lookupLoading,
    modal,
    monthlyBookForm,
    pickCoverImage,
    pickEditionCoverImage,
    pickEdgeImage,
    pickPreorderCover,
    pickSpineImage,
    preForm,
    saveBook,
    savePreorder,
    saveSubscription,
    saving,
    scanBarcode,
    selectedUniverse,
    series,
    seriesForm,
    setBookForm,
    setCollectionForm,
    setModal,
    setMonthlyBookForm,
    setPreForm,
    setSeriesForm,
    setSubscriptionForm,
    setUniverseForm,
    subscriptionForm,
    universeForm,
    universes,
  } = useFolio();
  if (modal === "book") {
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

  if (modal === "collectionChooser") {
    return (
      <>
        <Text style={styles.modalTitle}>What would you like to add?</Text>
        <Text style={styles.modalIntro}>
          Choose the type of collection record you want to create.
        </Text>
        <AppButton
          label="Collection"
          onPress={() => setModal("collection")}
        />
        <AppButton
          label="Universe"
          secondary
          onPress={() => setModal("universe")}
        />
        <AppButton
          label="Series"
          secondary
          onPress={() => {
            setSeriesForm({
              name: "",
              description: "",
              universe_id: "",
            });
            setModal("series");
          }}
        />
      </>
    );
  }

  if (modal === "existingSeries") {
    const availableSeries = series
      .filter(s => s.universe_id !== selectedUniverse?.id)
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );

    return (
      <>
        <Text style={styles.modalTitle}>Add existing series</Text>
        <Text style={styles.modalIntro}>
          Choose a series that already exists in Folio to add it to{" "}
          {selectedUniverse?.name || "this universe"}.
        </Text>
        {availableSeries.length ? (
          availableSeries.map(item => (
            <Pressable
              key={item.id}
              style={styles.selectCard}
              onPress={() => addExistingSeriesToUniverse(item.id)}
            >
              <Text style={styles.selectCardTitle}>{item.name}</Text>
              {!!item.description && (
                <Text style={styles.mutedText}>{item.description}</Text>
              )}
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No other series available</Text>
            <Text style={styles.emptyText}>
              Create a new series or move one here from another universe.
            </Text>
          </View>
        )}
      </>
    );
  }

  if (modal === "collection") {
    return (
      <>
        <Text style={styles.modalTitle}>New collection</Text>
        <Field
          label="Collection name"
          value={collectionForm.name}
          onChangeText={v => setCollectionForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={collectionForm.description}
          onChangeText={v =>
            setCollectionForm(p => ({ ...p, description: v }))
          }
          multiline
        />
        <AppButton label="Create collection" onPress={addCollection} />
      </>
    );
  }

  if (modal === "universe") {
    return (
      <>
        <Text style={styles.modalTitle}>New universe</Text>
        <Field
          label="Universe name"
          value={universeForm.name}
          onChangeText={v => setUniverseForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={universeForm.description}
          onChangeText={v => setUniverseForm(p => ({ ...p, description: v }))}
          multiline
        />
        <AppButton label="Create universe" onPress={addUniverse} />
      </>
    );
  }

  if (modal === "series") {
    return (
      <>
        <Text style={styles.modalTitle}>New series</Text>
        <Field
          label="Series name"
          value={seriesForm.name}
          onChangeText={v => setSeriesForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Description"
          value={seriesForm.description}
          onChangeText={v => setSeriesForm(p => ({ ...p, description: v }))}
          multiline
        />
        <Text style={styles.fieldLabel}>
          Add to Existing Universe
        </Text>


        <View style={styles.chipRow}>
          {universes.map(u => (
            <Chip
              key={u.id}
              label={u.name}
              selected={seriesForm.universe_id === u.id}
              onPress={() =>
                setSeriesForm(p => ({
                  ...p,
                  universe_id: u.id,
                }))
              }
            />
          ))}
        </View>

        <AppButton
          label="Create New Universe"
          onPress={() => setModal("universe")}
        />

        <AppButton label="Create series" onPress={createSeries} />
      </>
    );
  }

  if (modal === "preorder") {
    return (
      <>
        <Text style={styles.modalTitle}>
          {editingPreorderId ? "Edit pre-order" : "New pre-order"}
        </Text>
        <Field
          label="Book title"
          value={preForm.title}
          onChangeText={v => setPreForm(p => ({ ...p, title: v }))}
        />
        <Field
          label="Author"
          value={preForm.author}
          onChangeText={v => setPreForm(p => ({ ...p, author: v }))}
        />
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Book cover</Text>
          <Pressable
            onPress={pickPreorderCover}
            style={{
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.line,
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
            }}
          >
           {preForm.cover_url ? (
  <Image
    source={{
      uri: preForm.cover_url,
    }}
    style={{
      width: 110,
      height: 155,
      borderRadius: 8,
    }}
    contentFit="cover" transition={150}
    onLoad={() => console.log("IMAGE LOADED")}
    onError={(e) =>
      console.log(
        "IMAGE ERROR",
        JSON.stringify(e.nativeEvent, null, 2)
      )
    }
  />
) : (
  <Text style={{ color: C.text }}>
    + Choose book cover image
  </Text>
)}
          </Pressable>

        </View>
        <Field
          label="Retailer"
          value={preForm.retailer}
          onChangeText={v => setPreForm(p => ({ ...p, retailer: v }))}
        />
        <Field
          label="ISBN"
          value={preForm.isbn}
          onChangeText={v => setPreForm(p => ({ ...p, isbn: v }))}
        />

        <Text style={styles.fieldLabel}>Format</Text>
        <View style={styles.chipRow}>
          {FORMATS.map(format => (
            <Chip
              key={format}
              label={format}
              selected={preForm.format === format}
              onPress={() => setPreForm(p => ({ ...p, format }))}
            />
          ))}
        </View>

        <Field
          label="Book price"
          value={preForm.price}
          keyboardType="decimal-pad"
          onChangeText={v => setPreForm(p => ({ ...p, price: v }))}
        />
        <Field
          label="Shipping cost"
          value={preForm.shipping_cost}
          keyboardType="decimal-pad"
          onChangeText={v =>
            setPreForm(p => ({ ...p, shipping_cost: v }))
          }
        />

        <Text style={styles.fieldLabel}>Currency</Text>
        <View style={styles.chipRow}>
          {CURRENCIES.map(currency => (
            <Chip
              key={currency}
              label={currency}
              selected={preForm.currency === currency}
              onPress={() => setPreForm(p => ({ ...p, currency }))}
            />
          ))}
        </View>

        <Field
          label="Order date (DD/MM/YYYY)"
          value={preForm.order_date}
          onChangeText={v => setPreForm(p => ({ ...p, order_date: v }))}
        />
        <Text style={styles.fieldLabel}>
          Expected Shipping (MM / YYYY)
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Field
              label="MM"
              value={preForm.expected_shipping_month}
              onChangeText={v =>
                setPreForm(p => ({
                  ...p,
                  expected_shipping_month: v,
                }))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Field
              label="YYYY"
              value={preForm.expected_shipping_year}
              onChangeText={v =>
                setPreForm(p => ({
                  ...p,
                  expected_shipping_year: v,
                }))
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <Field
          label="Notes"
          value={preForm.notes}
          onChangeText={v => setPreForm(p => ({ ...p, notes: v }))}
          multiline
        />
        <AppButton
          label={saving ? "Saving..." : "Save pre-order"}
          disabled={saving}
          onPress={savePreorder}
        />
      </>
    );
  }

  if (modal === "subscription") {
    return (
      <>
        <Text style={styles.modalTitle}>
          {editingId ? "Edit subscription" : "New subscription"}
        </Text>
        <Field
          label="Subscription name"
          value={subscriptionForm.name}
          onChangeText={v => setSubscriptionForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Cost"
          value={subscriptionForm.price}
          keyboardType="decimal-pad"
          onChangeText={v => setSubscriptionForm(p => ({ ...p, price: v }))}
        />
        <Text style={styles.fieldLabel}>Currency</Text>
        <View style={styles.chipRow}>
          {CURRENCIES.map(currency => (
            <Chip
              key={currency}
              label={currency}
              selected={subscriptionForm.currency === currency}
              onPress={() =>
                setSubscriptionForm(p => ({ ...p, currency }))
              }
            />
          ))}
        </View>
        <Field
          label="Next Renewal Date"
          value={subscriptionForm.renewal_date}
          placeholder="DD/MM/YYYY"
          onChangeText={v =>
            setSubscriptionForm(p => ({
              ...p,
              renewal_date: v,
            }))
          }
        />

        <Text style={styles.fieldLabel}>
          Frequency
        </Text>

        <View style={styles.chipRow}>
          {[
            "Monthly",
            "Bi-Monthly",
            "Quarterly",
          ].map(frequency => (
            <Chip
              key={frequency}
              label={frequency}
              selected={
                subscriptionForm.frequency === frequency
              }
              onPress={() =>
                setSubscriptionForm(p => ({
                  ...p,
                  frequency,
                }))
              }
            />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.chipRow}>
          {["Active", "Paused", "Cancelled"].map(status => (
            <Chip
              key={status}
              label={status}
              selected={subscriptionForm.status === status}
              onPress={() =>
                setSubscriptionForm(p => ({ ...p, status }))
              }
            />
          ))}
        </View>
        <Field
          label="Notes"
          value={subscriptionForm.notes}
          onChangeText={v => setSubscriptionForm(p => ({ ...p, notes: v }))}
          multiline
        />
        <AppButton
          label={saving ? "Saving..." : "Save subscription"}
          disabled={saving}
          onPress={saveSubscription}
        />
      </>
    );
  }

  if (modal === "monthlyBook") {
    return (
      <>
        <Text style={styles.modalTitle}>Add monthly book</Text>
        <Field
          label="Book title"
          value={monthlyBookForm.title}
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, title: v }))}
        />
        <Field
          label="Author"
          value={monthlyBookForm.author}
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, author: v }))}
        />
        <Field
          label="Edition name"
          value={monthlyBookForm.edition_name}
          onChangeText={v =>
            setMonthlyBookForm(p => ({ ...p, edition_name: v }))
          }
        />
        <Field
          label="Cover URL"
          value={monthlyBookForm.cover_url}
          onChangeText={v =>
            setMonthlyBookForm(p => ({ ...p, cover_url: v }))
          }
        />
        <Field
          label="Month (1–12)"
          value={monthlyBookForm.month}
          keyboardType="numeric"
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, month: v }))}
        />
        <Field
          label="Year"
          value={monthlyBookForm.year}
          keyboardType="numeric"
          onChangeText={v => setMonthlyBookForm(p => ({ ...p, year: v }))}
        />
        <AppButton label="Add monthly book" onPress={addMonthlyBook} />
      </>
    );
  }

  return null;
}
