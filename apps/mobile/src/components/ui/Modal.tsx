import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BREAKPOINTS } from '@hmi/core';
import { GRADIENTS, type StatGradient } from '../../lib/gradients';
import type { IconRender } from './types';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  icon: IconRender;
  gradient: StatGradient;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Centered popup with a glass card, gradient icon header and dimmed/blurred
 * backdrop (mirrors the web modal pattern). Used for editing account/password.
 */
export function Modal({
  visible,
  onClose,
  icon,
  gradient,
  title,
  subtitle,
  children,
}: ModalProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < BREAKPOINTS.mobile;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center p-[18px]"
      >
        <BlurView
          intensity={18}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          className="bg-[rgba(4,7,16,0.72)]"
        />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: isPhone ? '100%' : 460, maxWidth: '100%', maxHeight: '88%' }}
          className="overflow-hidden rounded-lg border border-glass-border-strong bg-[rgba(14,20,35,0.96)] p-[22px]"
        >
          <View className="flex-row items-center gap-3.5">
            <LinearGradient
              colors={GRADIENTS[gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon({ color: '#0a1124', size: 16 })}
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-lg font-extrabold tracking-[-0.3px] text-text-primary">
                {title}
              </Text>
              {subtitle ? (
                <Text className="mt-0.5 text-[13px] font-medium text-text-muted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              className="h-8 w-8 items-center justify-center rounded-[10px] border border-glass-border bg-glass-fill"
            >
              <Ionicons name="close" size={16} color="#71809a" />
            </Pressable>
          </View>

          <ScrollView
            className="mt-[18px]"
            contentContainerStyle={{ paddingBottom: 2 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

export default Modal;
