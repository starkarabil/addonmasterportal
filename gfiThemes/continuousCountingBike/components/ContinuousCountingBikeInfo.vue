<script>
export default {
    name: "ContinuousCountingBikeInfo",
    props: {
        properties: {
            type: Array,
            required: true
        }
    }
};
</script>

<template>
    <div class="tab-content">
        <div
            class="tab-pane fade in active"
        >
            <div class="imageContinuousCountingBikeDiv">
            </div>
            <table class="table table-striped">
                <tbody>
                    <tr
                        colspan="3"
                        class="bold"
                    >
                        <td class="subHeader">
                        </td>
                        <td>
                            {{ $t("additional:modules.tools.gfi.themes.continuousCountingBike.timeframe") }}
                        </td>
                        <td>
                            {{ $t("additional:modules.tools.gfi.themes.continuousCountingBike.bikes") }}
                        </td>
                    </tr>
                    <tr
                        v-for="(value, key) in properties"
                        :key="key"
                    >
                        <td class="subHeader bold">
                            {{ value.attrName }}
                        </td>
                        <td
                            v-if="(Array.isArray(value.attrValue))"
                        >
                            {{ value.attrValue[0] }}
                        </td>
                        <td
                            v-if="(Array.isArray(value.attrValue))"
                        >
                            {{ value.attrValue[1] }}
                        </td>
                        <td
                            v-else
                        >
                            {{ value.attrValue }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="less" scoped>
.continuousCountingBike {
    overflow: hidden;
    .subHeader{
        font-family: 'MasterPortalFont Bold','Arial Narrow',Arial,sans-serif;
    }
     #table-data-container {
        margin:6px 15px 0 12px;
        table {
            margin: 0;
            td, th {
                padding: 6px;
            }
        }
    }
}
</style>

