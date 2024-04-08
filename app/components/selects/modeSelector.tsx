import React from 'react';
import { Picker } from '@react-native-picker/picker';

const ModeSelector = ({ mode, setMode }: { mode: string, setMode: (mode: string) => void }) => (
    <Picker
        selectedValue={mode}
        style={{ height: 40, width: 250, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderColor: 'white', borderWidth: 1, color: 'white', paddingLeft: 10 }}
        mode={"dialog"}
        onValueChange={(itemValue) => setMode(itemValue)}
    >
        <Picker.Item label="Daily Mode" value="daily" color='black' />
        <Picker.Item label="Weekly Mode" value="weekly" color='black' />
        <Picker.Item label="Monthly Mode" value="monthly" color='black' />
    </Picker>
);

export default ModeSelector;