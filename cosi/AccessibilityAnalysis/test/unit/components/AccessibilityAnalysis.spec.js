import Vuex from "vuex";
import {
    config,
    shallowMount,
    createLocalVue
} from "@vue/test-utils";
import AccessibilityAnalysisComponent from "../../../components/AccessibilityAnalysis.vue";
import AccessibilityAnalysis from "../../../store/index";
import {
    expect
} from "chai";
import sinon from "sinon";
import data from "./isochronesPoint.json";
import features from "./featuresPoint.json";
import featuresRegion from "./featuresRegion.json";
import {
    registerProjections
} from "./util.js";
import GeoJSON from "ol/format/GeoJSON";
import Vuetify from "vuetify";
import Vue from "vue";
import Tool from "../../../../../../src/modules/tools/Tool.vue";

Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

before(() => {
    registerProjections();
});

describe("AccessibilityAnalysis.vue", () => {
    // eslint-disable-next-line no-unused-vars
    let store, sandbox, sourceStub, addSingleAlertStub, cleanupStub, vuetify,

        coordiantes = [0, 0];

    const mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            AccessibilityAnalysis: {
                                "name": "translate#additional:modules.tools.vueAddon.title",
                                "glyphicon": "glyphicon-th-list"
                            }
                        }
                    }
                }
            }
        },

        layersMock = [{
            get: (id) => {
                if (id === "name") {
                    return "LayerName";
                }
                if (id === "id") {
                    return "LayerId";
                }
                if (id === "layer") {
                    return {
                        getSource: () => ({
                            getFeatures: sinon.stub().returns([{
                                style_: null,
                                getProperties: sinon.stub().returns({
                                    id: "label"
                                }),
                                getGeometry: sinon.stub().returns({
                                    getType: () => "Point",
                                    getCoordinates: () => [...coordiantes]
                                })
                            }])
                        })
                    };
                }
                return null;
            }
        }];

    beforeEach(() => {
        vuetify = new Vuetify();
        sandbox = sinon.createSandbox();
        sourceStub = {
            clear: sinon.stub(),
            addFeatures: sinon.stub(),
            getFeatures: sinon.stub().returns([
                []
            ])
        };
        addSingleAlertStub = sinon.stub();
        cleanupStub = sinon.stub();

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        AccessibilityAnalysis,
                        FeaturesList: {
                            namespaced: true,
                            getters: {
                                isFeatureDisabled: () => sinon.stub()
                            }
                        }
                    }
                },
                Map: {
                    namespaced: true,
                    getters: {
                        map: () => ({
                            addEventListener: () => sinon.stub(),
                            removeEventListener: () => sinon.stub()
                        })
                    },
                    actions: {
                        createLayer: () => {
                            return Promise.resolve({
                                setVisible: sinon.stub(),
                                addEventListener: sinon.stub(),
                                getSource: () => sourceStub
                            });
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: addSingleAlertStub,
                        cleanup: cleanupStub
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.commit("Tools/AccessibilityAnalysis/setActive", true);
    });

    afterEach(function () {
        sandbox.restore();
    });

    // eslint-disable-next-line require-jsdoc, no-shadow
    async function mount (layersMock, error = undefined) {
        sandbox.stub(Radio, "request").callsFake((a1, a2) => {
            if (a1 === "Parser" && a2 === "getItemsByAttributes") {
                return [];
            }
            if (a1 === "ModelList" && a2 === "getModelsByAttributes") {
                return layersMock;
            }
            if (a1 === "ModelList" && a2 === "getModelByAttributes") {
                return layersMock[0];
            }
            return null;
        });
        const ret = shallowMount(AccessibilityAnalysisComponent, {
            stubs: {Tool},
            store,
            localVue,
            vuetify,
            methods: {
                requestIsochrones: () => {
                    if (error) {
                        return Promise.reject(error);
                    }
                    return new Promise(function (resolve) {
                        resolve(JSON.stringify(data));
                    });
                },
                createAbortController: () => ({abort: sinon.stub})
            }
        });

        await ret.vm.$nextTick();
        return ret;
    }

    it("renders Component", async () => {
        const wrapper = await mount();

        expect(wrapper.find("#accessibilityanalysis").exists()).to.be.true;
        expect(wrapper.find("#accessibilityanalysis").html()).to.not.be.empty;
    });

    it("trigger button without user input", async () => {
        const wrapper = await mount();

        await wrapper.find("#create-isochrones").trigger("click");
        await wrapper.vm.$nextTick();
        sinon.assert.callCount(addSingleAlertStub, 1);
        expect(addSingleAlertStub.firstCall.args[1]).to.eql(
            {
                content: "<strong>additional:modules.tools.cosi.accessibilityAnalysis.inputReminder</strong>",
                category: "Info",
                displayClass: "info"
            });
    });

    it("trigger button with wrong input", async () => {
        const wrapper = await mount(undefined, {response: JSON.stringify({error: {code: 3002}})});

        await wrapper.setData({
            coordinate: "10.155828082155567, 53.60323024735499",
            transportType: "Auto",
            scaleUnit: "time",
            distance: 10
        });

        await wrapper.find("#create-isochrones").trigger("click");
        await wrapper.vm.$nextTick();
        sinon.assert.callCount(addSingleAlertStub, 1);
        expect(addSingleAlertStub.firstCall.args[1]).to.eql(
            {
                content: "<strong>additional:modules.tools.cosi.accessibilityAnalysis.showErrorInvalidInput</strong>",
                category: "Error",
                displayClass: "error"
            });
    });

    it("trigger button with user input and point selected", async () => {
        const wrapper = await mount([]);

        await wrapper.setData({
            coordinate: "10.155828082155567, 53.60323024735499",
            transportType: "Auto",
            scaleUnit: "time",
            distance: 10
        });

        await wrapper.find("#create-isochrones").trigger("click");
        await wrapper.vm.$nextTick();

        sinon.assert.callCount(sourceStub.addFeatures, 1);
        expect(new GeoJSON().writeFeatures(sourceStub.addFeatures.getCall(0).args[0])).to.equal(
            JSON.stringify(features));

        expect(wrapper.find("#legend").text().replace(/\s/g, "")).to.equal("3.306.7010");

        await wrapper.find("#clear").trigger("click");
        sinon.assert.callCount(sourceStub.clear, 2);
        expect(wrapper.find("#legend").text().replace(/\s/g, "")).to.equal("000");

        expect(wrapper.vm.askUpdate).to.be.false;
        wrapper.vm.$root.$emit("updateFeature");
        expect(wrapper.vm.askUpdate).to.be.false;
    });

    it("trigger button with user input and region selected", async () => {
        const wrapper = await mount(layersMock);

        await wrapper.setData({
            mode: "region",
            transportType: "Auto",
            scaleUnit: "time",
            distance: 10,
            selectedFacilityName: "familyName"
        });

        await wrapper.find("#create-isochrones").trigger("click");
        await wrapper.vm.$nextTick();

        sinon.assert.callCount(sourceStub.addFeatures, 1);
        expect(new GeoJSON().writeFeatures(sourceStub.addFeatures.getCall(0).args[0])).to.equal(
            JSON.stringify(featuresRegion));

        expect(wrapper.find("#legend").text().replace(/\s/g, "")).to.equal("3.306.7010");
        expect(wrapper.vm.currentCoordinates).not.to.be.empty;

        // check no update on equal coordinates
        expect(wrapper.vm.askUpdate).to.be.false;
        wrapper.vm.$root.$emit("updateFeature");
        expect(wrapper.vm.askUpdate).to.be.false;

        coordiantes = [1, 1];
        wrapper.vm.$root.$emit("updateFeature");
        expect(wrapper.vm.askUpdate).to.be.true;

        await wrapper.find("#create-isochrones").trigger("click");
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.askUpdate).to.be.false;
    });

    it("show help for selectedmode", async () => {
        const wrapper = await mount([]);

        await wrapper.find("#help").trigger("click");

        sinon.assert.callCount(cleanupStub, 1);
        sinon.assert.callCount(addSingleAlertStub, 1);
        expect(addSingleAlertStub.firstCall.args[1].content).to.contain("Erreichbarkeit ab einem Referenzpunkt");

        await wrapper.setData({
            mode: "region"
        });

        await wrapper.find("#help").trigger("click");
        expect(addSingleAlertStub.secondCall.args[1].content).to.contain("Erreichbarkeit im Gebiet");
    });

});