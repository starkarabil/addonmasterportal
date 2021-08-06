<script>
import Tool from "../../../src/modules/tools/Tool.vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersSdpDownload";
import mutations from "../store/mutationsSdpDownload";
import actions from "../store/actionsSdpDownload";
import GraphicalSelect from "../../../src/share-components/graphicalSelect/components/GraphicalSelect.vue";

export default {
    name: "SdpDownload",
    components: {
        Tool,
        GraphicalSelect
    },
    data () {
        return {
            options_value: {
                "Box": this.translate("common:snippets.graphicalSelect.selectBySquare"),
                "Circle": this.translate("common:snippets.graphicalSelect.selectByCircle"),
                "Polygon": this.translate("common:snippets.graphicalSelect.selectByPolygon")
            }
        };
    },
    computed: {
        ...mapGetters("Tools/SdpDownload", Object.keys(getters))
    },
    watch: {
        /**
         * Starts the action for processes and adds layers if the tool is activated (active === true)
         * @param {Boolean} value value deciding whether the tool gets activated or deactivated
         * @returns {void}
         */
        active (value) {
            if (value) {
                this.$nextTick(() => {
                    this.toggleRasterLayer();
                    this.loadWfsRaster();
                    this.$refs.graphicalSelection.setStatus(value);
                    this.$refs.graphicalSelection.resetGeographicSelection();
                });
            }
            else {
                this.toggleRasterLayer();
                this.$refs.graphicalSelection.setStatus(value);
                this.$refs.graphicalSelection.resetView();
            }
        },
        /**
         * Sets the graphicalSelection active or not
         * @param {Boolean} value value deciding whether the graphicalSelection gets activated or deactivated
         * @returns {void}
         */
        graphicalSelectStatus (value) {
            this.$refs.graphicalSelection.setStatus(value);
            this.$refs.graphicalSelection.resetView(value);
        }
    },
    /**
     * Initialize the closing of the tool window after created
     * @returns {void}
     */
    created () {
        this.$on("close", this.close);
    },
    /**
     * Put initialize functions here after mounting
     * @returns {void}
     */
    mounted () {
        this.applyTranslationKey(this.name);
    },
    methods: {
        ...mapMutations("Tools/SdpDownload", Object.keys(mutations)),
        ...mapActions("Tools/SdpDownload", Object.keys(actions)),

        /**
         * Translates the given key, checks if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formatting and plurals
         * @returns {String} the translation or the key itself
         */
        translate (key, options = null) {
            if (key === "additional:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the additional translation");
            }
            if (key === "common:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the common translation");
            }
            return this.$t(key, options);
        },

        /**
         * Closes this tool window by setting active to false
         * @returns {void}
         */
        close () {
            this.setActive(false);
            this.$refs.graphicalSelection.setStatus(false);
            this.$refs.graphicalSelection.resetView();

            // TODO replace trigger when Menu is migrated
            // set the backbone model to active false for changing css class in menu (menu/desktop/tool/view.toggleIsActiveClass)
            // else the menu-entry for this tool is always highlighted
            const model = Radio.request("ModelList", "getModelByAttributes", {id: this.$store.state.Tools.SdpDownload.id});

            if (model) {
                model.set("isActive", false);
            }
        }
    }
};
</script>

<template lang="html">
    <Tool
        :title="$t(name)"
        :icon="glyphicon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template #toolBody>
            <div
                v-if="active"
                id="sdp-addon"
                class="header"
            />
            <div class="content">
                <div class="form-group col-xs-12 first">
                    <span>{{ translate(selectFormat) }}</span>
                </div>
                <div class="form-group col-xs-12">
                    <select
                        id="formatSelection"
                        name="formatSelection"
                        class="form-control formatselect"
                        @change="setSelectedFormat($event.target.value)"
                    >
                        <option
                            v-for="(format,index) in formats"
                            :key="index"
                            :value="format.id"
                            data-toggle="tooltip"
                            :title="format.label"
                        >
                            {{ translate(`additional:modules.tools.sdpdownload.${format.fileId}Label`) }}
                        </option>
                    </select>
                </div>
                <div class="form-group col-xs-12 first">
                    <span>{{ translate(howToChooseTiles) }}</span>
                </div>
                <div class="form-group col-xs-12">
                    <div
                        class="form-group form-group-sm"
                    >
                        <GraphicalSelect
                            ref="graphicalSelection"
                        />
                    </div>
                </div>
                <div class="form-group col-md-12 col-xs-12 limiter">
                    <button
                        id="button-selectedDownload"
                        type="button"
                        class="btn btn-default btn-sm btn-block center-block"
                        @click="requestCompressedData"
                    >
                        {{ translate(downloadDataPackage) }}
                    </button>
                </div>
                <div class="form-group col-xs-12">
                    <span>{{ translate(specialDownloads) }}</span>
                </div>
                <div class="form-group col-md-12 col-xs-12">
                    <button
                        id="button-neuwerk"
                        type="button"
                        class="btn btn-default btn-sm btn-block center-block"
                        @click="requestCompressIslandData('Neuwerk')"
                    >
                        {{ translate(neuwerkDataPackage) }}
                    </button>
                </div>
                <div class="form-group col-md-12 col-xs-12">
                    <button
                        id="button-scharhoern"
                        type="button"
                        class="btn btn-default btn-sm btn-block center-block"
                        @click="requestCompressIslandData('Scharhoern')"
                    >
                        {{ $t(scharhoernDataPackage) }}
                    </button>
                </div>
                <div class="form-group col-md-12 col-xs-12">
                    <button
                        id="button-310"
                        type="button"
                        class="btn btn-default btn-sm btn-block center-block"
                        @click="requestCompressRasterOverviewData('LS310')"
                    >
                        {{ translate(tileOverview310) }}
                    </button>
                </div>
                <div class="form-group col-md-12 col-xs-12">
                    <button
                        id="button-320"
                        type="button"
                        class="btn btn-default btn-sm btn-block center-block"
                        @click="requestCompressRasterOverviewData('LS320')"
                    >
                        {{ translate(tileOverview320) }}
                    </button>
                </div>
            </div>
        </template>
    </Tool>
</template>

<style lang="less" scoped>
/*sdp download*/
    .content {
        width: 350px;
        .first{
            padding-top: 5px;
        }
        .form-group {
            >label {
                float: left;
                width: 75%;
            }
        }
    }
    #button-selectedDownload{
        margin-top: 15px;
    }
    .btn {
        white-space:initial;
    }
    .formatselect{
        width: 100%;
        height: 30px;
        margin-right: 15px;
        padding: 5px 5px;
        font-size: 12px;
        cursor: pointer;
    }
    .limiter{
        border-bottom: 1px solid rgb(229,229,229);
        padding-bottom: 20px;
    }
@media (min-width: 768px) {
    .header {
        padding: 5px;
    }
}
</style>

<style lang="less">
@color_1: #fff;
    #circle-overlay {
    position: absolute;
    background: rgba(51, 153, 204, 0.8);
    color: @color_1;
    padding: 4px 8px;
    }
    #tooltip-overlay {
        position: absolute;
        background: rgba(51, 153, 204, 0.8);
        color: @color_1;
        padding: 4px 8px;
    }
</style>
