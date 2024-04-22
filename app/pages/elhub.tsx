import React, { FC } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import Background from '../components/boxes/universal/background';
import SmallBoxWeb from '../components/boxes/web/smallBoxWeb';
import SmallBoxMobile from '../components/boxes/mobile/smallBoxMobile';
import BigBox from '../components/boxes/universal/bigBox';
import PowerIcon from '../components/icons/power';

const Elhub: FC = function Elhub() {
  const windowWidth = useWindowDimensions().width;

  if (windowWidth <= 768) {
    return (
      <Background>
        <ScrollView>
          <View
            style={{
              flexDirection: windowWidth > 768 ? 'row' : 'column',
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
                width: windowWidth * 0.95,
              }}
            >
              <BigBox>
                <Text>Chart</Text>
              </BigBox>
            </View>

            <View
              style={{
                flex: 2,
                flexDirection: 'column',
                width: windowWidth * 0.95,
              }}
            >
              <SmallBoxMobile>
                <PowerIcon />
                <Box style={{ height: 20 }} />
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  Strømpris
                </Text>
              </SmallBoxMobile>

              <Box style={{ height: 20 }} />

              <SmallBoxMobile>
                <PowerIcon />
                <Box style={{ height: 20 }} />
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  Gjennomsnittlig strømpris
                </Text>
              </SmallBoxMobile>

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
          <SmallBoxWeb>
            <PowerIcon />
            <Box style={{ height: 20 }} />
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                alignSelf: 'center',
              }}
            >
              Strømpris
            </Text>
          </SmallBoxWeb>

          <Box style={{ height: 20 }} />

          <SmallBoxWeb>
            <PowerIcon />
            <Box style={{ height: 20 }} />
            <Text
              style={{
                color: 'white',
                textAlign: 'center',
                alignSelf: 'center',
              }}
            >
              Gjennomsnittlig strømpris
            </Text>
          </SmallBoxWeb>
        </VStack>
      </HStack>
    </Background>
  );
};

export default Elhub;
