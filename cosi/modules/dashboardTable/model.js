/* eslint-disable max-depth */
import Tool from "../../../../modules/core/modelList/tool/model";
import ExportButtonModel from "../../../../modules/snippets/exportButton/model";
import DropdownModel from "../../../../modules/snippets/dropdown/model";
import TimelineModel from "../timeline/model";

const DashboardTableModel = Tool.extend(/** @lends DashboardTableModel.prototype */ {
    defaults: _.extend({}, Tool.prototype.defaults, {
        tableView: [],
        filteredTableView: [],
        unsortedTable: [],
        name: "",
        glyphicon: "",
        exportButtonModel: {},
        exportFilteredButtonModel: {},
        sortKey: "",
        timelineModel: new TimelineModel(),
        filterDropdownModel: {},
        customFilters: [],
        ratioAttrs: [],
        selectedAttrsForCharts: [],
        inactiveColumns: []
    }),

    /**
     * @class DashboardTableModel
     * @extends Tool
     * @memberof Tools.Dashboard
     * @constructs
     * @property {object} tableView
     * @property {object} filteredTableView
     * @property {object} unsortedTable
     * @property {Backbone.Model} exportButtonModel
     * @property {Backbone.Model} exportFilteredButtonModel
     * @property {string} sortKey
     * @property {Backbone.Model} timelineModel
     * @property {Backbone.Model} filterDropdownModel
     * @property {string[]} customFilters the filter options generated by createRatio
     * @property {string[]} ratioAttrs the selected rows for custom calculations
     * @property {string[]} selectedAttrsForCharts the selected rows for creating grouped bar charts
     * @property {number[]} inactiveColumns the switched off columns ignored for analysis
     * @listens SelectDistrict#RadioTriggerSelectionChanged
     * @listens Dashboard#RadioTriggerDashboardOpen
     * @fires Dashboard#RadioTriggerDestroyWidgetById
     */

    initialize: function () {
        const channel = Radio.channel("Dashboard");

        this.superInitialize();

        this.set("exportButtonModel", new ExportButtonModel({
            tag: "Als CSV herunterladen",
            rawData: [],
            filename: "CoSI-Dashboard-Datenblatt",
            fileExtension: "csv"
        }));
        this.set("exportFilteredButtonModel", new ExportButtonModel({
            tag: "Als CSV herunterladen (gefiltert)",
            rawData: [],
            filename: "CoSI-Dashboard-Datenblatt-(gefiltert)",
            fileExtension: "csv"
        }));

        this.set("filterDropdownModel", new DropdownModel({
            name: "Filter",
            type: "string",
            displayName: "Tabelle filtern",
            values: [],
            snippetType: "dropdown",
            isMultiple: true,
            liveSearch: true,
            isGrouped: true
        }));

        this.listenTo(this.get("filterDropdownModel"), {
            "valuesChanged": this.filterTableView
        });

        this.listenTo(Radio.channel("SelectDistrict"), {
            "selectionChanged": function () {
                Radio.trigger("Dashboard", "destroyWidgetById", "dashboard");
                this.set("tableView", []);
                this.set("filteredTableView", []);
                this.set("sortKey", Radio.request("SelectDistrict", "getSelector"));
            }
        }, this);

        this.listenTo(Radio.channel("FeaturesLoader"), {
            "districtsLoaded": this.getData
        }, this);

        this.listenTo(channel, {
            "dashboardOpen": function () {
                this.prepareRendering();
            }
        }, this);

        this.listenTo(this, {
            "change:tableView": function () {
                if (this.get("tableView").length > 0) {
                    this.set("filteredTableView", this.get("tableView"));
                }
            },
            "change:filteredTableView": function () {
                if (this.get("filteredTableView").length > 0) {
                    this.prepareRendering();
                }
            }
        });
    },

    /**
     * @description Concats the new feature data with the exisiting data-table and triggers the rendering
     * @param {Array<ol.feature>} features - the features that contain the info to display
     * @param {string} layerId - the ID of the LayerModel of the data
     * @returns {void}
     */
    updateTable: function (features) {
        const table = features.reduce((newTable, feature) => {
            const properties = feature.getProperties();
            let selector = properties.verwaltungseinheit || this.get("sortKey"),
                distCol = 0;

            // dirty fix for data inconsistencies
            if (selector === "stadtteile") {
                selector = "stadtteil";
            }
            if (selector === "bezirke") {
                selector = "bezirk";
            }

            distCol = newTable.findIndex(col => col[selector] === properties[selector] && col.verwaltungseinheit === properties.verwaltungseinheit);

            if (distCol !== -1) {
                newTable[distCol] = {...newTable[distCol], ...Radio.request("Timeline", "createTimelineTable", [properties])[0]};
                return newTable;
            }

            // Fill up Data that might be missing in the dataset
            // TODO: Fix in Data
            if (selector !== this.get("sortKey")) {
                properties[this.get("sortKey")] = properties[selector];
                properties.notes = "Referenzgebiet";
            }

            // Fill up Data that might be missing in the dataset
            // TODO: Fix in Data
            properties.notes = properties.notes || "-";
            properties.statgebiet = properties.statgebiet || "-";
            properties.stadtteil = properties.stadtteil || "-";
            properties.bezirk = properties.bezirk || "-";

            return [...newTable, Radio.request("Timeline", "createTimelineTable", [properties])[0]];
        }, []).sort((a, b) => {
            if (a[this.get("sortKey")] < b[this.get("sortKey")]) {
                return -1;
            }
            return 1;
        });

        // Fill up gaps in the data due to data inconsistencies
        // Add total and mean values and filter table for excluded properties
        this.set("columnNames", [...table.map(col => col[this.get("sortKey")]), "Gesamt", "Durchschnitt"]);
        this.set("unsortedTable", this.calculateTotalAndMean(Radio.request("Timeline", "fillUpTimelineGaps", table, "Array")));

        // group table according to mapping.json
        // Set table
        this.set("tableView", this.groupTable(this.get("unsortedTable")));

        // writes the table data to local storage for the 2nd screen
        window.localStorage.setItem("tableView", JSON.stringify(this.get("tableView")));
        window.localStorage.setItem("unsortedTable", JSON.stringify(this.get("unsortedTable")));
    },

    /**
     * @description prepares all nested views for rendering and triggers view
     * @returns {void}
     */
    prepareRendering: function () {
        // Update the filter dropdown list
        this.updateFilter();
        this.prepareExportLink();

        this.trigger("isReady");
    },

    /**
     * @description prepare exportLink and convert filtered table to readable obj
     * @returns {void}
     */
    prepareExportLink () {
        // Update Export Link
        this.get("exportButtonModel").set("rawData", this.flattenTable(this.get("tableView")));
        this.get("exportButtonModel").prepareForExport();

        this.get("exportFilteredButtonModel").set("rawData", this.flattenTable(this.get("filteredTableView")));
        this.get("exportFilteredButtonModel").prepareForExport();
    },

    /**
     * flattens the data table for export
     * @param {object} data the nested table
     * @returns {object} the flattened table Object-Array
     */
    flattenTable (data) {
        if (Array.prototype.flat) {
            const flatData = data.map(group => {
                const flatGroup = Object.values(Object.assign({}, group.values)),
                    propertyNames = Object.keys(group.values);

                return flatGroup.map((prop, i) => {
                    if (!Array.isArray(Object.values(prop)[0])) {
                        return {...{
                            Jahr: "-",
                            Datensatz: propertyNames[i],
                            Kategorie: group.group
                        }, ...prop};
                    }
                    const flatProp = Object.assign({}, prop),
                        years = flatProp.Durchschnitt.map(val => val[0]);

                    return years.map((year, j) => {
                        const flatYear = Object.assign({}, flatProp);

                        for (const district in flatYear) {
                            if (flatYear[district]) {
                                flatYear[district] = flatYear[district][j][1];
                            }
                            else {
                                flatYear[district] = "-";
                            }
                        }

                        return {...{
                            Jahr: year,
                            Datensatz: propertyNames[i],
                            Kategorie: group.group
                        }, ...flatYear};
                    });
                });
            }).flat(Infinity);

            return flatData;
        }

        return data;
    },

    /**
     * @description sums up and averages all rows of the table
     * @param {Object} table the existing table (already filtered)
     * @returns {Object} the resulting table
     */
    calculateTotalAndMean: function (table) {
        if (table) {
            const properties = Object.keys(table[0]);

            table.push(
                {
                    [this.get("sortKey")]: "Gesamt",
                    notes: "Berechnung aus Auswahl"
                },
                {
                    [this.get("sortKey")]: "Durchschnitt",
                    notes: "Berechnung aus Auswahl"
                }
            );
            properties.forEach((prop) => {
                if (prop !== this.get("sortKey")) {

                    // Check whether values in row are numbers or Arrays of numbers
                    if (!isNaN(parseFloat(table[0][prop])) && !Array.isArray(table[0][prop])) {
                        let total = 0;

                        // Add values for all columns
                        table.forEach((col) => {
                            // dirty fix for data inconsistencies
                            const selector = col.verwaltungseinheit === "stadtteile" ? "stadtteil" : col.verwaltungseinheit || this.get("sortKey");

                            if (col[selector] !== "Gesamt" && col[selector] !== "Durchschnitt" && selector === this.get("sortKey")) {
                                total += parseFloat(col[prop]);
                            }
                            if (total !== 0) {

                                // write sum
                                if (col[this.get("sortKey")] === "Gesamt") {
                                    col[prop] = prop.includes("Anteil") ? "-" : total;
                                }

                                // calculate and write average
                                if (col[this.get("sortKey")] === "Durchschnitt") {
                                    col[prop] = prop.includes("Anteil") ? "-" : total / (table.length - 2);
                                }
                            }
                        });
                    }
                    else if (Array.isArray(table[0][prop])) {
                        const matrixTotal = [],
                            avgArr = [];

                        // Create Matrix from timeline values
                        table.forEach((col) => {
                            // dirty fix for data inconsistencies
                            const selector = col.verwaltungseinheit === "stadtteile" ? "stadtteil" : col.verwaltungseinheit || this.get("sortKey");

                            if (col[this.get("sortKey")] !== "Gesamt" && col[this.get("sortKey")] !== "Durchschnitt" && selector === this.get("sortKey")) {
                                matrixTotal.push(col[prop]);
                            }
                            if (matrixTotal.length > 0) {
                                // sum up all columns of timeline and calculate average on the fly
                                if (col[this.get("sortKey")] === "Gesamt") {
                                    col[prop] = [];
                                    for (let i = 0; i < matrixTotal[0].length; i++) {
                                        let n = 0;

                                        if (prop.includes("Anteil")) {
                                            col[prop].push([matrixTotal[0][i][0], "-"]);
                                            avgArr.push([col[prop][i][0], "-"]);
                                        }
                                        else {
                                            col[prop].push([matrixTotal[0][i][0], 0]);

                                            for (let j = 0; j < matrixTotal.length; j++) {
                                                if (matrixTotal[j]) {
                                                    col[prop][i][1] += isNaN(parseFloat(matrixTotal[j][i][1])) ? 0 : parseFloat(matrixTotal[j][i][1]);
                                                    n += isNaN(parseFloat(matrixTotal[j][i][1])) ? 0 : 1;
                                                }
                                            }
                                            avgArr.push([col[prop][i][0], col[prop][i][1] / n]);
                                        }
                                    }
                                }

                                // write average
                                if (col[this.get("sortKey")] === "Durchschnitt") {
                                    col[prop] = avgArr;
                                }
                            }
                        });
                    }
                }
            });
        }

        return table;
    },

    /**
     * @description groups the table Object according to mapping.json and adds meta Info
     * @param {object} table the unsorted table
     * @fires Util#RadioTriggerRenameKeys
     * @fires Util#RadioTriggerRenameValues
     * @returns {object} the grouped table
     */
    groupTable (table) {
        const values = Radio.request("FeaturesLoader", "getAllValuesByScope", Radio.request("SelectDistrict", "getSelector")),
            metaInfo = {
                group: "Gebietsinformation",
                values: table.reduce((meta, col) => {
                    for (const prop in col) {
                        if (!Array.isArray(col[prop]) && prop !== this.get("sortKey")) {
                            if (meta[prop]) {
                                meta[prop][col[this.get("sortKey")]] = col[prop];
                            }
                            else {
                                meta[prop] = {
                                    [col[this.get("sortKey")]]: col[prop]
                                };
                            }
                        }
                    }
                    return meta;
                }, {})
            },
            groups = values.reduce((res, val) => {
                const match = res.find(el => el.group === val.group);
                let newGroup = {};

                if (match) {
                    match.values[val.value] = {};
                    table.forEach(col => {
                        match.values[val.value][col[this.get("sortKey")]] = col[val.value];
                    });
                    return res;
                }
                newGroup = {
                    group: val.group,
                    values: {
                        [val.value]: {}
                    }
                };

                table.forEach(col => {
                    newGroup.values[val.value][col[this.get("sortKey")]] = col[val.value];
                });

                return [...res, newGroup];
            }, []);

        metaInfo.values = Radio.request("Util", "renameKeys", {
            verwaltungseinheit: "Verwaltungseinheit",
            bezirk: "Bezirk",
            statgebiet: "Statistisches Gebiet",
            stadtteil: "Stadtteil",
            notes: "Anmerkungen"
        }, metaInfo.values);

        metaInfo.values = Radio.request("Util", "renameValues", {
            statgebiet: "Statistisches Gebiet",
            bezirke: "Bezirk",
            stadtteile: "Stadtteil"
        }, metaInfo.values);

        return [metaInfo, ...groups].map(group => {
            for (const prop in group.values) {
                this.get("columnNames").forEach(name => {
                    if (!Object.keys(group.values[prop]).includes(name)) {
                        group.values[prop][name] = "-";
                    }
                });
            }
            return group;
        }, this);
    },

    /**
     * @description gets the data features from featuresLoader
     * @returns {void}
     */
    getData: function () {
        const attrMap = Radio.request("FeaturesLoader", "getDistrictAttrMapping", Radio.request("SelectDistrict", "getScope")),
            features = Radio.request("FeaturesLoader", "getDistrictsByScope", [attrMap.attribute, ...attrMap.referenceAttributes]);

        if (features) {
            this.updateTable(features);
        }
    },

    /**
     * @description creates a new entry in the data table as the ratio between the 2 selected datasets and rerenders the view
     * @returns {void}
     */
    createRatio () {
        const tableView = this.get("tableView"),
            num = this.getValueByAttribute(this.getAttrsForRatio()[0]),
            den = this.getValueByAttribute(this.getAttrsForRatio()[1]),
            ratio = JSON.parse(JSON.stringify(num)),
            calcGroup = tableView.find(group => group.group === "Berechnungen");

        for (const col in ratio) {
            for (let i = 0; i < ratio[col].length; i++) {
                ratio[col][i][1] /= den[col][i][1];
            }
            const match = this.get("unsortedTable").find(distCol => distCol[this.get("sortKey")] === col);

            match[`(${this.getAttrsForRatio()[0]} / ${this.getAttrsForRatio()[1]})`] = ratio[col];
        }

        if (calcGroup) {
            calcGroup.values[`(${this.getAttrsForRatio()[0]} / ${this.getAttrsForRatio()[1]})`] = ratio;
        }
        else {
            tableView.push({
                group: "Berechnungen",
                values: {
                    [`(${this.getAttrsForRatio()[0]} / ${this.getAttrsForRatio()[1]})`]: ratio
                }
            });
        }

        this.get("customFilters").push({
            category: `(${this.getAttrsForRatio()[0]} / ${this.getAttrsForRatio()[1]})`,
            group: "Berechnungen",
            stadtteil: true,
            statgebiet: true,
            value: `(${this.getAttrsForRatio()[0]} / ${this.getAttrsForRatio()[1]})`,
            valueType: "relative"
        });

        this.filterTableView();
        this.trigger("filterUpdated");
    },

    /**
     * @description retrieves an entry from the grouped data table
     * @param {string} attr the attribute to filter for
     * @returns {object} the dataset for all selected districts
     */
    getValueByAttribute (attr) {
        const group = this.get("tableView").find(g => {
            for (const val in g.values) {
                if (val === attr) {
                    return true;
                }
            }
            return false;
        });

        return group ? group.values[attr] : null;
    },

    /**
     * @description appends a bar chart to the dashboard widgets, the data is taken from the selectedAttrs property, NOT from the currently clicked row
     * @param {number} year the year to create the bar graph from
     * @fires Dashboard#RadioTriggerAppend
     * @fires Alert#RadioTriggerAlert
     * @returns {void}
     */
    createBarChart (year) {
        const svgParent = document.createElement("div"),
            data = this.getBarChartData(this.get("selectedAttrsForCharts"), year);

        svgParent.className = "svg-container";


        if (Object.keys(data[0]).length <= 1) {
            return Radio.trigger("Alert", "alert", `Für das Jahr ${year} sind leider keine Werte zu ${this.get("selectedAttrsForCharts").join(", ")} verfügbar.`);
        }

        // eslint-disable-next-line one-var
        const graph = Radio.request("GraphV2", "createGraph", {
            graphType: "BarGraph",
            graphTitle: this.get("selectedAttrsForCharts").join(", "),
            selector: svgParent,
            scaleTypeX: "ordinal",
            scaleTypeY: "linear",
            data: data,
            attrToShowArray: this.get("selectedAttrsForCharts"),
            xAttr: this.get("sortKey"),
            xAxisLabel: {
                offset: 5,
                textAnchor: "middle",
                fill: "#000",
                fontSize: 10,
                label: this.get("sortKey")
            },
            yAxisLabel: {
                offset: -5,
                textAnchor: "middle",
                fill: "#000",
                fontSize: 10,
                label: this.get("selectedAttrsForCharts")
            },
            margin: {
                left: 40,
                top: 25,
                right: 20,
                bottom: 40
            },
            width: $(window).width() * 0.4,
            height: $(window).height() * 0.4,
            svgClass: "dashboard-graph-svg",
            selectorTooltip: ".dashboard-tooltip",
            hasContextMenu: true,
            attribution: {
                x: 0,
                y: $(window).height() * 0.4,
                lineHeight: 10,
                fontSize: "7px",
                anchor: "start",
                text: ["Datum: " + new Date().toLocaleDateString("de-DE"), "Quelle: Cockpit für Städtische Infrastruktur (CoSI)"]
            }
        });

        return Radio.trigger("Dashboard", "append", graph, "#dashboard-containers", {
            id: this.get("selectedAttrsForCharts").join(", "),
            name: `${this.get("selectedAttrsForCharts").join(", ")} (${year})`,
            glyphicon: "glyphicon-stats",
            width: $("#dashboard-containers").width() - 50 + "px",
            scalable: true,
            focus: true
        });
    },

    /**
     * @description appends a line chart to the dashboard widgets
     * @param {string[]} props the array of attributes to visualize
     * @param {string} title the label for the diagram, generated from the clicked row
     * @param {boolean} dynamicAxisStart is the y-Axis scaled?
     * @fires Dashboard#RadioTriggerAppend
     * @fires Alert#RadioTriggerAlert
     * @returns {void}
     */
    createLineChart (props, title, dynamicAxisStart = false) {
        const svgParent = document.createElement("div"),
            data = this.getLineChartData(props);

        svgParent.className = "svg-container";

        // eslint-disable-next-line one-var
        const graph = Radio.request("GraphV2", "createGraph", {
            graphType: "Linegraph",
            graphTitle: title,
            selector: svgParent,
            scaleTypeX: "ordinal",
            scaleTypeY: "linear",
            data: data.data,
            attrToShowArray: data.xAttrs,
            xAttr: "year",
            xAxisLabel: {
                offset: 5,
                textAnchor: "middle",
                fill: "#000",
                fontSize: 10,
                label: "Jahr"
            },
            yAxisLabel: {
                offset: -5,
                textAnchor: "middle",
                fill: "#000",
                fontSize: 10,
                label: props[0]
            },
            margin: {
                left: 40,
                top: 25,
                right: 20,
                bottom: 40
            },
            width: $(window).width() * 0.4,
            height: $(window).height() * 0.4,
            svgClass: "dashboard-graph-svg",
            selectorTooltip: ".dashboard-tooltip",
            hasLineLabel: true,
            hasContextMenu: true,
            dynamicAxisStart: dynamicAxisStart,
            attribution: {
                x: 0,
                y: $(window).height() * 0.4,
                lineHeight: 10,
                fontSize: "7px",
                anchor: "start",
                text: ["Datum: " + new Date().toLocaleDateString("de-DE"), "Quelle: Cockpit für Städtische Infrastruktur (CoSI)"]
            }
        });

        return Radio.trigger("Dashboard", "append", graph, "#dashboard-containers", {
            id: title,
            name: `${title}`,
            glyphicon: "glyphicon-stats",
            width: $("#dashboard-containers").width() - 50 + "px",
            scalable: true,
            focus: true
        });
    },

    /**
     * @description appends a scatterplot to the dashboard widgets based on the selected columns
     * @param {boolean} dynamicAxisStart is the y-Axis scaled?
     * @fires Dashboard#RadioTriggerAppend
     * @returns {void}
     */
    createCorrelation (dynamicAxisStart = true) {
        const svgParent = document.createElement("div"),
            attrsToShow = this.getAttrsForRatio(),
            data = this.getCorrelationChartData(this.getAttrsForRatio());

        svgParent.className = "svg-container";

        // eslint-disable-next-line one-var
        const graph = Radio.request("GraphV2", "createGraph", {
            graphType: "ScatterPlot",
            graphTitle: `Korrelation: ${attrsToShow[0]} (y) : ${attrsToShow[1]} (x)`,
            selector: svgParent,
            scaleTypeX: "linear",
            scaleTypeY: "linear",
            dynamicAxisStart: dynamicAxisStart,
            data: data,
            refAttr: this.get("sortKey"),
            attrToShowArray: [attrsToShow[0]],
            xAttr: attrsToShow[1],
            xAxisLabel: {
                offset: 5,
                textAnchor: "middle",
                fill: "#000",
                fontSize: 10,
                label: attrsToShow[1]
            },
            yAxisLabel: {
                offset: -5,
                textAnchor: "middle",
                fill: "#000",
                fontSize: 10,
                label: attrsToShow[0]
            },
            margin: {
                left: 40,
                top: 25,
                right: 20,
                bottom: 40
            },
            width: $(window).width() * 0.4,
            height: $(window).height() * 0.4,
            dotSize: 3,
            svgClass: "dashboard-graph-svg",
            selectorTooltip: ".dashboard-tooltip",
            hasContextMenu: true,
            attribution: {
                x: 0,
                y: $(window).height() * 0.4,
                lineHeight: 10,
                fontSize: "7px",
                anchor: "start",
                text: ["Datum: " + new Date().toLocaleDateString("de-DE"), "Quelle: Cockpit für Städtische Infrastruktur (CoSI)"]
            }
        });

        Radio.trigger("Dashboard", "append", graph, "#dashboard-containers", {
            name: `Korrelation: ${attrsToShow[0]} (y) : ${attrsToShow[1]} (x)`,
            glyphicon: "glyphicon-flash",
            width: $("#dashboard-containers").width() - 50 + "px",
            scalable: true,
            focus: true
        });
    },

    /**
     * @description retrieves and formats a number of datasets from the table for rendering a bar chart
     * @param {string[]} props the attributes to retrieve
     * @param {string | number} year the year to render the graph for
     * @returns {object} the formatted object
     */
    getBarChartData (props, year = "2018") {
        return this.get("unsortedTable")
            .filter((district, i) => !this.get("inactiveColumns").includes(i))
            .map((district) => {
                const districtProps = {
                    [this.get("sortKey")]: district[this.get("sortKey")]
                };

                props.forEach(prop => {
                    if (district[prop].find(value => value[0] === year)) {
                        districtProps[prop] = district[prop].find(value => value[0] === year)[1];
                    }
                });

                return districtProps;
            });
    },

    /**
     * @description retrieves and formats two datasets from the table for correlation and rendering the scatterplot
     * @param {string[]} props the attributes to retrieve
     * @returns {object} the formatted object
     */
    getCorrelationChartData (props) {
        const rawData = this.get("unsortedTable").filter((district, i) => !this.get("inactiveColumns").includes(i)),
            correlationData = rawData[0][props[0]].reduce((data, yearValue) => {
                const year = yearValue[0];

                return [...data, ...rawData
                    .filter(district => district[this.get("sortKey")] !== "Gesamt")
                    .map((district) => {
                        let hasVal = true;
                        const districtProps = {
                            [this.get("sortKey")]: district[this.get("sortKey")],
                            year: year
                        };

                        props.forEach(prop => {
                            if (district[prop].find(value => value[0] === year)) {
                                districtProps[prop] = district[prop].filter(value => value[0] === year)[0][1];
                            }
                            else {
                                hasVal = false;
                            }
                        });

                        return hasVal ? districtProps : null;
                    }).filter(district => district)];
            }, [])
                .sort((a, b) => {
                    return a[props[0]] - b[props[0]];
                });

        return correlationData;
    },

    /**
     * @description retrieves and formats a number of datasets from the table for rendering a line chart
     * @param {string[]} props the attributes to retrieve
     * @returns {object} the formatted object
     */
    getLineChartData (props) {
        const data = this.get("unsortedTable")
                .filter((district, i) => !this.get("inactiveColumns").includes(i))
                .map((district) => {
                    let districtDataToGraph = {};

                    for (const prop in district) {
                        if (props.includes(prop)) {
                            districtDataToGraph = {...districtDataToGraph, ..._.object(district[prop])};
                        }
                        else if (prop === this.get("sortKey")) {
                            districtDataToGraph[prop] = district[prop];
                        }
                        else {
                            delete districtDataToGraph[prop];
                        }
                    }

                    return districtDataToGraph;
                }),
            districts = data.map(col => col[this.get("sortKey")]).filter(name => name !== "Gesamt"),
            years = Object.keys(data[0]).filter(key => key !== this.get("sortKey")),
            map = years.map(year => {
                const yearObj = {year: year};

                data.filter(col => col[this.get("sortKey")] !== "Gesamt").forEach(col => {
                    yearObj[col[this.get("sortKey")]] = col[year];
                });

                return yearObj;
            });

        return {data: map, xAttrs: districts};
    },

    /**
     * @description zooms to the feature with the descriptor provided
     * @param {string} district the district descriptor (name or number)
     * @returns {void}
     */
    zoomAndHighlightFeature: function (district) {
        const selector = this.get("sortKey");
        let extent;

        Radio.request("SelectDistrict", "getSelectedDistricts").forEach((feature) => {
            if (feature.getProperties()[selector] === district) {
                extent = feature.getGeometry().getExtent();
            }
        });
        if (extent) {
            Radio.trigger("Map", "zoomToExtent", extent, {padding: [20, 20, 20, 20]});
        }
    },

    /**
     * reorder the table by swapping column positions by index
     * @param {*} index the column to move
     * @param {*} direction 0 or 1 depending on whether to move left (0) or right (1)
     * @returns {void}
     */
    changeTableOrder: function (index, direction) {
        const data = this.get("tableView"),
            rawData = this.get("unsortedTable"),
            i = index - 1 + direction,
            j = index + direction;

        if (index + direction > 0 && index + direction < rawData.length) {
            this.set("tableView", data.map(group => {
                for (const prop in group.values) {
                    const obj = group.values[prop],
                        arr = _.pairs(obj);

                    group.values[prop] = _.object(arr.swap(i, j));
                }

                return group;
            }));

            this.set("unsortedTable", rawData.swap(i, j));

            this.filterTableView();
        }
    },

    /**
     * @description filters the grouped table according to filterDropdownValues and triggers rendering
     * @returns {void}
     */
    filterTableView: function () {
        const filterValues = this.get("filterDropdownModel").getSelectedValues().values,
            filteredTable = filterValues.length > 0 ? this.get("tableView").map(group => {
                if (group.group === "Gebietsinformation") {
                    return group;
                }

                const filteredGroup = {
                    group: group.group,
                    values: {}
                };

                for (const value in group.values) {
                    if (filterValues.includes(value)) {
                        filteredGroup.values[value] = group.values[value];
                    }
                }

                return filteredGroup;
            }).filter(group => Object.keys(group.values).length > 0) : this.get("tableView");

        this.set("filteredTableView", filteredTable);
        this.prepareRendering();
    },

    /**
     * @description updates the filter if the districtSelection changes or a custom dataset was added
     * @returns {void}
     */
    updateFilter: function () {
        this.get("filterDropdownModel").set("values", [
            ...Radio.request("FeaturesLoader", "getAllValuesByScope", Radio.request("SelectDistrict", "getSelector")),
            ...this.get("customFilters")
        ]);
    },

    /**
     * activates/deactivates the dashboardTable
     * @param {boolean} state true/false
     * @returns {void}
     */
    setIsActive: function (state) {
        this.set("isActive", state);
    },

    /**
     * @description adds an attribute to the property "ratioAttrs" at index, 0 = numerator, 1 = denominator
     * @param {string} attr the attribute name
     * @param {*} i the index to add at
     * @returns {void}
     */
    addAttrForRatio (attr, i) {
        this.getAttrsForRatio()[i] = attr;
        this.trigger("ratioValuesUpdated");
    },

    /**
     * @description returns the ratioAttrs
     * @returns {string[]} the array of attributes, length 2
     */
    getAttrsForRatio () {
        return this.get("ratioAttrs");
    },

    /**
     * @description removes the attribute selection
     * @returns {void}
     */
    deleteAttrsForRatio () {
        this.set("ratioAttrs", []);
        this.trigger("ratioValuesUpdated");
    }
});

export default DashboardTableModel;
