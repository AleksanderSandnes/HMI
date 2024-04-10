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

module.exports = { removeNullValues };