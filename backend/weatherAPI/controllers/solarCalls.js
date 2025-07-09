/**
 * Script containing the class and methods for making requests to a Growatt server.
 */

const Url = require('url');
const { parameters } = require('../utils/solarParameters.js');
const { SessionNotInitializedException, ServerResponseException, HTTPRequestException } = require('../exceptions/exceptions.js');

/**
 * @class
 * @classdesc Class containing methods for making requests to the server
 * 
 * The class has a session as an object in the Composite pattern.
 * It follows a basic pattern: each method returns the result of a GET and POST method,
 * where each response has been analyzed by a callback func.
 * The parameters are passed to the methods and converted into HTTP request parameters.
 */
class Calls {
    /**
     * Initializes the class with a session that must be defined and started
     * 
     * @throws {SessionNotInitializedException} if the provided session is undefined or not started
     * @param {Session} session object of the Session class
     */
    constructor(session) {
        if (session === undefined || !session.isConnected)
            throw new SessionNotInitializedException("A session is required to make calls!")
        this.session = session;
    }

    /**
     * @callback func callback function to analyze the response
     * 
     * @param res response obtained from the request
     */

    /**
     * Makes a GET request to the server on the resource given by URL, where the response is analyzed by the callback func
     *
     * @param {func} func callback function
     * @param {string} url resource to be accessed on the server
     * @returns {Promise} promise based on the obtained response
     */
    async makeGet(func, url) {
        await this.session.checkCookieValidity();

        return new Promise((resolve, reject) => {
            this.session.axios
                .get(this.session.getUrl(url), { headers: this.session.headers })
                .then(res => {
                    if (!func(res))
                        reject(res);
                    else
                        resolve(res);
                })
                .catch(res => { reject(res); this.checkInvalidHTTPCode(res); });
        });
    }

    /**
     * Makes a POST request to the server on the resource given by URL, where the response is analyzed by the callback func
     *
     * @param {function} func callback function to analyze the response
     * @param {string} url resource to be accessed on the server
     * @param {Object} paramsObj parameters to be provided for the request
     * @param {string} paramsUrl parameters that are passed via URL
     * @returns {Promise} promise based on the obtained response
     */
    async makePost(func, url, paramsObj, paramsUrl = '') {
        await this.session.checkCookieValidity();

        return new Promise((resolve, reject) => {
            let params = null; // Assume no parameters are passed

            if (paramsObj !== undefined)
                params = new Url.URLSearchParams(paramsObj).toString();

            this.session.axios
                .post(this.session.getUrl(url) + paramsUrl, params, { headers: this.session.headers })
                .then(res => {
                    if (!func(res))
                        reject(res);
                    else
                        resolve(res);
                })
                .catch(res => { reject(res); this.checkInvalidHTTPCode(res, reject); });
        });
    }

    /**
     * Checks if the HTTP response code is within the normal range (200 ~ 300)
     * @throws {HTTPRequestException} Code outside the range 200 ~ 300
     * @param {any} res HTTP response
     */
    checkInvalidHTTPCode(res) {
        if (res.response.status < 200 || res.response.status > 300)
            throw new HTTPRequestException(res.response.status, "Error in HTTP request");
    }

    /**
     * Checks the type of problem in the request
     * 
     * @param {any} res HTTP response
     */
    handleRequestProblem(res) {
        if (res.request.path.match('errorMess'))
            throw new ServerResponseException(res.data, `An error occurred during the request: ${res.request.path}`);
        else
            throw new ServerResponseException(res.data);
    }

    /**
     * Gets the list of plants under control of the logged-in account
     * 
     * @returns {Promise<Array<Object>>} list containing JSON objects of the plants
     */
    async getPlantList() {
        let func = function (res) {
            if (!Array.isArray(res.data)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        };

        return (await this.makeGet(func, 'plantList')).data;
    }

    /**
     * Gets the devices in the provided plant
     * 
     * @param {string} plantId ID of the plant to be checked
     * @returns {Promise<Array<Object>>} list containing JSON objects with device information
     */
    async getDevicesInPlant(plantId) {
        const params = {
            plantId: plantId,
            currPage: '1'
        };

        let func = function (res) {
            if (!res.data) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        };

        let res = await this.makePost(func, 'devicesByPlantList', params);

        if (res.data.hasOwnProperty('obj'))
            return res.data.obj.datas;

        return res;
    }

    /**
     * Gets information of the provided device in a specific plant
     * 
     * @param {string} plantId ID of the plant
     * @param {string} serialNumber serial number of the device in the plant
     * @param {string} type type of information (storage/datalog)
     * @returns {Promise<Object>} storage or datalog information of the device
     */
    async getDeviceInfo(plantId, serialNumber, type = 'storage') {
        const params = {
            plantId: plantId,
            deviceTypeName: type,
            sn: serialNumber
        };

        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        };

        return (await this.makePost(func, 'deviceInfo', params)).data.obj;
    }

