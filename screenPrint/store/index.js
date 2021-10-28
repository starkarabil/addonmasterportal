import getters from "./gettersScreenPrint";
import mutations from "./mutationsScreenPrint";
import state from "./stateScreenPrint";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
