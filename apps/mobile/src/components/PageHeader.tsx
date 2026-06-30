import type { ReactNode } from 'react';
import { View, Text } from 'react-native';

/** Standard screen header: title + subtitle with an optional right slot. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[26px] font-extrabold tracking-[-0.6px] text-text-primary">
            {title}
          </Text>
          <Text className="mt-1 text-[13.5px] font-medium text-text-muted">
            {subtitle}
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

export default PageHeader;
