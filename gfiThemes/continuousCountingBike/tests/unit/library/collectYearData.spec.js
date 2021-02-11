import {expect} from "chai";
import {collectYearData, splitYearData} from "../../../library/collectYearData";

describe("src/modules/tools/gfi/components/themes/continuousCountingBike/library/collectYearData.js", () => {

    const yearLine = "2018,5,22200|2018,6,24896|2018,4,27518|2018,3,19464|2018,2,27534|2018,1,17096|2018,7,3103";

    before(function () {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });


    describe("collectYearData", function () {
        it("should return object that have all keys", function () {
            expect(collectYearData(yearLine)).to.be.an("object").that.have.all.keys(["data", "xLabel", "yLabel", "graphArray", "xAxisTicks", "legendArray"]);
        });
        it("should return object that has empty keys", function () {
            expect(collectYearData(undefined)).to.be.an("object").to.deep.include({
                data: "",
                xLabel: "modules.tools.gfi.themes.continuousCountingBike.yearScheduleInYear",
                graphArray: "",
                xAxisTicks: {
                    unit: "modules.tools.gfi.themes.continuousCountingBike.cw",
                    values: []
                },
                legendArray: ""
            });
        });
        it("should return object that has empty keys", function () {
            expect(collectYearData()).to.be.an("object").to.deep.include({
                data: "",
                xLabel: "modules.tools.gfi.themes.continuousCountingBike.yearScheduleInYear",
                graphArray: "",
                xAxisTicks: {
                    unit: "modules.tools.gfi.themes.continuousCountingBike.cw",
                    values: []
                },
                legendArray: ""
            });
        });
    });

    describe("splitYearData", () => {
        it("should be a function", () => {
            expect(typeof splitYearData).to.equal("function");
        });
        it("should disallow invalid dates into the result", () => {
            const data = "2021,1,0|2021,53,0";

            expect(splitYearData(data)).to.be.an("array").to.have.lengthOf(1);
        });
        it("should interpret a negativ week number as the same week without minus but of the previous year, should sort it in front", () => {
            const data = "2021,1,0|2021,-53,0",
                result = splitYearData(data);

            expect(result).to.be.an("array").to.have.lengthOf(2);
            expect(result[0].year).to.equal(2020);
        });
    });
});
