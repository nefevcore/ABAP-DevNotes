sap.ui.define([
    "sap/ui/core/Control",
    "cdm/ui/control/MonitorRenderer",
], function (
    Control,
    MonitorRenderer
) {
    "use strict";

    return Control.extend("cdm.ui.control.Monitor", {
        metadata: {
            properties: {
                gridName: { type: "string", defaultValue: "" },
            },
            aggregations: {
                header: { type: "cdm.ui.control.MonitorHeader", multiple: false, defaultValue: null },
                components: { type: "cdm.ui.control.MonitorComponent", multiple: true, defaultValue: null, singularName: "component" },
                backgrounds: { type: "cdm.ui.control.MonitorBackground", multiple: true, defaultValue: null, singularName: "background" },
            },
            renderer: MonitorRenderer
        },
    });
});