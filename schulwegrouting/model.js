import Tool from "../../modules/core/modelList/tool/model";
import BuildSpecModel from "../../modules/tools/print_/buildSpec";
import SnippetCheckboxModel from "../../modules/snippets/checkbox/model";
import {Circle as CircleStyle, Fill, Stroke, Style} from "ol/style.js";
import {MultiLineString, Point} from "ol/geom.js";
import {WKT} from "ol/format.js";
import Feature from "ol/Feature.js";
import thousandsSeparator from "../../src/utils/thousandsSeparator";

const Schulwegrouting = Tool.extend(/** @lends Schulwegrouting.prototype */{

    defaults: Object.assign({}, Tool.prototype.defaults, {
        id: "schulwegrouting",
        name: "Schulweg",
        layerId: "8712",
        wpsId: "1001",
        // ol-features of all schools
        schoolList: [],
        // the regional school in charge
        regionalSchool: {},
        selectedSchool: {},
        // names of streets found
        startAddress: {},
        streetNameList: [],
        addressList: [],
        addressListFiltered: [],
        // route layer
        layer: undefined,
        isActive: false,
        routeResult: {},
        routeDescription: [],
        checkBoxHVV: undefined,
        renderToSidebar: true,
        renderToWindow: false,
        glyphicon: "glyphicon-filter",
        // translations
        startingAddress: "",
        regionalPrimarySchool: "",
        selectSchool: "",
        printRouteName: "",
        deleteRoute: "",
        showRouteDescription: "",
        hideRouteDescription: "",
        totalLength: "",
        from: "",
        to: ""
    }),

    /**
     * @class Schulwegrouting
     * @extends Tool
     * @memberof Addons.Schulwegrouting
     * @constructs
     */
    initialize: function () {
        this.changeLang(i18next.language);
        const channel = Radio.channel("Schulwegrouting");

        this.superInitialize();

        this.setCheckBoxHVV(new SnippetCheckboxModel({
            isSelected: false,
            label: "HVV Verkehrsnetz"
        }));

        this.listenTo(channel, {
            "selectSchool": function (school) {
                this.selectSchool(this.get("schoolList"), school.get("schul_id"));
                this.trigger("updateSelectedSchool", school);
                this.prepareRequest(this.get("startAddress"));
            }
        }, this);

        this.listenTo(Radio.channel("VectorLayer"), {
            "featuresLoaded": function (layerId, features) {
                if (layerId === this.get("layerId")) {
                    this.setLayer(Radio.request("Map", "createLayerIfNotExists", "school_route_layer"));
                    this.addRouteFeatures(this.get("layer").getSource());
                    this.get("layer").setStyle(this.routeStyle);
                    this.setSchoolList(this.sortSchoolsByName(features));
                    if (this.get("isActive") === true) {
                        this.trigger("render");
                    }
                }
            }
        });

        this.listenTo(Radio.channel("Gaz"), {
            "streetNames": function (streetNameList) {
                this.startSearch(streetNameList, this.get("addressList"));
            },
            "houseNumbers": function (houseNumberList) {
                this.setAddressList(this.prepareAddressList(houseNumberList, this.get("streetNameList")));
                this.setAddressListFiltered(this.filterAddressList(this.get("addressList"), this.get("searchRegExp")));
            },
            "getAdress": this.parseRegionalSchool
        });

        this.listenTo(this.get("checkBoxHVV"), {
            "valuesChanged": this.toggleHVVLayer
        });

        this.listenTo(this, {
            "change:isActive": function (model, value) {
                if (value && this.get("layer") === undefined) {
                    this.setLayer(Radio.request("Map", "createLayerIfNotExists", "school_route_layer"));
                    this.addRouteFeatures(this.get("layer").getSource());
                    this.get("layer").setStyle(this.routeStyle);
                }
            }
        });

        this.listenTo(Radio.channel("VectorLayer"), {
            "featuresLoaded": function (layerId, features) {
                if (layerId === this.get("layerId")) {
                    this.setSchoolList(this.sortSchoolsByName(features));
                }
            }
        });

        this.listenTo(Radio.channel("i18next"), {
            "languageChanged": this.changeLang
        });
    },
    /**
     * change language - sets default values for the language
     * @param {String} lng - new language to be set
     * @returns {Void} -
     */
    changeLang: function (lng) {
        this.set({
            "startingAddress": i18next.t("additional:modules.tools.routingToSchool.startingAddress"),
            "regionalPrimarySchool": i18next.t("additional:modules.tools.routingToSchool.regionalPrimarySchool"),
            "selectSchool": i18next.t("additional:modules.tools.routingToSchool.selectSchool"),
            "printRouteName": i18next.t("additional:modules.tools.routingToSchool.printRouteName"),
            "deleteRoute": i18next.t("additional:modules.tools.routingToSchool.deleteRoute"),
            "showRouteDescription": i18next.t("additional:modules.tools.routingToSchool.showRouteDescription"),
            "hideRouteDescription": i18next.t("additional:modules.tools.routingToSchool.hideRouteDescription"),
            "totalLength": i18next.t("additional:modules.tools.routingToSchool.totalLength"),
            "from": i18next.t("additional:modules.tools.routingToSchool.from"),
            "to": i18next.t("additional:modules.tools.routingToSchool.to"),
            "currentLng": lng
        });
    },

    toggleHVVLayer: function (value) {
        Radio.trigger("ModelList", "setModelAttributesById", "1935geofox-bus", {
            isSelected: value,
            isVisibleInMap: value
        });
        Radio.trigger("ModelList", "setModelAttributesById", "1935geofox_BusName", {
            isSelected: value,
            isVisibleInMap: value
        });
        Radio.trigger("ModelList", "setModelAttributesById", "1935geofox-bahn", {
            isSelected: value,
            isVisibleInMap: value
        });
        Radio.trigger("ModelList", "setModelAttributesById", "1935geofox_Faehre", {
            isSelected: value,
            isVisibleInMap: value
        });
        Radio.trigger("ModelList", "setModelAttributesById", "1933geofox_stations", {
            isSelected: value,
            isVisibleInMap: value
        });
    },

    printRouteMapFish: function () {
        const visibleLayerList = Radio.request("Map", "getLayers").getArray().filter(function (layer) {
                return layer.getVisible() === true;
            }),
            address = this.get("startAddress"),
            school = this.get("selectedSchool"),
            route = this.get("routeResult"),
            routeDesc = this.prepareRouteDesc(this.get("routeDescription")),
            attr = {
                "layout": "A4 Hochformat",
                "outputFormat": "pdf",
                "attributes": {
                    "title": "Schulwegrouting",
                    "length": route.kuerzesteStrecke + "m",
                    "address": address.street + " " + address.number + address.affix,
                    "school": school.get("schulname") + ", " + route.SchuleingangTyp + " (" + route.SchuleingangAdresse + ")",
                    "map": {
                        "dpi": 200,
                        "projection": Radio.request("MapView", "getProjection").getCode(),
                        "center": Radio.request("MapView", "getCenter"),
                        "scale": Radio.request("MapView", "getOptions").scale
                    },
                    "datasource": [{
                        "table": {
                            "columns": ["index", "description"],
                            "data": routeDesc
                        }
                    }]
                }
            };

        let buildSpec = new BuildSpecModel(attr);

        buildSpec.buildLayers(visibleLayerList);
        buildSpec = buildSpec.toJSON();
        buildSpec = Radio.request("Util", "omit", buildSpec, ["uniqueIdList"]);

        Radio.trigger("Print", "createPrintJob", encodeURIComponent(JSON.stringify(buildSpec)), "schulwegrouting", "pdf");
    },

    prepareRouteDesc: function (routeDesc = []) {
        const data = [],
            routeDescription = Array.isArray(routeDesc) ? routeDesc : [];

        routeDescription.forEach((route, index) => {
            data.push([String(index + 1), route.anweisung]);
        });
        return data;
    },

    handleResponse: function (response, status) {
        let parsedData;

        this.toggleLoader(false);
        if (status === 200) {
            if (response.ExecuteResponse &&
                response.ExecuteResponse.ProcessOutputs &&
                response.ExecuteResponse.ProcessOutputs.Output &&
                response.ExecuteResponse.ProcessOutputs.Output.Data &&
                response.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData &&
                response.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.hasOwnProperty("Schulweg")) {
                parsedData = response.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.Schulweg.Ergebnis;
                if (parsedData.ErrorOccured === "yes") {
                    this.handleWPSError(parsedData);
                }
                else {
                    this.handleSuccess(parsedData);
                }
            }
            else {
                Radio.trigger("Alert", "alert", "<b>Entschuldigung</b><br>"
                    + "Routing konnte nicht berechnet werden, mit folgender Fehlermeldung:<br><br>"
                    + "<i>" + response.ExecuteResponse.ProcessOutputs.Output.Data.ComplexData.serviceResponse.statusInfo.message + "</i><br><br>"
                    + "Bitte wenden Sie sich mit dieser Fehlermeldung an den Administrator.");
            }
        }
        else {
            this.handleWPSError("Routing kann nicht durchgef??hrt werden.<br>Bitte versuchen Sie es sp??ter erneut (Status: " + status + ").");
        }
    },

    handleWPSError: function (response) {
        Radio.trigger("Alert", "alert", JSON.stringify(response));
        this.resetRoute();
    },

    handleSuccess: function (response) {
        const routeGeometry = this.parseRoute(response.route.edge);

        let routeDescription = response.routenbeschreibung.part;

        this.setGeometryByFeatureId("route", this.get("layer").getSource(), routeGeometry);
        response.kuerzesteStrecke = thousandsSeparator(response.kuerzesteStrecke);
        this.setRouteResult(response);
        if (!Array.isArray(routeDescription)) {
            routeDescription = [routeDescription];
        }
        this.setRouteDescription(routeDescription);
        this.trigger("togglePrintEnabled", true);
    },

    /**
     * Search for school.
     * @param {String} address address for searching school
     * @returns {void}
     */
    findRegionalSchool: function (address) {
        const gazAddress = {};

        if (address.length !== 0) {
            gazAddress.streetname = address.street;
            gazAddress.housenumber = address.number;
            gazAddress.affix = address.affix;
            Radio.trigger("Gaz", "adressSearch", gazAddress);
        }
    },

    parseRegionalSchool: function (xml) {
        const primarySchool = $(xml).find("gages\\:grundschulnr,grundschulnr");

        let schoolId,
            school,
            schoolWithAdress;

        if (primarySchool.length > 0) {
            schoolId = primarySchool[0].textContent + "-0";
            school = this.filterSchoolById(this.get("schoolList"), schoolId);
            this.setRegionalSchool(school);
            schoolWithAdress = school.get("schulname") + ", " + school.get("adresse_strasse_hausnr");
            this.setSchoolWithAdress(schoolWithAdress);
            this.trigger("updateRegionalSchool", schoolWithAdress);
        }
        else {
            this.setRegionalSchool({});
            this.trigger("updateRegionalSchool", "Keine Schule gefunden!");
        }
    },

    /**
     * creates one MultiLineString geometry from the routing parts.
     * @param {object[]} routeParts - the routing parts including wkt geometry
     * @returns {ol.geom.MultiLineString} multiLineString - the route geometry
     */
    parseRoute: function (routeParts) {
        const wktParser = new WKT(),
            multiLineString = new MultiLineString({});

        if (Array.isArray(routeParts)) {
            routeParts.forEach(function (routePart) {
                multiLineString.appendLineString(wktParser.readGeometry(routePart.wkt));
            });
        }
        else {
            multiLineString.appendLineString(wktParser.readGeometry(routeParts.wkt));
        }
        return multiLineString;
    },

    /**
     * Prepares an address and a school for calculating the school route.
     * @param {Object} address An address to route from.
     * @fires Tools.GFI#RadioTriggerGFISetVisible
     * @returns {void}
     */
    prepareRequest: function (address) {
        const schoolID = Object.keys(this.get("selectedSchool")).length > 0 ? this.get("selectedSchool")?.get("schul_id") : "";
        let requestObj = {};

        if (Object.keys(address).length !== 0 && schoolID.length > 0) {
            Radio.trigger("GFI", "setIsVisible", false);
            requestObj = this.setObjectAttribute(requestObj, "Schul-ID", "string", schoolID);
            requestObj = this.setObjectAttribute(requestObj, "SchuelerStrasse", "string", address.street);
            requestObj = this.setObjectAttribute(requestObj, "SchuelerHausnr", "integer", parseInt(address.number, 10));
            requestObj = this.setObjectAttribute(requestObj, "SchuelerZusatz", "string", address.affix);
            requestObj = this.setObjectAttribute(requestObj, "RouteAusgeben", "boolean", 1);

            this.sendRequest(requestObj);
        }
    },

    /**
     * Starts a WPS to determine a way to school.
     * @param {Object} requestObj - contains parameters to determine the way to school
     * @fires Core#RadioTriggerWPSRequest
     * @returns {void}
     */
    sendRequest: function (requestObj) {
        this.toggleLoader(true);
        Radio.trigger("WPS", "request", this.get("wpsId"), "schulwegrouting_wps.fmw", requestObj, this.handleResponse.bind(this), 50000);
    },

    toggleLoader: function (show) {
        if (show) {
            Radio.trigger("Util", "showLoader");
        }
        else {
            Radio.trigger("Util", "hideLoader");
        }
    },

    setObjectAttribute: function (object, attrName, dataType, value) {
        const dataObj = {
            dataType: dataType,
            value: value
        };

        object[attrName] = dataObj;
        return object;
    },

    isRoutingRequest: function (ownRequests, requestID) {
        return ownRequests.includes(requestID);
    },

    /**
     * sorts the school features by name
     * @param {ol.feature[]} features - school features
     * @return {ol.feature[]} sorted schools features by name
     */
    sortSchoolsByName: function (features) {
        return features.sort(function (featureA, featureB) {
            const schulnameA = featureA.get("schulname").toUpperCase(),
                schulnameB = featureB.get("schulname").toUpperCase();

            return schulnameA < schulnameB ? -1 : 1;
        });
    },

    /**
     * filters the schools by id. returns the first hit
     * @param {ol.feature[]} schoolList - features of all schools
     * @param {string} schoolId - id of the school feature
     * @returns {ol.feature} -
     */
    filterSchoolById: function (schoolList, schoolId) {
        return schoolList.find(school => {
            return school.get("schul_id") === schoolId;
        });
    },

    /**
     * performs the address search depending on the individual cases
     * @param {string[]} streetNameList - response from Gazetteer
     * @param {object[]} addressList - list of addresses
     * @return {void}
     */
    startSearch: function (streetNameList, addressList) {
        let filteredAddressList;

        if (streetNameList.length === 1) {
            this.setStreetNameList(streetNameList);
            if (addressList.length === 0) {
                Radio.trigger("Gaz", "findHouseNumbers", streetNameList[0]);
            }
            else {
                this.setAddressListFiltered(this.filterAddressList(addressList, this.get("searchRegExp")));
            }
        }
        else if (streetNameList.length > 0) {
            this.setAddressList([]);
            this.setAddressListFiltered([]);
            this.setStreetNameList(streetNameList);
        }
        else {
            filteredAddressList = this.filterAddressList(addressList, this.get("searchRegExp"));

            this.setAddressListFiltered(filteredAddressList);
            if (filteredAddressList.length === 1) {
                this.setStartAddress(filteredAddressList[0]);
                this.setGeometryByFeatureId("startPoint", this.get("layer").getSource(), filteredAddressList[0].geometry);
            }
        }
    },

    /**
     * Searches for street names in the gazetter via the Masterportal API.
     * The search is only executed if the string does not end with a blank.
     * @param {*} value - todo
     * @fires Core#RadioRequestMapGetMap
     * @returns {void}
     */
    searchAddress: function (value) {
        Radio.trigger("Gaz", "findStreets", value);
        this.setSearchRegExp(value);
    },

    /**
     * Searches for house numbers for a given street name in the gazetter via the Masterportal API.
     * @param {*} value - todo
     * @fires Core#RadioRequestMapGetMap
     * @fires Core#RadioRequestUtilSort
     * @returns {void}
     */
    searchHouseNumbers: function (value) {
        Radio.trigger("Gaz", "findHouseNumbers", value);
        this.setSearchRegExp(value);
    },

    /**
     * finds a specific address in the address list and calls 'setGeometryByFeatureId' for the startPoint
     * will be executed after a click on a address in the hitList
     * @param {string} searchString -
     * @param {object[]} addressListFiltered - filtered list of addresses
     * @returns {void}
     */
    selectStartAddress: function (searchString, addressListFiltered) {
        const startAddress = addressListFiltered.find(function (address) {
            return address.joinAddress === searchString.replace(/ /g, "");
        });

        this.setStartAddress(startAddress);
        this.setGeometryByFeatureId("startPoint", this.get("layer").getSource(), startAddress.geometry);
    },

    prepareAddressList: function (addressList, streetNameList) {
        addressList.forEach(function (address) {
            const coords = address.position.split(" ");

            address.geometry = new Point([parseInt(coords[0], 10), parseInt(coords[1], 10)]);
            address.street = streetNameList[0];
            address.joinAddress = address.street.replace(/ /g, "") + address.number + address.affix.replace(/ /g, "");
        }, this);

        return addressList;
    },

    /**
     * filters the addresses by the search RegExp
     * @param {object[]} addressList - list of addresses
     * @param {RegExp} searchRegExp -
     * @returns {object[]} filtered list of addresses
     */
    filterAddressList: function (addressList, searchRegExp) {
        return addressList.filter(function (address) {
            return address.joinAddress.search(searchRegExp) !== -1;
        }, this);
    },

    /**
     * finds the selected school, sets the school and sets the endpoint geometry
     * @param {ol.feature[]} schoolList - features of all schools
     * @param {string} schoolId - id of the school feature
     * @returns {void}
     */
    selectSchool: function (schoolList, schoolId) {
        const school = this.filterSchoolById(schoolList, schoolId);

        this.setSelectedSchool(school);
        this.setGeometryByFeatureId("endPoint", this.get("layer").getSource(), school.getGeometry());
    },

    /**
     * add features with an id to the route layer
     * @param {ol.source} source - vector source of the route layer
     * @returns {void}
     */
    addRouteFeatures: function (source) {
        ["startPoint", "endPoint", "route"].forEach(function (id) {
            const feature = new Feature();

            feature.setId(id);
            feature.set("styleId", id);
            source.addFeature(feature);
        }, this);
    },

    /**
     * sets the geometry for the route features and zoom to the feature extent
     * @param {string} featureId - id of the feature (startPoint | endPoint)
     * @param {ol.source} source - vector source of the route layer
     * @param {string} geometry - geometry of the feature
     * @returns {void}
     */
    setGeometryByFeatureId: function (featureId, source, geometry) {
        source.getFeatureById(featureId).setGeometry(geometry);
        if (geometry.getType() === "Point") {
            Radio.trigger("MapView", "setCenter", geometry.getCoordinates(), 6);
        }
        else {
            Radio.trigger("Map", "zoomToExtent", source.getExtent());
        }
        Radio.trigger("MapView", "setZoomLevelDown");
    },

    /**
     * sets the style for the route features
     * @param {ol.Feature} feature -
     * @returns {ol.Style} feature style
     */
    routeStyle: function (feature) {
        if (feature.getGeometry() instanceof Point) {
            return [
                new Style({
                    image: new CircleStyle({
                        radius: 18,
                        stroke: new Stroke({
                            color: feature.getId() === "startPoint" ? [0, 92, 169, 1] : [225, 0, 25, 1],
                            width: 3
                        }),
                        fill: new Fill({
                            color: [255, 255, 255, 0]
                        })
                    })
                }),
                new Style({
                    image: new CircleStyle({
                        radius: 4,
                        fill: new Fill({
                            color: feature.getId() === "startPoint" ? [0, 92, 169, 1] : [225, 0, 25, 1]
                        })
                    })
                })
            ];
        }
        return new Style({
            stroke: new Stroke({
                color: [225, 0, 25, 0.6],
                width: 6
            })
        });
    },

    resetRoute: function () {
        const features = this.get("layer").getSource().getFeatures();

        this.setStartAddress({});
        this.setSelectedSchool({});
        this.setAddressListFiltered([]);
        this.removeGeomFromFeatures(features);
        this.trigger("resetRouteResult");
        this.trigger("togglePrintEnabled", false);
    },
    removeGeomFromFeatures: function (features) {
        features.forEach(function (feature) {
            feature.unset("geometry");
        });
    },

    /**
     * Searches all streets that contain the string
     * @param {String} evtValue - input streetname
     * @returns {array} targetList
     */
    filterStreets: function (evtValue) {
        const streetNameList = this.get("streetNameList"),
            targetStreet = evtValue.split(" ")[0],
            targetList = [];

        streetNameList.forEach(function (street) {
            const streetNameParts = street.includes(" ") ? street.split(" ") : [street],
                resultStreets = streetNameParts.filter(function (part) {
                    return part.toLowerCase() === targetStreet.toLowerCase();
                }, this);

            if (resultStreets && resultStreets.length) {
                targetList.push(street);
            }
        }, this);

        return targetList;
    },

    setCheckBoxHVV: function (value) {
        this.set("checkBoxHVV", value);
    },

    setSchoolList: function (value) {
        this.set("schoolList", value);
    },

    setStreetNameList: function (value) {
        this.set("streetNameList", value);
    },

    setAddressList: function (value) {
        this.set("addressList", value);
    },

    setSearchRegExp: function (value) {
        // this.set("searchRegExp", new RegExp(value.replace(/ /g, " "), "i"));
        this.set("searchRegExp", new RegExp(value.replace(/ /g, ""), "i"));
    },

    setAddressListFiltered: function (value) {
        this.set("addressListFiltered", value);
    },
    setLayer: function (layer) {
        this.set("layer", layer);
    },
    setRegionalSchool: function (value) {
        this.set("regionalSchool", value);
    },
    setSelectedSchool: function (value) {
        this.set("selectedSchool", value);
    },
    setStartAddress: function (value) {
        this.set("startAddress", value);
    },
    setRouteResult: function (value) {
        this.set("routeResult", value);
    },
    setRouteDescription: function (value) {
        this.set("routeDescription", value);
    },
    setSchoolWithAdress: function (value) {
        this.set("schoolWithAdress", value);
    },
    setPrintRoute: function (value) {
        this.set("printRoute", value);
    }
});

export default Schulwegrouting;
