import ScreenPrintComponent from "./components/ScreenPrint.vue";
import ScreenPrintStore from "./store/index";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: ScreenPrintComponent,
    store: ScreenPrintStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
