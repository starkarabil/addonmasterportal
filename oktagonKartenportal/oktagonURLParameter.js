import ParametricURL from "../../modules/core/parametricURL";
import {extractEventCoordinates} from "../../src/utils/extractEventCoordinates";
import store from "../../src/app-store";

const OktagonURLParameter = ParametricURL.extend(/** @lends OktagonURLParameter.prototype */{
    defaults: {
        rueckURL: "",
        zoomLevel: 9
    },
    /**
     * @class OktagonURLParameter
     * @description Processes parameters that are specified via the URL.
     * @extends ParametricURL
     * @memberOf Addons.OktagonKartenportal
     * @property {String} rueckURL Parameter for the submit url.
     * @property {String} zoomLevel Parameter for the zoomlevel.
     * @listens ParametricURL#RadioRequestOktagonURLParameterGetRueckURL
     * @listens Gaz#RadioRequestGazGetAdress
     * @fires Alerting#RadioTriggerAlertAlert
     * @fires Gaz#RadioTriggerGazAdressSearch
     * @fires Util#RadioTriggerUtilPick
     * @constructs
     */
    initialize: function () {
        const result = {},
            channel = Radio.channel("OktagonURLParameter");
        let query = location.search.substr(1),
            rueckURLParameter = "";

        channel.reply({
            "getRueckURL": function () {
                return this.get("rueckURL");
            }
        }, this);

        this.listenTo(Radio.channel("Gaz"), {
            "getAdress": this.triggerZoomToAddress,
            "getStreetsWithoutHouseNumber": this.triggerZoomToStreet
        });
        if (query.indexOf("rueckurl") > 0) {
            rueckURLParameter = query.slice(query.indexOf("rueckurl"));
            query = query.slice(0, query.indexOf("&rueckurl"));
        }
        query = query.toUpperCase();
        query.split("&").forEach(function (keyValue) {
            const item = keyValue.split("=");

            result[item[0]] = decodeURIComponent(item[1]);
        });

        if (rueckURLParameter.length > 0) {
            this.setRueckURL(rueckURLParameter.slice(rueckURLParameter.indexOf("=") + 1));
        }
        if (result.hasOwnProperty("BEZIRK")) {
            const districtFromUrl = this.getParameterValue(result, "BEZIRK");
            let districtNameToZoom = "";

            districtNameToZoom = this.hasBezirk(districtFromUrl);
            if (districtNameToZoom === "") {
                Radio.trigger("Alert", "alert", {
                    text: "<strong>Der parametrisierte Aufruf des Portals ist leider fehlgeschlagen!</strong>"
                    + "<br>"
                    + "<small>Der Parameter BEZIRK=" + districtFromUrl + " existiert nicht.</small>",
                    kategorie: "alert-warning"
                });
            }
            else {
                Radio.trigger("ZoomToGeometry", "zoomToGeometry", districtNameToZoom, Config.zoomToGeometry.layerId, Config.zoomToGeometry.attribute);
            }
        }
        else if (result.hasOwnProperty("STRASSE")) {
            const address = this.createAddress(result);

            this.setAddress(address);
            Radio.trigger("Gaz", address.searchType, address);
        }
    },

    /**
     * Assembles the address from the URL parameters with searchType.
     * @param {Object} result - The url parameters.
     * @returns {object} The address parameters
     */
    createAddress: function (result) {
        const address = {
            streetname: this.getParameterValue(result, "STRASSE"),
            searchType: "streetsWithoutHouseNumberSearch"
        };

        if (result.hasOwnProperty("HAUSNUMMER") && result.HAUSNUMMER.length > 0) {
            address.housenumber = this.getParameterValue(result, "HAUSNUMMER");
            address.searchType = "adressSearch";

            if (result.hasOwnProperty("ZUSATZ")) {
                address.affix = this.getParameterValue(result, "ZUSATZ");
            }
        }

        return address;
    },

    /**
     * Handels the Bezirk URL parameter
     * @param {String} districtFromUrl contains the "Bezirk" URL String.
     * @returns {void} returns the distirct string if it exists in config.
     */
    hasBezirk: function (districtFromUrl) {
        let geometries,
            districtNameToZoom = "";

        if (Config.hasOwnProperty("zoomToGeometry") && Config.zoomToGeometry.hasOwnProperty("geometries")) {
            geometries = Config.zoomToGeometry.geometries;

            if (geometries.includes(districtFromUrl.toUpperCase())) {
                districtNameToZoom = districtFromUrl.toUpperCase();
            }
        }
        return districtNameToZoom;
    },
    /**
     * Zooms the map to the address.
     * @param {Object} data xml object.
     * @returns {void}
     */
    triggerZoomToAddress: function (data) {
        if ($("gages\\:Hauskoordinaten,Hauskoordinaten", data).length > 0) {
            const gages = $("gages\\:Hauskoordinaten,Hauskoordinaten", data)[0],
                posList = $(gages).find("gml\\:pos, pos")[0].textContent.split(" "),
                coordinates = this.parseCoordinatesToFloat(posList),
                coord = extractEventCoordinates(coordinates);

            Radio.trigger("MapView", "setCenter", coord, this.get("zoomLevel"));
            store.dispatch("MapMarker/placingPointMarker", coord);
        }
        else {
            this.alertWrongInputParameters();
        }
    },

    /**
     * Zooms the map to the extent of the street.
     * @param {Object} data xml object.
     * @returns {void}
     */
    triggerZoomToStreet: function (data) {
        if ($("dog\\:Strassen,Strassen", data).length > 0) {
            const streetElement = $("dog\\:Strassen,Strassen", data).toArray().find(member => {
                    const foundStreetnames = $("dog\\:strassenname, strassenname", member)[0].textContent.toLowerCase(),
                        inputStreetnames = this.get("address").streetname.toLowerCase();

                    return foundStreetnames === inputStreetnames;
                }),
                position = $("iso19112\\:position_strassenachse, position_strassenachse", streetElement)[0],
                point = $("gml\\:Point, Point", position)[0],
                pos = $("gml\\:pos, pos", point)[0].textContent.split(" "),
                coordinates = this.parseCoordinatesToFloat(pos),
                coord = extractEventCoordinates(coordinates);

            Radio.trigger("MapView", "setCenter", coord, this.get("zoomLevel"));
            store.dispatch("MapMarker/placingPointMarker", coord);
        }
        else {
            this.alertWrongInputParameters();
        }
    },

    /**
     * Trigger an alert for wrong input Parameters.
     * @returns {void}
     */
    alertWrongInputParameters: function () {
        Radio.trigger("Alert", "alert", {
            text: "<strong>Der parametrisierte Aufruf des Portals ist leider fehlgeschlagen!</strong>"
                + "<br>"
                + "<small>Es konnte keine Adresse gefunden werde. Bitte prüfen Sie die Eingabeparameter.</small>",
            kategorie: "alert-warning"
        });
    },

    /**
     * Returns the parameter value
     * @param {Object} result xml object.
     * @param {String} property xml object.
     * @fires Util#RadioTriggerUtilPick
     * @returns {String} returns the parmeter value
     */
    getParameterValue: function (result, property) {
        return Object.values(Radio.request("Util", "pick", result, [property]))[0];
    },
    /**
     * Parses the coordinates to float
     * @param {Array} coordinates contains the coordinates.
     * @returns {Array} array with coordinates
     */
    parseCoordinatesToFloat: function (coordinates) {
        const coordinatesArray = [];

        if (coordinates && Array.isArray(coordinates)) {
            coordinates.forEach(coordinate => {
                coordinatesArray.push(parseFloat(coordinate));
            });
        }
        return coordinatesArray;
    },
    /**
     * Setter for rueckURL.
     * @param {String} value Contains the submit url
     * @returns {void}
     */
    setRueckURL: function (value) {
        this.set("rueckURL", value);
    },

    /**
     * Setter for address.
     * @param {obejct} value - The address parameters.
     * @returns {void}
     */
    setAddress: function (value) {
        this.set("address", value);
    }
});

export default OktagonURLParameter;
