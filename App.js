import "react-native-gesture-handler";
import { useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthScreen from "./src/AuthScreen";
import styles from "./src/styles";
import { C } from "./src/theme";
import { FolioContext } from "./src/state/FolioContext";
import useFolioStore from "./src/state/useFolioStore";
import BookDetailScreen from "./src/screens/BookDetailScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import CollectionsScreen from "./src/screens/CollectionsScreen";
import ReadingListScreen from "./src/screens/ReadingListScreen";
import PreordersScreen from "./src/screens/PreordersScreen";
import SubscriptionsScreen from "./src/screens/SubscriptionsScreen";
import StatsScreen from "./src/screens/StatsScreen";
import PreorderDetailScreen from "./src/screens/PreorderDetailScreen";
import FormModal from "./src/screens/FormModal";
import TopBar from "./src/components/shell/TopBar";
import TabBar from "./src/components/shell/TabBar";
import ScannerModal from "./src/components/shell/ScannerModal";
import ProfileModal from "./src/components/shell/ProfileModal";
import { ToastHost } from "./src/components/Toast";

export default function App() {
  const folio = useFolioStore();
  // The main scroll area, shared with the bookshelf so a drag can auto-scroll.
  const mainScroll = useRef({ ref: null, y: 0, contentH: 0, viewportH: 0, windowTop: 0 });
  const {
    authLoading,
    closeModal,
    error,
    loadedForUser,
    loading,
    modal,
    openNewBook,
    selectedBook,
    selectedPreorder,
    session,
    setError,
    tab,
    userId,
  } = folio;

  const renderMain = () => {
    if (selectedBook) return <BookDetailScreen />;
    if (selectedPreorder) return <PreorderDetailScreen />;
    if (tab === "Library") return <LibraryScreen />;
    if (tab === "Collections") return <CollectionsScreen />;
    if (tab === "TBR" || tab === "DNF") return <ReadingListScreen />;
    if (tab === "Pre-orders") return <PreordersScreen />;
    if (tab === "Subscriptions") return <SubscriptionsScreen />;
    if (tab === "Stats") return <StatsScreen />;
    return null;
  };
  const renderModal = () => <FormModal />;

if (authLoading) {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={C.gold} />
      <Text style={styles.mutedText}>Opening Folio...</Text>
    </SafeAreaView>
  );
}

if (!session) return <AuthScreen />;

return (
  <FolioContext.Provider value={{ ...folio, mainScroll }}>
  <GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor={C.bg} />

    <TopBar />

    <TabBar />

    {!!error && (
      <Pressable style={styles.errorBanner} onPress={() => setError("")}>
        <Text style={styles.errorText}>{error} ×</Text>
      </Pressable>
    )}
    {loading && loadedForUser !== userId ? (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.mutedText}>
          Loading your collection...
        </Text>
      </View>
    ) : (
      <>
        <ScrollView
          ref={r => {
            mainScroll.current.ref = r;
          }}
          style={styles.main}
          contentContainerStyle={styles.mainContent}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={e => {
            mainScroll.current.y = e.nativeEvent.contentOffset.y;
          }}
          onContentSizeChange={(w, h) => {
            mainScroll.current.contentH = h;
          }}
          onLayout={e => {
            mainScroll.current.viewportH = e.nativeEvent.layout.height;
          }}
        >
          {renderMain()}
        </ScrollView>

        {tab === "Library" && (
          <View style={styles.libraryFabWrap}>
            <Pressable
              onPress={openNewBook}
              style={styles.libraryFab}
            >
              <Text style={styles.libraryFabText}>+</Text>
            </Pressable>

            <Text style={styles.libraryFabLabel}>
              Add Book
            </Text>
          </View>
        )}
      </>
    )}

    <ScannerModal />
    <ProfileModal />
    <Modal
      visible={!!modal}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalPanel}>
          <View style={styles.modalTopBar}>
            <Text style={styles.kicker}>FOLIO · COLLECTION RECORD</Text>
            <Pressable onPress={closeModal}>
              <Text style={styles.modalClose}>Close ×</Text>
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: 350,
            }}
          >
            {renderModal()}
            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <ToastHost />
    </Modal>
  </SafeAreaView>
   </GestureHandlerRootView>
  </FolioContext.Provider>
);
}
