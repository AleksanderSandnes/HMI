import { Platform, Text } from "react-native";

/**
 * App-wide typography. Inter is a clean, modern geometric sans that reads well
 * across web, tablet and mobile. The stack falls back to the native system
 * font if Inter has not loaded yet.
 */
export const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

if (Platform.OS === "web" && typeof document !== "undefined") {
  /* 1. Load the Inter webfont (all the weights the UI uses) once. */
  if (!document.getElementById("hpi-inter-font")) {
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
    stylesheet.id = "hpi-inter-font";
    stylesheet.rel = "stylesheet";
    stylesheet.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
    document.head.appendChild(stylesheet);
  }

  /*
   * 2. Make Inter the default family for every <Text>. We prepend the family to
   *    the incoming `style` prop so per-component styles (font size/weight)
   *    still apply, and any explicit fontFamily (e.g. icon glyphs) keeps
   *    winning because it stays later in the resolved style array.
   */
  interface RenderProps {
    style?: unknown;
  }
  const TextAny = Text as unknown as {
    render?: (props: RenderProps, ref: unknown) => unknown;
    __hpiFontPatched?: boolean;
  };
  if (!TextAny.__hpiFontPatched && typeof TextAny.render === "function") {
    const baseRender = TextAny.render;
    TextAny.render = (props: RenderProps, ref: unknown) =>
      baseRender({ ...props, style: [{ fontFamily: FONT_STACK }, props.style] }, ref);
    TextAny.__hpiFontPatched = true;
  }

  /* 3. Browser tab title. */
  document.title = "HMI";
}
