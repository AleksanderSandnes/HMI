import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  TextInputProps,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

/**
 * Web-only fixes: removes the default focus outline and prevents Chrome's
 * autofill from painting a white background / dark text over the dark field.
 * The long background-color transition defers the autofill repaint
 * indefinitely, while WebkitTextFillColor keeps our light text visible.
 */
const WEB_INPUT_FIX = {
  outlineStyle: 'none',
  transition: 'background-color 100000s ease-in-out 0s',
  WebkitTextFillColor: theme.text.primary,
  caretColor: theme.text.primary,
} as object;

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome5>['name'];
  /** Renders a password field with a show/hide toggle. */
  secure?: boolean;
  hint?: string;
  onFocusClearMask?: () => void;
}

/**
 * Labeled text input — glass fill, hairline border, focus glow,
 * optional leading icon and password visibility toggle.
 */
export default function Field({
  label,
  icon,
  secure = false,
  hint,
  onFocusClearMask,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        {icon ? (
          <FontAwesome5
            name={icon}
            size={14}
            color={focused ? theme.solar.light : theme.text.muted}
            solid
            style={styles.leadingIcon}
          />
        ) : null}
        <TextInput
          {...inputProps}
          secureTextEntry={secure && !reveal}
          placeholderTextColor={theme.text.muted}
          onFocus={(e) => {
            setFocused(true);
            onFocusClearMask?.();
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          style={[
            styles.input,
            Platform.OS === 'web' ? WEB_INPUT_FIX : null,
          ]}
        />
        {secure ? (
          <Pressable
            onPress={() => setReveal((r) => !r)}
            hitSlop={10}
            style={styles.revealBtn}
            accessibilityRole="button"
            accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
          >
            <FontAwesome5
              name={reveal ? 'eye-slash' : 'eye'}
              size={14}
              color={theme.text.secondary}
              solid
            />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.text.secondary,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.glass.fillSubtle,
    borderWidth: 1,
    borderColor: theme.glass.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
  },
  inputRowFocused: {
    borderColor: theme.solar.main,
    backgroundColor: theme.glass.fill,
  },
  leadingIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 13 : 12,
    fontSize: 15,
    color: theme.text.primary,
    fontWeight: '600',
  },
  revealBtn: { paddingLeft: 10, paddingVertical: 6 },
  hint: {
    fontSize: 11.5,
    color: theme.text.muted,
    marginTop: 6,
    fontWeight: '500',
  },
});
