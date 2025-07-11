import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { DatePickerModal } from 'react-native-paper-dates';
import { solarTheme } from '../../theme/solarTheme';

const { width } = Dimensions.get('window');

interface ModernDateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  disabled?: boolean;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: solarTheme.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorButtonPressed: {
    backgroundColor: solarTheme.background.cardLight,
    borderColor: solarTheme.secondary.accent,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateInfo: {
    flex: 1,
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 2,
  },
  dateSubtitle: {
    fontSize: 14,
    color: solarTheme.text.secondary,
  },
  chevronIcon: {
    marginLeft: 8,
  },

  // Quick date buttons
  quickDateContainer: {
    marginBottom: 16,
  },
  quickDateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 8,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
    alignItems: 'center',
    justifyContent: 'center', // Ensure vertical centering too
  },
  quickDateButtonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  quickDateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: solarTheme.text.secondary,
    textAlign: 'center', // Ensure text is centered
  },
  quickDateButtonTextActive: {
    color: solarTheme.text.primary,
    fontWeight: '600',
    textAlign: 'center', // Ensure active text is centered too
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: solarTheme.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: solarTheme.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: solarTheme.background.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDateContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
    paddingTop: 16,
    marginTop: 16,
  },
  customDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 16,
  },
  customDateButton: {
    backgroundColor: solarTheme.primary.main,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  customDateButtonText: {
    color: solarTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function ModernDateSelector({
  selectedDate,
  onDateSelect,
  disabled = false,
}: ModernDateSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const today = new Date();
  const selectedDateObj = new Date(selectedDate);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRelativeDate = (date: Date): string => {
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const selectQuickDate = (daysAgo: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const formattedDate = targetDate.toISOString().split('T')[0];
    onDateSelect(formattedDate);
    setIsModalVisible(false);
  };

  const onDatePickerConfirm = (params: any) => {
    setIsDatePickerVisible(false);
    setIsModalVisible(false);
    const formattedDate = params.date.toISOString().split('T')[0];
    onDateSelect(formattedDate);
  };

  const onDatePickerDismiss = () => {
    setIsDatePickerVisible(false);
  };

  const openCustomDatePicker = () => {
    setIsModalVisible(false);
    setIsDatePickerVisible(true);
  };

  const quickDateOptions = [
    { label: 'Today', daysAgo: 0 },
    { label: 'Yesterday', daysAgo: 1 },
    { label: '7 days ago', daysAgo: 7 },
    { label: '30 days ago', daysAgo: 30 },
  ];

  const isQuickDateActive = (daysAgo: number): boolean => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    return targetDate.toISOString().split('T')[0] === selectedDate;
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>Date Selection</Text>

        <TouchableOpacity
          style={[
            styles.selectorButton,
            isPressed && styles.selectorButtonPressed,
          ]}
          onPress={() => setIsModalVisible(true)}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <View style={styles.selectorContent}>
            <LinearGradient
              colors={[solarTheme.secondary.accent, solarTheme.primary.light]}
              style={styles.calendarIcon}
            >
              <MaterialIcons name="calendar-today" size={20} color="white" />
            </LinearGradient>

            <View style={styles.dateInfo}>
              <Text style={styles.selectedDate}>
                {getRelativeDate(selectedDateObj)}
              </Text>
              <Text style={styles.dateSubtitle}>
                {formatDate(selectedDateObj)}
              </Text>
            </View>
          </View>

          <MaterialIcons
            name="keyboard-arrow-down"
            size={24}
            color={solarTheme.text.secondary}
            style={styles.chevronIcon}
          />
        </TouchableOpacity>

        <Modal
          visible={isModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={solarTheme.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.quickDateContainer}>
                <Text style={styles.quickDateTitle}>Quick Selection</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.quickDateButtons}>
                    {quickDateOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.quickDateButton,
                          isQuickDateActive(option.daysAgo) &&
                            styles.quickDateButtonActive,
                        ]}
                        onPress={() => selectQuickDate(option.daysAgo)}
                      >
                        <Text
                          style={[
                            styles.quickDateButtonText,
                            isQuickDateActive(option.daysAgo) &&
                              styles.quickDateButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.customDateContainer}>
                <Text style={styles.customDateTitle}>Custom Date</Text>
                <TouchableOpacity
                  style={styles.customDateButton}
                  onPress={openCustomDatePicker}
                >
                  <Text style={styles.customDateButtonText}>
                    Pick Custom Date
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={isDatePickerVisible}
        onDismiss={onDatePickerDismiss}
        date={selectedDateObj}
        onConfirm={onDatePickerConfirm}
        presentationStyle="pageSheet"
      />
    </>
  );
}
