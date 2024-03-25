import React from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const PowerIcon: React.FC = () => {
    return (
        <View style={{
            width: 60,
            height: 60,
            borderRadius: 50,
            backgroundColor: '#4fd3cc',
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 10,
        }}>
            <FontAwesome name="bolt" size={40} color="white" />
        </View>
    );
}

export default PowerIcon;