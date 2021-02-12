<script>
export default {
    name: "ContinuousCountingBikeChart",
    props: {
        properties: {
            type: Object,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    data: () => ({tableVisible: true, chartVisible: true}),
    watch: {
        properties (newVal, oldVal) {
            if (newVal.language && oldVal.language !== newVal.language) {
                this.removeChart();
            }
            this.createD3Document();
        }
    },
    methods: {
        /**
         * Removes the current chart from DOM
         * @returns {void}
         */
        removeChart () {
            const graphEl = document.getElementById("graph-" + this.type),
                graphElChilds = graphEl ? graphEl.children : [];

            if (graphElChilds.length > 1) {
                // remove the graph-svg
                graphElChilds[1].remove();
            }
        },
        /**
         * createD3Document creates an object for the graph model to create the graphic
         * via radio trigger, the graphConfig object is transferred to the graph module
         * @param  {String} activeTab contains the value of the active tab
         * @fires Tools.Graph#event:RadioTriggerGraphCreateGraph
         * @returns {void}
         */
        createD3Document () {
            const dataset = this.properties,
                graphConfig = {
                    graphType: "Linegraph",
                    selector: "#graph-" + this.type,
                    width: 800,
                    height: 250,
                    margin: {top: 20, right: 20, bottom: 50, left: 70},
                    svgClass: "graph-svg",
                    selectorTooltip: "#graph-" + this.type + " .graph-tooltip-div",
                    scaleTypeX: "ordinal",
                    scaleTypeY: "linear",
                    data: dataset.data,
                    xAttr: "timestamp",
                    xAxisTicks: dataset.xAxisTicks,
                    xAxisLabel: {
                        label: dataset.xLabel,
                        translate: 20
                    },
                    yAxisLabel: dataset.yLabel,
                    attrToShowArray: dataset.graphArray,
                    legendData: dataset.legendArray,
                    legendHeight: dataset.legendArray.length * 15
                };

            Radio.trigger("Graph", "createGraph", graphConfig);
        },

        /**
         * If type id "year" append unit calendarweek to val.
         * @param {String} val value of the table cell
         * @returns {String} value to display
         */
        getTimeStampValue (val) {
            if (this.type === "year") {
                return (
                    val +
                    " " +
                    i18next.t(
                        "additional:modules.tools.gfi.themes.continuousCountingBike.cw"
                    )
                );
            }
            return val;
        }
    }
};
</script>

<template>
    <div
        v-if="properties"
        class="tab-pane fade"
    >
        <div>
            <input
                id="chartCheck"
                v-model="chartVisible"
                type="checkbox"
                class="chartCheckbox form-check-input"
            />
            <label
                class="form-check-label"
                for="chartCheck"
            >{{
                $t(
                    "additional:modules.tools.gfi.themes.continuousCountingBike.diagram"
                )
            }}</label>
        </div>
        <div
            :id="`continuousCountingBikeDiagram-${type}`"
            :class="{ hidden: !chartVisible, continuousCountingBikeDiagram: true}"
        >
            <div
                :id="`graph-${type}`"
                class="graph"
            >
                <div class="graph-tooltip-div"></div>
            </div>
        </div>
        <div>
            <input
                id="tableCheck"
                v-model="tableVisible"
                type="checkbox"
                class="tableCheckbox form-check-input"
            />
            <label
                class="form-check-label"
                for="tableCheck"
            >{{
                $t(
                    "additional:modules.tools.gfi.themes.continuousCountingBike.chart"
                )
            }}</label>
        </div>
        <div
            v-if="tableVisible && properties.data"
            class="table-data-container"
        >
            <table class="table table-hover">
                <thead>
                    <th>
                        {{
                            $t(
                                "additional:modules.tools.gfi.themes.continuousCountingBike.name"
                            )
                        }}
                    </th>
                    <th
                        v-for="(day, index) in properties.data"
                        :key="`header-${index}`"
                        class="text-align-center"
                    >
                        {{ getTimeStampValue(day.timestamp) }}
                    </th>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            {{ properties.Name }}
                        </td>
                        <td
                            v-for="(day, index) in properties.data"
                            :key="`data-${index}`"
                            class="data text-align-center"
                        >
                            {{ day.tableData }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="less">
.continuousCountingBike {
    .table-data-container {
        overflow-x: auto;
        border: 1px solid;
        table {
            margin: 0;
            padding: 5px 5px 5px 5px;
            white-space: nowrap;
            td,
            th {
                padding: 6px;
            }
        }
    }
    .text-align-center{
        text-align: center;
    }
    .continuousCountingBikeDiagram {
        .graph {
            padding-bottom: 5px;
            position: relative;
            overflow: auto;
        }
        .line {
            fill: none;
            stroke: steelblue;
            stroke-width: 2px;
        }
        .dot {
            cursor: pointer;
            stroke: none;
            fill: steelblue;
        }
        .dot_visible {
            cursor: pointer;
            stroke: none;
            fill: red;
        }
        .dot_invisible {
            display: none;
        }
        .domain {
            fill: none;
            stroke: #000;
        }
        .graph-tooltip-div {
            transform: translateX(-50%);
            -moz-transform: translateX(-50%);
            -ms-transform: translateX(-50%);
            display: inline-block;
            position: absolute;
            color: black;
            padding: 2px;
            border: 2px solid white;
        }
    }
}
</style>
