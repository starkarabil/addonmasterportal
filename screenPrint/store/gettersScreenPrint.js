
import {generateSimpleGetters} from ".../../../src/app-store/utils/generators";
import screenPrintState from "./stateScreenPrint";

const getters = {
    ...generateSimpleGetters(screenPrintState)
};

export default getters;
