import {expect} from "chai";
import {
    optimizeComplexTypeValues,
    changeMetadata,
    convertComplexTypeToPiechart,
    convertComplexTypeToBarchart,
    confineComplexTypeValues,
    convertComplexTypeToLinechart,
    convertComplexTypesToMultilinechart,
    isComplexType,
    compareComplexTypesAndFillDataGaps,
    sortComplexType,
    cloneComplexType,
    hasComplexTypeValues
} from "../../../utils/complexType.js";

describe("addons/utils/complexType.js", () => {
    describe("optimizeComplexTypeValues", () => {
        it("should return the given value if the value is not a complex type", () => {
            expect(optimizeComplexTypeValues(undefined)).to.be.undefined;
            expect(optimizeComplexTypeValues(null)).to.be.null;
            expect(optimizeComplexTypeValues("string")).to.equal("string");
            expect(optimizeComplexTypeValues(1)).to.equal(1);
            expect(optimizeComplexTypeValues(false)).to.be.false;
            expect(optimizeComplexTypeValues(true)).to.be.true;
        });
        it("should optimize the given complex type values", () => {
            const complexType = {
                    metadata: {type: "timeseries", format: "YYYY/YY", description: "Anteil in %"},
                    values: [
                        {key: "2019/20", value: 123},
                        {key: "2018/19", value: 123.45678},
                        {key: "2017/18", value: "456"},
                        {key: "2016/17", value: "456.789"},
                        {key: "2015/16", value: "789,012"}
                    ]
                },
                expected = {
                    metadata: {type: "timeseries", format: "YYYY/YY", description: "Anteil in %"},
                    values: [
                        {key: "2019/20", value: 123},
                        {key: "2018/19", value: 123.45678},
                        {key: "2017/18", value: 456},
                        {key: "2016/17", value: 456.789},
                        {key: "2015/16", value: 789.012}
                    ]
                };

            expect(optimizeComplexTypeValues(complexType)).to.deep.equal(expected);
        });
        it("should optimize the given complex type values, rounded to decimal points", () => {
            const complexType = {
                    metadata: {type: "timeseries", format: "YYYY/YY", description: "Anteil in %"},
                    values: [
                        {key: "2019/20", value: 123},
                        {key: "2018/19", value: 123.45678},
                        {key: "2017/18", value: "456"},
                        {key: "2016/17", value: "456.789"},
                        {key: "2015/16", value: "789,012"}
                    ]
                },
                expected = {
                    metadata: {type: "timeseries", format: "YYYY/YY", description: "Anteil in %"},
                    values: [
                        {key: "2019/20", value: 123},
                        {key: "2018/19", value: 123.46},
                        {key: "2017/18", value: 456},
                        {key: "2016/17", value: 456.79},
                        {key: "2015/16", value: 789.01}
                    ]
                };

            expect(optimizeComplexTypeValues(complexType, 2)).to.deep.equal(expected);
        });
    });

    describe("convertComplexTypeToPiechart", () => {
        it("should return false, if complex data is a empty object", () => {
            expect(convertComplexTypeToPiechart({})).to.be.false;
        });
        it("should return false, if complexData is anything but an object", () => {
            expect(convertComplexTypeToPiechart(undefined)).to.be.false;
            expect(convertComplexTypeToPiechart(null)).to.be.false;
            expect(convertComplexTypeToPiechart(1)).to.be.false;
            expect(convertComplexTypeToPiechart("string")).to.be.false;
            expect(convertComplexTypeToPiechart(false)).to.be.false;
            expect(convertComplexTypeToPiechart([])).to.be.false;
        });
        it("should return false, if complex data is not complete", () => {
            const complexData = {
                metadata: {
                    type: "timeseries",
                    format: "YYYY/YY",
                    description: "Anzahl"
                }
            };

            expect(convertComplexTypeToPiechart(complexData)).to.be.false;
        });

        it("should convert complex data to chartJS data", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        backgroundColor: [
                            "rgba(230, 159, 0, 1)",
                            "rgba(86, 180, 233, 1)",
                            "rgba(0, 158, 115, 1)",
                            "rgba(240, 228, 66, 1)",
                            "rgba(0, 114, 178, 1)"
                        ],
                        hoverOffset: 4
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToPiechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if one value is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: undefined}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381
                        ],
                        backgroundColor: [
                            "rgba(230, 159, 0, 1)",
                            "rgba(86, 180, 233, 1)",
                            "rgba(0, 158, 115, 1)",
                            "rgba(240, 228, 66, 1)"
                        ],
                        hoverOffset: 4
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17"
                    ]
                };

            expect(convertComplexTypeToPiechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if one key is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: undefined, value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381
                        ],
                        backgroundColor: [
                            "rgba(230, 159, 0, 1)",
                            "rgba(86, 180, 233, 1)",
                            "rgba(0, 158, 115, 1)",
                            "rgba(240, 228, 66, 1)"
                        ],
                        hoverOffset: 4
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17"
                    ]
                };

            expect(convertComplexTypeToPiechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if label is empty", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: ""
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        backgroundColor: [
                            "rgba(230, 159, 0, 1)",
                            "rgba(86, 180, 233, 1)",
                            "rgba(0, 158, 115, 1)",
                            "rgba(240, 228, 66, 1)",
                            "rgba(0, 114, 178, 1)"
                        ],
                        hoverOffset: 4
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToPiechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if label is empty, with confined array", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: ""
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "",
                        data: [
                            392,
                            398,
                            381,
                            384
                        ],
                        backgroundColor: [
                            "rgba(230, 159, 0, 1)",
                            "rgba(86, 180, 233, 1)",
                            "rgba(0, 158, 115, 1)",
                            "rgba(240, 228, 66, 1)"
                        ],
                        hoverOffset: 4
                    }],
                    labels: [
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToPiechart(complexData, null, false, 4)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if description is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: undefined
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        backgroundColor: [
                            "rgba(230, 159, 0, 1)",
                            "rgba(86, 180, 233, 1)",
                            "rgba(0, 158, 115, 1)",
                            "rgba(240, 228, 66, 1)",
                            "rgba(0, 114, 178, 1)"
                        ],
                        hoverOffset: 4
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToPiechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data with given background colors, if backgroundColors are given", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Beschreibung"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398}
                    ]
                },
                givenBackgroundColors = [
                    [210, 220, 0, 1],
                    [230, 138, 190, 1],
                    [110, 200, 230, 1]
                ],
                chartJSData = {
                    datasets: [{
                        label: "Beschreibung",
                        data: [
                            372,
                            392,
                            398
                        ],
                        backgroundColor: [
                            "rgba(210, 220, 0, 1)",
                            "rgba(230, 138, 190, 1)",
                            "rgba(110, 200, 230, 1)"
                        ],
                        hoverOffset: 4
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18"
                    ]
                };

            expect(convertComplexTypeToPiechart(complexData, {}, givenBackgroundColors)).to.deep.equal(chartJSData);
        });
    });

    describe("convertComplexTypeToBarchart", () => {
        it("should return false, if complex data is a empty object", () => {
            expect(convertComplexTypeToBarchart({})).to.be.false;
        });
        it("should return an empty object, if complexData is anything but an object", () => {
            expect(convertComplexTypeToBarchart(undefined)).to.be.false;
            expect(convertComplexTypeToBarchart(null)).to.be.false;
            expect(convertComplexTypeToBarchart(1)).to.be.false;
            expect(convertComplexTypeToBarchart("string")).to.be.false;
            expect(convertComplexTypeToBarchart(false)).to.be.false;
            expect(convertComplexTypeToBarchart([])).to.be.false;
        });
        it("should return false, if complex data is not complete", () => {
            const complexData = {
                metadata: {
                    type: "timeseries",
                    format: "YYYY/YY",
                    description: "Anzahl"
                }
            };

            expect(convertComplexTypeToBarchart(complexData)).to.be.false;
        });

        it("should convert complex data to bar chartJS data", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        backgroundColor: "rgba(0, 48, 99, 1)",
                        hoverBackgroundColor: "rgba(181, 216, 250, 1)",
                        borderWidth: 1
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToBarchart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to bar chartJS data with confined array", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 370},
                        {key: "2018/19", value: 371},
                        {key: "2017/18", value: 372},
                        {key: "2016/17", value: 373},
                        {key: "2015/16", value: 374},
                        {key: "2019/20", value: 375},
                        {key: "2018/19", value: 376},
                        {key: "2017/18", value: 377},
                        {key: "2016/17", value: 378},
                        {key: "2015/16", value: 379}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            375,
                            376,
                            377,
                            378,
                            379
                        ],
                        backgroundColor: "rgba(0, 48, 99, 1)",
                        hoverBackgroundColor: "rgba(181, 216, 250, 1)",
                        borderWidth: 1
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToBarchart(complexData, null, 5)).to.deep.equal(chartJSData);
        });
        it("should confine values from complexDataValues to the given parameter", () => {
            const complexDataValues = [
                    {key: "2019/20", value: 370},
                    {key: "2018/19", value: 371},
                    {key: "2017/18", value: 372},
                    {key: "2016/17", value: 373},
                    {key: "2015/16", value: 374},
                    {key: "2019/20", value: 375},
                    {key: "2018/19", value: 376},
                    {key: "2017/18", value: 377},
                    {key: "2016/17", value: 378},
                    {key: "2015/16", value: 379}
                ],
                confinedComplexDataValues = [
                    {key: "2019/20", value: 375},
                    {key: "2018/19", value: 376},
                    {key: "2017/18", value: 377},
                    {key: "2016/17", value: 378},
                    {key: "2015/16", value: 379}
                ];

            expect(confineComplexTypeValues(complexDataValues, 5)).to.deep.equal(confinedComplexDataValues);
        });
        it("should confine values from complexDataValues to the given parameter", () => {
            const complexDataValues = [
                    {key: "2019/20", value: 370},
                    {key: "2018/19", value: 371},
                    {key: "2017/18", value: 372},
                    {key: "2016/17", value: 373},
                    {key: "2015/16", value: 374},
                    {key: "2019/20", value: 375},
                    {key: "2018/19", value: 376},
                    {key: "2017/18", value: 377},
                    {key: "2016/17", value: 378},
                    {key: "2015/16", value: 379}
                ],
                confinedComplexDataValues = [
                    {key: "2019/20", value: 370},
                    {key: "2018/19", value: 371},
                    {key: "2017/18", value: 372},
                    {key: "2016/17", value: 373},
                    {key: "2015/16", value: 374},
                    {key: "2019/20", value: 375},
                    {key: "2018/19", value: 376},
                    {key: "2017/18", value: 377},
                    {key: "2016/17", value: 378},
                    {key: "2015/16", value: 379}
                ];

            expect(confineComplexTypeValues(complexDataValues, "string")).to.deep.equal(confinedComplexDataValues);
        });
        it("should confine values from complexDataValues to the given parameter", () => {
            const complexDataValues = [
                    {key: "2019/20", value: 370},
                    {key: "2018/19", value: 371},
                    {key: "2017/18", value: 372},
                    {key: "2016/17", value: 373},
                    {key: "2015/16", value: 374},
                    {key: "2019/20", value: 375},
                    {key: "2018/19", value: 376},
                    {key: "2017/18", value: 377},
                    {key: "2016/17", value: 378},
                    {key: "2015/16", value: 379}
                ],
                confinedComplexDataValues = [
                    {key: "2019/20", value: 370},
                    {key: "2018/19", value: 371},
                    {key: "2017/18", value: 372},
                    {key: "2016/17", value: 373},
                    {key: "2015/16", value: 374},
                    {key: "2019/20", value: 375},
                    {key: "2018/19", value: 376},
                    {key: "2017/18", value: 377},
                    {key: "2016/17", value: 378},
                    {key: "2015/16", value: 379}
                ];

            expect(confineComplexTypeValues(complexDataValues, 12)).to.deep.equal(confinedComplexDataValues);
        });
        it("should convert complex data to chartJS data with a gap in the dataset, if one value is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: undefined}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            undefined
                        ],
                        backgroundColor: "rgba(0, 48, 99, 1)",
                        hoverBackgroundColor: "rgba(181, 216, 250, 1)",
                        borderWidth: 1
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToBarchart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if one key is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: undefined, value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381
                        ],
                        backgroundColor: "rgba(0, 48, 99, 1)",
                        hoverBackgroundColor: "rgba(181, 216, 250, 1)",
                        borderWidth: 1
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17"
                    ]
                };

            expect(convertComplexTypeToBarchart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if label is empty", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: ""
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2016/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        backgroundColor: "rgba(0, 48, 99, 1)",
                        hoverBackgroundColor: "rgba(181, 216, 250, 1)",
                        borderWidth: 1
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2016/16"
                    ]
                };

            expect(convertComplexTypeToBarchart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if description is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: undefined
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2016/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        backgroundColor: "rgba(0, 48, 99, 1)",
                        hoverBackgroundColor: "rgba(181, 216, 250, 1)",
                        borderWidth: 1
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2016/16"
                    ]
                };

            expect(convertComplexTypeToBarchart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data with given background colors, if backgroundColors are given", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Beschreibung"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398}
                    ]
                },
                givenBackgroundColor = [210, 220, 0, 1],
                givenHoverBackgroundColor = [0, 92, 255, 1],
                chartJSData = {
                    datasets: [{
                        label: "Beschreibung",
                        data: [
                            372,
                            392,
                            398
                        ],
                        backgroundColor: "rgba(210, 220, 0, 1)",
                        hoverBackgroundColor: "rgba(0, 92, 255, 1)",
                        borderWidth: 1
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18"
                    ]
                };

            expect(convertComplexTypeToBarchart(complexData, {
                backgroundColor: givenBackgroundColor,
                hoverBackgroundColor: givenHoverBackgroundColor
            })).to.deep.equal(chartJSData);
        });
    });

    describe("convertComplexTypeToLinechart", () => {
        it("should return false, if complex data is a empty object", () => {
            expect(convertComplexTypeToLinechart({})).to.be.false;
        });
        it("should return an empty object, if complexData is anything but an object", () => {
            expect(convertComplexTypeToLinechart(undefined)).to.be.false;
            expect(convertComplexTypeToLinechart(null)).to.be.false;
            expect(convertComplexTypeToLinechart(1)).to.be.false;
            expect(convertComplexTypeToLinechart("string")).to.be.false;
            expect(convertComplexTypeToLinechart(false)).to.be.false;
            expect(convertComplexTypeToLinechart([])).to.be.false;
        });
        it("should return false, if complex data is not complete", () => {
            const complexData = {
                metadata: {
                    type: "timeseries",
                    format: "YYYY/YY",
                    description: "Anzahl"
                }
            };

            expect(convertComplexTypeToLinechart(complexData)).to.be.false;
        });

        it("should convert complex data to line chartJS data", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        borderColor: "rgba(0, 92, 169, 1)",
                        backgroundColor: "rgba(0, 92, 169, 1)",
                        spanGaps: false,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        lineTension: 0
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToLinechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if one key is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: undefined, value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381
                        ],
                        borderColor: "rgba(0, 92, 169, 1)",
                        backgroundColor: "rgba(0, 92, 169, 1)",
                        spanGaps: false,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        lineTension: 0
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17"
                    ]
                };

            expect(convertComplexTypeToLinechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data with a gap in the dataset, if one value is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: undefined}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "Anzahl",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            null
                        ],
                        borderColor: "rgba(0, 92, 169, 1)",
                        backgroundColor: "rgba(0, 92, 169, 1)",
                        spanGaps: false,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        lineTension: 0
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToLinechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if label is empty", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: ""
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        borderColor: "rgba(0, 92, 169, 1)",
                        backgroundColor: "rgba(0, 92, 169, 1)",
                        spanGaps: false,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        lineTension: 0
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToLinechart(complexData)).to.deep.equal(chartJSData);
        });
        it("should convert complex data to chartJS data, if description is undefined", () => {
            const complexData = {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: undefined
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                chartJSData = {
                    datasets: [{
                        label: "",
                        data: [
                            372,
                            392,
                            398,
                            381,
                            384
                        ],
                        borderColor: "rgba(0, 92, 169, 1)",
                        backgroundColor: "rgba(0, 92, 169, 1)",
                        spanGaps: false,
                        fill: false,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        lineTension: 0
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypeToLinechart(complexData)).to.deep.equal(chartJSData);
        });
    });

    describe("isComplexType", () => {
        it("should return false if anything but a complexType is given", () => {
            expect(isComplexType(undefined)).to.be.false;
            expect(isComplexType(null)).to.be.false;
            expect(isComplexType("string")).to.be.false;
            expect(isComplexType(1)).to.be.false;
            expect(isComplexType(true)).to.be.false;
            expect(isComplexType(false)).to.be.false;
            expect(isComplexType([])).to.be.false;
            expect(isComplexType({})).to.be.false;
            expect(isComplexType({
                metadata: {
                    type: false,
                    format: "someFormat",
                    description: "someDescription"
                },
                values: []
            })).to.be.false;
            expect(isComplexType({
                metadata: {
                    type: "someType",
                    format: false,
                    description: "someDescription"
                },
                values: []
            })).to.be.false;
            expect(isComplexType({
                metadata: {
                    type: "someType",
                    format: "someFormat",
                    description: false
                },
                values: []
            })).to.be.true;
            expect(isComplexType({
                metadata: {
                    type: "someType",
                    format: "someFormat",
                    description: "someDescription"
                },
                values: {}
            })).to.be.false;
        });

        it("should return true if the given complexType is recognized", () => {
            expect(isComplexType({
                metadata: {
                    type: "someType",
                    format: "someFormat",
                    description: "someDescription"
                },
                values: []
            })).to.be.true;
        });
    });

    describe("sortComplexType", () => {
        it("should return false if the given complex type is not a complex type", () => {
            expect(sortComplexType(undefined)).to.be.false;
            expect(sortComplexType(null)).to.be.false;
            expect(sortComplexType("string")).to.be.false;
            expect(sortComplexType(1)).to.be.false;
            expect(sortComplexType(true)).to.be.false;
            expect(sortComplexType(false)).to.be.false;
            expect(sortComplexType([])).to.be.false;
            expect(sortComplexType({})).to.be.false;
            expect(sortComplexType({
                metadata: {}, values: []
            })).to.be.false;
        });
        it("should sort the given complex type by key ascending by default for a timeseries", () => {
            const complexType = {
                    metadata: {
                        type: "timeseries",
                        format: "DD.MM.YYYY, HH:mm",
                        description: ""
                    },
                    values: [
                        {key: "11.05.2021, 17:00", value: 1},
                        {key: "12.04.2021, 18:00", value: 2},
                        {key: "10.06.2021, 17:48", value: 3}
                    ]
                },
                expected = {
                    metadata: {
                        type: "timeseries",
                        format: "DD.MM.YYYY, HH:mm",
                        description: ""
                    },
                    values: [
                        {key: "12.04.2021, 18:00", value: 2},
                        {key: "11.05.2021, 17:00", value: 1},
                        {key: "10.06.2021, 17:48", value: 3}
                    ]
                };

            expect(sortComplexType(complexType)).to.deep.equal(expected);
        });
        it("should sort the given complex type by key ascending by default for an unknown type", () => {
            const complexType = {
                    metadata: {
                        type: "unknownType",
                        format: "DD.MM.YYYY, HH:mm",
                        description: ""
                    },
                    values: [
                        {key: "11.05.2021, 17:00", value: 1},
                        {key: "12.04.2021, 18:00", value: 2},
                        {key: "10.06.2021, 17:48", value: 3}
                    ]
                },
                expected = {
                    metadata: {
                        type: "unknownType",
                        format: "DD.MM.YYYY, HH:mm",
                        description: ""
                    },
                    values: [
                        {key: "10.06.2021, 17:48", value: 3},
                        {key: "11.05.2021, 17:00", value: 1},
                        {key: "12.04.2021, 18:00", value: 2}
                    ]
                };

            expect(sortComplexType(complexType)).to.deep.equal(expected);
        });
        it("should sort the given complex type with the given compare function", () => {
            const complexType = {
                    metadata: {
                        type: "something",
                        format: "someFormat",
                        description: ""
                    },
                    values: [
                        {key: "high", value: 2},
                        {key: "low", value: 1},
                        {key: "mid", value: 3}
                    ]
                },
                expected = {
                    metadata: {
                        type: "something",
                        format: "someFormat",
                        description: ""
                    },
                    values: [
                        {key: "low", value: 1},
                        {key: "mid", value: 3},
                        {key: "high", value: 2}
                    ]
                },
                functionHelper = {
                    compareFunction: (a, b) => {
                        if (a.key === "low" && b.key !== "low") {
                            return -1;
                        }
                        else if (b.key === "low" && a.key !== "low") {
                            return 1;
                        }
                        else if (a.key === "mid" && b.key !== "mid") {
                            return -1;
                        }
                        else if (b.key === "mid" && a.key !== "mid") {
                            return 1;
                        }
                        return 1;
                    }
                };

            expect(sortComplexType(complexType, functionHelper.compareFunction)).to.deep.equal(expected);
        });
        it("should put an unknown key into the list as the lowest entry", () => {
            const complexType = {
                    metadata: {
                        type: "timeseries",
                        format: "DD.MM.YYYY, HH:mm",
                        description: ""
                    },
                    values: [
                        {key: undefined, value: 1},
                        {key: "12.04.2021, 18:00", value: 2},
                        {key: "10.06.2021, 17:48", value: 3}
                    ]
                },
                expected = {
                    metadata: {
                        type: "timeseries",
                        format: "DD.MM.YYYY, HH:mm",
                        description: ""
                    },
                    values: [
                        {key: undefined, value: 1},
                        {key: "12.04.2021, 18:00", value: 2},
                        {key: "10.06.2021, 17:48", value: 3}
                    ]
                };

            expect(sortComplexType(complexType)).to.deep.equal(expected);
        });
    });

    describe("convertComplexTypesToMultilinechart", () => {
        it("should return false, if complex data is not complete", () => {
            const complexData = {
                metadata: {
                    type: "timeseries",
                    format: "YYYY/YY",
                    description: "Anzahl"
                }
            };

            expect(convertComplexTypesToMultilinechart(complexData)).to.be.false;
        });
        it("should return false, if complex data is a empty object", () => {
            expect(convertComplexTypesToMultilinechart({})).to.be.false;
        });
        it("should return an empty object, if complexData is anything but an object", () => {
            expect(convertComplexTypesToMultilinechart(undefined)).to.be.false;
            expect(convertComplexTypesToMultilinechart(null)).to.be.false;
            expect(convertComplexTypesToMultilinechart(1)).to.be.false;
            expect(convertComplexTypesToMultilinechart("string")).to.be.false;
            expect(convertComplexTypesToMultilinechart(false)).to.be.false;
            expect(convertComplexTypesToMultilinechart([])).to.be.false;
        });

        it("should convert complex data to chartJS data", () => {
            const complexData = [
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Anzahl"
                        },
                        values: [
                            {key: "2019/20", value: 372},
                            {key: "2018/19", value: 392},
                            {key: "2017/18", value: 398},
                            {key: "2016/17", value: 381},
                            {key: "2015/16", value: 384}
                        ]
                    },
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Gewicht"
                        },
                        values: [
                            {key: "2019/20", value: 72},
                            {key: "2018/19", value: 92},
                            {key: "2017/18", value: 98},
                            {key: "2016/17", value: 81},
                            {key: "2015/16", value: 84}
                        ]
                    }
                ],
                expected = {
                    datasets: [
                        {
                            label: "Anzahl",
                            data: [
                                372,
                                392,
                                398,
                                381,
                                384
                            ],
                            backgroundColor: "rgba(46, 127, 210, 1)",
                            borderColor: "rgba(46, 127, 210, 1)",
                            borderWidth: 2,
                            fill: false,
                            lineTension: 0,
                            pointRadius: 4,
                            pointHoverRadius: 4,
                            spanGaps: false
                        },
                        {
                            label: "Gewicht",
                            data: [
                                72,
                                92,
                                98,
                                81,
                                84
                            ],
                            backgroundColor: "rgba(255, 217, 102, 1)",
                            borderColor: "rgba(255, 217, 102, 1)",
                            borderWidth: 2,
                            fill: false,
                            lineTension: 0,
                            pointRadius: 4,
                            pointHoverRadius: 4,
                            spanGaps: false
                        }
                    ],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypesToMultilinechart(complexData)).to.deep.equal(expected);
        });
        it("should convert complex data to chartJS data, if one element from complex data array are incomplete", () => {
            const complexData = [
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Anzahl"
                        },
                        values: undefined
                    },
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Gewicht"
                        },
                        values: [
                            {key: "2019/20", value: 72},
                            {key: "2018/19", value: 92},
                            {key: "2017/18", value: 98},
                            {key: "2016/17", value: 81},
                            {key: "2015/16", value: 84}
                        ]
                    }
                ],
                expected = {
                    datasets: [{
                        label: "Gewicht",
                        data: [
                            72,
                            92,
                            98,
                            81,
                            84
                        ],
                        backgroundColor: "rgba(255, 217, 102, 1)",
                        borderColor: "rgba(255, 217, 102, 1)",
                        borderWidth: 2,
                        fill: false,
                        lineTension: 0,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        spanGaps: false
                    }],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypesToMultilinechart(complexData)).to.deep.equal(expected);
        });
        it("should convert complex data to chartJS data, if one element from complex data array are incomplete", () => {
            const complexData = [
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Anzahl"
                        },
                        values: [
                            {key: "2019/20", value: ""},
                            {key: "2018/19", value: 392},
                            {key: "2017/18", value: 398},
                            {key: "2016/17", value: 381},
                            {key: "2015/16", value: 384}
                        ]
                    },
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Gewicht"
                        },
                        values: [
                            {key: "2019/20", value: 72},
                            {key: "2018/19", value: 92},
                            {key: "2017/18", value: 98},
                            {key: "2016/17", value: 81},
                            {key: "2015/16", value: 84}
                        ]
                    }
                ],
                expected = {
                    datasets: [
                        {
                            label: "Anzahl",
                            data: [
                                null,
                                392,
                                398,
                                381,
                                384
                            ],
                            backgroundColor: "rgba(46, 127, 210, 1)",
                            borderColor: "rgba(46, 127, 210, 1)",
                            borderWidth: 2,
                            fill: false,
                            lineTension: 0,
                            pointRadius: 4,
                            pointHoverRadius: 4,
                            spanGaps: false
                        },
                        {
                            label: "Gewicht",
                            data: [
                                72,
                                92,
                                98,
                                81,
                                84
                            ],
                            backgroundColor: "rgba(255, 217, 102, 1)",
                            borderColor: "rgba(255, 217, 102, 1)",
                            borderWidth: 2,
                            fill: false,
                            lineTension: 0,
                            pointRadius: 4,
                            pointHoverRadius: 4,
                            spanGaps: false
                        }
                    ],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypesToMultilinechart(complexData)).to.deep.equal(expected);
        });
        it("should convert complex data to chartJS data with given colors, if colors are given", () => {
            const complexData = [
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Anzahl"
                        },
                        values: [
                            {key: "2019/20", value: 372},
                            {key: "2018/19", value: 392},
                            {key: "2017/18", value: 398},
                            {key: "2016/17", value: 381},
                            {key: "2015/16", value: 384}
                        ]
                    },
                    {
                        metadata: {
                            type: "timeseries",
                            format: "YYYY/YY",
                            description: "Gewicht"
                        },
                        values: [
                            {key: "2019/20", value: 72},
                            {key: "2018/19", value: 92},
                            {key: "2017/18", value: 98},
                            {key: "2016/17", value: 81},
                            {key: "2015/16", value: 84}
                        ]
                    }
                ],
                lineColors = [[213, 94, 0, 1], [204, 121, 167, 1]],
                expected = {
                    datasets: [
                        {
                            label: "Anzahl",
                            data: [
                                372,
                                392,
                                398,
                                381,
                                384
                            ],
                            backgroundColor: "rgba(213, 94, 0, 1)",
                            borderColor: "rgba(213, 94, 0, 1)",
                            borderWidth: 2,
                            fill: false,
                            lineTension: 0,
                            pointRadius: 4,
                            pointHoverRadius: 4,
                            spanGaps: false
                        },
                        {
                            label: "Gewicht",
                            data: [
                                72,
                                92,
                                98,
                                81,
                                84
                            ],
                            backgroundColor: "rgba(204, 121, 167, 1)",
                            borderColor: "rgba(204, 121, 167, 1)",
                            borderWidth: 2,
                            fill: false,
                            lineTension: 0,
                            pointRadius: 4,
                            pointHoverRadius: 4,
                            spanGaps: false
                        }
                    ],
                    labels: [
                        "2019/20",
                        "2018/19",
                        "2017/18",
                        "2016/17",
                        "2015/16"
                    ]
                };

            expect(convertComplexTypesToMultilinechart(complexData, {}, lineColors)).to.deep.equal(expected);
        });
    });
    it("should convert complex data to chartJS data with given colors, if colors are given, with confined array", () => {
        const complexData = [
                {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Anzahl"
                    },
                    values: [
                        {key: "2019/20", value: 372},
                        {key: "2018/19", value: 392},
                        {key: "2017/18", value: 398},
                        {key: "2016/17", value: 381},
                        {key: "2015/16", value: 384}
                    ]
                },
                {
                    metadata: {
                        type: "timeseries",
                        format: "YYYY/YY",
                        description: "Gewicht"
                    },
                    values: [
                        {key: "2019/20", value: 72},
                        {key: "2018/19", value: 92},
                        {key: "2017/18", value: 98},
                        {key: "2016/17", value: 81},
                        {key: "2015/16", value: 84}
                    ]
                }
            ],
            lineColors = [[213, 94, 0, 1], [204, 121, 167, 1]],
            expected = {
                datasets: [
                    {
                        label: "Anzahl",
                        data: [
                            398,
                            381,
                            384
                        ],
                        backgroundColor: "rgba(213, 94, 0, 1)",
                        borderColor: "rgba(213, 94, 0, 1)",
                        borderWidth: 2,
                        fill: false,
                        lineTension: 0,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        spanGaps: false
                    },
                    {
                        label: "Gewicht",
                        data: [
                            98,
                            81,
                            84
                        ],
                        backgroundColor: "rgba(204, 121, 167, 1)",
                        borderColor: "rgba(204, 121, 167, 1)",
                        borderWidth: 2,
                        fill: false,
                        lineTension: 0,
                        pointRadius: 4,
                        pointHoverRadius: 4,
                        spanGaps: false
                    }
                ],
                labels: [
                    "2017/18",
                    "2016/17",
                    "2015/16"
                ]
            };

        expect(convertComplexTypesToMultilinechart(complexData, {}, lineColors, 3)).to.deep.equal(expected);
    });

    describe("changeMetadata", () => {
        it("should return false if anything but a complexType is given", () => {
            expect(changeMetadata(undefined)).to.be.false;
            expect(changeMetadata(null)).to.be.false;
            expect(changeMetadata("string")).to.be.false;
            expect(changeMetadata(1234)).to.be.false;
            expect(changeMetadata(true)).to.be.false;
            expect(changeMetadata(false)).to.be.false;
            expect(changeMetadata([])).to.be.false;
            expect(changeMetadata({})).to.be.false;
        });
        it("should return false if anything but a string is given as key", () => {
            const complexType = {
                metadata: {type: "timeseries", format: "format", description: "description"},
                values: [
                    {key: "key", value: "value"}
                ]
            };

            expect(changeMetadata(complexType, undefined)).to.be.false;
            expect(changeMetadata(complexType, null)).to.be.false;
            expect(changeMetadata(complexType, 1234)).to.be.false;
            expect(changeMetadata(complexType, true)).to.be.false;
            expect(changeMetadata(complexType, false)).to.be.false;
            expect(changeMetadata(complexType, [])).to.be.false;
            expect(changeMetadata(complexType, {})).to.be.false;
        });
        it("should change any entry in metadata and return true in doing so", () => {
            const complexType = {
                metadata: {type: "timeseries", format: "format", description: "description", anyentry: false},
                values: [
                    {key: "key", value: "value"}
                ]
            };

            expect(changeMetadata(complexType, "anyentry", true)).to.be.true;
            expect(complexType?.metadata?.anyentry).to.be.true;
        });
        it("should add any entry into metadata and return true in doing so", () => {
            const complexType = {
                metadata: {type: "timeseries", format: "format", description: "description"},
                values: [
                    {key: "key", value: "value"}
                ]
            };

            expect(changeMetadata(complexType, "anyentry", true)).to.be.true;
            expect(complexType?.metadata?.anyentry).to.be.true;
        });
    });
    describe("cloneComplexType", () => {
        it("should return a complex type", () => {
            const complexType = {
                    metadata: {type: "type", format: "format", description: "description"},
                    values: [
                        {key: "key", value: 1}
                    ]
                },
                clonedComplexType = cloneComplexType(complexType);

            expect(isComplexType(clonedComplexType)).to.be.true;
        });
        it("should clone the complex type", () => {
            const complexType = {
                    metadata: {type: "type", format: "format", description: "description"},
                    values: [
                        {key: "key", value: 1}
                    ]
                },
                expectedComplexType = {
                    metadata: {type: "type", format: "format", description: "description"},
                    values: [
                        {key: "key", value: 1}
                    ]
                },
                expectedClone = {
                    metadata: {type: "type_changed", format: "format_changed", description: "description_changed"},
                    values: [
                        {key: "key_changed", value: 2}
                    ]
                },
                clonedComplexType = cloneComplexType(complexType);

            clonedComplexType.metadata.type = "type_changed";
            clonedComplexType.metadata.format = "format_changed";
            clonedComplexType.metadata.description = "description_changed";
            clonedComplexType.values[0].key = "key_changed";
            clonedComplexType.values[0].value = 2;

            expect(clonedComplexType).to.deep.equal(expectedClone);
            expect(complexType).to.deep.equal(expectedComplexType);
        });
    });
    describe("hasComplexTypeValues", () => {
        it("should return false if the given complexType is anything but a ComplexType", () => {
            expect(hasComplexTypeValues(undefined)).to.be.false;
            expect(hasComplexTypeValues(null)).to.be.false;
            expect(hasComplexTypeValues("string")).to.be.false;
            expect(hasComplexTypeValues(1234)).to.be.false;
            expect(hasComplexTypeValues(true)).to.be.false;
            expect(hasComplexTypeValues(false)).to.be.false;
            expect(hasComplexTypeValues([])).to.be.false;
            expect(hasComplexTypeValues({})).to.be.false;
        });
        it("should return false if the given complexType does not include any valid information", () => {
            const complexType = {
                metadata: {type: "type", format: "format", description: "description"},
                values: [
                    {key: "keyA", value: undefined},
                    {key: "keyB", value: null},
                    {key: "keyC", value: ""}
                ]
            };

            expect(hasComplexTypeValues(complexType)).to.be.false;
        });
        it("should return true if the given complexType does include valid numeric information", () => {
            const complexType = {
                metadata: {type: "type", format: "format", description: "description"},
                values: [
                    {key: "keyA", value: undefined},
                    {key: "keyB", value: null},
                    {key: "keyOK", value: 0},
                    {key: "keyC", value: ""}
                ]
            };

            expect(hasComplexTypeValues(complexType)).to.be.true;
        });
        it("should return true if the given complexType does include valid string information", () => {
            const complexType = {
                metadata: {type: "type", format: "format", description: "description"},
                values: [
                    {key: "keyA", value: undefined},
                    {key: "keyB", value: null},
                    {key: "keyOK", value: "0"},
                    {key: "keyC", value: ""}
                ]
            };

            expect(hasComplexTypeValues(complexType)).to.be.true;
        });
    });

    describe("compareComplexTypesAndFillDataGaps", () => {
        it("should compare complexTypes and fill data gaps", () => {
            const fillValue = "fillValue",
                complexTypeA = {
                    metadata: {type: "type", format: "format", description: "description"},
                    values: [
                        {key: "keyA", value: 1},
                        {key: "keyB", value: 2},
                        {key: "keyC", value: 3}
                    ]
                },
                complexTypeB = {
                    metadata: {type: "type", format: "format", description: "description"},
                    values: [
                        {key: "keyA", value: 4},
                        {key: "keyB"},
                        {key: "keyD", value: 5}
                    ]
                },
                complexTypeC = {
                    metadata: {type: "type", format: "format", description: "description"},
                    values: [
                        {key: "keyB", value: 6},
                        {key: "keyE", value: 7}
                    ]
                },
                expected = [
                    {
                        metadata: {type: "type", format: "format", description: "description"},
                        values: [
                            {key: "keyA", value: 1},
                            {key: "keyB", value: 2},
                            {key: "keyC", value: 3},
                            {key: "keyD", value: "fillValue"},
                            {key: "keyE", value: "fillValue"}
                        ]
                    },
                    {
                        metadata: {type: "type", format: "format", description: "description"},
                        values: [
                            {key: "keyA", value: 4},
                            {key: "keyB", value: "fillValue"},
                            {key: "keyC", value: "fillValue"},
                            {key: "keyD", value: 5},
                            {key: "keyE", value: "fillValue"}
                        ]
                    },
                    {
                        metadata: {type: "type", format: "format", description: "description"},
                        values: [
                            {key: "keyA", value: "fillValue"},
                            {key: "keyB", value: 6},
                            {key: "keyC", value: "fillValue"},
                            {key: "keyD", value: "fillValue"},
                            {key: "keyE", value: 7}
                        ]
                    }
                ];

            expect(compareComplexTypesAndFillDataGaps([
                complexTypeA,
                complexTypeB,
                complexTypeC
            ], fillValue)).to.deep.equal(expected);
        });
    });
});
