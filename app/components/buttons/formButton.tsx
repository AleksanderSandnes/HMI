import { Button, ButtonText } from '@gluestack-ui/themed';
import React from 'react';

const FormButton = () => (
    <Button
        size="md"
        variant="solid"
        action="primary"
        isDisabled={false}
        isFocusVisible={false}
        style={{ backgroundColor: '#0474e4', marginTop: 20, padding: 10, width: 150, alignItems: 'center' }}
    >
        <ButtonText style={{ color: 'white', fontWeight: 'bold' }}>View</ButtonText>
    </Button>
);

export default FormButton;