<script>
import {BildungsatlasApi} from "../utils/bildungsatlasApi.js";
import Barchart from "../../../../src/share-components/charts/components/Barchart.vue";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import {getChartOptions, getChartOptionsForPercentage} from "../utils/chartOptions.js";
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
    name: "BildungsatlasBalkendiagramm",
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
            featureTypeKey: "",
            propertyName: "",
            title: "",
            table_title: "",
            toConfineNumber: 10,

            statgeb_value: false,
            sozialraum_value: false,
            stadtteil_value: false,
            bezirk_value: false,
            stadt_value: false,

            statgeb_id: "",
            sozialraum_name: "",
            stadtteil_name: "",
            bezirk_name: "",
            stadt_name: "Hamburg",

            barchartData: false,
            barchartDataOptions: {},

            infoMatrix: {
                anzahl_sus_primarstufe: ["anzahl_sus_primarstufe", "gebiet2011", "fallzahlen.anzahl_sus_primarstufe", "hint.anzahl_sus_primarstufe"],
                anzahl_sus_sekundarstufe: ["anzahl_sus_sekundarstufe", "gebiet2011", "fallzahlen.anzahl_sus_sekundarstufe", "hint.anzahl_sus_sekundarstufe"],
                anteil_sus_gymnasien: ["anteil_sus_gymnasien", "gebiet2011", "fallzahlen.anteil_sus_gymnasien", "hint.anzahl_sus_sekundarstufe"],
                anteil_sus_stadtteilschulen: ["anteil_sus_stadtteilschulen", "gebiet2011", "fallzahlen.anteil_sus_stadtteilschulen", "hint.anzahl_sus_sekundarstufe"],
                anteil_sus_sonderschulen: ["anteil_sus_sonderschulen", "gebiet2011", "fallzahlen.anteil_sus_sonderschulen", "hint.anzahl_sus_sekundarstufe", "hint.anteil_sus_sonderschulen"],
                anzahl_u18: ["fallzahlen.anzahl_bev", "gebiet2011"],
                anzahl_u3: ["fallzahlen.anzahl_bev", "gebiet2011"],
                anzahl_3_5: ["fallzahlen.anzahl_bev", "gebiet2011"],
                anzahl_6_9: ["fallzahlen.anzahl_bev", "gebiet2011"],
                anzahl_10_15: ["fallzahlen.anzahl_bev", "gebiet2011"],
                anteil_u18: ["fallzahlen.anteil_bev", "gebiet2011"],
                anteil_u3: ["fallzahlen.anteil_bev", "gebiet2011"],
                anteil_3_5: ["fallzahlen.anteil_bev", "gebiet2011"],
                anteil_6_9: ["fallzahlen.anteil_bev", "gebiet2011"],
                anteil_10_15: ["fallzahlen.anteil_bev", "gebiet2011"],
                migrhintergrund_u18: ["migrhintergrund", "migrhintergrund_1", "migrhintergrund_2", "migrhintergrund_3", "fallzahlen.migrhintergrund", "gebiet2011"],
                migrhintergrund_u3: ["migrhintergrund", "migrhintergrund_1", "migrhintergrund_2", "migrhintergrund_3", "fallzahlen.migrhintergrund", "gebiet2011"],
                migrhintergrund_3_6: ["migrhintergrund", "migrhintergrund_1", "migrhintergrund_2", "migrhintergrund_3", "fallzahlen.migrhintergrund", "gebiet2011"],
                migrhintergrund_6_9: ["migrhintergrund", "migrhintergrund_1", "migrhintergrund_2", "migrhintergrund_3", "fallzahlen.migrhintergrund", "gebiet2011"],
                migrhintergrund_10_15: ["migrhintergrund", "migrhintergrund_1", "migrhintergrund_2", "migrhintergrund_3", "fallzahlen.migrhintergrund", "gebiet2011"],
                nicht_dt_spr_kl1: ["nicht_dt_spr_kl1", "fallzahlen.nicht_dt_spr_kl1"],
                alleinerz_u18: ["alleinerz", "fallzahlen.alleinerz", "gebiet2011"],
                alleinerz_u6: ["alleinerz", "fallzahlen.alleinerz", "gebiet2011"],
                alleinerz_u10: ["alleinerz", "fallzahlen.alleinerz", "gebiet2011"],
                alleinerz_u16: ["alleinerz", "fallzahlen.alleinerz", "gebiet2011"],
                hilfebeduerftige_u15: ["hilfebeduerftige_u15", "fallzahlen.hilfebeduerftige_u15"],
                betr_quote_3_schuleintritt_proz: ["kita.betr_quote_3_schuleintritt_proz", "kita.betreuungsquote.betr_quote_3_schuleintritt_proz", "kita.berechnungsgrundlage.betr_quote_3_schuleintritt_proz", "kita.fallzahlen.betr_quote_3_schuleintritt_proz", "kita.leistungsarten.betr_quote_3_schuleintritt_proz", "kita.gutscheinsystem", "kita.gutscheinsystem_1", "kita.gutscheinsystem_2"],
                betr_quote_4_proz: ["kita.betreuungsquote.betr_quote_4_proz", "kita.berechnungsgrundlage.betr_quote_4_proz", "kita.fallzahlen.betr_quote_4_proz", "kita.leistungsarten.betr_quote_4_proz", "kita.gutscheinsystem", "kita.gutscheinsystem_1", "kita.gutscheinsystem_2"],
                betr_quote_unter3_proz: ["kita.betreuungsquote.betr_quote_unter3_proz", "kita.berechnungsgrundlage.betr_quote_unter3_proz", "kita.fallzahlen.betr_quote_unter3_proz", "kita.leistungsarten.betr_quote_unter3_proz", "kita.gutscheinsystem", "kita.gutscheinsystem_1", "kita.gutscheinsystem_2"],
                betr_quote_2_proz: ["kita.betreuungsquote.betr_quote_2_proz", "kita.berechnungsgrundlage.betr_quote_2_proz", "kita.fallzahlen.betr_quote_2_proz"],
                anteil_3_schuleintritt_fam_proz: ["kita.betreuungsquote.anteil_3_schuleintritt_fam_proz", "kita.anteil_3_schuleintritt_fam_proz", "kita.fallzahlen.anteil_3_schuleintritt_fam_proz"],
                anteil_unter3_fam_proz: ["kita.anteil_unter3_fam_proz", "kita.fallzahlen.anteil_unter3_fam_proz"],
                kinder_vorschulischer_sf: ["kita.kinder_vorschulischer_sf", "kita.fallzahlen.kinder_vorschulischer_sf", "kita.hint.kinder_vorschulischer_sf"],
                hoher_anteil_migrhintergrund_u6: ["kita.hoher_anteil_migrhintergrund_u6", "kita.fallzahlen.hoher_anteil_migrhintergrund_u6", "kita.hint.hoher_anteil_migrhintergrund_u6", "kita.hint.hoher_anteil_migrhintergrund_u6_1", "kita.hint.hoher_anteil_migrhintergrund_u6_2", "kita.hint.hoher_anteil_migrhintergrund_u6_3", "kita.hint.hoher_anteil_migrhintergrund_u6_4", "kita.hint.hoher_anteil_migrhintergrund_u6_5"],
                hoher_anteil_nicht_dt_spr_kl1: ["kita.hoher_anteil_nicht_dt_spr_kl1", "kita.berechnungsgrundlage.hoher_anteil_nicht_dt_spr_kl1", "kita.hint.hoher_anteil_nicht_dt_spr_kl1"],
                anteil_nutzer_bevölkerung_6_9: ["jugendmusikschulen_anteil"],
                anteil_nutzer_bevölkerung_10_15: ["jugendmusikschulen_anteil"],
                anzahl_nutzer_6_9: ["jugendmusikschulen_anzahl"],
                anteil_nutzer_10_15: ["jugendmusikschulen_anzahl"]
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

            this.api.callWhenInitialized(() => {
                const featureTypeKey = this.getFeatureTypeKey(this.stadtteil_name, this.sozialraum_name, this.statgeb_id);

                this.propertyName = this.getPropertyName(this.properties, featureTypeKey);
                if (this.propertyName) {
                    const complexType = this.properties[this.propertyName];

                    if (hasComplexTypeValues(complexType)) {
                        this.barchartData = convertComplexTypeToBarchart(sortComplexType(optimizeComplexTypeValues(complexType, 2)));
                        this.barchartDataOptions = getChartOptions(this.propertyName, this.chartOptions);
                        if (this.barchartDataOptions === false && this.isComplexTypeBasedOnPercentage(complexType)) {
                            this.barchartDataOptions = getChartOptionsForPercentage(this.propertyName, this.chartOptions);
                        }
                        if (this.barchartDataOptions === false) {
                            this.barchartDataOptions = {};
                        }
                    }
                    else {
                        this.barchartData = false;
                        this.barchartDataOptions = {};
                    }

                    this.setValuesBasedOnFeatureTypeKey(featureTypeKey, complexType);
                    this.table_title = this.translate("additional:addons.gfiThemes.bildungsatlas.balkendiagramm.title." + this.propertyName);

                    this.api.getComplexTypeBezirk(this.propertyName, this.properties?.bezirk_id, complexTypeBezirk => {
                        this.bezirk_value = this.convertValueBasedOnComplexType(complexTypeBezirk.values[0]?.value, complexTypeBezirk);
                    }, error => {
                        this.bezirk_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                        console.error(error);
                    });
                    this.api.getComplexTypeStadt(this.propertyName, complexTypeStadt => {
                        this.stadt_value = this.convertValueBasedOnComplexType(complexTypeStadt.values[0]?.value, complexTypeStadt);
                    }, error => {
                        this.stadt_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                        console.error(error);
                    });
                }
                else {
                    this.title = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                    this.table_title = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError");
                }
            });
        },

        /**
         * initializes/resets all values for a clean start/switch of gfi
         * @post the values are reset to default or initial values (like names or the "loading" text)
         * @returns {void}
         */
        initValues () {
            this.propertyName = "";
            this.title = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.table_title = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");

            this.stadtteil_name = this.properties?.stadtteil_name ? this.properties.stadtteil_name : "";
            this.sozialraum_name = this.properties?.sozialraum_name ? this.properties.sozialraum_name : "";
            this.statgeb_id = this.properties?.statgeb_id ? this.properties.statgeb_id : "";
            this.bezirk_name = this.properties?.bezirk_name ? this.properties.bezirk_name : "";

            this.statgeb_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.sozialraum_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.stadtteil_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.bezirk_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            this.stadt_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");

            this.barchartData = false;
        },

        /**
         * converts the given value into a string with thousandsSeparators or % if percent
         * @param {String|Number} value the value to convert
         * @param {ComplexType} complexType the ComplexType with metadata to analyse the unit
         * @returns {String|Boolean} the value as string to show or false if no value was given (use g.F. outside)
         */
        convertValueBasedOnComplexType (value, complexType) {
            if (!value) {
                return false;
            }
            else if (this.isComplexTypeBasedOnPercentage(complexType)) {
                return Math.round(optimizeValueRootedInComplexType(value)) + "%";
            }
            return thousandsSeparator(optimizeValueRootedInComplexType(value));
        },

        /**
         * checks if the given complex type is based on percentages
         * @param {ComplexType} complexType the ComplexType with metadata to analyse the unit
         * @returns {boolean} true if it is based on percentages
         */
        isComplexTypeBasedOnPercentage (complexType) {
            if (!isComplexType(complexType)) {
                return false;
            }
            return complexType.metadata.description.indexOf("%") !== -1;
        },

        /**
         * returns the propertyName of this theme based on the api knowladgebase (make sure the api is fully loaded)
         * @param {Object} properties the properties to look for the current key
         * @param {String} featureTypeKey the key of the featureType - see BildungsatlasApi constants
         * @returns {String} the propertyName of this theme
         */
        getPropertyName (properties, featureTypeKey) {
            if (typeof properties !== "object" || properties === null) {
                return "";
            }
            let result = "";

            Object.keys(properties).forEach(key => {
                if (this.api.hasFeatureType(featureTypeKey, key)) {
                    result = key;
                }
            });
            return result;
        },

        /**
         * helper function to execute api call on "Stadtteil"
         * @param {String|Number} stadtteil_id the id of the "Stadtteil" - could be a piped string e.g. "101 | 102"
         * @param {String[]} [joinedValues=[]] for recursion only in case of piped stadtteil_id
         * @post this.stadtteil_value is either a value or the error translation
         * @returns {void}
         */
        loadValueStadtteil (stadtteil_id, joinedValues = []) {
            const id = String(stadtteil_id),
                reducedIds = id.split("|"),
                currentId = reducedIds.shift().trim();

            if (!currentId) {
                // ready
                if (!joinedValues.length) {
                    this.stadtteil_value = "g.F.";
                    return;
                }
                this.stadtteil_value = joinedValues.join(" | ");
                return;
            }
            else if (!Array.isArray(joinedValues)) {
                // first circle
                this.stadtteil_value = this.translate("additional:addons.gfiThemes.bildungsatlas.general.loading");
            }

            // recursion
            this.api.getComplexTypeStadtteil(this.propertyName, currentId, complexType => {
                const value = isComplexType(complexType) ? complexType.values[0]?.value : false;

                joinedValues.push(value ? this.convertValueBasedOnComplexType(value, complexType) : "g.F.");

                this.loadValueStadtteil(reducedIds.join("|"), joinedValues);
                // preview of already loaded data:
                this.stadtteil_value = joinedValues.join(" | ");
            }, error => {
                // errors should only be applied to the pipe part that has the error
                joinedValues.push(this.translate("additional:addons.gfiThemes.bildungsatlas.general.loadingError"));

                this.loadValueStadtteil(reducedIds.join("|"), joinedValues);
                // preview of already loaded data:
                this.stadtteil_value = joinedValues.join(" | ");
                console.error(error);
            });
        },

        /**
         * returns the featureType key of BildungsatlasApi based on the state of the gfi theme
         * @param {String} stadtteil_name the occurence of stadtteil_name
         * @param {String} sozialraum_name the occurence of sozialraum_name
         * @param {String} statgeb_id the occurence of statgeb_id
         * @returns {String} either BildungsatlasApi KEY_STATGEB or KEY_SOZIALRAUM or anything else KEY_STADTTEIL
         */
        getFeatureTypeKey (stadtteil_name, sozialraum_name, statgeb_id) {
            if (statgeb_id) {
                return BildungsatlasApi.KEY_STATGEB;
            }
            else if (sozialraum_name) {
                return BildungsatlasApi.KEY_SOZIALRAUM;
            }
            return BildungsatlasApi.KEY_STADTTEIL;
        },

        /**
         * sets all values that are dependend on the featureTypeKey (see BildungsatlasApi constants)
         * @param {String} featureTypeKey the key to use (see this.getFeatureTypeKey)
         * @param {ComplexType} complexType the ComplexType with metadata to analyse the unit
         * @post all values that are dependend on the featureTypeKey are loaded
         * @returns {void}
         */
        setValuesBasedOnFeatureTypeKey (featureTypeKey, complexType) {
            switch (featureTypeKey) {
                case BildungsatlasApi.KEY_STATGEB:
                    if (isComplexType(complexType)) {
                        this.statgeb_value = this.convertValueBasedOnComplexType(complexType.values[0].value, complexType);
                    }
                    else {
                        this.statgeb_value = "g.F.";
                    }
                    if (!this.statgeb_value) {
                        this.statgeb_value = "g.F.";
                    }
                    this.loadValueStadtteil(this.properties?.stadtteil_id);
                    this.title = this.stadtteil_name + ": " + this.statgeb_id;
                    break;
                case BildungsatlasApi.KEY_SOZIALRAUM:
                    if (isComplexType(complexType)) {
                        this.sozialraum_value = this.convertValueBasedOnComplexType(complexType.values[0].value, complexType);
                    }
                    else {
                        this.sozialraum_value = "g.F.";
                    }
                    if (!this.sozialraum_value) {
                        this.sozialraum_value = "g.F.";
                    }
                    this.loadValueStadtteil(this.properties?.stadtteil_id);
                    this.title = this.sozialraum_name;
                    break;
                default:
                    // BildungsatlasApi.KEY_STADTTEIL
                    if (isComplexType(complexType)) {
                        this.stadtteil_value = this.convertValueBasedOnComplexType(complexType.values[0].value, complexType);
                    }
                    else {
                        this.stadtteil_value = "g.F.";
                    }
                    if (!this.stadtteil_value) {
                        this.stadtteil_value = "g.F.";
                    }
                    this.title = this.stadtteil_name;
            }
        }
    }
};
</script>

<template>
    <div class="gfi-balkendiagramm">
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
                        <tr v-if="statgeb_id">
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.balkendiagramm.general.statisticalarea") }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ statgeb_value }}
                            </td>
                        </tr>
                        <tr v-if="sozialraum_name">
                            <td>
                                {{ sozialraum_name }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ sozialraum_value }}
                            </td>
                        </tr>
                        <tr v-if="stadtteil_name">
                            <td>
                                {{ stadtteil_name }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ stadtteil_value }}
                            </td>
                        </tr>
                        <tr v-if="bezirk_name">
                            <td>
                                {{ translate("additional:addons.gfiThemes.bildungsatlas.balkendiagramm.general.district") }}
                                {{ bezirk_name }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ bezirk_value }}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {{ stadt_name }}
                            </td>
                            <td class="rba_table_rightcol">
                                {{ stadt_value }}
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
.gfi-balkendiagramm {
    max-width: 420px;
    font-size: 13px;
}
</style>
