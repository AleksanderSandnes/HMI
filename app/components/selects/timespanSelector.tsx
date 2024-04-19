/* eslint-disable no-unused-vars */
import React from 'react';
import { Picker } from '@react-native-picker/picker';

interface TimespanSelectorProps {
  timespan: string;
  setTimespan: (value: string) => void;
}

export default function TimespanSelector({
  timespan,
  setTimespan,
}: TimespanSelectorProps) {
  return (
    <Picker
      selectedValue={timespan}
      style={{
        height: 40,
        width: 250,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: 'white',
        borderWidth: 1,
        color: 'white',
        paddingLeft: 10,
      }}
      mode="dialog"
      onValueChange={(itemValue) => setTimespan(itemValue)}
    >
      <Picker.Item label="Daily Interval" value="daily" color="black" />
      <Picker.Item label="Weekly Interval" value="weekly" color="black" />
      <Picker.Item label="Monthly Interval" value="monthly" color="black" />
    </Picker>
  );
}
