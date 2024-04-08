import React from 'react';
import { Dimensions } from "react-native";
import { Box, HStack, Text, VStack, View, ScrollView } from "@gluestack-ui/themed";
import Background from "../components/boxes/background";
import SmallBox from "../components/boxes/smallBox";
import BigBox from '../components/boxes/bigBox';
import PowerProductionChart from "../components/charts/powerProductionChart";
import PowerIcon from "../components/icons/power";

const windowWidth = Dimensions.get('window').width;

const Elhub: React.FC = () => {
    if (windowWidth <= 768) {
        return (
            <Background>
                <ScrollView>
                    <View style={{ flexDirection: windowWidth > 768 ? 'row' : 'column', width: '100%', justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                        <View style={{ flex: 8, flexDirection: 'column', paddingBottom: 20, width: windowWidth * 0.95 }}>
                            <BigBox>
                                <PowerProductionChart />
                            </BigBox>
                        </View>

                        {windowWidth > 768 && <Box style={{ width: 20 }} />}

                        <View style={{ flex: 2, flexDirection: 'column', width: windowWidth * 0.95 }}>
                            <SmallBox>
                                <PowerIcon />
                                <Box style={{ height: 20 }} />
                                <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømpris</Text>
                            </SmallBox>

                            <Box style={{ height: 20 }} />

                            <SmallBox>
                                <PowerIcon />
                                <Box style={{ height: 20 }} />
                                <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Gjennomsnittlig strømpris</Text>
                            </SmallBox>

                            <Box style={{ height: 20 }} />
                        </View>
                    </View>
                </ScrollView>
            </Background>
        )
    } else {
        return (
            <Background>
                <HStack reversed={false} style={{ flex: 0.90, flexDirection: 'row', width: '95%', margin: 'auto' }}>
                    <VStack style={{ flex: 8, flexDirection: 'column' }} reversed={false}>
                        <BigBox>
                            <PowerProductionChart />
                        </BigBox>
                    </VStack>

                    <Box style={{ width: 20 }} />

                    <VStack style={{ flex: 2, flexDirection: 'column' }} reversed={false}>
                        <SmallBox>
                            <PowerIcon />
                            <Box style={{ height: 20 }} />
                            <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømpris</Text>
                        </SmallBox>

                        <Box style={{ height: 20 }} />

                        <SmallBox>
                            <PowerIcon />
                            <Box style={{ height: 20 }} />
                            <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Gjennomsnittlig strømpris</Text>
                        </SmallBox>
                    </VStack>
                </HStack>
            </Background >
        )
    }
}

export default Elhub;