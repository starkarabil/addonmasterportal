import axios from "axios";

/**
 * send request to get Isochrone geoJSON
 * @param {String} pathType type of transportation
 * @param {Array} coordinates coordinates of origins
 * @param {String} rangeType  type of range ("time" or "distance")
 * @param {Array} rangeArray array of time range values
 * @param {object} abort abort
 * @param {String} [baseUrl="https://csl-lig.hcu-hamburg.de/ors/v2/"] baseUrl
 * @returns {void}
 */
async function requestIsochrones (pathType, coordinates, rangeType, rangeArray, abort, baseUrl = "https://csl-lig.hcu-hamburg.de/ors/v2/") {
    const _baseUrl = baseUrl + "isochrones/",
        opts = {"locations": coordinates, "range_type": rangeType, "range": rangeArray},
        url = _baseUrl + pathType.trim(),

        ret = await axios.post(url, JSON.stringify(opts), {
            headers: {
                "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
                "Content-Type": "application/json"
            },
            cancelToken: abort && abort.token
        }),
        json = ret.data;

    if (json.error) {
        throw Error(json);
    }


    return json;

}

export default requestIsochrones;
