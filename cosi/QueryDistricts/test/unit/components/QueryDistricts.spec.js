import Vuex from "vuex";
import {
    config,
    shallowMount,
    createLocalVue
} from "@vue/test-utils";
import QueryDistrictsComponent from "../../../components/QueryDistricts.vue";
import compareFeatures from "../../../components/compareFeatures.js";
import QueryDistricts from "../../../store/index";
import {
    expect
} from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
import Vue from "vue";
import Tool from "../../../../../../src/modules/tools/Tool.vue";
import features_bev from "./features_bev.json";
import features_ha from "./features_ha.json";
import GeoJSON from "ol/format/GeoJSON";

Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;


describe("cosi.QueryDistricts.vue", () => {
    // eslint-disable-next-line no-unused-vars
    let store, sandbox, vuetify, selectedFeaturesStub, keyOfAttrNameStub, keyOfAttrNameStatsStub, getLayerListStub, getSelectedDistrictStub, zoomToStub, layerFeaturesStub, mappingStub;

    const bev_features = new GeoJSON().readFeatures(features_bev),
        ha_features = new GeoJSON().readFeatures(features_ha),

        mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            QueryDistricts: {
                                "name": "translate#additional:modules.tools.vueAddon.title",
                                "glyphicon": "glyphicon-th-list"
                            }
                        }
                    }
                }
            }
        };

    // eslint-disable-next-line require-jsdoc
    function getAllFeaturesByAttribute ({id}) {
        if (id === "19041") {
            return ha_features;
        }
        if (id === "19034") {
            return bev_features;
        }
        return null;
    }

    beforeEach(() => {
        vuetify = new Vuetify();
        sandbox = sinon.createSandbox();
        selectedFeaturesStub = sandbox.stub();
        keyOfAttrNameStub = sandbox.stub();
        keyOfAttrNameStatsStub = sandbox.stub();
        getLayerListStub = sandbox.stub();
        getSelectedDistrictStub = sandbox.stub();
        zoomToStub = sandbox.stub();
        layerFeaturesStub = sandbox.stub();
        mappingStub = sandbox.stub();

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        QueryDistricts,
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                selectedFeatures: selectedFeaturesStub,
                                keyOfAttrName: keyOfAttrNameStub,
                                keyOfAttrNameStats: keyOfAttrNameStatsStub,
                                layer: ()=>({
                                    getSource: () => ({
                                        getFeatures: layerFeaturesStub
                                    })})
                            },
                            mutations: {
                                setSelectedDistrictsCollection: sinon.stub()
                            }
                        },
                        DistrictLoader: {
                            namespaced: true,
                            getters: {
                                mapping: mappingStub,
                                getAllFeaturesByAttribute: ()=>getAllFeaturesByAttribute
                            }
                        }
                    }
                },
                Map: {
                    namespaced: true,
                    actions: {
                        zoomTo: zoomToStub
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.commit("Tools/QueryDistricts/setActive", false);
    });

    afterEach(function () {
        sandbox.restore();
    });

    // eslint-disable-next-line require-jsdoc, no-shadow
    async function mount () {
        const ret = shallowMount(QueryDistrictsComponent, {
            stubs: {Tool},
            store,
            localVue,
            vuetify,
            methods: {
                getLayerList: getLayerListStub,
                getSelectedDistrict: getSelectedDistrictStub
            }
        });

        await ret.vm.$nextTick();
        return ret;
    }
    it("renders inactive", async () => {

        const wrapper = await mount();

        expect(wrapper.find("#queryDistricts").exists()).to.be.false;
    });
    it("renders active", async () => {
        // arrange
        getLayerListStub.returns([{
            id: "15563",
            url: "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Statistische_Gebiete",
            featureType: "de.hh.up:v_hh_statistik_bev_insgesamt"
        }]);
        mappingStub.returns([{
            value: "Bevölkerung insgesamt",
            category: "bev_insgesamt"

        }]);
        keyOfAttrNameStub.returns("key");
        keyOfAttrNameStatsStub.returns("statgebiet");
        selectedFeaturesStub.returns([{
            style_: null,
            getProperties: ()=>({
                key: "name"
            })
        }]);

        const wrapper = await mount();

        // act
        store.commit("Tools/QueryDistricts/setActive", true);
        await wrapper.vm.$nextTick();

        // assert
        expect(wrapper.find("#queryDistricts").exists()).to.be.true;
        expect(wrapper.find("#queryDistricts").html()).to.not.be.empty;
        expect(wrapper.vm.selectedFeatures).to.not.empty;
        // expect(wrapper.vm.districtNames).to.deep.equal(["name"]);
        expect(wrapper.vm.selectedLayer).to.be.null;
        expect(wrapper.vm.layerOptions).to.deep.equal([{"id": "15563", "name": "Bevölkerung insgesamt"}]);
    });
    it("add selected layer", async () => {
        // arrange
        getLayerListStub.returns([{
            id: "19034",
            url: "https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Statistische_Gebiete",
            featureType: "de.hh.up:v_hh_statistik_bev_insgesamt"
        }]);
        mappingStub.returns([{
            value: "Bevölkerung insgesamt",
            category: "bev_insgesamt"

        }]);
        keyOfAttrNameStub.returns("stadtteil_name");
        keyOfAttrNameStatsStub.returns("stadtteil");
        getSelectedDistrictStub.returns("Leeren");
        selectedFeaturesStub.returns([{
            style_: null,
            getProperties: ()=>({
                key: "name"
            })
        }]);
        layerFeaturesStub.returns([{
            getProperties: ()=>({
                "stadtteil_name": "Horn"
            }),
            getGeometry: sinon.stub().returns({
                getExtent: sinon.stub()
            })
        }]);

        const wrapper = await mount();

        store.commit("Tools/QueryDistricts/setActive", true);
        await wrapper.vm.$nextTick();

        // act
        await wrapper.setData({
            selectedLayer: {id: "19034", name: "Bevölkerung insgesamt"}
        });
        await wrapper.find("#add-filter").trigger("click");
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        // assert
        expect(wrapper.vm.selectedLayer).to.be.null;
        expect(wrapper.vm.layerOptions).to.deep.equal([]);
        expect(wrapper.vm.layerFilterModels).to.deep.equal(
            [{"layerId": "19034", "districtInfo": [{"key": "jahr_2019", "max": 92087, "min": 506, "value": 0}], "field": "jahr_2019", "filter": {"jahr_2019": [0, 0]}}]);
        expect(wrapper.vm.resultNames).to.deep.equal([]);

        // act: update filter
        await wrapper.setData({
            layerFilterModels: [{"layerId": "19034", "districtInfo": [{"key": "jahr_2019", "max": 92087, "min": 506, "value": 38373}], "field": "jahr_2019", "filter": {"jahr_2019": ["1000", "1000"]}}]
        });
        await wrapper.vm.$nextTick();

        // assert
        // TODO: wrong districts
        expect(wrapper.vm.resultNames).to.deep.equal(["Horn", "Hamm"]);
        expect(await wrapper.find("#compare-results").text()).to.equal("Vergleichbare Gebiete:  HornHamm");

        // act: click result name
        await wrapper.find("#result-Horn").trigger("click");
        await wrapper.vm.$nextTick();

        // assert
        sinon.assert.callCount(zoomToStub, 1);

        // act: set selected districts
        await wrapper.find("#set-selected-district").trigger("click");
        await wrapper.vm.$nextTick();
    });
    it("compareFeatures on filter", async () => {
        const value = [
                {"layerId": "19041", "filter": {"jahr_2019": ["100", "200"]}, "districtInfo": [{"key": "jahr_2019", "value": 0, "max": 3538, "min": 54}]},
                {"layerId": "19034", "filter": {"jahr_2019": ["1000", "1000"]}, "districtInfo": [{"key": "jahr_2019", "value": 0, "max": 92087, "min": 506}]}
            ],
            self = {
                // TODO
                getAllFeaturesByAttribute,
                selectorField: "verwaltungseinheit",
                getSelectedDistrict: ()=>"Leeren",
                keyOfAttrNameStats: "stadtteil",
                ...compareFeatures
            },
            ret = await self.setComparableFeatures(value);

        // expect(ret).to.deep.equal({
        //     comparableFeatures: ["Reitbrook", "Tatenberg", "Spadenland", "Francop", "Cranz"]
        // });
        expect(ret).to.deep.equal({
            resultNames:
                ["Sternschanze", "Hoheluft-West", "Hoheluft-Ost", "Hohenfelde", "Dulsberg", "Eilbek", "Langenbek", "Cranz", "Hamburg-Altstadt", "St.Georg", "Borgfelde"]
        });
    });
});
