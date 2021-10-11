import {convertColor} from "../../src/utils/convertColor";
import moment from "moment";

/**
 * ComplexTypes are invented by the LGV to represent wfs array structures.
 * This is a collection of functions to use, handeling ComplexTypes.
 */

/**
 * a complex type is an object to represent a wfs array
 * @typedef {Object} ComplexType
 * @property {Object} metadata the metadata to describe the content of the array
 * @property {String} metadata.type the type e.g. "timeseries"
 * @property {String} metadata.format the format of the keys e.g. "DD.MM.YYYY"
 * @property {String} metadata.description the description of the values
 * @property {ComplexTypeValue[]} values an array of values
 */

/**
 * a set of data in a complex type is an object with key and value params
 * @typedef {Object} ComplexTypeValue
 * @property {String|Number} key the key of the array entry
 * @property {*} value the value for the key
 */

/**
 * tries to optimize the values of the ComplexType: cutting down decimal points, converts german numbers to ChartJS standard
 * @param {ComplexType} complexType the ComplexType to optimize
 * @param {Number|boolean} [decimals=false] the number of decimal points to cut at - or false if no cuts
 * @returns {ComplexType} a clone of the complexType with optimized values
 */
function optimizeComplexTypeValues (complexType, decimals = false) {
    if (!isComplexType(complexType)) {
        return complexType;
    }
    const result = cloneComplexType(complexType);

    result.values.forEach(item => {
        item.value = optimizeValueRootedInComplexType(item.value, decimals);
    });
    return result;
}

/**
 * tries to optimize the given value under the assumption that is rootes in a values of the ComplexType: cutting down decimal points, converts german numbers to ChartJS standard
 * @param {String|Number} value the value to optimize
 * @param {Number|boolean} [decimals=false] the number of decimal points to cut at - or false if no cuts
 * @returns {String|Number} the same value but optimized
 */
function optimizeValueRootedInComplexType (value, decimals = false) {
    const factor = typeof decimals === "number" ? Math.pow(10, decimals) : false;
    let result = value;

    if (typeof result === "number" && factor !== false) {
        result = Math.round(result * factor) / factor;
    }
    else if (typeof result === "string") {
        if (result.indexOf(",") !== -1) {
            result = result.replace(/,/, ".");
        }
        if (decimals !== false) {
            result = Math.round(parseFloat(result) * factor) / factor;
        }
        else {
            result = Number(result);
        }
    }

    return result;
}

/**
 * changes values of the metadata of a ComplexType
 * @param {ComplexType} complexType the ComplexType to change
 * @param {String} key the key to set/add to the metadata
 * @param {*} value the data to set/add for the given key in metadata
 * @returns {boolean} true if the data was set, false if something went wrong
 */
function changeMetadata (complexType, key, value) {
    if (!isComplexType(complexType) || typeof key !== "string") {
        return false;
    }
    complexType.metadata[key] = value;
    return true;
}

/**
 * limits the number of elements from the complexTypeValues array to the given parameter confineNumber
 * @param {complexTypeValues[]} complexTypeValues an array of values
 * @param {Number} toConfineNumber the number of elements to be present in array
 * @returns {confinedComplexTypeValues[]} restricted array
 */
function confineComplexTypeValues (complexTypeValues, toConfineNumber) {
    let confinedComplexTypeValues = complexTypeValues;

    if (typeof toConfineNumber === "number" && complexTypeValues.length > toConfineNumber) {
        confinedComplexTypeValues = complexTypeValues.slice(-toConfineNumber);
    }

    return confinedComplexTypeValues;
}

/**
 * converter for complexTypes to pie chart data for ChartJS
 * @param {ComplexType} complexType the complexType to convert - sort complexTypes beforehand with sortComplexType
 * @param {Object} [options=null] options to apply to each pice of pie
 * @param {String[]|boolean} [pieColors=false] the array of colors (everything convertColor accepts) that overwrites the default colors
 * @param {Number} toConfineNumber the number of complexTypeValues to be displayed
 * @see {@link https://jfly.uni-koeln.de/color/}
 * @return {Object|boolean} an object following chartJS dataset configuration or false on failure
 * @see {@link https://www.chartjs.org/docs/master/general/data-structures.html}
 */
