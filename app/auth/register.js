import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { registerUser } from '../(services)/api/api';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      {mutation?.isError && (
        <Text style={styles.errorText}>
          {mutation?.error?.response?.data?.message}
        </Text>
      )}
      {mutation?.isSuccess && (
        <Text style={styles.successText}>Registration is successful</Text>
      )}
      <Formik
        initialValues={{
          email: 'nomail@nomail.com',
          username: 'Alex',
          password: '1243',
          confirmPassword: '1243',
        }}
        onSubmit={(values) => {
          mutation
            .mutateAsync(values)
            .then((data) => {
              dispatch(registerUser(data));
            })
            .catch((error) => {
              //console.log('error', error);
            });
          router.push('/(tabs)');
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
        }) => (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              value={values.email}
              keyboardType="email-address"
            />
            {errors.email && touched.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Username"
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              value={values.username}
              keyboardType="email-address"
            />
            {errors.username && touched.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Password"
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              securedTextEntry
            />
            {errors.password && touched.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              value={values.confirmPassword}
              securedTextEntry
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.button}
              disabled={mutation?.isPending}
            >
              {mutation?.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successText: {
    color: 'green',
    marginBottom: 16,
  },
});
