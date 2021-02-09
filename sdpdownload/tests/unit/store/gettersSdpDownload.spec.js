import {expect} from "chai";
import stateSdpDownload from "../../../store/stateSdpDownload";



describe("addons/SdpDownload/store/gettersSdpDownload", function () {
    it("returns the active from state", function () {
        expect(stateSdpDownload.active).to.be.false;
    });
    it("returns the id from state", function () {
        expect(stateSdpDownload.id).to.be.equal("SdpAddon");
    });

    describe("testing default values", function () {
        it("returns the name default value from state", function () {
            expect(stateSdpDownload.name).to.be.equal("SDP Download");
        });
        it("returns the glyphicon default value from state", function () {
            expect(stateSdpDownload.glyphicon).to.be.equal("glyphicon-download");
        });
        it("returns the renderToWindow default value from state", function () {
            expect(stateSdpDownload.renderToWindow).to.be.false;
        });
        it("returns the resizableWindow default value from state", function () {
            expect(stateSdpDownload.resizableWindow).to.be.true;
        });
        it("returns the isVisibleInMenu default value from state", function () {
            expect(stateSdpDownload.isVisibleInMenu).to.be.true;
        });
        it("returns the deactivateGFI default value from state", function () {
            expect(stateSdpDownload.deactivateGFI).to.be.true;
        });
        it("returns the renderToSidebar default value from state", function () {
            expect(stateSdpDownload.renderToSidebar).to.be.true;
        });
        it("returns the wmsRasterLayerId default value from state", function () {
            expect(stateSdpDownload.wmsRasterLayerId).to.be.equal("4707")
        });
        it("returns the formats default value from state", function () {
            expect(stateSdpDownload.formats).to.be.eql([
                {id: "NAS", label: "", isSelected: true, desc: "", fileId: "nas"},
                {id: "DWG_310", label: "", isSelected: false, desc: "", fileId: "dwg310"},
                {id: "DWG_320", label: "", isSelected: false, desc: "", fileId: "dwg320"},
                {id: "JPG", label: "", isSelected: false, desc: "", fileId: "jpg"}
            ])
        });
        it("returns the selectedFormat default value from state", function () {
            expect(stateSdpDownload.selectedFormat).to.be.equal("NAS");
        });
        it("returns the compressDataId default value from state", function () {
            expect(stateSdpDownload.compressDataId).to.be.equal("compressData");
        });
        it("returns the compressedFileId default value from state", function () {
            expect(stateSdpDownload.compressedFileId).to.be.equal("compressedFile");
        });
        it("returns the wfsRasterParams default value from state", function () {
            expect(stateSdpDownload.wfsRasterParams).to.be.eql({
                url: "https://geodienste.hamburg.de/HH_WFS_Uebersicht_Kachelbezeichnungen",
                request: "GetFeature",
                service: "WFS",
                version: "1.1.0",
                typename: "app:lgv_kachel_dk5_1km_utm"
            });
        });
        it("returns the overviewDownloadLocation default value from state", function () {
            expect(stateSdpDownload.overviewDownloadLocation).to.be.equal("U:\\Kachel_Uebersichten\\UTM_Kachel_1KM_");
        });
        it("returns the wfsRaster default value from state", function () {
            expect(stateSdpDownload.wfsRaster).to.be.eql({});
        });
        it("returns the graphicalSelectModel default value from state", function () {
            expect(stateSdpDownload.graphicalSelectModel).to.be.eql({});
        });
        it("returns the selectedRasterLimit default value from state", function () {
            expect(stateSdpDownload.selectedRasterLimit).to.be.equal(9);
        });
        it("returns the rasterNames default value from state", function () {
            expect(stateSdpDownload.rasterNames).to.be.eql([]);
        });
    });
});