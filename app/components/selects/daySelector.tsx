import React from 'react';
import { Picker } from '@react-native-picker/picker';

type DaySelectorProps = {
  selectedDay: string;
  setDay: (value: string) => void;
  dates: Date[];
};

export default function DaySelector({
  selectedDay,
  setDay,
  dates,
}: DaySelectorProps) {
  return (
    <Picker
      selectedValue={selectedDay}
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
      onValueChange={(itemValue) => setDay(itemValue)}
    >
      {dates.map((date) => {
        const dayValue = date.getDate().toString().padStart(2, '0');
        return (
          <Picker.Item
            key={dayValue}
            label={dayValue}
            value={dayValue}
            color="black"
          />
        );
      })}
    </Picker>
  );
}
