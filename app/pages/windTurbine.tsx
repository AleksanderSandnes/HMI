import React from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Box,
  HStack,
  Text,
  VStack,
  View,
  ScrollView,
} from '@gluestack-ui/themed';
import Background from '../components/boxes/background';
import SmallBox from '../components/boxes/smallBox';
import DollarIcon from '../components/icons/dollar';
import BigBox from '../components/boxes/bigBox';
import PowerIcon from '../components/icons/power';

const WindTurbine: React.FC = function WindTurbineComponent() {
  const windowDimensions = useWindowDimensions();
  if (windowDimensions.width <= 768) {
    return (
      <Background>
        <ScrollView>
          <View
            style={{
              flexDirection: windowDimensions.width > 768 ? 'row' : 'column',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 60,
            }}
          >
            <View
              style={{
                flex: 8,
                flexDirection: 'column',
                paddingBottom: 20,
                width: windowDimensions.width * 0.95,
              }}
            >
              <BigBox>
                <Text>Chart</Text>
              </BigBox>
            </View>

            {windowDimensions.width > 768 && <Box style={{ width: 20 }} />}

            <View
              style={{
                flex: 2,
                flexDirection: 'column',
                width: windowDimensions.width * 0.95,
              }}
            >
              <SmallBox>
                <PowerIcon />
                <Box style={{ height: 20 }} />
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  Strømproduksjon basert på valgt tidsintervall
                </Text>
              </SmallBox>

              <Box style={{ height: 20 }} />

              <SmallBox>
                <DollarIcon />
                <Box style={{ height: 20 }} />
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  Inntekt basert på valgt tidsintervall
                </Text>
              </SmallBox>

              <Box style={{ height: 20 }} />
            </View>
          </View>
        </ScrollView>
      </Background>
    );
  }
  return (
    <Background>
      <HStack
        reversed={false}
        style={{
          flex: 0.9,
          flexDirection: 'row',
          width: '95%',
          margin: 'auto',
        }}
      >
        <VStack style={{ flex: 8, flexDirection: 'column' }} reversed={false}>
          <BigBox>
            <Text>Chart</Text>
          </BigBox>
        </VStack>

        <Box style={{ width: 20 }} />

        <VStack style={{ flex: 2, flexDirection: 'column' }} reversed={false}>
          <SmallBox>
            <PowerIcon />
            <Box style={{ height: 20 }} />
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                alignSelf: 'center',
              }}
            >
              Strømproduksjon basert på valgt tidsintervall
            </Text>
          </SmallBox>

          <Box style={{ height: 20 }} />

          <SmallBox>
            <DollarIcon />
            <Box style={{ height: 20 }} />
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                alignSelf: 'center',
              }}
            >
              Inntekt basert på valgt tidsintervall
            </Text>
          </SmallBox>
        </VStack>
      </HStack>
    </Background>
  );
};

export default WindTurbine;
