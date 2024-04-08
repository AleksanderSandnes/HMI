import React from 'react';
import { Picker } from '@react-native-picker/picker';

const YearSelector = ({ year, setYear }: { year: number, setYear: (year: number) => void }) => (
    <Picker
        selectedValue={year}
        style={{ height: 40, width: 250, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderColor: 'white', borderWidth: 1, color: 'white', paddingLeft: 10, marginTop: 20 }}
        mode={"dialog"}
        onValueChange={(itemValue) => setYear(itemValue)}
    >
        {Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i).map((year, index) => (
            <Picker.Item key={index} label={year.toString()} value={year} color='black' />
        ))}
    </Picker>
);

export default YearSelector;