function convertComplexTypeToPiechart (complexType, options = null, pieColors = false, toConfineNumber = null) {
    if (!isComplexType(complexType)) {
        return false;
    }
    const data = [],
        labels = [],
        label = complexType.metadata.description ? complexType.metadata.description : "",
        colors = [],
        defaultColors = Array.isArray(pieColors) && pieColors.length ? pieColors : [
            [230, 159, 0, 1],
            [86, 180, 233, 1],
            [0, 158, 115, 1],
            [240, 228, 66, 1],
            [0, 114, 178, 1],
            [213, 94, 0, 1],
            [204, 121, 167, 1]
        ],
        complexTypeValues = toConfineNumber ? confineComplexTypeValues(complexType.values, toConfineNumber) : complexType.values;

    complexTypeValues.forEach((elem, idx) => {
        // elem without value mustn't be added for piecharts
        if (typeof elem === "object" && elem !== null && elem.key && elem.value) {
            data.push(elem.value);
            labels.push(elem.key);
            colors.push(convertColor(defaultColors[idx % defaultColors.length], "rgbaString"));
        }
    });
    return {
        datasets: [Object.assign({
            label,
            data,
            backgroundColor: colors,
            hoverOffset: 4
        }, options)],
        labels
    };
}

/**
 * converter for complexTypes to line chart data for ChartJS
 * @param {ComplexType} complexType the complexType to convert - sort complexTypes beforehand with sortComplexType
 * @param {Object} [options=null] options to apply to each line
 * @param {*} [lineColor="#005ca9"] the color of the line (everything convertColor accepts), the default is masterportal standard blue
 * @return {Object|boolean} an object following chartJS dataset configuration or false on failure
 * @see {@link https://www.chartjs.org/docs/master/general/data-structures.html}
 */
function convertComplexTypeToLinechart (complexType, options = null, lineColor = "#005ca9") {
    if (!isComplexType(complexType)) {
        return false;
    }
    return convertComplexTypesToMultilinechart([complexType], options, [lineColor]);
}

/**
 * converter for complexTypes to multi line chart data for ChartJS
 * @param {ComplexType[]} complexTypes an array of complexTypes to convert - sort each complexTypes beforehand with sortComplexType
 * @param {Object} [options=null] options to apply to each line
 * @param {String[]|boolean} [lineColors=false] the array of colors (everything convertColor accepts) that overwrites the default colors
 * @param {Number} toConfineNumber the number of complexTypeValues to be displayed
 * @see {@link https://jfly.uni-koeln.de/color/}
 * @return {Object|boolean} an object following chartJS dataset configuration for multilinecharts or false on failure
 * @see {@link https://www.chartjs.org/docs/master/general/data-structures.html}
 */
function convertComplexTypesToMultilinechart (complexTypes, options = null, lineColors = false, toConfineNumber = null) {
    if (!Array.isArray(complexTypes)) {
        return false;
    }
    const labelsets = [],
        datasets = [],
        // default colors - see  https://jfly.uni-koeln.de/color/
        defaultColors = Array.isArray(lineColors) && lineColors.length ? lineColors : [
            [46, 127, 210, 1],
            [255, 217, 102, 1],
            [13, 86, 163, 1],
            [255, 130, 102, 1],
            [0, 48, 99, 1],
            [230, 159, 0, 1],
            [86, 180, 233, 1]
        ];

    complexTypes.forEach((complexType, idx) => {
        if (!isComplexType(complexType)) {
            return;
        }
        const data = [],
            labels = [],
            label = complexType.metadata.description ? complexType.metadata.description : "",
            complexTypeValues = toConfineNumber ? confineComplexTypeValues(complexType.values, toConfineNumber) : complexType.values;

        complexTypeValues.forEach(elem => {
            if (typeof elem === "object" && elem !== null && elem.key) {
                labels.push(elem.key);
                data.push(typeof elem.value === "number" || elem.value ? elem.value : null);
            }
        });

        labelsets.push(labels);
        datasets.push(Object.assign({
            label,
            data,
            borderColor: convertColor(defaultColors[idx % defaultColors.length], "rgbaString"),
            backgroundColor: convertColor(defaultColors[idx % defaultColors.length], "rgbaString"),
            spanGaps: false,
            fill: false,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 4,
            lineTension: 0
        }, options));
    });

    if (!Array.isArray(labelsets) || !labelsets.length || !Array.isArray(datasets) || !datasets.length) {
        return false;
    }
    return {
        datasets,
        labels: getCompletestLabels(labelsets)
    };
}

