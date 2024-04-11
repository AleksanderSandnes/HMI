const sessionModule = require('../controllers/solarSession.js');
const callsModule = require('../controllers/solarCalls.js');
const parametersModule = require('../utils/solarParameters.js');
const MongoClient = require('mongodb').MongoClient;

const FIVE_MINUTE_INTERVALS_PER_DAY = 288;
const uri = "mongodb://localhost:27017/HMI";
const client = new MongoClient(uri);

async function fetchPlantData(username, password) {
    let session = new sessionModule.Session(username, password);

    const params = parametersModule.parameters.power.pac +
        ',' +
        parametersModule.parameters.power.power1 +
        ',' +
        parametersModule.parameters.power.power2

    await session.login();

    const calls = new callsModule.Calls(session);

    const plantList = await calls.getPlantList();

    /* Executes the retrieval of information and saving to MongoDB in parallel */
    const requests = plantList.map(e => saveDeviceInformationForPlant(e, params, calls));

    const end = await Promise.all(requests);

    await session.logout();

    return end;
}

async function saveDeviceInformationForPlant(plant, params, calls) {
    const devicesList = await calls.getDevicesInPlant(plant.id);

    if (devicesList.hasOwnProperty('data'))
        return devicesList;

    const paramsList = params.split(',');

    for (let i = 0; i < devicesList.length; i++) {
        let deviceEnergyData = await calls.getDeviceEnergyData(plant.id, new Date(), devicesList[i].sn, params, 'max', 'day');

        deviceEnergyData = removeNullValues(deviceEnergyData, paramsList);

        // saveDayDataToDB(deviceEnergyData, paramsList);
    }

    return devicesList;
}

async function saveDayDataToDB(deviceEnergyData, paramsList) {
    const firstHour = new Date((new Date()).toISOString().substring(0, 10) + "T" + "00:00:00Z");

    let dataToSave = {
        date: firstHour,
        data: []
    };

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
            let hour = new Date(firstHour.getTime() + 60000 * j * 5).toISOString();
            hour = `${hour.substr(8, 2) + "/" + hour.substr(5, 2) + "/" + hour.substr(0, 4) + " " + hour.substr(11, 5)}`;
            dataRow.hour = hour;
            dataToSave.data.push(dataRow);
        }
    }

    try {
        await client.connect();
        const collection = client.db("HMI").collection("solar_data");
        await collection.insertOne(dataToSave);
    } finally {
        await client.close();
    }
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

module.exports = { fetchPlantData };