import { usePushRegistration } from "../hooks/usePushRegistration";

/**
 * Headless component that registers the device's Expo push token once the user is logged
 * in (native only). Renders nothing.
 */
export default function PushRegistrar(): null {
  usePushRegistration();
  return null;
}
