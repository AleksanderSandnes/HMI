const sessionModule = require('../controllers/solarSession.js');
const callsModule = require('../controllers/solarCalls.js');
const parametersModule = require('../utils/solarParameters.js');
const {
    createParameterString,
    removeNullValues,
    createDataToSave,
    populateDataToSave
} = require('../utils/solarUtils.js');

const FIVE_MINUTE_INTERVALS_PER_DAY = 288;

async function fetchPlantData(username, password, date) {
    let session = new sessionModule.Session(username, password);

    const params = createParameterString([
        parametersModule.parameters.power.pac,
        parametersModule.parameters.power.power1,
        parametersModule.parameters.power.power2
    ]);

    await session.login();

    const calls = new callsModule.Calls(session);

    const plantList = await calls.getPlantList();

    /* Executes the retrieval of information and saving to MongoDB in parallel */
    const requests = plantList.map(e => saveDeviceInformationForPlant(e, params, calls, date));

    const results = await Promise.all(requests);

    await session.logout();

    return results[0];
}

async function saveDeviceInformationForPlant(plant, params, calls, date) {
    const devicesList = await calls.getDevicesInPlant(plant.id);

    if (devicesList.hasOwnProperty('data'))
        return devicesList;

    const paramsList = params.split(',');

    let deviceEnergyData = {};
    for (let i = 0; i < devicesList.length; i++) {
        const deviceData = await calls.getDeviceEnergyData(plant.id, date, devicesList[i].sn, params, 'max', 'day');
        const cleanedData = removeNullValues(deviceData, paramsList);
        deviceEnergyData = { ...deviceEnergyData, ...cleanedData };
    }

    const formattedData = formatData(deviceEnergyData, paramsList);
    return formattedData;
}

async function formatData(deviceEnergyData, paramsList) {
    const firstHour = new Date((new Date()).toISOString().substring(0, 10) + "T" + "00:00:00Z");

    let dataToSave = createDataToSave(firstHour);
    dataToSave = populateDataToSave(dataToSave, deviceEnergyData, paramsList, firstHour);

    return dataToSave;
}

module.exports = { fetchPlantData };