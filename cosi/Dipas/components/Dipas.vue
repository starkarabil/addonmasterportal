<script>
import Tool from "../../../../src/modules/tools/Tool.vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersDipas";
import mutations from "../store/mutationsDipas";
import GeoJSON from "ol/format/GeoJSON";
import {Fill, Stroke, Style, Circle, Text} from "ol/style.js";
import {Vector} from "ol/source.js";
import {Heatmap} from "ol/layer.js";
import {getCenter} from "ol/extent.js";
import {Point} from "ol/geom.js";
import {generateColorScale, generateColorScaleByColor} from "../../utils/colorScale";
import {getLayerById} from "../../DistrictSelector/utils/prepareDistrictLevels.js";
import {scaleSequential} from "d3-scale";
import {interpolateRdYlGn} from "d3-scale-chromatic";
import ToolInfo from "../../components/ToolInfo.vue";
import axios from "axios";

export default {
    name: "Dipas",
    components: {
        Tool,
        ToolInfo
    },
    data () {
        return {
            projectsFeatureCollection: [],
            projectsColors: null,
            projectsActive: {},
            contributions: {},
            selectedStyling: null,
            categoryRainbow: false
        };
    },
    computed: {
        ...mapGetters("Tools/Dipas", Object.keys(getters)),
        ...mapGetters("Map", {map: "ol2DMap", layerById: "layerById", projectionCode: "projectionCode"}),
        ...mapGetters("Language", ["currentLocale"]),
        isProjectActive () {
            return (id) => {
                const projectActive = this.projectsActive[id];

                return projectActive.layer || projectActive.contributions || projectActive.heatmap;
            };
        }
    },
    watch: {
        selectedStyling: function () {
            for (const [id, value] of Object.entries(this.contributions)) {
                if (value.features.length > 0) {
                    const model = Radio.request("ModelList", "getModelByAttributes", {id: id + "-contributions"});

                    model.get("layerSource").changed();
                }
            }
        }
    },
    /**
    * @returns {void}
    */
    created () {
        this.$on("close", this.close);
    },
    /**
   * fetches the projects and creates their layer with different color styles
   * @returns {void}
   */
    async mounted () {
        this.applyTranslationKey(this.name);
        const fetch = await this.fetchProjects(),
            features = new GeoJSON().readFeatures(fetch);

        this.selectedStyling = "category";
        this.projectsFeatureCollection = this.transformFeatures(features);
        this.projectsColors = generateColorScale(undefined, "interpolateTurbo", this.projectsFeatureCollection.length).legend.colors;
        for (let i = 0; i < this.projectsFeatureCollection.length; i++) {
            const id = this.projectsFeatureCollection[i].getProperties().id,
                layer = {
                    id: id,
                    name: id,
                    project: true,
                    features: [this.projectsFeatureCollection[i]]
                },
                style = new Style({
                    fill: new Fill({color: this.projectsColors[i].replace("rgb", "rgba").replace(")", ", 0.4)")}),
                    stroke: new Stroke({color: this.projectsColors[i], width: 4})
                }),
                len = Object.values(this.projectsFeatureCollection[i].getProperties().standardCategories).length,
                colorScale = generateColorScaleByColor(this.projectsColors[i], len),
                rainbowColorScale = generateColorScale([0, len + 1], "interpolateRainbow").scale,
                model = await this.addLayer(layer),
                layerOnMap = getLayerById(this.map.getLayers().getArray(), id);

            layerOnMap.setZIndex(0);
            layerOnMap.setStyle(style);
            layerOnMap.setVisible(false);
            model.set("isSelected", false);

            this.$set(this.projectsActive, id, {layer: false, contributions: false, heatmap: false});
            this.$set(this.contributions, id, {index: i, colors: {}, rainbowColors: {}, features: [], loading: false});
            for (const [catIndex, category] of Object.values(this.projectsFeatureCollection[i].getProperties().standardCategories).entries()) {
                this.contributions[id].colors[category] = colorScale(catIndex);
                this.contributions[id].rainbowColors[category] = rainbowColorScale(catIndex);
            }
        }
    },
    methods: {
        ...mapActions("Map", ["createLayer", "zoomTo"]),
        ...mapActions("Tools/Dipas", ["addLayer"]),
        ...mapActions("Tools/FeaturesList", ["addVectorlayerToMapping", "removeVectorLayerFromMapping"]),
        ...mapMutations("Tools/Dipas", Object.keys(mutations)),
        ...mapMutations("Map", ["addLayerToMap"]),

        /**
        * Closes this tool window by setting active to false
        * @returns {void}
        */
        close () {
            this.setActive(false);

            // set the backbone model to active false for changing css class in menu (menu/desktop/tool/view.toggleIsActiveClass)
            // else the menu-entry for this tool is always highlighted
            const model = Radio.request("ModelList", "getModelByAttributes", {
                id: this.$store.state.Tools.Dipas.id
            });

            if (model) {
                model.set("isActive", false);
            }
        },
        /**
         * fetches all projects as a FeatureCollection
         * @returns {Object} the FeatureCollection of all projects in json format
         */
        async fetchProjects () {
            const url = "https://beteiligung.hamburg/dipas/drupal/dipas-pds/projects",
                ret = await axios(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
                        "Content-Type": "application/json"
                    }
                }),
                json = await ret.data;

            if (json.error) {
                throw Error(JSON.stringify(json));
            }
            return json;
        },
        /**
         * fetches the contributions of a given project id
         * @param {String} id the id of a previously fetched project
         * @returns {Object} the FeatureCollection of all contributions for the given project id in json format
         */
        async fetchContributions (id) {
            const url = "https://beteiligung.hamburg/dipas/drupal/dipas-pds/projects/" + id + "/contributions",
                ret = await axios(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
                        "Content-Type": "application/json"
                    }
                }),
                json = await ret.data;

            if (json.error) {
                throw Error(JSON.stringify(json));
            }

            return json;
        },
        /**
         * takes an array of features and passes them to the transformFeature function
         * @param {Array} features an array of features
         * @returns {Array} an array with the transformed features
         */
        transformFeatures (features) {
            features.forEach(feature => this.transformFeature(feature));
            return features;
        },
        /**
         * takes a feature and transforms it to the desired referenceSystem so it can be displayed on the map
         * @param {Object} feature the feature to be transformed
         * @returns {Object} the transformed feature
         */
        transformFeature (feature) {
            const geometry = feature.getGeometry();
            let referenceSystem = feature.getProperties().referenceSystem;

            referenceSystem = referenceSystem === undefined ? "4326" : referenceSystem;
            if (geometry) {
                geometry.transform("EPSG:" + referenceSystem, this.projectionCode);
            }
            return feature;
        },
        /**
         * fetches the contributions for the given project id and transforms those features
         * @param {String} id the id of the project
         * @returns {Array} the transformed features of all contributions
         */
        async getContributionFeatures (id) {
            const fetch = await this.fetchContributions(id),
                features = new GeoJSON().readFeatures(fetch);

            return this.transformFeatures(features);
        },
        /**
         * changes the visibility of the layer for the given project id
         * @param {String} id the project id
         * @param {Boolean} value wether the project layer shall be visible or not
         * @returns {void}
         */
        async changeProjectVisibility (id, value) {
            const model = Radio.request("ModelList", "getModelByAttributes", {id: id});

            model.set("isSelected", value);
        },
        /**
         * changes the visibility of the contributions layer for the given project id
         * @param {String} id the project id
         * @param {Boolean} value wether the contributions layer shall be visible or not
         * @returns {void}
         */
        async changeContributionVisibility (id, value) {
            const layer = {
                    id: id + "-contributions",
                    name: id + " contributions",
                    features: []
                },
                contribution = this.contributions[id];

            let model = Radio.request("ModelList", "getModelByAttributes", {id: layer.id});

            if (!model) {
                if (contribution.features.length === 0) {
                    contribution.loading = true;
                    const contributions = await this.getContributionFeatures(id);

                    for (const feature of contributions) {
                        const geometryType = feature.getGeometry().getType();

                        if (geometryType !== "Point") {
                            const extent = feature.getGeometry().getExtent(),
                                center = getCenter(extent);

                            feature.setGeometry(new Point(center));
                            // needs to be set after resetting the geometry
                            // eslint-disable-next-line one-var
                            const props = feature.getProperties();

                            props.originalGeometryType = geometryType;
                            feature.setProperties(props);
                        }
                    }
                    this.contributions[id].features = contributions;
                    contribution.loading = false;
                }
                for (const feature of contribution.features) {
                    const properties = feature.getProperties();

                    feature.setId(feature.get("id"));

                    for (const property of ["votingPro", "votingContra", "commentsNumber"]) {
                        properties[property] = String(properties[property]);
                    }
                    feature.setProperties(properties);
                }
                layer.features = contribution.features;
                model = await this.addLayer(layer);

                const
                    layerOnMap = getLayerById(this.map.getLayers().getArray(), layer.id),
                    heatmapLayer = getLayerById(this.map.getLayers().getArray(), id + "-heatmap");

                layerOnMap.setZIndex(2);
                layerOnMap.setStyle(this.contributionStyles);
                this.addVectorlayerToMapping(model.attributes);

                if (heatmapLayer) {
                    heatmapLayer.setSource(layerOnMap.getSource());
                }
            }

            model.set("isSelected", value);
        },
        contributionStyles (feature, resolution) {
            const styles = [];

            switch (this.selectedStyling) {
                case "project":
                    styles.push(this.getContributionColorByProject(feature, resolution));
                    break;
                case "category":
                    this.categoryRainbow = false;
                    styles.push(this.getContributionColorByCategory(feature, resolution));
                    break;
                case "categoryRainbow":
                    this.categoryRainbow = true;
                    styles.push(this.getContributionColorByCategory(feature, resolution));
                    break;
                case "voting":
                    styles.push(this.getContributionColorByVoting(feature, resolution));
                    break;
                default:
                    styles.push(null);
                    break;
            }
            if (typeof feature.getProperties().originalGeometryType !== "undefined") {
                const secondary_style = new Style();

                if (resolution < 1.5) {
                    secondary_style.setText(this.getContributionGeometryLabel());
                }
                styles.push(secondary_style);
            }
            return styles;
        },
        /**
         * creates a style for the given feature and resolution
         * @param {ol.Feature} feature the feature to style
         * @param {Number} resolution the current map resolution
         * @returns {void}
         */
        getContributionColorByProject (feature, resolution) {
            const id = feature.getProperties().belongToProject,
                index = this.contributions[id].index,
                color = this.projectsColors[index],
                text = this.getContributionLabel(feature),
                style = new Style({
                    image: new Circle({
                        radius: 5,
                        fill: new Fill({color: color.replace("rgb", "rgba").replace(")", ", 0.4)")}),
                        stroke: new Stroke({color: "#000", width: 1})
                    })
                });

            if (resolution < 1.5) {
                style.setText(text);
            }
            return style;
        },
        /**
         * creates a style for the given feature and resolution
         * @param {ol.Feature} feature the feature to style
         * @param {Number} resolution the current map resolution
         * @returns {void}
         */
        getContributionColorByCategory (feature, resolution) {
            const id = feature.getProperties().belongToProject,
                category = feature.getProperties().category;
            let colors;

            if (this.categoryRainbow) {
                colors = this.contributions[id].rainbowColors;
            }
            else {
                colors = this.contributions[id].colors;
            }

            // eslint-disable-next-line one-var
            const color = colors[category],
                text = this.getContributionLabel(feature),
                style = new Style({
                    image: new Circle({
                        radius: 5,
                        fill: new Fill({color: color}),
                        stroke: new Stroke({color: "#000", width: 1})
                    })
                });

            if (resolution < 1.5) {
                style.setText(text);
            }
            return style;
        },
        /**
         * creates a style for the given feature and resolution
         * @param {ol.Feature} feature the feature to style
         * @param {Number} resolution the current map resolution
         * @returns {void}
         */
        getContributionColorByVoting (feature, resolution) {
            const colorScale = scaleSequential().interpolator(interpolateRdYlGn),
                properties = feature.getProperties(),
                votingPro = parseInt(properties.votingPro, 10),
                votingContra = parseInt(properties.votingContra, 10),
                weight = (votingPro + 1) / ((votingPro + 1) + (votingContra + 1)),
                color = colorScale(weight),
                text = this.getContributionLabel(feature),
                style = new Style({
                    image: new Circle({
                        // radius: Math.sqrt(votingPro + votingContra) + 5,
                        radius: Math.pow(votingPro + votingContra, 2 / 3) + 3,
                        fill: new Fill({color: color}),
                        stroke: new Stroke({color: "#000", width: 1})
                    })
                });

            if (resolution < 1.5) {
                style.setText(text);
            }
            return style;
        },
        /**
         * changes the visibility of the heatmap layer for the given project id
         * @param {String} id the project id
         * @param {Boolean} value wether the heatmap layer shall be visible or not
         * @returns {void}
         */
        async changeHeatmapVisibility (id, value) {
            const
                layerId = id + "-heatmap",
                contributionsModel = Radio.request("ModelList", "getModelByAttributes", {id: id + "-contributions"});
            let
                layer = getLayerById(this.map.getLayers().getArray(), layerId);

            if (!layer) {
                const vector = new Vector();
                let maxVotes = 0;

                if (!this.contributions[id].features) {
                    Radio.trigger("Util", "showLoader");
                    this.contributions[id].features = await this.getContributionFeatures(id);
                    Radio.trigger("Util", "hideLoader");
                }
                for (const feature of this.contributions[id].features) {
                    vector.addFeature(feature);
                }

                maxVotes = Math.max(...this.contributions[id].features.map(
                    f => parseInt(f.get("votingPro"), 10) + parseInt(f.get("votingPro"), 10))
                );
                layer = new Heatmap({
                    source: vector,
                    radius: 40,
                    blur: 20,
                    id: layerId,
                    weight: function (feature) {
                        const votingPro = parseInt(feature.getProperties().votingPro, 10),
                            votingContra = parseInt(feature.getProperties().votingContra, 10),
                            weight = (votingPro + votingContra) / maxVotes;
                            // weight = (votingPro + 1) / ((votingPro + 1) + (votingContra + 1));

                        return weight;
                    }
                });
                layer.setZIndex(1);
                this.map.addLayer(layer);
            }
            if (contributionsModel && layer.getSource() !== contributionsModel.get("layerSource")) {
                layer.setSource(contributionsModel.get("layerSource"));
            }

            layer.setVisible(value);
        },

        getContributionLabel (feature) {
            return new Text({
                font: "16px Calibri,sans-serif",
                fill: new Fill({
                    color: [255, 255, 255]
                }),
                stroke: new Stroke({
                    color: [0, 0, 0],
                    width: 2
                }),
                text: feature.get("id"),
                textAlign: "left",
                offsetY: -8,
                offsetX: 8
            });
        },

        getContributionGeometryLabel () {
            return new Text({
                font: "16px Calibri,sans-serif",
                fill: new Fill({
                    color: [255, 0, 0]
                }),
                stroke: new Stroke({
                    color: [0, 0, 0],
                    width: 2
                }),
                text: "*",
                textAlign: "left",
                offsetY: -8,
                offsetX: -8
            });
        },

        handleColor (id, category) {
            let color;

            if (["project", "voting"].includes(this.selectedStyling)) {
                const index = this.contributions[id].index;

                color = this.projectsColors[index];
            }
            else {
                let colors = this.contributions[id].colors;

                if (this.categoryRainbow) {
                    colors = this.contributions[id].rainbowColors;
                }
                color = colors[category] ? colors[category] : "rgb(0,0,0)";
            }
            return color;
        },

        zoomToProject (feature) {
            const extent = feature.getGeometry().getExtent();

            this.zoomTo({geometryOrExtent: extent, options: {padding: [20, 20, 20, 20]}});
        }
    }
};
</script>

