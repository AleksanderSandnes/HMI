import React from 'react';
import { Picker } from '@react-native-picker/picker';

interface MonthSelectorProps {
  month: string;
  setMonth: (value: string) => void;
}

export default function MonthSelector({ month, setMonth }: MonthSelectorProps) {
  return (
    <Picker
      selectedValue={month}
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
      onValueChange={(itemValue) => setMonth(itemValue)}
    >
      <Picker.Item label="January" value="0" color="black" />
      <Picker.Item label="February" value="1" color="black" />
      <Picker.Item label="March" value="2" color="black" />
      <Picker.Item label="April" value="3" color="black" />
      <Picker.Item label="May" value="4" color="black" />
      <Picker.Item label="June" value="5" color="black" />
      <Picker.Item label="July" value="6" color="black" />
      <Picker.Item label="August" value="7" color="black" />
      <Picker.Item label="September" value="8" color="black" />
      <Picker.Item label="October" value="9" color="black" />
      <Picker.Item label="November" value="10" color="black" />
      <Picker.Item label="December" value="11" color="black" />
    </Picker>
  );
}
