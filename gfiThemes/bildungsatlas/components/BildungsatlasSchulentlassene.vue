<script>
import Barchart from "../../../../src/share-components/charts/components/Barchart.vue";
import Linechart from "../../../../src/share-components/charts/components/Linechart.vue";
import {getChartOptions, getChartOptionsForPercentage} from "../utils/chartOptions.js";
import {
    optimizeComplexTypeValues,
    optimizeValueRootedInComplexType,
    changeMetadata,
    convertComplexTypeToBarchart,
    convertComplexTypesToMultilinechart,
    compareComplexTypesAndFillDataGaps,
    sortComplexTypes,
    sortComplexType,
    isComplexType,
    hasComplexTypeValues
} from "../../../utils/complexType.js";

export default {
    name: "BildungsatlasSchulentlassene",
    components: {
        Barchart,
        Linechart
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
        },

        /**
         * the BildungsatlasApi to access data via wfs with
         */
        api: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            // anteil_sus_abi or anteil_sus_ohneabschluss
            susType: "",
            toConfineNumber: 10,

            stadtteil_name: "",
            sozialraum_name: "",
            bezirk_name: "",
            stadt_name: "Hamburg",

            anteil_sus_abi: "",
            anteil_sus_abi_bezirk: "",
            anteil_sus_abi_stadt: "",
            anteil_sus_msa: "",
            anteil_sus_msa_bezirk: "",
            anteil_sus_msa_stadt: "",
            anteil_sus_esa: "",
            anteil_sus_esa_bezirk: "",
            anteil_sus_esa_stadt: "",
            anteil_sus_ohneabschluss: "",
            anteil_sus_ohneabschluss_bezirk: "",
            anteil_sus_ohneabschluss_stadt: "",

            barchartData: false,
            barchartDataOptions: false,

            linechartData: false,
            linechartDataOptions: false
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
         * refreshes the gfi
         * @returns {void}
         */
        refreshGfi () {
            this.susType = Object.prototype.hasOwnProperty.call(this.properties, "anteil_sus_abi") ? "anteil_sus_abi" : "anteil_sus_ohneabschluss";

            this.stadtteil_name = this.properties?.stadtteil_name ? this.properties.stadtteil_name : "";
            this.sozialraum_name = this.properties?.sozialraum_name ? this.properties.sozialraum_name : "";
            this.bezirk_name = this.properties?.bezirk_name ? this.properties.bezirk_name : "";

            this.refreshGeneralData();

            if (this.susType === "anteil_sus_abi") {
                this.refreshAbiData();
            }
            else {
                this.refreshOsaData();
            }

            this.refreshLinechart();
        },

        /**
         * refreshes the data that is equal for anteil_sub_abi and anteil_sub_ohneabschluss
         * @returns {void}
         */
        refreshGeneralData () {
            if (isComplexType(this.properties?.anteil_sus_msa) && typeof this.properties.anteil_sus_msa.values[0].value !== "undefined") {
                this.anteil_sus_msa = optimizeValueRootedInComplexType(this.properties.anteil_sus_msa.values[0].value, 0) + "%";
            }
            else {
                this.anteil_sus_msa = "g.F.";
            }
            if (isComplexType(this.properties?.anteil_sus_esa) && typeof this.properties.anteil_sus_esa.values[0].value !== "undefined") {
                this.anteil_sus_esa = optimizeValueRootedInComplexType(this.properties.anteil_sus_esa.values[0].value, 0) + "%";
            }
            else {
                this.anteil_sus_esa = "g.F.";
            }

            this.anteil_sus_msa_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueBezirk("anteil_sus_msa", this.properties?.bezirk_id, value => {
                this.anteil_sus_msa_bezirk = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_msa_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });

            this.anteil_sus_esa_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueBezirk("anteil_sus_esa", this.properties?.bezirk_id, value => {
                this.anteil_sus_esa_bezirk = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_esa_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });

            this.anteil_sus_msa_stadt = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueStadt("anteil_sus_msa", value => {
                this.anteil_sus_msa_stadt = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_msa_stadt = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });

            this.anteil_sus_esa_stadt = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueStadt("anteil_sus_esa", value => {
                this.anteil_sus_esa_stadt = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_esa_stadt = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });
        },

        /**
         * refreshes the data anteil_sub_abi only
         * @returns {void}
         */
        refreshAbiData () {
            if (isComplexType(this.properties?.anteil_sus_abi) && typeof this.properties.anteil_sus_abi.values[0].value !== "undefined") {
                this.anteil_sus_abi = optimizeValueRootedInComplexType(this.properties.anteil_sus_abi.values[0].value, 0) + "%";
            }
            else {
                this.anteil_sus_abi = "g.F.";
            }
            if (hasComplexTypeValues(this.properties?.anteil_sus_abi)) {
                this.barchartData = convertComplexTypeToBarchart(sortComplexType(optimizeComplexTypeValues(this.properties.anteil_sus_abi, 2)), null, this.toConfineNumber);
                this.barchartDataOptions = getChartOptions("anteil_sus_abi", this.chartOptions);
                if (this.barchartDataOptions === false) {
                    this.barchartDataOptions = getChartOptionsForPercentage("anteil_sus_abi", this.chartOptions);
                }
                if (this.barchartDataOptions === false) {
                    this.barchartDataOptions = {};
                }
            }
            else {
                this.barchartData = false;
                this.barchartDataOptions = {};
            }

            this.anteil_sus_abi_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueBezirk("anteil_sus_abi", this.properties?.bezirk_id, value => {
                this.anteil_sus_abi_bezirk = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_abi_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });

            this.anteil_sus_abi_stadt = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueStadt("anteil_sus_abi", value => {
                this.anteil_sus_abi_stadt = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_abi_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });
        },

        /**
         * refreshes the data anteil_sub_ohneabschluss only
         * @returns {void}
         */
        refreshOsaData () {
            if (isComplexType(this.properties?.anteil_sus_ohneabschluss) && typeof this.properties.anteil_sus_ohneabschluss.values[0].value !== "undefined") {
                this.anteil_sus_ohneabschluss = optimizeValueRootedInComplexType(this.properties.anteil_sus_ohneabschluss.values[0].value, 0) + "%";
            }
            else {
                this.anteil_sus_ohneabschluss = "g.F.";
            }
            if (hasComplexTypeValues(this.properties?.anteil_sus_ohneabschluss)) {
                this.barchartData = convertComplexTypeToBarchart(sortComplexType(optimizeComplexTypeValues(this.properties.anteil_sus_ohneabschluss, 2)), null, this.toConfineNumber);
                this.barchartDataOptions = getChartOptions("anteil_sus_ohneabschluss", this.chartOptions);
                if (this.barchartDataOptions === false) {
                    this.barchartDataOptions = getChartOptionsForPercentage("anteil_sus_ohneabschluss", this.chartOptions);
                }
            }
            else {
                this.barchartData = false;
                this.barchartDataOptions = {};
            }

            this.anteil_sus_ohneabschluss_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueBezirk("anteil_sus_ohneabschluss", this.properties?.bezirk_id, value => {
                this.anteil_sus_ohneabschluss_bezirk = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_ohneabschluss_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });

            this.anteil_sus_ohneabschluss_stadt = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.api.getValueStadt("anteil_sus_ohneabschluss", value => {
                this.anteil_sus_ohneabschluss_stadt = optimizeValueRootedInComplexType(value, 0) + "%";
            }, error => {
                this.anteil_sus_ohneabschluss_bezirk = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                console.error(error);
            });
        },

        /**
         * a callback for the api to simplify the code of refreshLinechart
         * @param {String} propertyName the name of the property
         * @param {Function} onsuccess the callback on success
         * @param {Function} onerror the callback on error
         * @returns {void}
         */
        callApiForLinechart (propertyName, onsuccess, onerror) {
            if (this.stadtteil_name) {
                this.api.getComplexTypeStadtteil(propertyName, this.properties?.stadtteil_id, onsuccess, onerror);
            }
            else {
                this.api.getComplexTypeSozialraum(propertyName, this.properties?.sozialraum_id, onsuccess, onerror);
            }
        },

        /**
         * refreshes the multilinechart
         * @returns {void}
         */
        refreshLinechart () {
            this.linechartDataOptions = Object.assign({
                aspectRatio: 1
            }, getChartOptions("anzahl_abschluss_bezug_gesamt", this.chartOptions));

            this.callApiForLinechart("anzahl_abschluss_bezug_abi", complexTypeABI => {
                this.callApiForLinechart("anzahl_abschluss_bezug_msa", complexTypeMSA => {
                    this.callApiForLinechart("anzahl_abschluss_bezug_esa", complexTypeESA => {
                        this.callApiForLinechart("anzahl_abschluss_bezug_osa", complexTypeOSA => {
                            this.callApiForLinechart("anzahl_abschluss_bezug_gesamt", complexTypeGesamt => {
                                if (
                                    hasComplexTypeValues(complexTypeABI)
                                    || hasComplexTypeValues(complexTypeMSA)
                                    || hasComplexTypeValues(complexTypeESA)
                                    || hasComplexTypeValues(complexTypeOSA)
                                    || hasComplexTypeValues(complexTypeGesamt)
                                ) {
                                    changeMetadata(complexTypeABI, "description", this.translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.linechart.labelABI"));
                                    changeMetadata(complexTypeMSA, "description", this.translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.linechart.labelMSA"));
                                    changeMetadata(complexTypeESA, "description", this.translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.linechart.labelESA"));
                                    changeMetadata(complexTypeOSA, "description", this.translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.linechart.labelOSA"));
                                    changeMetadata(complexTypeGesamt, "description", this.translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.linechart.labelGesamt"));

                                    this.linechartData = convertComplexTypesToMultilinechart(
                                        sortComplexTypes(
                                            compareComplexTypesAndFillDataGaps([
                                                optimizeComplexTypeValues(complexTypeABI, 2),
                                                optimizeComplexTypeValues(complexTypeMSA, 2),
                                                optimizeComplexTypeValues(complexTypeESA, 2),
                                                optimizeComplexTypeValues(complexTypeOSA, 2),
                                                optimizeComplexTypeValues(complexTypeGesamt, 2)
                                            ])
                                        ),
                                        null,
                                        false,
                                        this.toConfineNumber
                                    );
                                }
                                else {
                                    this.linechartData = false;
                                }
                            }, error => {
                                console.error(error);
                            });
                        }, error => {
                            console.error(error);
                        });
                    }, error => {
                        console.error(error);
                    });
                }, error => {
                    console.error(error);
                });
            }, error => {
                console.error(error);
            });
        }
    }
};
</script>

<template>
    <div class="gfi-schulentlassene">
        <div
            class="tab-panel gfi-data"
            :class="{ 'hidden': !isActiveTab('data') }"
        >
            <div class="rba_header">
                <div
                    v-if="susType"
                    class="rba_header_title"
                >
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.title." + susType) }}
                </div>
            </div>
            <div
                v-if="susType === 'anteil_sus_abi'"
                class="rba_table"
            >
                <table class="table table-striped">
                    <thead>
                        <tr colspan="4">
                            <th />
                            <th>Abi/FH</th>
                            <th>MSA</th>
                            <th>ESA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr colspan="4">
                            <td v-if="stadtteil_name">
                                {{ stadtteil_name }}
                            </td>
                            <td v-else>
                                {{ sozialraum_name }}
                            </td>
                            <td>{{ anteil_sus_abi }}</td>
                            <td>{{ anteil_sus_msa }}</td>
                            <td>{{ anteil_sus_esa }}</td>
                        </tr>
                        <tr colspan="4">
                            <td v-if="stadtteil_name">
                                {{ bezirk_name }}
                            </td>
                            <td v-else>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.general.district") }}
                                {{ bezirk_name }}
                            </td>
                            <td>{{ anteil_sus_abi_bezirk }}</td>
                            <td>{{ anteil_sus_msa_bezirk }}</td>
                            <td>{{ anteil_sus_esa_bezirk }}</td>
                        </tr>
                        <tr colspan="4">
                            <td>{{ stadt_name }}</td>
                            <td>{{ anteil_sus_abi_stadt }}</td>
                            <td>{{ anteil_sus_msa_stadt }}</td>
                            <td>{{ anteil_sus_esa_stadt }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div
                v-else-if="susType === 'anteil_sus_ohneabschluss'"
                class="rba_table"
            >
                <table class="table table-striped">
                    <thead>
                        <tr colspan="4">
                            <th />
                            <th>oSA</th>
                            <th>ESA</th>
                            <th>MSA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr colspan="4">
                            <td v-if="stadtteil_name">
                                {{ stadtteil_name }}
                            </td>
                            <td v-else>
                                {{ sozialraum_name }}
                            </td>
                            <td>{{ anteil_sus_ohneabschluss }}</td>
                            <td>{{ anteil_sus_esa }}</td>
                            <td>{{ anteil_sus_msa }}</td>
                        </tr>
                        <tr colspan="4">
                            <td v-if="stadtteil_name">
                                {{ bezirk_name }}
                            </td>
                            <td v-else>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.general.district") }}
                                {{ bezirk_name }}
                            </td>
                            <td>{{ anteil_sus_ohneabschluss_bezirk }}</td>
                            <td>{{ anteil_sus_esa_bezirk }}</td>
                            <td>{{ anteil_sus_msa_bezirk }}</td>
                        </tr>
                        <tr colspan="4">
                            <td>{{ stadt_name }}</td>
                            <td>{{ anteil_sus_ohneabschluss_stadt }}</td>
                            <td>{{ anteil_sus_esa_stadt }}</td>
                            <td>{{ anteil_sus_msa_stadt }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="rba_chart">
                <div
                    v-if="susType"
                    class="rba_chart_title"
                >
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.barchart.title." + susType) }}
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
            <div class="rba_chart">
                <div class="rba_chart_title">
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.linechart.title") }}
                </div>
                <div
                    v-if="linechartData"
                    class="rba_chart_content"
                >
                    <Linechart
                        v-if="linechartData"
                        :given-options="linechartDataOptions"
                        :data="linechartData"
                    />
                </div>
                <div v-else>
                    g.F.
                </div>
            </div>
            <div class="rba_footer">
                <p>
                    {{ $t("additional:addons.gfiThemes.bildungsatlas.general.disclaimer") }}
                </p>
            </div>
        </div>
        <div
            class="tab-panel gfi-info"
            :class="{ 'hidden': !isActiveTab('info') }"
        >
            <div v-if="susType === 'anteil_sus_abi'">
                <h5>
                    <b>{{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.titleAbi") }}</b>
                </h5>
                <p>
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.textAbi") }}
                </p>
            </div>
            <div v-else>
                <h5>
                    <b>{{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.titleOsa") }}</b>
                </h5>
                <p>
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.textOsa") }}
                </p>
            </div>
            <div>
                <h5>
                    <b>{{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.titleA") }}</b>
                </h5>
                <p>
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.textA") }}
                </p>
                <h5>
                    <b>{{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.titleB") }}</b>
                </h5>
                <p>
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.textB") }}
                </p>
                <br>
                <p>
                    {{ translate("additional:addons.gfiThemes.bildungsatlas.schulentlassene.info.footer") }}
                </p>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.gfi-schulentlassene {
    max-width: 420px;
    font-size: 13px;
}
</style>
