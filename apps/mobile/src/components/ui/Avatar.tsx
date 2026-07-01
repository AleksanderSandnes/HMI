import { Image, Text, View } from "react-native";

/** Circular avatar: shows the picked profile image if set, else the initials. */
export function Avatar({
  initials,
  uri,
  size,
}: {
  initials: string;
  uri?: string | null;
  size: number;
}) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden border border-glass-border-strong bg-[#1a2036]"
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text
          style={{ fontSize: Math.round(size * 0.34) }}
          className="font-extrabold text-[#c9d2e6]"
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

export default Avatar;
