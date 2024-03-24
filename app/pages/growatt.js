import React from "react";
import { Box, HStack, Text, VStack, View } from "@gluestack-ui/themed";
import Background from "../components/background";
import BigBox from "../components/bigBox";
import SmallBox from "../components/smallBox";
import { FontAwesome } from '@expo/vector-icons';
import PowerProductionChart from "../components/powerProductionChart";

const Growatt = () => {
    return (
        <Background style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <HStack reversed={false} style={{ flex: 0.90, flexDirection: 'row', width: '95%', margin: 'auto' }}>
                <VStack style={{ flex: 8, flexDirection: 'column' }} reversed={false}>
                    <BigBox>
                        <PowerProductionChart />
                    </BigBox>
                </VStack>

                <Box style={{ width: 20 }} />

                <VStack style={{ flex: 2, flexDirection: 'column' }} reversed={false}>
                    <SmallBox>
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
                        <Box style={{ height: 20 }} />
                        <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon basert på valgt tidsintervall</Text>
                    </SmallBox>

                    <Box style={{ height: 20 }} />

                    <SmallBox>
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
                        <Box style={{ height: 20 }} />
                        <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon totalt</Text>
                    </SmallBox>
                </VStack>
            </HStack>
        </Background >
    );
}

export default Growatt;