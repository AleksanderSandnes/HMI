import React, { ReactNode } from 'react';
import { Box } from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle, Dimensions } from 'react-native';

interface BigBoxProps {
    children: ReactNode;
}

const windowWidth = Dimensions.get('window').width;

const BigBox: React.FC<BigBoxProps> = ({ children }) => {
    if (windowWidth <= 768) {
        const boxStyle: ViewStyle = {
            borderRadius: 10,
            overflow: 'hidden',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.5,
            shadowRadius: 5,
            elevation: 10
        };

        return (
            <Box style={boxStyle}>
                {children}
            </Box>
        );
    } else {
        const boxStyle: ViewStyle = {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            overflow: 'hidden',
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.5,
            shadowRadius: 5,
            elevation: 10,
        };

        const gradientStyle: ViewStyle = {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };

        return (
            <Box style={boxStyle}>
                <LinearGradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    colors={['rgba(40,38,91,255)', 'rgba(39,56,106,255)']}
                    style={gradientStyle}
                />
                {children}
            </Box>
        );
    }
}

export default BigBox;