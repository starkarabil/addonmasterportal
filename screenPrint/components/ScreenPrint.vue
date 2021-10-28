<script>
import {mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersScreenPrint";
import mutations from "../store/mutationsScreenPrint";

export default {
    name: "ScreenPrint",
    computed: {
        ...mapGetters("Tools/ScreenPrint", Object.keys(getters))
    },
    watch: {
        /**
         * Listens to the active property change.
         * @param {Boolean} isActive Value deciding whether the tool gets activated or deactivated.
         * @returns {void}
         */
        active () {
            this.reset();
        }
    },
    /**
     * Put initialize here if mounting occurs after config parsing
     * @returns {void}
     */
    mounted () {
        this.applyTranslationKey(this.name);
    },
    methods: {
        ...mapMutations("Tools/ScreenPrint", Object.keys(mutations)),

        reset () {
            /* var headstr = "<html><head><title>Header</title></head><body>";
            var footstr = "Footer</body>";
            var newstr = document.getElementById("masterportal-container").innerHTML;
            var oldstr = document.body.innerHTML;

            document.body.innerHTML = headstr + newstr + footstr;*/

            // var oldstr = document.body.innerHTML;

            /* document.body.innerHTML = "<html><head><title>Header</title></head><body>TEST</body></html>";
            window.print();
            document.body.innerHTML = oldstr;*/

            // document.body.innerHTML = oldstr;

            let windowContent = "<!DOCTYPE html>";

            windowContent += "<html>";
            windowContent += "<head><title>Print canvas</title></head>";
            windowContent += "<body>";
            // windowContent += document.body.innerHTML;
            // windowContent += document.getElementsByClassName("legend")[0];
            windowContent += "</body>";
            windowContent += "</html>";

            /* const legend = document.getElementsByClassName("legend")[0],
                printWin = window.open("", "", "width=950, height=650"),
                element = document.createElement("div"),
                // logo = document.getElementById("logo");*/

            const canvas = document.getElementsByTagName("canvas")[0];

            let img = new Image(),
                newWin = window.open("", "", "width=950, height=650");

            img.src = canvas.toDataURL();
            newWin.document.write(img.outerHTML);
            newWin.print();

            // img.src = canvas.toDataURL();
            // newWin.document.write(img.outerHTML);
            // newWin.print();


            // element.appendChild(logo);
            // element.appendChild(img);
            // element.appendChild(legend);

            // printWin.document.open();
            // printWin.document.location.replace(self.location.href);
            // printWin.document.write(element.outerHTML);
            // printWin.document.close();
            // printWin.focus();
            // printWin.print();
            // printWin.close();

            // window.print();

            return true;
        }
    }
};
</script>

<template lang="html">
    <div>&nbsp;</div>
</template>

<style>
    @media print {
        #legend .legend-window {
            display: block;
            background-color: #000;
            position: fixed;
        }
        body * {
            visibility: visible;
            background-color: #2b542c;
        }
        nav * {
            visibility: hidden;
        }
        ul * {
            visibility: hidden;
        }
        #section-to-print, #section-to-print * {
            visibility: visible;
        }
        #section-to-print {
            position: absolute;
            left: 0;
            top: 0;
        }
    }
    @media screen {
        h1 {
            text-align: right;
            border-bottom: 3px dashed #00f;
            color: #008;
            background-color: inherit;
        }
    }
</style>
