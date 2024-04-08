"use strict"

/*
    Example of API usage.
    This script retrieves energy data for the day with parameters PAC and POWER 1 to 4.
    It creates a folder called 'data', which will have subfolders for managed plants.
    For each plant with at least one device, subfolders within the previous subfolders
    will be created, named after the serial number of the device.
    Within these latter described subfolders, .tsv files containing the requested data will be saved.
    The file names are the respective dates.
*/

const MongoClient = require('mongodb').MongoClient;
const sessionModule = require('./session.js');
const callsModule = require('./calls.js');
const parametersModule = require('../util/parameters.js');
const prompt = require('prompt-sync')();
const fsModule = require('fs');
const username = prompt("Username: ");
const password = prompt.hide("Password: ");

const FIVE_MINUTE_INTERVALS_PER_DAY = 288;
const uri = "mongodb://localhost:27017/HMI";
const client = new MongoClient(uri);

/**
 * Saves the day's energy data to the database.
 * 
 * @param {Object} deviceEnergyData - The energy data for the device.
 * @param {Array} paramsList - The list of parameters to save.
 * @returns {Promise<void>} - A promise that resolves when the data is saved to the database.
 */
async function saveDayDataToDB(deviceEnergyData, paramsList) {
    const firstHour = new Date((new Date()).toISOString().substring(0, 10) + "T" + "00:00:00Z");

    let dataToSave = {
        date: firstHour,
        data: []
    };

    for (let j = 0; j < FIVE_MINUTE_INTERVALS_PER_DAY; j++) {
        let hour = new Date(firstHour.getTime() + 60000 * j * 5).toISOString();
        hour = `${hour.substr(8, 2) + "/" + hour.substr(5, 2) + "/" + hour.substr(0, 4) + " " + hour.substr(11, 5)}`;

        let dataRow = { hour: hour };

        for (let i = 0; i < paramsList.length; i++) {
            let data = deviceEnergyData[paramsList[i]];
            dataRow[paramsList[i]] = data[j].replace('.', ',');
        }

        dataToSave.data.push(dataRow);
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

/*
    Saves energy information requested by the params argument
    for all devices of the given plant in the argument.
*/

async function saveDeviceInformationForPlant(plant, params, calls) {
    const devicesList = await calls.getDevicesInPlant(plant.id);

    if (devicesList.hasOwnProperty('data'))
        return devicesList;

    const paramsList = params.split(',');

    for (let i = 0; i < devicesList.length; i++) {
        let deviceEnergyData = await calls.getDeviceEnergyData(plant.id, new Date(), devicesList[i].sn, params, 'max', 'day');

        deviceEnergyData = removeNullValues(deviceEnergyData, paramsList);

        saveDayDataToDB(deviceEnergyData, paramsList);
    }

    return devicesList;
}

async function main() {
    let session = new sessionModule.Session(username, password);

    const params = parametersModule.parameters.power.pac +
        ',' +
        parametersModule.parameters.power.power1 +
        ',' +
        parametersModule.parameters.power.power2 +
        ',' +
        parametersModule.parameters.power.power3 +
        ',' +
        parametersModule.parameters.power.power4;

    await session.login();

    const calls = new callsModule.Calls(session);

    const plantList = await calls.getPlantList();

    /* Executes the retrieval of information and saving to MongoDB in parallel */

    const requests = plantList.map(e => saveDeviceInformationForPlant(e, params, calls));

    const end = await Promise.all(requests);

    await session.logout();
}

main()