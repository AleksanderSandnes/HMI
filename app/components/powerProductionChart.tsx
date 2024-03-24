import React from 'react';
import { LineChart } from "react-native-chart-kit";
import { Dimensions, ViewStyle } from "react-native";
import { View } from "@gluestack-ui/themed";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const defaultData = {
    labels: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
    datasets: [
        {
            data: [1246, 4733, 8865, 9238, 8835, 6773, 3215, 188],
            color: () => `#329932`,
            strokeWidth: 1.5
        }
    ]
};

const chartConfig = {
    backgroundGradientFrom: 'rgba(40,38,91,255)',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: 'rgba(39,56,106,255)',
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // solid white
    barPercentage: 0.5,
    fillShadowGradient: '#329932', // green
    fillShadowGradientTo: '#329932', // green
    fillShadowGradientFromOpacity: 0.4,
    fillShadowGradientToOpacity: 0.4,
    propsForBackgroundLines: {
        stroke: 'rgba(255, 255, 255, 1)',
        strokeWidth: 0.3,
        strokeDasharray: '0'
    },
    propsForLabels: {
        dy: 5,
    },
};

interface ChartData {
    labels: string[];
    datasets: {
        data: number[];
        color: () => string;
        strokeWidth: number;
    }[];
}

interface PowerProductionChartProps {
    data?: ChartData;
}

const PowerProductionChart: React.FC<PowerProductionChartProps> = ({ data = defaultData }) => {
    const viewStyle: ViewStyle = {
        width: screenWidth,
        paddingHorizontal: screenWidth * 0.125,
        height: screenHeight,
        paddingVertical: screenHeight * 0.125
    };

    return (
        <View style={viewStyle}>
            <LineChart
                data={data}
                width={screenWidth * 0.84}
                height={screenHeight * 0.90}
                chartConfig={chartConfig}
                withDots={false}
                withVerticalLines={false}
                bezier
            />
        </View>
    )
}

export default PowerProductionChart;