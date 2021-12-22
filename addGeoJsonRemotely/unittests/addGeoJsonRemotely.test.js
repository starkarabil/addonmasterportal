import {expect} from "chai";
import getFeatureIds from "../addGeoJsonRemotely";
import sinon from "sinon";

const geojson = {
    "type": "FeatureCollection",
    "features":
        [
            {
                "type": "Feature",
                "geometry":
                    {
                        "type": "Point",
                        "coordinates": [10.023374939929553, 53.5356067536243]
                    },
                "properties": {"epsg": "WGS84"}
            }
        ],
    "styles": [
        {
            "styleId": "customStyle",
            "rules": [
                {
                    "style": {
                        "circleStrokeColor": [255, 0, 0, 1],
                        "circleFillColor": [255, 0, 0, 0.5]
                    }
                }
            ]
        }
    ]
};

describe("ADDON: addGeoJSONRemotely", () => {
    const spy = sinon.spy(Radio, "trigger");

    Radio.trigger("addGeoJson", "addGeoJson", "LayerName", "LayerID", geojson, "customStyle", "tree", {"test1": "xyz", "test2": "abc"});

    it("should trigger the right Radio functions", () => {
        expect(spy.getCall(1).calledWithExactly("StyleList", "addToStyleList", geojson.styles)).to.be.true;
        expect(spy.getCall(2).calledWithExactly("Parser", "addGeoJSONLayer", "LayerName", "LayerID", geojson, "customStyle", "tree", {"test1": "xyz", "test2": "abc"})).to.be.true;
        expect(spy.getCall(3).calledWithExactly("ModelList", "addModelsByAttributes", {id: "LayerID"})).to.be.true;
        expect(spy.getCall(4).calledWithExactly("ModelList", "renderTree")).to.be.true;
    });
});

describe("ADDON: addGeoJSONRemotely - getFeatureIds", function () {
    const spy = sinon.spy(),
        correctId = "42",
        fakeLayer = {
            get: () => correctId,
            getSource: () => {
                return {
                    getFeatures: () => [{id: "66", getId}, {id: "89", getId}]
                };
            }
        },
        fakeFunction = sinon.fake.returns({
            getArray: () => [fakeLayer]
        });

    beforeEach(function () {
        sinon.stub(console, "warn").callsFake(spy);
    });
    afterEach(function () {
        sinon.restore();
        spy.resetHistory();
    });

    /**
     * @returns {string} The id of the feature;
     */
    function getId () {
        return this.id;
    }

    beforeEach(function () {
        sinon.stub(Radio, "request").callsFake(fakeFunction);
    });
    it("should return an array of feature Ids if the layer was found", function () {
        expect(getFeatureIds(correctId)).to.eql(["66", "89"]);
    });

    it("should log an error on the console if no layer was found with the specified layerId and return an empty array", function () {
        const wrongId = "402";

        expect(getFeatureIds(wrongId)).to.eql([]);
        expect(spy.calledOnce).to.be.true;
    });
});