    /**
     * Gets weather information for the plant
     * 
     * @param {string} plantId ID of the plant
     * @returns {Promise<Object>} weather information for the plant
     */
    async getPlantWeatherCondition(plantId) {
        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, 'weather', undefined, `?plantId=${plantId}`)).data.obj;
    }

    /**
     * Gets technical specifications of the plant
     * 
     * @param {string} plantId ID of the plant
     * @returns {Promise<Object>} technical specifications of the plant
     */
    async getPlantData(plantId) {
        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, 'plantData', undefined, `?plantId=${plantId}`)).data.obj;
    }

    /**
     * Helper method to generalize the energy info request based on the time period
     * 
     * @description The time parameter dictates the date format and the resource to be analyzed on the server
     * 
     * @param {string} time time period to be analyzed (day/month/year)
     * @param {Date} date initialized Date class object
     * @param {string} dir resource to be requested on the server
     * @returns {Array<string>} array of two items, one being an object containing the adjusted date and the other the server directory
     */
    returnDateParameters(time, date, dir) {
        let params = {};
        switch (time) {
            case 'day':
                params.date = date.toISOString().substr(0, 10);
                break;

            case 'month':
                params.date = date.toISOString().substr(0, 7);
                dir = dir.replace('Day', 'Month');
                break;

            case 'year':
            case 'total':
                params.year = date.toISOString().substr(0, 4);
                dir = dir.replace('Day', 'Year');

            case 'total':
                dir = dir.replace('Day', 'Total');
        }

        return [params, dir];
    }

    /**
     * Get energy data from an inverter
     * 
     * @param {string} plantId ID of the plant
     * @param {Date} date date for which information is desired
     * @param {string} time time period (day/month/year)
     * @returns {Promise<Object>} object with the 'pac' property
     */
    async getInverterEnergyData(plantId, date, time = 'day') {
        let [params, dir] = [...this.returnDateParameters(time, date, 'inverterEnergyDataDayUrl')];

        params.plantId = plantId;

        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, dir, params)).data.obj;
    }

    /**
     * Gets energy data of any device
     * 
     * @description If the 'day' parameter is provided for time, data for the parameters specified in 'param' is obtained for each 5-minute interval of the day
     * 
     * @param {string} plantId ID of the plant
     * @param {Date} date date for which information is desired
     * @param {string} sn serial number of the device
     * @param {string} param parameters for which information is desired. It is a string concatenated with ',', where parameters can be obtained from the parameters.js file
     * @param {string} type device type
     * @param {string} time time period (day/month/year)
     * @returns {Promise<Object>} object with properties given by the parameters in 'param'
     */
    async getDeviceEnergyData(plantId, date, sn = '', param = parameters.parametrosInverter.potencia.pac, type = 'max', time = 'day') {
        let jsonData = { params: param };

        let [params, dir] = [...this.returnDateParameters(time, date, 'deviceEnergyDataDayUrl')];

        /* If the serial number is empty, we will obtain information from the plant */

        if (sn === '') {
            jsonData.type = "plant";
            jsonData.sn = plantId;
        } else {
            jsonData.type = type;
            jsonData.sn = sn;
        }

        params.plantId = plantId;
        params.jsonData = JSON.stringify([jsonData]);

        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, dir, params)).data.obj[0].datas;
    }

    /**
     * Gets total storage information of the plant for the entire period
     * 
     * @param {string} plantId ID of the plant
     * @param {string} storageSerialNumber serial number of the storage device
     * @returns {Promise<Object>} object containing the information
     */
    async getTotalPlantStorageInformation(plantId, storageSerialNumber) {
        const params = {
            storageSn: storageSerialNumber
        };

        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, 'storageTotalData', params, `?plantId=${plantId}`)).data.obj.datas;
    }

    /**
     * Gets current storage status information of the plant
     * 
     * @param {string} plantId ID of the plant
     * @param {string} storageSerialNumber serial number of the storage device
     * @returns {Promise<Object>} object containing the information
     */
    async getCurrentPlantStorageStatusInformation(plantId, storageSerialNumber) {
        const params = {
            storageSn: storageSerialNumber
        };

        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, 'storageStatusData', params, `?plantId=${plantId}`)).data.obj;
    }

    /**
     * Obtains battery information of the plant's storage
     * 
     * @param {string} plantId ID of the plant
     * @param {string} storageSerialNumber serial number of the storage device
     * @returns {Promise<Object>} object containing the information
     */
    async getStorageBatteryInformation(plantId, storageSerialNumber) {
        const params = {
            storageSn: storageSerialNumber
        };

        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, 'storageBatteryData', params, `?plantId=${plantId}`)).data.obj;
    }

    /**
     * Obtains energy information of the plant's storage on a certain day
     * 
     * @param {string} plantId ID of the plant
     * @param {string} storageSerialNumber serial number of the storage device
     * @param {Date} date the date for which the information is desired
     * @returns {Promise<Object>} object containing the information
     */
    async getStorageEnergyInformationOnDay(plantId, storageSerialNumber, date) {
        const params = {
            plantId: plantId,
            storageSn: storageSerialNumber,
            data: date.toISOString().substr(0, 10)
        };

        let func = function (res) {
            if (!(res.data && res.data.result == 1)) {
                this.handleRequestProblem(res);
                return false;
            }
            return true;
        }

        return (await this.makePost(func, 'storageBatteryData', params)).data.obj;
    }
}

module.exports = { Calls }