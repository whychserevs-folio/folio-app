import { CameraView } from "expo-camera";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import styles from "../../styles";
import { useFolio } from "../../state/FolioContext";

export default function ScannerModal() {
  const {
    closeScanner,
    handleBarcodeScanned,
    scannerOpen,
  } = useFolio();
  return (
    <Modal
      visible={scannerOpen}
      animationType="slide"
      onRequestClose={closeScanner}
    >
      <View style={styles.scannerScreen}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
            ],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerTop}>
            <Text style={styles.scannerTitle}>Scan ISBN</Text>
            <Pressable onPress={closeScanner} style={styles.scannerClose}>
              <Text style={styles.scannerCloseText}>Close ×</Text>
            </Pressable>
          </View>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>
            Place the ISBN barcode inside the frame.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
