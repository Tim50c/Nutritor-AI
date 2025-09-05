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
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Change Time</Text>
            <View style={styles.headerLine} />
          </View>

          {/* Time Selectors */}
          <View style={styles.selectorsContainer}>
            <TimeSelector
              type="hour"
              selectedValue={selectedHour}
              onValueChange={(hour) => onTimeChange(hour, selectedMinute)}
            />
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
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    padding: 24,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  headerLine: {
    width: 50,
    height: 3,
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  selectorsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    height: 135, // Exactly 3 visible items (ITEM_HEIGHT * 3)
    marginTop: 8,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    marginLeft: 10,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default TimePickerModal;
