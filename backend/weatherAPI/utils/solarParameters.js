/**
 * @constant {Object}
 * 
 * Contains the parameters that can be passed to retrieve energy data from a device
 */
const parameters =
{
    power:
    {
        pac: 'pac',
        mpptPower: 'ppv',
        powerR: 'pacr',
        powerS: 'pacs',
        powerT: 'pact',
        power1: 'ppv1',
        power2: 'ppv2',
        power3: 'ppv3',
        power4: 'ppv4',
        power5: 'ppv5',
        power6: 'ppv6',
        power7: 'ppv7',
        power8: 'ppv8'
    },

    voltage:
    {
        mppt1: "VPV1",
        mppt2: "VPV2",
        mppt3: "VPV3",
        string1: "vString1",
        string2: "vString2",
        string3: "vString3",
        string4: "vString4",
        string5: "vString5",
        string6: "vString6",
        string7: "vString7",
        string8: "vString8"
    },

    current:
    {
        mppt1: "VPV1",
        mppt2: "VPV2",
        mppt3: "VPV3",
        string1: "vString1",
        string2: "vString2",
        string3: "vString3",
        string4: "vString4",
        string5: "vString5",
        string6: "vString6",
        string7: "vString7",
        string8: "vString8"
    }
}

module.exports = { parameters }