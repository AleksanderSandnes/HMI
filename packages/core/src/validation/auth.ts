// Auth form validation schemas (ported from mobile app/auth/login.js + register.js).
// Factories take a Translator so the apps can rebuild the schemas when the
// language changes; the plain exports keep the English default for callers
// (and tests) that don't care about locale.
import * as Yup from "yup";

import { DEFAULT_LOCALE, getTranslator, type Translator } from "../i18n";

export function createLoginSchema(t: Translator) {
  return Yup.object().shape({
    email: Yup.string()
      .required(t("validation.emailRequired"))
      .email(t("validation.emailInvalid"))
      .label("Email"),
    password: Yup.string()
      .required(t("validation.passwordRequired"))
      .min(4, t("validation.passwordMin"))
      .label("Password"),
  });
}

export function createRegisterAccountSchema(t: Translator) {
  return Yup.object().shape({
    email: Yup.string()
      .required(t("validation.emailRequired"))
      .email(t("validation.emailInvalid"))
      .label("Email"),
    username: Yup.string().required(t("validation.usernameRequired")).label("Username"),
    password: Yup.string()
      .required(t("validation.passwordRequired"))
      .min(4, t("validation.passwordMin"))
      .label("Password"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("validation.passwordsMustMatch"))
      .required(t("validation.confirmPassword")),
  });
}

export const loginSchema = createLoginSchema(getTranslator(DEFAULT_LOCALE));
export const registerAccountSchema = createRegisterAccountSchema(getTranslator(DEFAULT_LOCALE));

export type LoginValues = Yup.InferType<typeof loginSchema>;
export type RegisterAccountValues = Yup.InferType<typeof registerAccountSchema>;
