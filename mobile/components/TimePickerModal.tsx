import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Text } from "./CustomText";
import TimeSelector from "./TimeSelector";
import { useIsDark } from "@/theme/useIsDark";

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedHour: number;
  selectedMinute: number;
  onTimeChange: (hour: number, minute: number) => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSave,
  selectedHour,
  selectedMinute,
  onTimeChange,
}) => {
  const isDark = useIsDark();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.modalContent, isDark ? styles.darkModalContent : null]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerText, isDark ? styles.darkHeaderText : null]}>Change Time</Text>
            <View style={styles.headerLine} />
          </View>

          {/* Time Selectors */}
          <View style={styles.selectorsContainer}>
            <TimeSelector
              type="hour"
              selectedValue={selectedHour}
              onValueChange={(hour) => onTimeChange(hour, selectedMinute)}
            />
            <Text style={styles.separator}>:</Text>
            <TimeSelector
              type="minute"
              selectedValue={selectedMinute}
              onValueChange={(minute) => onTimeChange(selectedHour, minute)}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={[styles.button, styles.cancelButton, isDark ? styles.darkCancelButton : null]}
            >
              <Text style={[styles.cancelButtonText, isDark ? styles.darkCancelButtonText : null]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.7}
              style={[styles.button, styles.saveButton]}
            >
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    paddingHorizontal: 32,
    paddingVertical: 32,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: "#1f2937",
    shadowColor: "#fff",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
  },
  darkHeaderText: {
    color: "#fff",
  },
  headerLine: {
    width: 50,
    height: 3,
    backgroundColor: "#ff5a16",
    borderRadius: 2,
  },
  selectorsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    height: 110,
    marginTop: 8,
    marginBottom: 0,
  },
  separator: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff5a16",
    alignSelf: "center",
    marginHorizontal: 8,
    marginTop: -8,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    marginRight: 16,
  },
  darkCancelButton: {
    backgroundColor: "#374151",
  },
  saveButton: {
    backgroundColor: "#ff5a16",
    marginLeft: 16,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  darkCancelButtonText: {
    color: "#fff",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default TimePickerModal;