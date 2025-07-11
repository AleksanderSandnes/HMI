import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { registerUser } from '../(services)/api/api';
import { loginUserAction } from '../(redux)/authSlice';
import { solarTheme } from '../theme/solarTheme';

const validationSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email().label('Email'),
  username: Yup.string().required('Username is required').label('Username'),
  password: Yup.string()
    .required('Password is required')
    .min(4)
    .label('Password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});

const Register = () => {
  const mutation = useMutation({
    mutationFn: registerUser,
    mutationKey: ['register'],
  });
  const dispatch = useDispatch();
  const router = useRouter();
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dynamicStyles = {
    container: {
      ...styles.container,
      paddingHorizontal: isMobile ? 20 : 40,
      paddingVertical: isMobile ? 20 : 40,
    },
    formContainer: {
      ...styles.formContainer,
      maxWidth: isMobile ? '100%' : 400,
      paddingHorizontal: isMobile ? 24 : 32,
      paddingVertical: isMobile ? 32 : 40,
    },
    title: {
      ...styles.title,
      fontSize: isMobile ? 28 : 32,
      marginBottom: isMobile ? 8 : 12,
    },
    subtitle: {
      ...styles.subtitle,
      fontSize: isMobile ? 14 : 16,
      marginBottom: isMobile ? 32 : 40,
    },
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#0f172a" translucent={false} />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.gradientContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                dynamicStyles.container,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={dynamicStyles.formContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={dynamicStyles.title}>Create Account</Text>
                  <Text style={dynamicStyles.subtitle}>
                    Join the energy monitoring revolution
                  </Text>
                </View>

                {/* Status Messages */}
                {mutation?.isError && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.errorMessage}>
                      {mutation?.error?.response?.data?.message ||
                        'Registration failed'}
                    </Text>
                  </View>
                )}
                {mutation?.isSuccess && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.successMessage}>
                      Registration successful! Welcome aboard! 🎉
                    </Text>
                  </View>
                )}

                {/* Form */}
                <Formik
                  initialValues={{
                    email: '',
                    username: '',
                    password: '',
                    confirmPassword: '',
                  }}
                  onSubmit={(values) => {
                    mutation
                      .mutateAsync(values)
                      .then((data) => {
                        dispatch(loginUserAction(data));
                        router.push('/(tabs)');
                      })
                      .catch((error) => {
                        console.log('Registration error:', error);
                      });
                  }}
                  validationSchema={validationSchema}
                >
                  {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched,
                    isValid,
                    dirty,
                  }) => (
                    <View style={styles.form}>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === 'email' &&
                              styles.inputWrapperFocused,
                            errors.email &&
                              touched.email &&
                              styles.inputWrapperError,
                          ]}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor={solarTheme.text.tertiary}
                            value={values.email}
                            onChangeText={handleChange('email')}
                            onBlur={() => {
                              handleBlur('email');
                              setFocusedField(null);
                            }}
                            onFocus={() => setFocusedField('email')}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                        {errors.email && touched.email && (
                          <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Username</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === 'username' &&
                              styles.inputWrapperFocused,
                            errors.username &&
                              touched.username &&
                              styles.inputWrapperError,
                          ]}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Choose a username"
                            placeholderTextColor={solarTheme.text.tertiary}
                            value={values.username}
                            onChangeText={handleChange('username')}
                            onBlur={() => {
                              handleBlur('username');
                              setFocusedField(null);
                            }}
                            onFocus={() => setFocusedField('username')}
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </View>
                        {errors.username && touched.username && (
                          <Text style={styles.errorText}>
                            {errors.username}
                          </Text>
                        )}
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === 'password' &&
                              styles.inputWrapperFocused,
                            errors.password &&
                              touched.password &&
                              styles.inputWrapperError,
                          ]}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Create a secure password"
                            placeholderTextColor={solarTheme.text.tertiary}
                            value={values.password}
                            onChangeText={handleChange('password')}
                            onBlur={() => {
                              handleBlur('password');
                              setFocusedField(null);
                            }}
                            onFocus={() => setFocusedField('password')}
                            secureTextEntry
                          />
                        </View>
                        {errors.password && touched.password && (
                          <Text style={styles.errorText}>
                            {errors.password}
                          </Text>
                        )}
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View
                          style={[
                            styles.inputWrapper,
                            focusedField === 'confirmPassword' &&
                              styles.inputWrapperFocused,
                            errors.confirmPassword &&
                              touched.confirmPassword &&
                              styles.inputWrapperError,
                          ]}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Confirm your password"
                            placeholderTextColor={solarTheme.text.tertiary}
                            value={values.confirmPassword}
                            onChangeText={handleChange('confirmPassword')}
                            onBlur={() => {
                              handleBlur('confirmPassword');
                              setFocusedField(null);
                            }}
                            onFocus={() => setFocusedField('confirmPassword')}
                            secureTextEntry
                          />
                        </View>
                        {errors.confirmPassword && touched.confirmPassword && (
                          <Text style={styles.errorText}>
                            {errors.confirmPassword}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={handleSubmit}
                        style={[
                          styles.submitButton,
                          (!isValid || !dirty || mutation?.isPending) &&
                            styles.submitButtonDisabled,
                        ]}
                        disabled={mutation?.isPending || !isValid || !dirty}
                      >
                        <LinearGradient
                          colors={solarTheme.primary.gradient}
                          style={styles.submitButtonGradient}
                        >
                          {mutation?.isPending ? (
                            <ActivityIndicator
                              color={solarTheme.text.primary}
                              size="small"
                            />
                          ) : (
                            <Text style={styles.submitButtonText}>
                              Create Account
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <View style={styles.footer}>
                        <Text style={styles.footerText}>
                          Already have an account?{' '}
                          <Text
                            style={styles.linkText}
                            onPress={() => router.push('/auth/login')}
                          >
                            Sign in
                          </Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </Formik>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};

export default Register;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: solarTheme.border.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: solarTheme.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: solarTheme.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageContainer: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorMessage: {
    color: solarTheme.text.error,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  successMessage: {
    color: solarTheme.text.success,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: solarTheme.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: solarTheme.border.primary,
    borderRadius: 12,
    backgroundColor: solarTheme.background.input,
    transition: 'all 0.2s ease',
  },
  inputWrapperFocused: {
    borderColor: solarTheme.border.focus,
    shadowColor: solarTheme.primary.main,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: solarTheme.border.error,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: solarTheme.text.primary,
    fontWeight: '500',
    // Fix Chrome autofill white background
    ...(Platform.OS === 'web' && {
      transition: 'background-color 5000s ease-in-out 0s',
      WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.1) inset',
      WebkitTextFillColor: solarTheme.text.primary,
    }),
  },
  inputFocused: {
    color: solarTheme.text.primary,
  },
  inputError: {
    color: solarTheme.text.primary,
  },
  errorText: {
    color: solarTheme.text.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: solarTheme.primary.main,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  submitButtonText: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: solarTheme.border.primary,
  },
  footerText: {
    color: solarTheme.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  linkText: {
    color: solarTheme.primary.light,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
