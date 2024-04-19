/* eslint-disable no-unused-vars */
import React from 'react';
import { Picker } from '@react-native-picker/picker';

interface YearSelectorProps {
  year: number;
  setYear: (value: number) => void;
}

export default function YearSelector({ year, setYear }: YearSelectorProps) {
  const years = Array.from(
    { length: new Date().getFullYear() - 2019 },
    (_, i) => 2020 + i
  );

  return (
    <Picker
      selectedValue={year}
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
      onValueChange={(itemValue) => setYear(itemValue)}
    >
      {years.map((yearValue) => (
        <Picker.Item
          key={yearValue}
          label={yearValue.toString()}
          value={yearValue}
          color="black"
        />
      ))}
    </Picker>
  );
}
