import React, { ReactNode } from 'react';
import { Box } from '@gluestack-ui/themed';
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

        return (
            <Box style={boxStyle}>
                {children}
            </Box>
        );
    }
}

export default BigBox;