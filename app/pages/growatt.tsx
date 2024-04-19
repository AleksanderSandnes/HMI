import React, { useState, useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Box,
  HStack,
  Text,
  VStack,
  ScrollView,
  View,
} from '@gluestack-ui/themed';
import Background from '../components/boxes/background';
import BigBox from '../components/boxes/bigBox';
import SmallBox from '../components/boxes/smallBox';
import PowerProductionChart, {
  ChartData,
} from '../components/charts/powerProductionChart';
import PowerIcon from '../components/icons/power';
import MonthSelector from '../components/selects/monthSelector';
import DaySelector from '../components/selects/daySelector';
import YearSelector from '../components/selects/yearSelector';
import TimespanSelector from '../components/selects/timespanSelector';

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

function Growatt(): React.ReactElement {
  const today = new Date();
  const [data, setData] = useState<ChartData>({ labels: [], datasets: [] });
  const [timespan, setTimespan] = useState('daily');
  const [day, setDay] = useState(`0${today.getDate()}`.slice(-2));
  const [month, setMonth] = useState(String(today.getMonth()));
  const [year, setYear] = useState(today.getFullYear());

  function getDatesInMonth(yearParam: number, monthParam: number) {
    const date = new Date(yearParam, monthParam, 1);
    const datesInMonth = [];

    while (date.getMonth() === monthParam) {
      datesInMonth.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return datesInMonth;
  }

  const dates = getDatesInMonth(Number(year), Number(month));

  const fetchSolarData = () => {
    const dateString = `${year}-${String(Number(month) + 1).padStart(
      2,
      '0'
    )}-${day}`;

    fetch(`http://localhost:5000/api/solar/daily/${dateString}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        const formattedData = json.data.map(
          (item: { hour: string; pac: string }) => ({
            hour: item.hour,
            pac: parseFloat(item.pac.replace(',', '.')),
          })
        );

        const labels = formattedData.map((item: { hour: string }) => {
          const [, minute] = item.hour.split(':').map(Number);

          return minute === 0 ? item.hour : '';
        });

        const pacData = formattedData.map((item: { pac: string }) => item.pac);

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
      });
  };

  useEffect(() => {
    if (timespan === 'daily') {
      fetchSolarData();
    }
  }, [day, month, year]);

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
                <PowerProductionChart data={data} />
              </BigBox>
            </View>

            {windowWidth > 768 && <Box style={{ width: 20 }} />}

            <View
              style={{
                flex: 2,
                flexDirection: 'column',
                width: windowWidth * 0.95,
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
                <PowerIcon />
                <Box style={{ height: 20 }} />
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  Strømproduksjon totalt
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
            <PowerProductionChart data={data} key={JSON.stringify(data)} />
          </BigBox>
        </VStack>

        <Box style={{ width: 20 }} />

        <VStack style={{ flex: 2, flexDirection: 'column' }} reversed={false}>
          <SmallBox>
            <PowerIcon />
            <Box style={{ height: 20 }} />
            <Text style={web.text}>
              Strømproduksjon basert på valgt tidsintervall
            </Text>
            <Text style={web.text}>kWh</Text>
          </SmallBox>

          <Box style={{ height: 20 }} />

          <SmallBox>
            <Text style={web.text}>Chart controls</Text>
            <TimespanSelector timespan={timespan} setTimespan={setTimespan} />
            <MonthSelector month={month} setMonth={setMonth} />
            <DaySelector selectedDay={day} setDay={setDay} dates={dates} />
            <YearSelector year={year} setYear={setYear} />
          </SmallBox>
        </VStack>
      </HStack>
    </Background>
  );
}

export default Growatt;
