import React from 'react';
import { Picker } from '@react-native-picker/picker';

type DaySelectorProps = {
    day: string;
    setDay: (day: string) => void;
    dates: Date[];
};

const DaySelector = ({ day, setDay, dates }: DaySelectorProps) => (
    <Picker
        selectedValue={day}
        style={{ height: 40, width: 250, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderColor: 'white', borderWidth: 1, color: 'white', paddingLeft: 10, marginTop: 20 }}
        mode={"dialog"}
        onValueChange={(itemValue) => setDay(itemValue)}
    >
        {dates.map((date, index) => {
            const day = date.getDate().toString().padStart(2, '0');
            return <Picker.Item key={index} label={day} value={day} color='black' />
        })}
    </Picker>
);

export default DaySelector;