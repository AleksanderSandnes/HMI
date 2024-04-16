import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet } from "react-native";
import { Box, HStack, Text, VStack, ScrollView, View } from "@gluestack-ui/themed";
import Background from "../components/boxes/background";
import BigBox from "../components/boxes/bigBox";
import SmallBox from "../components/boxes/smallBox";
import PowerProductionChart, { ChartData } from "../components/charts/powerProductionChart";
import PowerIcon from "../components/icons/power";
import ModeSelector from '../components/selects/modeSelector';
import MonthSelector from '../components/selects/monthSelector';
import DaySelector from '../components/selects/daySelector';
import YearSelector from '../components/selects/yearSelector';

const web = StyleSheet.create({
    hStack: { flex: 0.90, flexDirection: 'row', width: '95%', margin: 'auto' },
    bigVStack: { flex: 8, flexDirection: 'column' },
    smallVStack: { flex: 2, flexDirection: 'column' },
    smallBoxWidth: { width: 20 },
    smallBoxHeight: { height: 20 },
    text: { fontSize: 24, color: 'white', textAlign: 'center', alignSelf: 'center', marginBottom: 20 },
});

const windowWidth = Dimensions.get('window').width;

const Growatt: React.FC = () => {
    const [data, setData] = useState<ChartData>({ labels: [], datasets: [] });
    const [mode, setMode] = useState("daily");
    const [day, setDay] = useState("01");
    const [month, setMonth] = useState("0");
    const [year, setYear] = useState(2024);
    const dates = getDatesInMonth(Number(year), Number(month));

    const fetchSolarData = () => {
        const dateString = `${year}-${String(Number(month) + 1).padStart(2, '0')}-${day}`;

        fetch(`http://localhost:5000/api/solar/daily/${dateString}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("HTTP error " + response.status);
                }
                return response.json();
            })
            .then(json => {
                const data = json.data;
                const formattedData = data.map((item: any) => {
                    return {
                        hour: item.hour,
                        pac: parseFloat(item.pac.replace(',', '.')),
                    };
                });

                const labels = formattedData.map((item: { hour: any; }) => {
                    const [hour, minute] = item.hour.split(':').map(Number);

                    return minute === 0 ? item.hour : '';
                });

                const pacData = formattedData.map((item: { pac: any; }) => item.pac);

                setData({
                    labels,
                    datasets: [{
                        data: pacData,
                        color: () => `#329932`,
                        strokeWidth: 1.5
                    }]
                });
            })
            .catch(error => console.error(error));
    };

    useEffect(() => {
        if (mode === 'daily') {
            fetchSolarData();
        }
    }, [day, month, year]);

    function getDatesInMonth(year: number, month: number) {
        const date = new Date(year, month, 1);
        const dates = [];

        while (date.getMonth() === month) {
            dates.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }

        return dates;
    }

    if (windowWidth <= 768) {
        return (
            <Background>
                <ScrollView>
                    <View style={{ flexDirection: windowWidth > 768 ? 'row' : 'column', width: '100%', justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                        <View style={{ flex: 8, flexDirection: 'column', paddingBottom: 20, width: windowWidth * 0.95 }}>
                            <BigBox>
                                <PowerProductionChart data={data} />
                            </BigBox>
                        </View>

                        {windowWidth > 768 && <Box style={{ width: 20 }} />}

                        <View style={{ flex: 2, flexDirection: 'column', width: windowWidth * 0.95 }}>
                            <SmallBox>
                                <PowerIcon />
                                <Box style={{ height: 20 }} />
                                <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon basert på valgt tidsintervall</Text>
                            </SmallBox>

                            <Box style={{ height: 20 }} />

                            <SmallBox>
                                <PowerIcon />
                                <Box style={{ height: 20 }} />
                                <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon totalt</Text>
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
                            <PowerProductionChart data={data} key={JSON.stringify(data)} />
                        </BigBox>
                    </VStack>

                    <Box style={{ width: 20 }} />

                    <VStack style={{ flex: 2, flexDirection: 'column' }} reversed={false}>
                        <SmallBox>
                            <PowerIcon />
                            <Box style={{ height: 20 }} />
                            <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Strømproduksjon basert på valgt tidsintervall</Text>
                        </SmallBox>

                        <Box style={{ height: 20 }} />

                        <SmallBox>
                            <Text style={web.text}>Chart controls</Text>
                            <ModeSelector mode={mode} setMode={setMode} />
                            <MonthSelector month={month} setMonth={setMonth} />
                            <DaySelector day={day} setDay={setDay} dates={dates} />
                            <YearSelector year={year} setYear={setYear} />
                        </SmallBox>
                    </VStack>
                </HStack>
            </Background >
        )
    }
}

export default Growatt;