function createParameterString(parameters) {
    return parameters.join(',');
}

function removeNullValues(data, parameters) {
    /* Replaces null values with 0.0 */

    const adjustedData = JSON.parse(JSON.stringify(data));

    for (let i = 0; i < parameters.length; i++) {
        adjustedData[parameters[i]] =
            adjustedData[parameters[i]]
                .map(param => {
                    if (param == null)
                        param = 0.0

                    return param.toString()
                });
    }

    return adjustedData;
}

function createDataToSave(firstHour) {
    return {
        date: firstHour,
        data: []
    };
}

function populateDataToSave(dataToSave, deviceEnergyData, paramsList, firstHour) {
    const FIVE_MINUTE_INTERVALS_PER_DAY = 288;
    const twoHoursInMilliseconds = 2 * 60 * 60 * 1000;

    for (let j = 0; j < FIVE_MINUTE_INTERVALS_PER_DAY; j++) {
        let allZero = true;
        let dataRow = {};

        for (let i = 0; i < paramsList.length; i++) {
            let data = deviceEnergyData[paramsList[i]];
            if (data[j] !== "0") {
                allZero = false;
                dataRow[paramsList[i]] = data[j].replace('.', ',');
            }
        }

        if (!allZero) {
            let hour = new Date(firstHour.getTime() + 60000 * j * 5 - twoHoursInMilliseconds);
            dataRow.hour = `${hour.getHours().toString().padStart(2, '0')}:${hour.getMinutes().toString().padStart(2, '0')}`;
            dataToSave.data.push(dataRow);
        }
    }

    return dataToSave;
}

module.exports = {
    createParameterString,
    removeNullValues,
    createDataToSave,
    populateDataToSave
};