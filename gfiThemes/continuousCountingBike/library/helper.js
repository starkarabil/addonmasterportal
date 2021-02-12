
/**
 * Returns an array of key values.
 * @param  {Object} inspectData contains the first row of the dataset
 * @return {String[]} showData array with key values
 */
export function getDataAttributes (inspectData) {
    const showData = ["total"];

    if (inspectData && inspectData.r_in !== null) {
        showData.push("r_in");
    }
    if (inspectData && inspectData.r_out !== null) {
        showData.push("r_out");
    }

    return showData;
}

/**
 * createxAxisTickValues returns an array of the tick values for the graph module
 * @param  {Array} data array of objects from dayLineData
 * @param  {Integer} xThreshold incrementing x axis label gaps: SUM[gap+1](xThreshold * gap < data.length)
 * @return {Array} tickValuesArray array of the tick values
 */
export function createxAxisTickValues (data = [], xThreshold = 0) {
    const len = data.length,
        mod = xThreshold > 0 ? Math.ceil(len / xThreshold) : 1,
        result = [];

    data.forEach((ele, i) => {
        if (i % mod) {
            return;
        }
        result.push(ele.timestamp);
    });
    return result;
}
/**
 * Returns an array for the graphic legend
 * @param  {Object} inspectData contains the first row of the dataset
 * @return {Array} legendData contains an array of objecs for the graphic legend
 */
export function getLegendAttributes (inspectData) {
    const legendData = [{
        class: "dot",
        text: i18next.t("additional:modules.tools.gfi.themes.continuousCountingBike.bikesSummedUp"),
        style: "circle"
    }];

    if (inspectData && inspectData.r_in !== null) {
        legendData.push({
            key: "r_in",
            value: i18next.t("additional:modules.tools.gfi.themes.continuousCountingBike.bikesIntoTown")
        });
    }

    if (inspectData && inspectData.r_out !== null) {
        legendData.push({
            key: "r_out",
            value: i18next.t("additional:modules.tools.gfi.themes.continuousCountingBike.bikesOutOfTown")
        });
    }

    return legendData;
}

export default {getDataAttributes, createxAxisTickValues, getLegendAttributes};


