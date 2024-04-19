/* eslint-disable no-unused-vars */
import React from 'react';
import { Picker } from '@react-native-picker/picker';

interface DataTypeSelectorProps {
  dataType: string;
  setDataType: (value: string) => void;
}

export default function DataTypeSelector({
  dataType,
  setDataType,
}: DataTypeSelectorProps) {
  return (
    <Picker
      selectedValue={dataType}
      style={{
        height: 40,
        width: 250,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: 'white',
        borderWidth: 1,
        color: 'white',
        paddingLeft: 10,
        marginTop: 20,
      }}
      mode="dialog"
      onValueChange={(itemValue) => setDataType(itemValue)}
    >
      <Picker.Item label="Temperature" value="temperature" color="black" />
      <Picker.Item label="Wind Speed" value="windSpeed" color="black" />
      <Picker.Item label="Wind Direction" value="windDirection" color="black" />
      <Picker.Item label="Precip" value="precip" color="black" />
      <Picker.Item label="Pressure" value="pressure" color="black" />
      <Picker.Item
        label="Solar Radiation"
        value="solarRadiation"
        color="black"
      />
      <Picker.Item label="UV Index" value="uvIndex" color="black" />
    </Picker>
  );
}
