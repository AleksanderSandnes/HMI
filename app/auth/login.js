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
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../(services)/api/api';
import { useDispatch, useSelector } from 'react-redux';
import { loginUserAction } from '../(redux)/authSlice';

const validationSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email().label('Email'),
  password: Yup.string()
    .required('Password is required')
    .min(4)
    .label('Password'),
});

const Login = () => {
  const mutation = useMutation({
    mutationFn: loginUser,
    mutationKey: ['login'],
  });
  const dispatch = useDispatch();

  const router = useRouter();
  useSelector((state) => console.log('Store data: ', state));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {mutation?.isError && (
        <Text style={styles.errorText}>
          {mutation?.error?.response?.data?.message}
        </Text>
      )}
      {mutation?.isSuccess && (
        <Text style={styles.successText}>Logged in successfully</Text>
      )}
      <Formik
        initialValues={{ email: 'nomail@nomail.com', password: '1243' }}
        onSubmit={(values) => {
          console.log(values);
          mutation
            .mutateAsync(values)
            .then((data) => {
              console.log('data', data);
              dispatch(loginUserAction(data));
              router.push('/(tabs)');
            })
            .catch((error) => {
              //console.log('error', error);
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
              placeholder="Password"
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              value={values.password}
              secureTextEntry
            />
            {errors.password && touched.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.button}
              disabled={mutation?.isPending}
            >
              {mutation?.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
  );
};

export default Login;

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
