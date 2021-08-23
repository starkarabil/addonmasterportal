import {getAllDistrictsWithoutLayer, getDistricts, getHamburgDistrict, getFeatureTypes, getLayerById, getNameList, getPropertyNameList, prepareDistrictLevels, setProperties} from "../../../utils/prepareDistrictLevels.js";
import {expect} from "chai";
import {initializeLayerList} from "masterportalAPI/src/rawLayerList";
import Source from "ol/source/Vector.js";
import Layer from "ol/layer/Vector.js";
import Feature from "ol/Feature.js";
import sinon from "sinon";

describe("addons/DistrictSelector/utils/prepareDistrictLevels.js", () => {
    describe("getAllDistrictsWithoutLayer", () => {
        it("should return an empty array if the given parameter is not an array or an array with length zero", () => {
            expect(getAllDistrictsWithoutLayer({})).to.be.empty;
            expect(getAllDistrictsWithoutLayer(true)).to.be.empty;
            expect(getAllDistrictsWithoutLayer("districtLevels")).to.be.empty;
            expect(getAllDistrictsWithoutLayer(undefined)).to.be.empty;
            expect(getAllDistrictsWithoutLayer(null)).to.be.empty;
            expect(getAllDistrictsWithoutLayer(42)).to.be.empty;
            expect(getAllDistrictsWithoutLayer([])).to.be.empty;
        });

        it("should return an array with length three", () => {
            const testArray = [{}, {}, {}],
                testArrayTwo = [{layer: {}}, {layer: {}}, {}, {}, {}];

            expect(getAllDistrictsWithoutLayer(testArray)).to.be.an("array");
            expect(getAllDistrictsWithoutLayer(testArray)).to.have.lengthOf(3);
            expect(getAllDistrictsWithoutLayer(testArrayTwo)).to.be.an("array");
            expect(getAllDistrictsWithoutLayer(testArrayTwo)).to.have.lengthOf(3);
        });

        it("should return an array with to objects, that have no layer attribute", () => {
            const testArray = [{id: "123"}, {name: "Hello"}, {layer: {}}];

            expect(getAllDistrictsWithoutLayer(testArray)).to.deep.equal([{id: "123"}, {name: "Hello"}]);
        });
    });

    describe("getDistricts", () => {
        const layer = new Layer({
            source: new Source({
                features: [
                    new Feature({
                        name: "Altona",
                        id: "123"
                    }),
                    new Feature({
                        name: "Ottensen",
                        id: "456"
                    })
                ]
            })
        });

        it("should return an empty array if the property layer is not or wrongly defined", () => {
            expect(getDistricts({layer: ""})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: null})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: false})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: 5})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: []})).to.be.an("array").to.be.empty;
            expect(getDistricts({layer: undefined})).to.be.an("array").to.be.empty;
        });

        it("should return an empty array if the property label is not or wrongly defined", () => {
            expect(getDistricts({label: {}})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: null})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: false})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: 5})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: []})).to.be.an("array").to.be.empty;
            expect(getDistricts({label: undefined})).to.be.an("array").to.be.empty;
        });

        it("should return an empty array if the property keyOfAttrName is not or wrongly defined", () => {
            expect(getDistricts({keyOfAttrName: {}})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: null})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: false})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: 5})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: []})).to.be.an("array").to.be.empty;
            expect(getDistricts({keyOfAttrName: undefined})).to.be.an("array").to.be.empty;
        });

        it("should return district hamburg if label is 'Hamburg'", () => {
            const districts = getDistricts({label: "Hamburg", layer: {}, keyOfAttrName: ""});

            expect(districts).to.be.an("array");
            expect(districts[0].getLabel()).to.equal("Hamburg (gesamt)");
        });

        it("should returns two districts", () => {
            const districts = getDistricts({label: "Stadtteil", layer: layer, keyOfAttrName: "name"});

            expect(districts).to.be.an("array").lengthOf(2);
        });

        it("should returns a district where the name and the label are the same", () => {
            const districts = getDistricts({label: "Stadtteile", layer: layer, keyOfAttrName: "name"});

            expect(districts[0].getLabel()).to.equal(districts[0].getName());
        });

        it("should returns a district where the name and the label are not the same, if duplicateDistrictNames includes the name of the district", () => {
            const districts = getDistricts({label: "Stadtteile", layer: layer, keyOfAttrName: "name", duplicateDistrictNames: ["Altona"]});

            expect(districts[0].getLabel()).not.to.equal(districts[0].getName());
            expect(districts[0].getLabel()).to.equal("Altona (Stadtteil)");
        });
    });

    describe("getFeatureTypes", () => {
        it("should return an empty array", () => {
            expect(getFeatureTypes(undefined)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes(null)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes({})).to.be.an("array").to.be.empty;
            expect(getFeatureTypes(true)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes(42)).to.be.an("array").to.be.empty;
            expect(getFeatureTypes([])).to.be.an("array").to.be.empty;
        });

        it("should return an empty array include empty arrays", (done) => {
            initializeLayerList("https://geoportal-hamburg.de/lgv-config/services-internet.json", () => {
                const featureTypes = getFeatureTypes(["123", "456"]);

                expect(featureTypes).to.be.an("array").to.have.lengthOf(2);
                expect(featureTypes[0]).to.be.an("array").to.be.empty;
                expect(featureTypes[1]).to.be.an("array").to.be.empty;
                done();
            });
        });

        it("should return an array of arrays", (done) => {
            initializeLayerList("https://geoportal-hamburg.de/lgv-config/services-internet.json", () => {
                const featureTypes = getFeatureTypes(["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"]);

                expect(featureTypes).to.be.an("array").to.not.be.empty;
                expect(featureTypes[0]).to.be.an("array").to.not.be.empty;
                done();
            });
        });

        it("should return featureType 'v_hh_bezirk_bev_insgesamt' for the given url", (done) => {
            initializeLayerList("https://geoportal-hamburg.de/lgv-config/services-internet.json", () => {
                const featureTypes = getFeatureTypes(["https://geodienste.hamburg.de/HH_WFS_Regionalstatistische_Daten_Bezirke"]);

                expect(featureTypes[0]).to.include("v_hh_bezirk_bev_insgesamt");
                done();
            });
        });
    });

    describe("getHamburgDistrict", () => {
        it("should return the hamburg district", () => {
            const hamburgDistrict = getHamburgDistrict();

            expect(hamburgDistrict).to.be.an("object");
            expect(hamburgDistrict.getId()).to.equal("Hamburg");
            expect(hamburgDistrict.getLabel()).to.equal("Hamburg (gesamt)");
            expect(hamburgDistrict.getName()).to.equal("hamburg_gesamt");
            expect(hamburgDistrict.statFeatures).to.be.empty;
        });
    });

    describe("getLayerById", () => {
        it("should return undefined if only one param is given", () => {
            expect(getLayerById(["Test"])).to.be.undefined;
        });

        it("should return undefined if the first param is not an array", () => {
            expect(getLayerById({}, "123")).to.be.undefined;
            expect(getLayerById(true, "123")).to.be.undefined;
            expect(getLayerById("districtLevels", "123")).to.be.undefined;
            expect(getLayerById(undefined, "123")).to.be.undefined;
            expect(getLayerById(null, "123")).to.be.undefined;
            expect(getLayerById(42, "123")).to.be.undefined;
        });

        it("should return undefined if the first param is an empty array", () => {
            expect(getLayerById([], "123")).to.be.undefined;
        });

        it("should return undefined if the second param is not a string", () => {
            expect(getLayerById([], {})).to.be.undefined;
            expect(getLayerById([], true)).to.be.undefined;
            expect(getLayerById([], undefined)).to.be.undefined;
            expect(getLayerById([], null)).to.be.undefined;
            expect(getLayerById([], 42)).to.be.undefined;
            expect(getLayerById([], [])).to.be.undefined;
        });

        it("should return a layer with the passed id", () => {
            const layerOne = new Layer({id: "123"}),
                layerTwo = new Layer({id: "456"}),
                layerThree = new Layer({id: "789"}),
                layerList = [layerOne, layerTwo, layerThree];

            expect(getLayerById(layerList, "123")).to.be.an("object");
            expect(getLayerById(layerList, "456")).to.be.an("object");
        });

        it("should return undefined if no layer is found", () => {
            const layerOne = new Layer({id: "123"}),
                layerTwo = new Layer({id: "456"}),
                layerList = [layerOne, layerTwo];

            expect(getLayerById(layerList, "789")).to.be.undefined;
        });
    });

    describe("getNameList", () => {
        it("should return an empty array if only one param is passed", () => {
            const layerOne = new Layer();

            expect(getNameList(layerOne)).to.be.an("array").that.is.empty;
            expect(getNameList(true)).to.be.an("array").that.is.empty;
            expect(getNameList("layerOne")).to.be.an("array").that.is.empty;
            expect(getNameList(42)).to.be.an("array").that.is.empty;
        });

        it("should return an empty array if the first param is not an object", () => {
            expect(getNameList([], "123")).to.be.empty;
            expect(getNameList(true, "123")).to.be.empty;
            expect(getNameList("districtLevels", "123")).to.be.empty;
            expect(getNameList(undefined, "123")).to.be.empty;
            expect(getNameList(null, "123")).to.be.empty;
            expect(getNameList(42, "123")).to.be.empty;
        });

        it("should return an empty array if the second param is not a string", () => {
            const layerOne = new Layer();

            expect(getNameList(layerOne, {})).to.be.empty;
            expect(getNameList(layerOne, true)).to.be.empty;
            expect(getNameList(layerOne, undefined)).to.be.empty;
            expect(getNameList(layerOne, null)).to.be.empty;
            expect(getNameList(layerOne, 42)).to.be.empty;
            expect(getNameList(layerOne, [])).to.be.empty;
        });

        it("should return an empty array if no features with the attribute name exist", () => {
            const layerOne = new Layer({
                source: new Source({
                    features: [
                        new Feature({
                            id: "123"
                        }),
                        new Feature({
                            bezeichnung: "Ottensen"
                        })
                    ]
                })
            });

            expect(getNameList(layerOne, "name")).to.be.an("array").that.is.empty;
        });

        it("should return an array with the length of two'", () => {
            const layerOne = new Layer({
                source: new Source({
                    features: [
                        new Feature({
                            name: "Altona",
                            id: "123"
                        }),
                        new Feature({
                            name: "Ottensen"
                        }),
                        new Feature({
                            id: "Ottensen"
                        })
                    ]
                })
            });

            expect(getNameList(layerOne, "name")).to.be.an("array");
            expect(getNameList(layerOne, "name")).to.have.lengthOf(2);
        });

        it("should return an array with the strings 'Altona' and 'Ottensen'", () => {
            const layerOne = new Layer({
                source: new Source({
                    features: [
                        new Feature({
                            name: "Altona",
                            id: "123"
                        }),
                        new Feature({
                            name: "Ottensen"
                        })
                    ]
                })
            });

            expect(getNameList(layerOne, "name")).to.be.an("array");
            expect(getNameList(layerOne, "name")).to.deep.equal(["Altona", "Ottensen"]);
        });
    });

    describe("getPropertyNameList", () => {
        it("should return an empty array", async () => {
            expect(await getPropertyNameList(undefined)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList(null)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList({})).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList(true)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList(42)).to.be.an("array").to.be.empty;
            expect(await getPropertyNameList([])).to.be.an("array").to.be.empty;
        });

        it("should return an empty array include empty arrays", (done) => {
            initializeLayerList("https://geoportal-hamburg.de/lgv-config/services-internet.json", async () => {
                const propertyNameList = await getPropertyNameList(["123", "456"]);

                expect(propertyNameList).to.be.an("array").to.have.lengthOf(2);
                expect(propertyNameList[0]).to.be.an("array").to.be.empty;
                expect(propertyNameList[1]).to.be.an("array").to.be.empty;
                done();
            });
        });
    });


    describe("setProperties", () => {
        const bindObj = {
                districts: [],
                keyOfAttrName: "name",
                label: "Stadtteile",
                layer: new Layer({
                    source: new Source({
                        features: [
                            new Feature({
                                name: "Altona",
                                id: "123"
                            }),
                            new Feature({
                                name: "Ottensen",
                                id: "456"
                            })
                        ]
                    })
                })
            },
            eventDummy = {
                target: {
                    getFeatures: () => ["", ""]
                }
            },
            eventDummyEmpty = {
                target: {
                    getFeatures: () => []
                }
            },
            copySetProperties = setProperties.bind(bindObj);

        it("should return an object without the property 'nameList'", () => {
            copySetProperties(eventDummyEmpty);

            expect(bindObj).to.have.not.property("nameList");
        });

        it("should return an object without districts", () => {
            copySetProperties(eventDummyEmpty);

            expect(bindObj.districts).to.be.empty;
        });

        it("should return an object with the property 'nameList'", () => {
            copySetProperties(eventDummy);

            expect(bindObj).to.have.property("nameList");
        });

        it("should return an object with two districts", () => {
            copySetProperties(eventDummy);

            expect(bindObj.districts).to.have.lengthOf(2);
        });

        it("should return an array for the property 'nameList'", () => {
            copySetProperties(eventDummy);

            expect(bindObj.nameList).to.be.an("array");
        });

        it("should return ['Altona', 'Ottensen'] for the property 'nameList'", () => {
            copySetProperties(eventDummy);

            expect(bindObj.nameList).to.deep.equal(["Altona", "Ottensen"]);
        });
    });

    describe("prepareDistrictLevels", () => {
        const layerOne = new Layer({id: "123", source: new Source()}),
            spyOnSource = sinon.spy(layerOne.getSource(), "on"),
            layerList = [layerOne];

        it("should call on listener", () => {
            const testArray = [{layerId: "123", stats: {}}];

            prepareDistrictLevels(testArray, layerList);
            expect(spyOnSource.calledOnce).to.be.true;
        });

        it("should return an object with the properties 'nameList', 'layer' , 'featureTypes', 'propertyNameList', 'referenceLevel' and 'districts'", () => {
            const testArray = [{layerId: "123", stats: {}}];

            prepareDistrictLevels(testArray, layerList);

            expect(testArray[0]).to.have.property("nameList");
            expect(testArray[0]).to.have.property("layer");
            expect(testArray[0]).to.have.property("districts");
            expect(testArray[0]).to.have.property("featureTypes");
            expect(testArray[0]).to.have.property("propertyNameList");
            expect(testArray[0]).to.have.property("referenceLevel");
        });

        it("should do nothing if layer already there", () => {
            const testArray = [{layer: {}, stats: {}}];

            prepareDistrictLevels(testArray, layerList);
            expect(testArray[0]).to.have.not.property("nameList");
            expect(testArray[0]).to.have.not.property("districts");
        });
    });
});