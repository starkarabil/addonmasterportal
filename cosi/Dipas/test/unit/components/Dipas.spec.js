import Vuex from "vuex";
import {
    config,
    shallowMount,
    createLocalVue
} from "@vue/test-utils";
import {
    expect
} from "chai";
import Vuetify from "vuetify";
import Vue from "vue";
import sinon from "sinon";
import DipasComponent from "../../../components/Dipas.vue";
import Dipas from "../../../store/index";
import Tool from "../../../../../../src/modules/tools/Tool.vue";


Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

after(() => {
    global.fetch = undefined;
});



describe("Dipas.vue", () => {
    let component, store, clearStub, sandbox, sourceStub, addSingleAlertStub, cleanupStub, vuetify, progressStub, createIsochronesStub;

    const mockConfigJson = {
        Portalconfig: {
            menu: {
                tools: {
                    children: {
                        Dipas: {
                            "name": "translate#additional:modules.tools.vueAddon.title",
                            "glyphicon": "glyphicon-th-list"
                        }
                    }
                }
            }
        }
    },
        modelMock = {
            set: (model) => sinon.stub()
    };

    beforeEach(() => {
        vuetify = new Vuetify();
        sandbox = sinon.createSandbox();
        clearStub = sinon.stub();
        sourceStub = {
            clear: clearStub,
            addFeatures: sinon.stub(),
            getFeatures: sinon.stub().returns([
                []
            ])
        };
        addSingleAlertStub = sinon.stub();
        cleanupStub = sinon.stub();
        progressStub = sinon.stub();

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        Dipas,
                        FeaturesList: {
                            namespaced: true,
                            getters: {
                                isFeatureDisabled: () => sinon.stub(),
                                isFeatureActive: () => sinon.stub()
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
                        }),
                        projectionCode: () => "EPSG:25832"
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
        store.commit("Tools/Dipas/setActive", true);
    });

    afterEach(function () {
        component.destroy();
        sandbox.restore();
    });

    // eslint-disable-next-line require-jsdoc, no-shadow
    async function mount (error = undefined) {
        sandbox.stub(Radio, "request").callsFake((a1, a2) => {
            if (a1 === "ModelList" && a2 === "getModelByAttributes") {
                return modelMock;
            }
            return null;
        });
        component = shallowMount(DipasComponent, {
            stubs: {Tool},
            store,
            localVue,
            vuetify
        });

        await component.vm.$nextTick();
        return component;
    }

    it("renders Component", async () => {
        const wrapper = await mount();

        expect(wrapper.find("#dipas").exists()).to.be.true;
        expect(wrapper.find("#dipas").html()).to.not.be.empty;
    });

    it("fetchProjects", async function () {
        this.timeout(15000);
        const wrapper = await mount();

        const ret = await wrapper.vm.fetchProjects();
        expect(ret.features).to.not.be.empty;
    });

    it("getContributionLabel", async function () {
        const wrapper = await mount(),
            feature = {'id': 'test'},
            label = wrapper.vm.getContributionLabel(feature);
        
        console.log(label);

    })

    it("transformFeatures", async function () {
        const features = [
            {
                "disposed": false,
                "pendingRemovals_": {},
                "dispatching_": {},
                "listeners_": {
                    "change:geometry": [
                        null
                    ],
                    "change": [
                        null
                    ],
                    "propertychange": [
                        null
                    ]
                },
                "revision_": 2,
                "ol_uid": "159",
                "values_": {
                    "geometry": {
                        "disposed": false,
                        "pendingRemovals_": {},
                        "dispatching_": {},
                        "listeners_": {
                            "change": [
                                null
                            ]
                        },
                        "revision_": 2,
                        "ol_uid": "158",
                        "values_": null,
                        "extent_": [
                            553702.1683456366,
                            5921373.522546296,
                            567164.1626506767,
                            5927213.493638324
                        ],
                        "extentRevision_": 2,
                        "simplifiedGeometryMaxMinSquaredTolerance": 0,
                        "simplifiedGeometryRevision": 0,
                        "layout": "XY",
                        "stride": 2,
                        "flatCoordinates": [
                            553702.1683456366,
                            5925331.686510341,
                            556697.2507479526,
                            5921987.35538667,
                            558073.0829346156,
                            5921553.439277295,
                            561449.1647678417,
                            5921479.35566099,
                            564952.2455635556,
                            5921373.522546296,
                            567164.1626506767,
                            5922781.104958045,
                            565373.3311109062,
                            5925731.827731384,
                            563944.5809134975,
                            5926229.244169819,
                            559785.3326750249,
                            5926673.743929789,
                            556610.3343895243,
                            5927213.493638324,
                            554102.0856228612,
                            5926070.494134426,
                            553702.1683456366,
                            5925331.686510341
                        ],
                        "ends_": [
                            24
                        ],
                        "flatInteriorPointRevision_": -1,
                        "flatInteriorPoint_": null,
                        "maxDelta_": -1,
                        "maxDeltaRevision_": -1,
                        "orientedRevision_": -1,
                        "orientedFlatCoordinates_": null
                    },
                    "id": "clever-leitsystem",
                    "nameFull": "CLEVER Cities Korridorleitsystem",
                    "description": " Worum geht es? \r\n\r\nIm Rahmen des EU-Projekts CLEVER Cities soll für das Projektgebiet in Neugraben-Fischbek ein Leitsystem entwickelt werden, das die Teilprojekte inhaltlich und räumlich verknüpft. Die Projekte,&nbsp;wie z. B. der Gemeinschaftsgarten der DRK-Wohnunterkunft „Am Röhricht“, eine begrünte Lärmschutzwand entlang der S-Bahnstrecke oder für Wildbienen qualifizierte Gründächer, verorten sich überwiegend entlang eines Korridors zwischen den S-Bahnhöfen Neugraben und Fischbek. Eines haben diese Projekte gemeinsam: Als naturbasierte Lösungen von urbanen Herausforderungen fügen sie sich in die lokalen räumlichen Gegebenheiten ein. Nach dem Grundsatz von CLEVER Cities werden die Projekte in Ko-Kreation mit lokalen Akteur*innen entwickelt und intensivieren so die Gemeinschaft und Nachbarschaft vor Ort.\r\n\r\nWie kann ich mich beteiligen?\r\n\r\nAuch das Leitsystem soll ko-kreativ entwickelt werden: In einem Workshop mit Kernakteur*innen des Stadtteils wurden im März 2021 erste Ideen entwickelt und ausgearbeitet. Diese möchten wir Ihnen auf dieser Beteiligungsplattform vorstellen und weiterentwickeln:\r\n\r\nUnter Entwürfe erläutern wir Ihnen die Grundidee für das Leitsystem und fragen Sie nach Anregungen und Ideen zur weiteren Ausgestaltung und Befüllung des bisherigen Entwurfs.\r\n\r\nAuf der Beitragskarte sehen Sie alle Standorte der CLEVER-Projekte. Sie können Orte hinzufügen, an denen das Leitsystem oder einzelne Objekte zum Einsatz kommen sollen. Dort können Sie auch die Beiträge anderer ansehen und kommentieren. Wer ist verantwortlich?\r\n\r\nDas Projekt CLEVER Cities wird unter der Federführung des Bezirksamts Harburg umgesetzt. SUPERURBAN unterstützt das Projektteam bei der ko-kreativen Entwicklung des Leitsystems. Das Büro für Gestaltungsfragen (bfgf) ist für den Entwurf und die Umsetzung der Schilder verantwortlich.\r\n\r\nZeitplanung (vorbehaltlich)\r\n\r\nBis zum 15.06.2021 können Sie Ihre Ideen beitragen. Die Ergebnisse der Online-Beteiligung dienen als Grundlage für die weitere Ausarbeitung des Entwurfs. Die vorgeschlagenen Standorte werden vom Bezirksamt auf Umsetzbarkeit geprüft. Nach einem zweiten Workshop mit den Stadtteilakteur*innen findet voraussichtlich im Spätsommer/Herbst eine öffentliche Abschlussveranstaltung statt. Anschließend folgt die Umsetzung. Karte Projektgebiet\r\n\r\nProjektbeschreibung CLEVER Cities",
                    "dateStart": "2021-05-01T00:00:00Z",
                    "dateEnd": "2021-06-27T00:00:00Z",
                    "dipasPhase": "phasemix",
                    "website": "https://clever-leitsystem.beteiligung.hamburg/dipas/#",
                    "owner": "Bezirksamt Harburg",
                    "publisher": "",
                    "standardCategories": {
                        "1": "Wunschstandort",
                        "2": "CLEVER Projekt",
                        "3": "Sonstiges"
                    },
                    "projectContributionType": [],
                    "referenceSystem": "4326",
                    "hasParticipatoryText": [
                        "12",
                        "8",
                        "23",
                        "18",
                        "16",
                        "14",
                        "13",
                        "11",
                        "20",
                        "19",
                        "17",
                        "15",
                        "22",
                        "21",
                        "10",
                        "9",
                        "157",
                        "158",
                        "159"
                    ],
                    "dipasCategoriesCluster": null
                },
                "geometryName_": "geometry",
                "style_": null,
                "geometryChangeKey_": {
                    "target": {
                        "disposed": false,
                        "pendingRemovals_": {},
                        "dispatching_": {},
                        "listeners_": {
                            "change": [
                                null
                            ]
                        },
                        "revision_": 2,
                        "ol_uid": "158",
                        "values_": null,
                        "extent_": [
                            553702.1683456366,
                            5921373.522546296,
                            567164.1626506767,
                            5927213.493638324
                        ],
                        "extentRevision_": 2,
                        "simplifiedGeometryMaxMinSquaredTolerance": 0,
                        "simplifiedGeometryRevision": 0,
                        "layout": "XY",
                        "stride": 2,
                        "flatCoordinates": [
                            553702.1683456366,
                            5925331.686510341,
                            556697.2507479526,
                            5921987.35538667,
                            558073.0829346156,
                            5921553.439277295,
                            561449.1647678417,
                            5921479.35566099,
                            564952.2455635556,
                            5921373.522546296,
                            567164.1626506767,
                            5922781.104958045,
                            565373.3311109062,
                            5925731.827731384,
                            563944.5809134975,
                            5926229.244169819,
                            559785.3326750249,
                            5926673.743929789,
                            556610.3343895243,
                            5927213.493638324,
                            554102.0856228612,
                            5926070.494134426,
                            553702.1683456366,
                            5925331.686510341
                        ],
                        "ends_": [
                            24
                        ],
                        "flatInteriorPointRevision_": -1,
                        "flatInteriorPoint_": null,
                        "maxDelta_": -1,
                        "maxDeltaRevision_": -1,
                        "orientedRevision_": -1,
                        "orientedFlatCoordinates_": null
                    },
                    "type": "change"
                }
            },
            {
                "disposed": false,
                "pendingRemovals_": {},
                "dispatching_": {},
                "listeners_": {
                    "change:geometry": [
                        null
                    ],
                    "change": [
                        null
                    ],
                    "propertychange": [
                        null
                    ]
                },
                "revision_": 2,
                "ol_uid": "161",
                "values_": {
                    "geometry": {
                        "disposed": false,
                        "pendingRemovals_": {},
                        "dispatching_": {},
                        "listeners_": {
                            "change": [
                                null
                            ]
                        },
                        "revision_": 2,
                        "ol_uid": "160",
                        "values_": null,
                        "extent_": [
                            560841.690427507,
                            5929187.940513232,
                            573078.6629862087,
                            5940101.99711964
                        ],
                        "extentRevision_": 2,
                        "simplifiedGeometryMaxMinSquaredTolerance": 0,
                        "simplifiedGeometryRevision": 0,
                        "layout": "XY",
                        "stride": 2,
                        "flatCoordinates": [
                            560841.690427507,
                            5939903.559726797,
                            560841.6904275076,
                            5929187.940513232,
                            573078.6629862087,
                            5929187.940513233,
                            572880.2255933655,
                            5940101.99711964,
                            560841.690427507,
                            5939903.559726797
                        ],
                        "ends_": [
                            10
                        ],
                        "flatInteriorPointRevision_": -1,
                        "flatInteriorPoint_": null,
                        "maxDelta_": -1,
                        "maxDeltaRevision_": -1,
                        "orientedRevision_": -1,
                        "orientedFlatCoordinates_": null
                    },
                    "id": "digitalstrategie-stadtentwicklung",
                    "nameFull": "Digitalstrategie Stadtentwicklung",
                    "description": " Mit dieser Ideenplattform wollen wir Sie, liebe Kolleginnen und Kollegen, aktiv in die Gestaltung der Digitalisierung im Amt LP mit einbeziehen. Als Fachanwender wissen Sie am besten was Sie für ihre tägliche Arbeit benötigen und welche digitalen Werkzeuge Sie in Ihrer Arbeit unterstützen. Sagen Sie uns welche Ideen Sie für die künftige Zusammenarbeit haben, was Sie für ihre fachliche Arbeit benötigen oder wo aus Ihrer Sicht Handlungsbedarfe bestehen.\r\n\r\nDie Ideenplattform setzt auf den Überlegungen der Digitalstrategie Stadtentwicklung auf. Geben Sie uns ihre Anregungen zu folgenden sechs Handlungsfeldern:\r\n\r\n\r\n\tDigitale Werkzeuge\r\n\tDatenmanagement\r\n\tGestaltung und Optimierung von Arbeitsprozessen\r\n\tTechnische Ausstattung\r\n\tZugang zu aktuellen Softwareprodukten\r\n\tKulturwandel\r\n\r\n\r\nVermerken Sie Ihre Ideen als Kommentare in der sechs Handlungsfelder und kommentieren Sie die Ideen anderer. Ziel dieser Plattform ist es die Ideen für konkrete Maßnahmen zu sammeln welche in der Folge auch umgesetzt werden&nbsp; sollen. Mit der Digitalstrategie Stadtentwicklung möchte das Amt für Landesplanung und Stadtentwicklung den Umgang mit den Aspekten der Digitalisierung und die Konzeption digitaler Werkzeuge und Oberflächen für die Themen der Stadtentwicklung aktiv gestalten.\r\nDie Digitalstrategie Stadtentwicklung soll dabei Digitalisierungspotenzialen und Chancen identifizieren und eine Entscheidungshilfe bieten, die es den Mitarbeiterinnen und Mitarbeiter ermöglicht (digitale) Maßnahmen zu konzipieren und umzusetzen.",
                    "dateStart": "2021-06-07T00:00:00Z",
                    "dateEnd": "2021-12-31T00:00:00Z",
                    "dipasPhase": "phase2",
                    "website": "https://digitalstrategie-stadtentwicklung.beteiligung.hamburg/dipas/#",
                    "owner": "Behörde für Stadtentwicklung und Wohnen",
                    "publisher": "",
                    "standardCategories": {
                        "49": "Digitale Werkzeuge",
                        "50": "Software",
                        "51": "Digitale Arbeitsfläche",
                        "52": "Gestaltung und Organisation",
                        "53": "Kulturwandel",
                        "59": "Sonstiges"
                    },
                    "projectContributionType": {
                        "54": "Idee",
                        "55": "Kritik",
                        "56": "Lob",
                        "57": "Frage",
                        "58": "Sonstiges"
                    },
                    "referenceSystem": "4326",
                    "hasParticipatoryText": [
                        "251",
                        "252",
                        "253",
                        "254",
                        "255",
                        "256",
                        "259"
                    ],
                    "dipasCategoriesCluster": null
                },
                "geometryName_": "geometry",
                "style_": null,
                "geometryChangeKey_": {
                    "target": {
                        "disposed": false,
                        "pendingRemovals_": {},
                        "dispatching_": {},
                        "listeners_": {
                            "change": [
                                null
                            ]
                        },
                        "revision_": 2,
                        "ol_uid": "160",
                        "values_": null,
                        "extent_": [
                            560841.690427507,
                            5929187.940513232,
                            573078.6629862087,
                            5940101.99711964
                        ],
                        "extentRevision_": 2,
                        "simplifiedGeometryMaxMinSquaredTolerance": 0,
                        "simplifiedGeometryRevision": 0,
                        "layout": "XY",
                        "stride": 2,
                        "flatCoordinates": [
                            560841.690427507,
                            5939903.559726797,
                            560841.6904275076,
                            5929187.940513232,
                            573078.6629862087,
                            5929187.940513233,
                            572880.2255933655,
                            5940101.99711964,
                            560841.690427507,
                            5939903.559726797
                        ],
                        "ends_": [
                            10
                        ],
                        "flatInteriorPointRevision_": -1,
                        "flatInteriorPoint_": null,
                        "maxDelta_": -1,
                        "maxDeltaRevision_": -1,
                        "orientedRevision_": -1,
                        "orientedFlatCoordinates_": null
                    },
                    "type": "change"
                }
            }
        ],
            wrapper = await mount(),
            transformedFeatures = wrapper.vm.transformFeatures(features);

        expect(transformedFeatures.length).to.equal(transformedFeatures.length);
        
        
    });
});
