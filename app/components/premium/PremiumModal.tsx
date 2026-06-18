import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { premiumTheme, glassBlur, glow, type GradientColors } from '../../theme/premiumTheme';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  gradient: GradientColors;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Fancy centered popup with a glass card, gradient icon header and
 * a dimmed backdrop. Used for editing account/profile/password.
 */
export default function PremiumModal({
  visible,
  onClose,
  icon,
  gradient,
  title,
  subtitle,
  children,
}: PremiumModalProps) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            glassBlur(28),
            glow(),
            { width: isMobile ? '100%' : 460, maxWidth: '100%' },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.icon}
            >
              <FontAwesome5 name={icon} size={16} color={premiumTheme.text.inverse} solid />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <FontAwesome5 name="times" size={16} color={premiumTheme.text.muted} solid />
            </Pressable>
          </View>

          <ScrollView
            style={{ marginTop: 18 }}
            contentContainerStyle={{ paddingBottom: 2 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 16, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(6px)' } as object) : {}),
  },
  card: {
    backgroundColor: 'rgba(14, 20, 35, 0.96)',
    borderRadius: premiumTheme.radius.lg,
    borderWidth: 1,
    borderColor: premiumTheme.glass.borderStrong,
    padding: 22,
    maxHeight: '88%',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: premiumTheme.text.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premiumTheme.glass.fill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
});
