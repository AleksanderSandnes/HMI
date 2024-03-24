import React from 'react';
import { Box } from '@gluestack-ui/themed';

const SmallBox = ({ children }) => {
    return (
        <Box
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(39,64,112,255)',
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
            }}
        >
            {children}
        </Box>
    );
}

export default SmallBox;