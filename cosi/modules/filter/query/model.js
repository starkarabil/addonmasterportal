import SnippetDropdownModel from "../../../../../modules/snippets/dropdown/model";
import SnippetSliderModel from "../../../../../modules/snippets/slider/model";
import SnippetCheckboxModel from "../../../../../modules/snippets/checkbox/model";
import SnippetMultiCheckboxModel from "../../../../../modules/snippets/multiCheckbox/model";
import {getDisplayNamesOfFeatureAttributes} from "masterportalAPI/src/rawLayerList";

const QueryModel = Backbone.Model.extend(/** @lends QueryModel.prototype */{

    defaults: {
        featureIds: [],
        isLayerVisible: false,
        activateOnSelection: false,
        searchInMapExtent: true,
        liveZoomToFeatures: false
    },

    /**
     * @class QueryModel
     * @description todo
     * @extends Backbone.Model
     * @memberOf Tools.Filter.Query
     * @constructs
     * @property {Array} featureIds=[] todo
     * @property {boolean} isLayerVisible=false todo
     * @property {boolean} activateOnSelection=false todo
     * @property {boolean} searchInMapExtent=true Flag for the search in the current map extent.
     * @property {boolean} liveZoomToFeatures=false todo
     * @returns {void}
     */
    superInitialize: function () {
        this.setSnippetCollection(new Backbone.Collection());
        this.addIsActiveCheckbox();
        this.listenTo(this.get("snippetCollection"), {
            "valuesChanged": function () {
                let options;

                this.setIsActive(true);
                this.get("btnIsActive").setIsSelected(true);
                this.runFilter();
                if (this.get("liveZoomToFeatures")) {
                    Radio.trigger("Map", "zoomToFilteredFeatures", this.get("featureIds"), this.get("layerId"));
                    options = Radio.request("MapView", "getOptions");
                    if (this.get("minScale") && options.scale < this.get("minScale")) {
                        Radio.trigger("MapView", "setScale", this.get("minScale"));
                    }
                }
            }
        }, this);
        this.checkLayerVisibility();
        this.listenTo(Radio.channel("Layer"), {
            "layerVisibleChanged": function (layerId, visible) {
                if (layerId === this.get("layerId")) {
                    this.setIsLayerVisible(visible);
                }
            }
        }, this);

    },

    isSearchInMapExtentActive: function () {
        const model = this.get("snippetCollection").findWhere({type: "searchInMapExtent"});

        if (model !== undefined && model.getIsSelected() === true) {
            this.runFilter();
        }
    },

    checkLayerVisibility: function () {
        const model = Radio.request("ModelList", "getModelByAttributes", {id: this.get("layerId")});

        if (model !== undefined) {
            this.setIsLayerVisible(model.get("isVisibleInMap"));
        }
    },

    addIsActiveCheckbox: function () {
        if (!this.get("activateOnSelection")) {
            this.setBtnIsActive(new SnippetCheckboxModel({
                isSelected: this.get("isActive")
            }));

            this.listenTo(this.get("btnIsActive"), {
                "valuesChanged": function () {
                    const checkboxModel = this.get("btnIsActive"),
                        isActive = this.get("btnIsActive").getIsSelected();

                    checkboxModel.renderView();
                    this.setIsActive(isActive);
                }
            }, this);
        }
    },

    /**
     * [description]
     * @param  {Object[]} featureAttributesMap Mapping array for feature attributes
     * @return {void}
     */
    addSnippets: function (featureAttributesMap) {
        featureAttributesMap.forEach(function (featureAttribute) {
            this.addSnippet(featureAttribute);
        }, this);
    },

    addSnippet: function (featureAttribute) {
        let snippetAttribute = featureAttribute,
            isSelected = false;

        snippetAttribute.values = Radio.request("Util", "sort", snippetAttribute.values);
        if (snippetAttribute.type === "string" || snippetAttribute.type === "text") {
            snippetAttribute = Object.assign(snippetAttribute, {"snippetType": "dropdown"});
            this.get("snippetCollection").add(new SnippetDropdownModel(snippetAttribute));
        }
        else if (snippetAttribute.type === "boolean") {
            if (snippetAttribute.hasOwnProperty("preselectedValues")) {
                isSelected = snippetAttribute.preselectedValues[0];
            }
            snippetAttribute = Object.assign(snippetAttribute, {"snippetType": "checkbox", "label": snippetAttribute.displayName, "isSelected": isSelected});
            this.get("snippetCollection").add(new SnippetCheckboxModel(snippetAttribute));
        }
        else if (snippetAttribute.type === "integer" || snippetAttribute.type === "decimal") {
            snippetAttribute = Object.assign(snippetAttribute, {"snippetType": "slider"});
            this.get("snippetCollection").add(new SnippetSliderModel(snippetAttribute));
        }
        else if (snippetAttribute.type === "checkbox-classic") {
            snippetAttribute = Object.assign(snippetAttribute, {"snippetType": snippetAttribute.type});
            snippetAttribute.type = "string";
            snippetAttribute.layerId = this.get("layerId");
            snippetAttribute.isInitialLoad = this.get("isInitialLoad");
            this.get("snippetCollection").add(new SnippetMultiCheckboxModel(snippetAttribute));
        }
    },
    /**
     * adds a snippet for the map extent search
     * @return {void}
     */
    addSearchInMapExtentSnippet: function () {
        this.get("snippetCollection").add(new SnippetCheckboxModel({
            type: "searchInMapExtent",
            isSelected: false,
            label: "Suche im aktuellen Kartenausschnitt"
        }));
    },

    /**
     * Creates one or more Snippets, where Snippets like DropDowns or Sliders
     * @param  {object[]} featureAttributes feature attributes
     * @return {void}
     */
    createSnippets: function (featureAttributes) {
        let featureAttributesMap = this.trimAttributes(featureAttributes),
            options;

        featureAttributesMap = this.mapDisplayNames(featureAttributesMap);
        featureAttributesMap = this.collectSelectableOptions(this.get("features"), [], featureAttributesMap);
        featureAttributesMap = this.mapRules(featureAttributesMap, this.get("rules"));

        this.setFeatureAttributesMap(featureAttributesMap);
        this.addSnippets(featureAttributesMap);
        if (this.get("isSelected") === true) {
            this.runFilter();
            if (this.get("liveZoomToFeatures")) {
                Radio.trigger("Map", "zoomToFilteredFeatures", this.get("featureIds"), this.get("layerId"));
                options = Radio.request("MapView", "getOptions");
                if (this.get("minScale") && options.scale < this.get("minScale")) {
                    Radio.trigger("MapView", "setScale", this.get("minScale"));
                }
            }
            this.trigger("renderDetailView");
        }
    },

    /**
     * Entfernt alle Attribute die nicht in der Whitelist stehen
     * @param  {object} featureAttributesMap - Mapobject
     * @return {object} featureAttributesMap - gefiltertes Mapobject
     */
    trimAttributes: function (featureAttributesMap) {
        const trimmedFeatureAttributesMap = [];
        let featureAttribute;

        this.get("attributeWhiteList").forEach(function (attr) {
            const attrObj = this.createAttrObject(attr);

            featureAttribute = featureAttributesMap.find({name: attrObj.name});
            if (featureAttribute !== undefined) {
                featureAttribute.matchingMode = attrObj.matchingMode;
                trimmedFeatureAttributesMap.push(featureAttribute);
            }
        }, this);

        return trimmedFeatureAttributesMap;
    },

    createAttrObject: function (attr) {
        let attrObj = {};

        if (typeof attr === "string") {
            attrObj.name = attr;
            attrObj.matchingMode = "OR";
        }
        else if (attr.hasOwnProperty("name") && attr.hasOwnProperty("matchingMode")) {
            attrObj = attr;
        }
        return attrObj;
    },
    /**
     * Konfigurierter Labeltext wird den Features zugeordnet
     * @param  {object} featureAttributesMap - Mapobject
     * @return {object} featureAttributesMap - gefiltertes Mapobject
     */
    mapDisplayNames: function (featureAttributesMap) {
        const displayNames = getDisplayNamesOfFeatureAttributes(this.get("layerId"));

        featureAttributesMap.forEach(function (featureAttribute) {
            if (displayNames && (typeof displayNames === "object" || typeof displayNames === "function") && displayNames.hasOwnProperty(featureAttribute.name) === true) {
                featureAttribute.displayName = displayNames[featureAttribute.name];
            }
            else {
                featureAttribute.displayName = featureAttribute.name;
            }
        });

        return featureAttributesMap;
    },

    /**
     * adds values that should be initially selected (rules) to the map object
     * @param  {object} featureAttributesMap - Mapobject
     * @param  {object} rules - contains values to be added
     * @return {object} featureAttributesMap
     */
    mapRules: function (featureAttributesMap, rules) {
        let attrMap;

        if (rules !== undefined) {
            rules.forEach(function (rule) {
                attrMap = featureAttributesMap.find({name: rule.attrName});

                if (attrMap) {
                    attrMap.preselectedValues = rule.values;
                }
            });
        }

        return featureAttributesMap;
    },

    /**
     * iterates over the snippet collection and
     * calls in the snippet deselectValueModels
     * @return {void}
     */
    deselectAllValueModels: function () {
        this.get("snippetCollection").models.forEach(function (snippet) {
            snippet.deselectValueModels();
        }, this);
    },

    setFeatureAttributesMap: function (value) {
        this.set("featureAttributesMap", value);
    },

    // setter for isDefault
    setIsDefault: function (value) {
        this.set("isDefault", value);
    },
    selectThis: function () {
        let options;

        if (!this.get("isSelected")) {
            // die Query-Collection h??rt im Filter-Model auf diesen Trigger
            this.collection.trigger("deselectAllModels", this);
            this.collection.trigger("deactivateAllModels", this);
            this.setIsSelected(true);
            if (this.get("isActive")) {
                this.runFilter();
                if (this.get("liveZoomToFeatures")) {
                    Radio.trigger("Map", "zoomToFilteredFeatures", this.get("featureIds"), this.get("layerId"));
                    options = Radio.request("MapView", "getOptions");
                    if (this.get("minScale") && options.scale < this.get("minScale")) {
                        Radio.trigger("MapView", "setScale", this.get("minScale"));
                    }
                }
            }
        }
        else {
            this.setIsSelected(false);
            this.runFilter();
        }
    },

    setIsSelected: function (value) {
        if (this.get("activateOnSelection")) {
            this.setIsActive(value);
        }
        this.set("isSelected", value);
    },

    setIsActive: function (value) {
        this.set("isActive", value);
    },

    setFeatureIds: function (value) {
        this.set("featureIds", value);
    },
    setIsNoValueSelected: function (value) {
        this.set("isNoValueSelected", value);
    },
    setIsLayerVisible: function (value) {
        this.set("isLayerVisible", value);
    },

    setActivateOnSelection: function (value) {
        this.set("activateOnSelection", value);
    },

    // setter for snippetCollection
    setSnippetCollection: function (value) {
        this.set("snippetCollection", value);
    },

    // setter for btnIsActive
    setBtnIsActive: function (value) {
        this.set("btnIsActive", value);
    },

    // setter for liveZoomToFeatures
    setLiveZoomToFeatures: function (value) {
        this.set("liveZoomToFeatures", value);
    },

    // setter for layerId
    setLayerId: function (value) {
        this.set("layerId", value);
    },

    // setter for features
    setFeatures: function (value) {
        this.set("features", value);
    },

    // setter for rules
    setRules: function (value) {
        this.set("rules", value);
    },

    // setter for attributeWhiteList
    setAttributeWhiteList: function (value) {
        this.set("attributeWhiteList", value);
    },

    // setter for isInitialLoad
    setIsInitialLoad: function (value) {
        this.set("isInitialLoad", value);
    }
});

export default QueryModel;
