import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import Background from '../components/boxes/universal/background';
import BigBox from '../components/boxes/universal/bigBox';
import SmallBoxWeb from '../components/boxes/web/smallBoxWeb';
import PowerProductionChart, {
  ChartData,
} from '../components/charts/powerProductionChart';
import PowerIcon from '../components/icons/power';
import TimespanSelector from '../components/selects/timespanSelector';
import { Button } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import SmallBoxMobile from '../components/boxes/mobile/smallBoxMobile';

const web = StyleSheet.create({
  hStack: { flex: 0.9, flexDirection: 'row', width: '95%', margin: 'auto' },
  bigVStack: { flex: 8, flexDirection: 'column' },
  smallVStack: { flex: 2, flexDirection: 'column' },
  smallBoxWidth: { width: 20 },
  smallBoxHeight: { height: 20 },
  text: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
});

const mobile = StyleSheet.create({
  outerView: {
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
  },
});

function Growatt(): React.ReactElement {
  const today = new Date();
  const [data, setData] = useState<ChartData>({ labels: [], datasets: [] });
  const [timespan, setTimespan] = useState('daily');
  const [pickerDate, setPickerDate] = useState(
    today.toISOString().split('T')[0]
  );
  const [open, setOpen] = useState(false);

  const onDismiss = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const onConfirm = useCallback(
    (params) => {
      setOpen(false);
      const selectedDate = params.date;
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      setPickerDate(formattedDate);
    },
    [setOpen, setPickerDate]
  );

  const windowWidth = useWindowDimensions().width;

  const fetchSolarData = () => {
    fetch(`https://hmi-backend.onrender.com/api/solar/daily/${pickerDate}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        if (json && json.data) {
          const formattedData = json.data.map(
            (item: { hour: string; pac: string }) => ({
              hour: item.hour,
              pac: parseFloat(item.pac.replace(',', '.')),
            })
          );

          const isMobile = windowWidth <= 768;

          const labels = formattedData.map((item: { hour: string }) => {
            const [hour, minute] = item.hour.split(':').map(Number);

            if (isMobile) {
              // On mobile, only return the label for every other hour
              return minute === 0 && hour % 2 === 0 ? item.hour : '';
            }
            // On desktop, return the label for every hour
            return minute === 0 ? item.hour : '';
          });

          const pacData = formattedData.map(
            (item: { pac: number }) => item.pac
          );

          setData({
            labels,
            datasets: [
              {
                data: pacData,
                color: () => `#329932`,
                strokeWidth: 1.5,
              },
            ],
          });
        }
      });
  };

  useEffect(() => {
    if (timespan === 'daily') {
      fetchSolarData();
    }
  }, [pickerDate]);

  if (windowWidth <= 768) {
    return (
      <Background>
        <ScrollView>
          <View style={mobile.outerView}>
            <Text style={web.text}>
              Date:{' '}
              {pickerDate
                ? new Date(pickerDate).toDateString()
                : 'No date selected'}
            </Text>
            <View
              style={{
                flex: 8,
                flexDirection: 'column',
                paddingBottom: 20,
                width: windowWidth * 0.95,
              }}
            >
              <BigBox>
                <PowerProductionChart data={data} key={JSON.stringify(data)} />
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
                <Text style={web.text}>Chart controls</Text>
                <Button
                  onPress={() => setOpen(true)}
                  uppercase={false}
                  mode="outlined"
                  buttonColor="#4fd3cc"
                  textColor="white"
                  style={{ borderWidth: 0 }}
                >
                  Pick a date
                </Button>
                <DatePickerModal
                  locale="en"
                  mode="single"
                  visible={open}
                  onDismiss={onDismiss}
                  date={new Date(pickerDate)}
                  onConfirm={onConfirm}
                />
              </SmallBoxMobile>

              <Box style={{ height: 20 }} />

              <SmallBoxMobile>
                <PowerIcon />
                <Box style={{ height: 20 }} />
                <Text style={mobile.text}>
                  Strømproduksjon basert på valgt tidsintervall
                </Text>
              </SmallBoxMobile>

              <Box style={{ height: 20 }} />

              <SmallBoxMobile>
                <PowerIcon />
                <Box style={{ height: 20 }} />
                <Text style={mobile.text}>Strømproduksjon totalt</Text>
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
            <PowerProductionChart data={data} key={JSON.stringify(data)} />
          </BigBox>
        </VStack>

        <Box style={{ width: 20 }} />

        <VStack style={{ flex: 2, flexDirection: 'column' }} reversed={false}>
          <SmallBoxWeb>
            <PowerIcon />
            <Box style={{ height: 20 }} />
            <Text style={web.text}>
              Strømproduksjon basert på valgt tidsintervall
            </Text>
            <Text style={web.text}>kWh</Text>
          </SmallBoxWeb>

          <Box style={{ height: 20 }} />

          <SmallBoxWeb>
            <Text style={web.text}>Chart controls</Text>
            <TimespanSelector timespan={timespan} setTimespan={setTimespan} />
            <Button
              onPress={() => setOpen(true)}
              uppercase={false}
              mode="outlined"
            >
              Pick a date
            </Button>
            <DatePickerModal
              locale="en"
              mode="single"
              visible={open}
              onDismiss={onDismiss}
              date={new Date(pickerDate)}
              onConfirm={onConfirm}
            />

            <Text>
              Selected date:{' '}
              {pickerDate
                ? new Date(pickerDate).toDateString()
                : 'No date selected'}
            </Text>
          </SmallBoxWeb>
        </VStack>
      </HStack>
    </Background>
  );
}

export default Growatt;
