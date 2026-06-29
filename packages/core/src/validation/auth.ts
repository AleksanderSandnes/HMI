// Auth form validation schemas (ported from mobile app/auth/login.js + register.js).
import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email().label('Email'),
  password: Yup.string().required('Password is required').min(4).label('Password'),
});

export const registerAccountSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email().label('Email'),
  username: Yup.string().required('Username is required').label('Username'),
  password: Yup.string().required('Password is required').min(4).label('Password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export type LoginValues = Yup.InferType<typeof loginSchema>;
export type RegisterAccountValues = Yup.InferType<typeof registerAccountSchema>;
