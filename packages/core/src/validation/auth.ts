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

export interface RegisterAccountFields {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Validate the register-account step, returning a field → first-message map
 * ({} when valid). Shared by the web and mobile register wizards.
 */
export function validateRegisterAccount(
  account: RegisterAccountFields,
  schema: ReturnType<typeof createRegisterAccountSchema>,
): Record<string, string> {
  try {
    schema.validateSync(account, { abortEarly: false });
    return {};
  } catch (err) {
    const map: Record<string, string> = {};
    if (err instanceof Yup.ValidationError) {
      err.inner.forEach((e) => {
        if (e.path && !map[e.path]) map[e.path] = e.message;
      });
    }
    return map;
  }
}
