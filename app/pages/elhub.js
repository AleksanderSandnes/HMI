import React from "react";
import { Box, HStack, Text, VStack } from "@gluestack-ui/themed";
import Background from "../components/background";
import BigBox from "../components/bigBox";
import SmallBox from "../components/smallBox";


const Elhub = () => {
    return (
        <Background style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <HStack reversed={false} style={{ flex: 0.90, flexDirection: 'row', width: '95%', margin: 'auto' }}>
                <VStack style={{ flex: 8, flexDirection: 'column' }} reversed={false}>
                    <BigBox>
                        <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Grafer</Text>
                    </BigBox>
                </VStack>

                <Box style={{ width: 20 }} />

                <VStack style={{ flex: 2, flexDirection: 'column' }} reversed={false}>
                    <SmallBox>
                        <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon basert på valgt tidsintervall</Text>
                    </SmallBox>

                    <Box style={{ height: 20 }} />

                    <SmallBox>
                        <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon totalt</Text>
                    </SmallBox>
                </VStack>
            </HStack>
        </Background >
    );
}

export default Elhub;