/**
 * converter for complexTypes to bar chart data for ChartJS
 * @param {ComplexType} complexType a complexType to convert - sort the complexType beforehand with sortComplexType
 * @param {Object} [options=null] options to apply to each bar
 * @param {Number} toConfineNumber the number of complexTypeValues to be displayed
 * @return {Object|boolean} an object following chartJS dataset configuration for multilinecharts or false on failure
 * @see {@link https://www.chartjs.org/docs/master/general/data-structures.html}
 */
function convertComplexTypeToBarchart (complexType, options = null, toConfineNumber = null) {
    if (!isComplexType(complexType)) {
        return false;
    }
    const label = complexType.metadata.description ? complexType.metadata.description : "",
        data = [],
        labels = [],
        complexTypeValues = toConfineNumber ? confineComplexTypeValues(complexType.values, toConfineNumber) : complexType.values;

    complexTypeValues.forEach(elem => {
        // for bar charts elem without value shall be shown as gaps - so no check of elem.value
        if (typeof elem === "object" && elem !== null && elem.key) {
            data.push(elem.value);
            labels.push(elem.key);
        }
    });

    if (options?.backgroundColor) {
        options.backgroundColor = convertColor(options.backgroundColor, "rgbaString");
    }
    if (options?.hoverBackgroundColor) {
        options.hoverBackgroundColor = convertColor(options.hoverBackgroundColor, "rgbaString");
    }

    return {
        datasets: [Object.assign({
            label,
            data,
            // as standard colors we use masterportal standard blue and red
            backgroundColor: convertColor("#003063", "rgbaString"),
            hoverBackgroundColor: convertColor("#B5D8FA", "rgbaString"),
            borderWidth: 1
        }, options)],
        labels
    };
}

/**
 * returns true if data is a complextype, or false if not
 * @param {Object} data the given data
 * @return {boolean} true or false
 */
function isComplexType (data) {
    return typeof data === "object" && data !== null
        && typeof data.metadata === "object" && data.metadata !== null
        && typeof data.metadata.type === "string"
        && typeof data.metadata.format === "string"
        && Array.isArray(data.values);
}

/**
 * finds gaps in unsorted complex values (comparing with other complex types) and fills them with a neutral value
 * @param {ComplexType[]} complexTypes a list of complexTypes
 * @param {*} [fillValue=null] the neutral value to fill gaps with
 * @returns {ComplexType[]} the same list of complex types with filled gaps, is unsorted, use sortComplexTypes to sort afterwards
 */
function compareComplexTypesAndFillDataGaps (complexTypes, fillValue = null) {
    if (!Array.isArray(complexTypes)) {
        return complexTypes;
    }
    const blueprint = {},
        assocs = [];

    // generate the blueprint
    complexTypes.forEach((complexType, idx) => {
        if (!isComplexType(complexType)) {
            return;
        }
        complexType.values.forEach(item => {
            if (typeof item === "object" && item !== null && item?.key) {
                blueprint[item.key] = true;
                if (!Object.prototype.hasOwnProperty.call(assocs, idx)) {
                    assocs[idx] = {};
                }
                if (item?.value) {
                    assocs[idx][item.key] = item.value;
                }
            }
        });
    });

    // apply blueprint
    complexTypes.forEach((complexType, idx) => {
        if (!isComplexType(complexType)) {
            return;
        }

        complexType.values = [];
        Object.keys(blueprint).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(assocs[idx], key)) {
                complexType.values.push({key, value: assocs[idx][key]});
            }
            else {
                complexType.values.push({key, value: fillValue});
            }
        });
    });
    return complexTypes;
}

/**
 * sorts many complexTypes at once
 * @info this is necessary after using compareComplexTypesAndFillDataGaps
 * @param {ComplexType[]} complexTypes the list of complex types to sort at once
 * @param {Function|boolean} [compareFunction=false] the compare function as function(firstEl, secondEl) to sort with or false to use a default behavior
 * @returns {ComplexType} a list of clones of the given complex types with sorted values
 */
function sortComplexTypes (complexTypes, compareFunction = false) {
    if (!Array.isArray(complexTypes)) {
        return complexTypes;
    }
    const result = [];

    complexTypes.forEach(complexType => {
        result.push(sortComplexType(complexType, compareFunction));
    });
    return result;
}

/**
 * sorts a complexType with the given compare function or ascending by its keys by default
 * @param {ComplexType} complexType the complex type to sort
 * @param {Function|boolean} [compareFunction=false] the compare function as function(firstEl, secondEl) to sort with or false to use a default behavior
 * @see sort https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 * @returns {ComplexType} a clone of the complex type with sorted values
 */
