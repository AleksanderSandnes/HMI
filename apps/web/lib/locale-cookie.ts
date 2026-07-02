/** Cookie holding the user's language choice. Read by the server root layout
 * so `<html lang>` and the first paint render in the right language; written
 * client-side by `LocaleProvider.setLocale`. */
export const LOCALE_COOKIE = "hmi.locale";