<template lang="html">
    <div id="toolWrap">
        <Tool
            :title="$t('additional:modules.tools.cosi.dipas.title')"
            :icon="glyphicon"
            :active="active"
            :render-to-window="renderToWindow"
            :resizable-window="resizableWindow"
            :deactivate-gfi="deactivateGFI"
        >
            <template #toolBody>
                <v-app class="clamp-600px">
                    <ToolInfo
                        :url="readmeUrl[currentLocale]"
                        :summary="$t('additional:modules.tools.cosi.dipas.summary')"
                    />
                    <div
                        v-if="active"
                        id="dipas"
                    >
                        <v-card
                            class="mx-auto"
                            tile
                        >
                            <v-list>
                                <v-list-group
                                    v-for="(feature, index) in projectsFeatureCollection"
                                    :key="feature.getProperties().id"
                                >
                                    <template #activator>
                                        <v-list-item-content>
                                            <v-list-item-title
                                                class="text-wrap"
                                                v-text="feature.getProperties().nameFull"
                                            />
                                        </v-list-item-content>
                                        <v-list-item-icon>
                                            <v-btn
                                                :color="projectsColors[index]"
                                                small
                                                dark
                                            >
                                                <v-icon
                                                    v-if="isProjectActive(feature.getProperties().id)"
                                                    dark
                                                >
                                                    mdi-checkbox-marked-circle
                                                </v-icon>
                                                <v-icon
                                                    v-else
                                                    dark
                                                >
                                                    mdi-cancel
                                                </v-icon>
                                            </v-btn>
                                        </v-list-item-icon>
                                    </template>
                                    <p
                                        class="description"
                                        v-html="feature.getProperties().description"
                                    />
                                    <v-chip
                                        v-for="category in feature.getProperties().standardCategories"
                                        :key="feature.getProperties().id + category"
                                        class="ma-1 category"
                                        :color="handleColor(feature.getProperties().id, category)"
                                        small
                                    >
                                        {{ category }}
                                    </v-chip>
                                    <v-list-item>
                                        <v-list-item-action>
                                            <v-switch
                                                v-model="projectsActive[feature.getProperties().id]['layer']"
                                                @change="changeProjectVisibility(feature.getProperties().id, $event)"
                                            />
                                        </v-list-item-action>
                                        <v-list-item-content>
                                            <v-list-item-title>{{ $t('additional:modules.tools.cosi.dipas.showProject') }}</v-list-item-title>
                                        </v-list-item-content>
                                        <v-list-item-icon v-if="projectsActive[feature.getProperties().id]['layer']">
                                            <v-icon
                                                :title="$t('additional:modules.tools.cosi.dipas.showProject')"
                                                @click="zoomToProject(feature)"
                                            >
                                                mdi-magnify
                                            </v-icon>
                                        </v-list-item-icon>
                                    </v-list-item>
                                    <v-list-item>
                                        <v-list-item-action>
                                            <v-switch
                                                v-model="projectsActive[feature.getProperties().id]['contributions']"
                                                @change="changeContributionVisibility(feature.getProperties().id, $event)"
                                            />
                                        </v-list-item-action>
                                        <v-list-item-content>
                                            <v-list-item-title>
                                                {{ $t('additional:modules.tools.cosi.dipas.showContributions') }}
                                                <v-btn
                                                    v-if="contributions[feature.getProperties().id].loading"
                                                    plain
                                                    loading
                                                    small
                                                />
                                            </v-list-item-title>
                                        </v-list-item-content>
                                        <v-list-item-icon>
                                            {{ feature.getProperties().hasParticipatoryText.length }} {{ $t('additional:modules.tools.cosi.dipas.contributions') }}
                                        </v-list-item-icon>
                                    </v-list-item>
                                    <v-list-item>
                                        <v-list-item-action>
                                            <v-switch
                                                v-model="projectsActive[feature.getProperties().id]['heatmap']"
                                                @change="changeHeatmapVisibility(feature.getProperties().id, $event)"
                                            />
                                        </v-list-item-action>
                                        <v-list-item-content>
                                            <v-list-item-title>{{ $t('additional:modules.tools.cosi.dipas.showHeatmap') }}</v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>
                                    <v-divider />
                                </v-list-group>
                            </v-list>
                        </v-card>
                    </div>
                    <v-divider />
                    <div id="radio">
                        <div class="mb-1">
                            {{ $t('additional:modules.tools.cosi.dipas.styling.label') }}
                        </div>
                        <label>
                            <input
                                v-model="selectedStyling"
                                type="radio"
                                value="project"
                            > {{ $t('additional:modules.tools.cosi.dipas.styling.byProject') }}
                        </label>
                        <label>
                            <input
                                v-model="selectedStyling"
                                type="radio"
                                value="category"
                            > {{ $t('additional:modules.tools.cosi.dipas.styling.byCategories') }}
                        </label>
                        <label>
                            <input
                                v-model="selectedStyling"
                                type="radio"
                                value="categoryRainbow"
                            > {{ $t('additional:modules.tools.cosi.dipas.styling.byCategoriesRainbow') }}
                        </label>
                        <label>
                            <input
                                v-model="selectedStyling"
                                type="radio"
                                value="voting"
                            > {{ $t('additional:modules.tools.cosi.dipas.styling.byVoting') }}
                        </label>
                    </div>
                </v-app>
            </template>
        </Tool>
    </div>
</template>

<style lang="less" scoped>
#dipas {
  width: auto;
  min-height: 100px;
  max-height: 46vh;
  overflow-y: auto;
}

#radio {
    margin-top: 5px;
}

.feature-item {
    white-space: nowrap;
    overflow-x: auto;
}

.feature-item-content {
    display: inline-block;
    margin-left: 20px;
}

p.description {
    padding: 20px;
    max-height: 40vh;
    overflow-y: auto;
    line-height: 1.5rem;
}

.v-chip.category {
    border: 1px solid rgb(0,0,0) !important;
}
</style>
