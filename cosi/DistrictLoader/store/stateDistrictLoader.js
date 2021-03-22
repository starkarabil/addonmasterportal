/**
 * User type definition
 * @typedef {Object} DistrictSelectorState
 * @property {Object[]} districtLevels - All avaiable district levels.
 * @property {?Object} selectedDistrictLevel - The selected district level.
 * @property {module:ol/Feature[]} featureList - All stats features per layer (feature type).
 */
const state = {
    active: false,
    id: "DistrictLoader",
    name: "DistrictLoader",
    glyphicon: "glyphicon-map",
    isVisibleInMenu: false,
    renderToWindow: false,
    resizableWindow: false,
    districtLevels: [
        {
            label: "Statistische Gebiete",
            selector: "statgebiet",
            url: "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Statistische_Gebiete"
        },
        {
            label: "Stadtteile",
            selector: "stadtteil",
            url: "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Stadtteile"
        },
        {
            label: "Bezirke",
            selector: "bezirk",
            url: "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"
        }
    ],
    selectedDistrictLevel: null,
    featureList: []
};

export default state;
