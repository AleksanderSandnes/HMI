import { Button, View } from 'react-native';
import React from 'react';

const FormButton = ({ onPress }: { onPress: () => void }) => (
    <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Button
            title="View Data"
            onPress={onPress}
            color="#0474e4" // Change button color
        />
    </View>
);

export default FormButton;