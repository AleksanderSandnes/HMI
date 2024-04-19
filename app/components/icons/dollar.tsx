import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DollarIcon() {
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 50,
        backgroundColor: '#eae20e',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 10,
      }}
    >
      <MaterialIcons name="attach-money" size={40} color="white" />
    </View>
  );
}
