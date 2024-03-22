import React from "react";
import { Box, HStack, Text, VStack } from "@gluestack-ui/themed";

const WeatherStation = () => {
    return (
        <HStack space="none" reversed={false} style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
            <VStack style={{ flex: 8, display: 'flex', flexDirection: 'column' }} space="none" reversed={false}>
                <Box style={{ flex: 12, backgroundColor: 'blue', height: '50%' }} display="flex" justifyContent="center" alignItems="center">
                    <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Grafer</Text>
                </Box>
            </VStack>

            <VStack style={{ flex: 2, display: 'flex', flexDirection: 'column' }} space="none" reversed={false}>
                <Box style={{ flex: 2, backgroundColor: 'darkblue', height: '50%' }} display="flex" justifyContent="center" alignItems="center">
                    <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon basert på valgt tidsintervall</Text>
                </Box>
                <Box style={{ flex: 2, backgroundColor: 'darkblue', height: '50%' }} display="flex" justifyContent="center" alignItems="center">
                    <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon totalt</Text>
                </Box>
            </VStack>
        </HStack>
    );
}

export default WeatherStation;