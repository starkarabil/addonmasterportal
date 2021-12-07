/**
 * User type definition
 * @typedef {Object} populationRequestState
 * @property {Boolean} active if true, PopulationRequest will be rendered
 * @property {String} id id of the PopulationRequest component
 * @property {String} glyphicon icon next to title (config-param)
 * @property {Boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {Boolean} resizableWindow if true, window is resizable (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {Boolean} rasterActive is the rasterLayer active
 * @property {Boolean} alkisAdressesActive is the alkisAdressesLayer active
 * @property {Number} populationReqServiceId id of the population Request
 * @property {String} wpsId The id of the used web processing service.
 * @property {String} fmwProcess FME process triggered via the WPS.
 */
const state = {
    active: false,
    id: "populationRequest",
    // defaults for config.json parameters
    name: "translate#additional:modules.tools.populationRequest.title",
    glyphicon: "glyphicon-wrench",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    rasterActive: false,
    alkisAdressesActive: false,
    populationReqServiceId: 2,
    wpsId: "1001",
    fmwProcess: "einwohner_ermitteln.fmw"
};

export default state;
