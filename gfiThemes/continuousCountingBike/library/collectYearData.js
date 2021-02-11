
import * as moment from "moment";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import {getDataAttributes, getLegendAttributes, createxAxisTickValues} from "./helper.js";

/**
 * splitYearDataset creates a json for the graphic module with the yearLine data.
 * @param  {String} yearLine contains the year data of gfi content
 * @fires Util#event:RadioRequestUtilPunctuate
 * @return {Array} tempArr array with prepared objects of the data
 */
function splitYearData (yearLine) {
    const dataSplit = yearLine ? yearLine.split("|") : [],
        result = [];

    dataSplit.forEach(data => {
        const splitted = data.split(","),
            total = parseFloat(splitted[2]),
            r_in = splitted[3] ? parseFloat(splitted[3]) : null,
            r_out = splitted[4] ? parseFloat(splitted[4]) : null;
        let year = parseInt(splitted[0], 10),
            weeknumber = parseInt(splitted[1], 10),
            timestamp = "";

        // the weeknumber can be negative. In this case we assume that a calendar week of the previous year is ment.
        // e.g. "2021,-53,..." -> means: KW53 of 2020
        if (weeknumber < 0) {
            year--;
            weeknumber = Math.abs(weeknumber);
        }

        timestamp = moment(year + "-" + weeknumber, "YYYY-WW").toDate();

        // if the timestamp is an Invalid Date (isNaN), do not touch this data
        if (isNaN(timestamp)) {
            return;
        }

        result.push({
            class: "dot",
            style: "circle",
            timestamp,
            year,
            total,
            tableData: thousandsSeparator(total),
            r_in,
            r_out
        });
    });

    return result.sort((valueA, valueB) => valueA.timestamp - valueB.timestamp);
}


/**
 * prepareYearDataset creates an object for the yearDataset
 * @param {Array} data array of objects from yearLineData
 * @returns {Object} charts data
 */
function getYearData (data) {
    const hasData = Array.isArray(data) && typeof data[data.length - 1] === "object",
        graphArray = hasData ? getDataAttributes(data[data.length - 1]) : "",
        newData = hasData ? [] : "",
        legendArray = hasData ? getLegendAttributes(data[data.length - 1]) : "",
        year = hasData ? data[data.length - 1].year : "";

    if (hasData) {
        data.forEach(val => {
            val.timestamp = moment(val.timestamp).format("w");
            newData.push(val);
        });
    }

    return {
        data: newData,
        xLabel: i18next.t("additional:modules.tools.gfi.themes.continuousCountingBike.yearScheduleInYear", {year: year}),
        yLabel: {
            label: i18next.t("additional:modules.tools.gfi.themes.continuousCountingBike.amountBikesPerWeek"),
            offset: 60
        },
        graphArray: graphArray,
        xAxisTicks: {
            unit: i18next.t("additional:modules.tools.gfi.themes.continuousCountingBike.cw"),
            values: createxAxisTickValues(data, 5)
        },
        legendArray: legendArray
    };
}
/**
 * Creates the data for the year chart.
 * @param {String} data contains the yearLine data of gfi content
 * @returns {Object} charts data
 */
function collectYearData (data) {
    return getYearData(splitYearData(data));
}

export {collectYearData, getYearData, splitYearData};
