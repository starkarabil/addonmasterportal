<script>
import Barchart from "../../../../src/share-components/charts/components/Barchart.vue";
import {getChartOptionsForPercentage} from "../utils/chartOptions.js";
import {
    optimizeComplexTypeValues,
    optimizeValueRootedInComplexType,
    convertComplexTypeToBarchart,
    sortComplexType,
    isComplexType,
    hasComplexTypeValues
} from "../../../utils/complexType.js";

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

export default {
    name: "BildungsatlasVorschulischeSF",
    components: {
        Barchart
    },
    props: {
        /**
         * checks if the given tab name is currently active
         * @param {String} tab the tab name
         * @returns {Boolean}  true if the given tab name is active
         */
        isActiveTab: {
            type: Function,
            required: true
        },

        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate: {
            type: Function,
            required: true
        },

        /**
         * the properties as a key value object
         */
        properties: {
            type: Object,
            required: true
        },

        /**
         * the chartOptions as configured in config.json
         */
        chartOptions: {
            type: [Object, Boolean],
            required: true
        }
    },
    data () {
        return {
            propertyName: "kinder_vorschulischer_sf",
            toConfineNumber: 10,

            title: "",
            table_title: "",

            stadtteil_value: false,
            stadtteil_name: "",

            barchartData: false,
            barchartDataOptions: {},

            infoMatrix: {
                kinder_vorschulischer_sf: ["kita.kinder_vorschulischer_sf", "kita.fallzahlen.kinder_vorschulischer_sf", "kita.hint.kinder_vorschulischer_sf"]
            }
        };
    },
    watch: {
        // when the gfi window is switched, the gfi is refreshed
        properties: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.refreshGfi();
                }
            },
            immediate: true
        }
    },
    mounted () {
        this.refreshGfi();
    },
    methods: {
        /**
         * checks if the given translation key exists
         * @param {String} key the translation key to check
         * @returns {boolean} true if it exists, false if not
         */
        translationExists (key) {
            return !(key === "additional:" + this.$t(key));
        },

        /**
         * refreshes the gfi
         * @returns {void}
         */
        refreshGfi () {
            this.initValues();

            const complexType = this.properties[this.propertyName];

            if (hasComplexTypeValues(complexType)) {
                this.barchartData = convertComplexTypeToBarchart(sortComplexType(optimizeComplexTypeValues(complexType, 2)), null, this.toConfineNumber);
                this.barchartDataOptions = getChartOptionsForPercentage(this.propertyName, this.chartOptions);
                if (this.barchartDataOptions === false) {
                    this.barchartDataOptions = {};
                }
            }
            else {
                this.barchartData = false;
                this.barchartDataOptions = {};
            }

            if (isComplexType(complexType)) {
                this.stadtteil_value = Math.round(optimizeValueRootedInComplexType(complexType.values[0].value)) + "%";
            }
            if (!this.stadtteil_value) {
                this.stadtteil_value = "g.F.";
            }
            this.title = this.stadtteil_name;
            this.table_title = this.translate("additional:addons.gfiThemes.bildungsatlas.balkendiagramm.title." + this.propertyName);
        },

        /**
         * initializes/resets all values for a clean start/switch of gfi
         * @post the values are reset to default or initial values (like names or the "loading" text)
         * @returns {void}
         */
        initValues () {
            this.title = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.table_title = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");

            this.stadtteil_name = this.properties?.stadtteil_name ? this.properties.stadtteil_name : "";
            this.statgeb_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");

            this.barchartData = false;
        }
    }
};
</script>

<template>
    <div class="gfi-balkendiagramm-vorschulische-sf">
        <div
            class="tab-panel gfi-data"
            :class="{ 'hidden': !isActiveTab('data') }"
        >
            <div class="rba_header">
                <div class="rba_header_title">
                    {{ title }}
                </div>
            </div>
            <div class="rba_table">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th colspan="2">
                                {{ table_title }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="stadtteil_name">
                            <td>
                                {{ stadtteil_name }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ stadtteil_value }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="rba_chart">
                <div
                    class="rba_chart_title"
                >
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.balkendiagramm.barchart.title") }}
                </div>
                <div
                    v-if="barchartData"
                    class="rba_chart_content"
                >
                    <Barchart
                        v-if="barchartData"
                        :given-options="barchartDataOptions"
                        :data="barchartData"
                    />
                </div>
                <div v-else>
                    g.F.
                </div>
            </div>
            <div
                v-if="translationExists('additional:addons.gfiThemes.bildungsatlas.balkendiagramm.hint.' + propertyName)"
                class="rba_footer"
            >
                <p>
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.balkendiagramm.hint." + propertyName) }}
                </p>
            </div>
            <div class="rba_footer">
                <p>
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.general.disclaimer") }}
                </p>
            </div>
        </div>
        <div
            class="tab-panel gfi-info"
            :class="{ 'hidden': !isActiveTab('info') }"
        >
            <div v-if="infoMatrix.hasOwnProperty(propertyName) && Array.isArray(infoMatrix[propertyName])">
                <div
                    v-for="(lngkey, idx) in infoMatrix[propertyName]"
                    :key="idx"
                    :value="lngkey"
                >
                    <h5 v-if="translationExists('additional:addons.gfiThemes.bildungsatlas.balkendiagramm.info.' + lngkey + '.title')">
                        <b>{{ $t('additional:addons.gfiThemes.bildungsatlas.balkendiagramm.info.' + lngkey + '.title') }}</b>
                    </h5>
                    <p v-if="translationExists('additional:addons.gfiThemes.bildungsatlas.balkendiagramm.info.' + lngkey + '.text')">
                        {{ $t('additional:addons.gfiThemes.bildungsatlas.balkendiagramm.info.' + lngkey + '.text') }}
                    </p>
                    <ul v-if="translationExists('additional:addons.gfiThemes.bildungsatlas.balkendiagramm.info.' + lngkey + '.list')">
                        <li>{{ $t('additional:addons.gfiThemes.bildungsatlas.balkendiagramm.info.' + lngkey + '.list') }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.gfi-balkendiagramm-vorschulische-sf {
    max-width: 420px;
    font-size: 13px;
}
</style>
