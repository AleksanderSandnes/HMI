import { Platform, StyleSheet, Text, type TextStyle } from "react-native";

/**
 * App-wide typography. Geist is the same clean geometric sans the web app uses,
 * so mobile matches the design 1:1. On web it loads as a single variable family
 * and CSS picks the weight; on native each weight is a distinct loaded family
 * (see `GEIST_FONTS` + `useFonts` in `app/_layout.tsx`), so we map the requested
 * `fontWeight` to the matching Geist family.
 */
export const FONT_STACK =
  "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Native font families to load via `expo-font` — keys become the family names. */
export const GEIST_FONT_NAMES = [
  "Geist_400Regular",
  "Geist_500Medium",
  "Geist_600SemiBold",
  "Geist_700Bold",
  "Geist_800ExtraBold",
  "Geist_900Black",
] as const;

const WEIGHT_FAMILY: Record<string, string> = {
  "500": "Geist_500Medium",
  "600": "Geist_600SemiBold",
  "700": "Geist_700Bold",
  bold: "Geist_700Bold",
  "800": "Geist_800ExtraBold",
  "900": "Geist_900Black",
};

/** Map a React Native `fontWeight` to the matching loaded Geist family. */
export function geistFamilyForWeight(weight: TextStyle["fontWeight"]): string {
  return WEIGHT_FAMILY[String(weight)] ?? "Geist_400Regular";
}

interface RenderProps {
  style?: unknown;
}
interface PatchableText {
  render?: (props: RenderProps, ref: unknown) => unknown;
  __hmiFontPatched?: boolean;
}

/**
 * Make Geist the default family for every `<Text>`. We prepend the family to the
 * incoming `style` so per-component sizes/weights still apply and any explicit
 * `fontFamily` (e.g. icon glyphs) keeps winning by staying later in the array.
 */
function patchDefaultTextFont(resolve: (props: RenderProps) => string) {
  const TextAny = Text as unknown as PatchableText;
  if (TextAny.__hmiFontPatched || typeof TextAny.render !== "function") return;
  const baseRender = TextAny.render;
  TextAny.render = (props: RenderProps, ref: unknown) =>
    baseRender({ ...props, style: [{ fontFamily: resolve(props) }, props.style] }, ref);
  TextAny.__hmiFontPatched = true;
}

if (Platform.OS === "web" && typeof document !== "undefined") {
  if (!document.getElementById("hmi-geist-font")) {
    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";
    document.head.appendChild(preconnect2);

    const stylesheet = document.createElement("link");
    stylesheet.id = "hmi-geist-font";
    stylesheet.rel = "stylesheet";
    stylesheet.href =
      "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800;900&display=swap";
    document.head.appendChild(stylesheet);
  }

  patchDefaultTextFont(() => FONT_STACK);
  document.title = "HMI";
} else {
  patchDefaultTextFont((props) => {
    const flat = StyleSheet.flatten(props.style) as TextStyle | undefined;
    return geistFamilyForWeight(flat?.fontWeight);
  });
}
