import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const DateFilterModal = ({ 
  visible, 
  onClose, 
  selectedOption,
  selectedMonth,
  onSelectOption,
  onSelectMonth,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const DATE_OPTIONS = [
    { id: 'all', label: t('allUpcoming'), days: null, icon: 'infinite' },
    { id: '7days', label: t('next7Days'), days: 7, icon: 'calendar-outline' },
    { id: '30days', label: t('next30Days'), days: 30, icon: 'calendar-outline' },
    { id: '60days', label: t('next60Days'), days: 60, icon: 'calendar-outline' },
    { id: '90days', label: t('next90Days'), days: 90, icon: 'calendar-outline' },
    { id: '6months', label: t('next6Months'), days: 180, icon: 'calendar' },
    { id: '1year', label: t('nextYear'), days: 365, icon: 'calendar' },
  ];

  const MONTH_OPTIONS = [
    { id: 'jan', label: t('january'), month: 0 },
    { id: 'feb', label: t('february'), month: 1 },
    { id: 'mar', label: t('march'), month: 2 },
    { id: 'apr', label: t('april'), month: 3 },
    { id: 'may', label: t('may'), month: 4 },
    { id: 'jun', label: t('june'), month: 5 },
    { id: 'jul', label: t('july'), month: 6 },
    { id: 'aug', label: t('august'), month: 7 },
    { id: 'sep', label: t('september'), month: 8 },
    { id: 'oct', label: t('october'), month: 9 },
    { id: 'nov', label: t('november'), month: 10 },
    { id: 'dec', label: t('december'), month: 11 },
  ];

  const handleSelectOption = (option) => {
    onSelectOption(option);
    onSelectMonth(null);
    onClose();
  };

  const handleSelectMonth = (month) => {
    onSelectMonth(month);
    onSelectOption(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('filterByDate')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('quickFilters')}
          </Text>
          {DATE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                { 
                  backgroundColor: selectedOption?.id === option.id ? colors.primary + '20' : colors.card,
                  borderColor: selectedOption?.id === option.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleSelectOption(option)}
            >
              <Ionicons 
                name={option.icon} 
                size={20} 
                color={selectedOption?.id === option.id ? colors.primary : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.optionText, 
                  { color: selectedOption?.id === option.id ? colors.primary : colors.text }
                ]}
              >
                {option.label}
              </Text>
              {selectedOption?.id === option.id && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.checkmark} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('byMonth')}
          </Text>
          <View style={styles.monthGrid}>
            {MONTH_OPTIONS.map((month) => (
              <TouchableOpacity
                key={month.id}
                style={[
                  styles.monthOption,
                  { 
                    backgroundColor: selectedMonth?.id === month.id ? colors.primary : colors.card,
                    borderColor: selectedMonth?.id === month.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => handleSelectMonth(month)}
              >
                <Text 
                  style={[
                    styles.monthText, 
                    { color: selectedMonth?.id === month.id ? '#FFFFFF' : colors.text }
                  ]}
                >
                  {month.label.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.clearButton, { borderColor: colors.border }]}
          onPress={() => {
            onSelectOption(null);
            onSelectMonth(null);
            onClose();
          }}
        >
          <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
            {t('clearDateFilter')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    paddingTop: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  optionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    flex: 1,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  monthOption: {
    width: '23%',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  clearButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 'auto',
  },
  clearButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
});

export default DateFilterModal;
