import { Button, View } from 'react-native';
import React from 'react';

export default function FormButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ marginTop: 20, alignItems: 'center' }}>
      <Button title="View Data" onPress={onPress} color="#0474e4" />
    </View>
  );
}
