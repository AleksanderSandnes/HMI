import React, { ReactNode } from 'react';
import { Box } from '@gluestack-ui/themed';
import { ViewStyle } from 'react-native';

interface SmallBoxProps {
  children: ReactNode;
}

export default function SmallBoxWeb({ children }: SmallBoxProps) {
  const boxStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(39,64,112,255)',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    minHeight: 300,
  };

  return <Box style={boxStyle}>{children}</Box>;
}
