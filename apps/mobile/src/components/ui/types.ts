import type { ReactNode } from "react";

/**
 * Library-agnostic icon slot. UI components take a render function so call sites
 * can use @expo/vector-icons, Skia, or anything else — the component supplies the
 * resolved color + size (which may depend on state, e.g. focus/variant).
 */
export type IconRender = (props: { color: string; size: number }) => ReactNode;