function sortComplexType (complexType, compareFunction = false) {
    if (!isComplexType(complexType)) {
        return false;
    }
    const result = cloneComplexType(complexType);

    if (typeof compareFunction === "function") {
        result.values.sort(compareFunction);
        return result;
    }

    if (result.metadata.type === "timeseries") {
        sortComplexTypeTimeseries(result, result.metadata.format);
        return result;
    }

    sortComplexTypeDefault(result);
    return result;
}

/**
 * clones a complex type - necessary in every function to avoid changing the original
 * @param {ComplexType} complexType the complex type to sort
 * @returns {ComplexType} a clone of the given complexType
 */
function cloneComplexType (complexType) {
    if (!isComplexType(complexType)) {
        return complexType;
    }
    const result = {
        metadata: {
            type: complexType.metadata.type,
            format: complexType.metadata.format,
            description: complexType.metadata.description
        },
        values: []
    };

    complexType.values.forEach(elem => {
        result.values.push({
            key: elem.key,
            value: elem.value
        });
    });
    return result;
}

/** private */

/**
 * private function of complexType.js - sorts the given complexType (must be valid) plain by its keys
 * @param {ComplexType} complexType the complex type to sort
 * @returns {ComplexType} the sorted complex type
 */
function sortComplexTypeDefault (complexType) {
    return complexType.values.sort((firstEl, secondEl) => {
        if (typeof firstEl !== "object" || firstEl === null || !Object.prototype.hasOwnProperty.call(firstEl, "key")) {
            return 1;
        }
        else if (typeof secondEl !== "object" || secondEl === null || !Object.prototype.hasOwnProperty.call(secondEl, "key")) {
            return -1;
        }
        else if (firstEl.key < secondEl.key) {
            return -1;
        }
        else if (firstEl.key > secondEl.key) {
            return 1;
        }
        return 0;
    });
}


/** private */

/**
 * private function of complexType.js - sorts the given complexType by keys with the given moment format
 * @param {ComplexType} complexType the complex type to sort
 * @param {String} format the format to sort with
 * @returns {ComplexType} the sorted complex type
 */
function sortComplexTypeTimeseries (complexType, format) {
    return complexType.values.sort((firstEl, secondEl) => {
        if (typeof firstEl !== "object" || firstEl === null || !Object.prototype.hasOwnProperty.call(firstEl, "key")) {
            return 1;
        }
        else if (typeof secondEl !== "object" || secondEl === null || !Object.prototype.hasOwnProperty.call(secondEl, "key")) {
            return -1;
        }
        return moment(firstEl.key, format).diff(moment(secondEl.key, format));
    });
}

/**
 * helper function for convertComplexTypesToMultilinechart to filter the healthiest labels
 * @param {Array[]} labels an array of array of labels to choose from
 * @returns {String[]|boolean} the item from labels that seems to be the completest one or false if no label was found
 */
function getCompletestLabels (labels) {
    if (!Array.isArray(labels)) {
        return false;
    }
    let max = 0,
        result = false;

    labels.forEach(subset => {
        if (!Array.isArray(subset)) {
            return;
        }
        const len = subset.length;

        if (len > max) {
            max = len;
            result = subset;
        }
    });
    return result;
}

/**
 * runs through the values of the given complexType and checks if there is data somewhere
 * @param {ComplexType} complexType the complex type to check
 * @returns {boolean} true if there ist data somewhere, false if there is no data (e.g. only undefined values)
 */
function hasComplexTypeValues (complexType) {
    if (!isComplexType(complexType)) {
        return false;
    }
    const len = complexType.values.length;
    let i = 0;

    for (i = 0; i < len; i++) {
        if (typeof complexType.values[i].value === "number" || typeof complexType.values[i].value === "string" && complexType.values[i].value) {
            // a number or a string (not empty)
            return true;
        }
    }
    return false;
}

export {
    optimizeComplexTypeValues,
    optimizeValueRootedInComplexType,
    changeMetadata,
    convertComplexTypeToPiechart,
    convertComplexTypeToLinechart,
    convertComplexTypeToBarchart,
    convertComplexTypesToMultilinechart,
    isComplexType,
    compareComplexTypesAndFillDataGaps,
    sortComplexType,
    sortComplexTypes,
    cloneComplexType,
    hasComplexTypeValues
};
