sap.ui.define([
    "sap/ui/core/Control",
    "cdm/ui/control/CustomControlRenderer"
], (Control, CustomControlRenderer) => {
    "use strict";

    return Control.extend("cdm.ui.control.CustomControlRenderer", {
        metadata: {
            properties: {
                text: { type: "string", defaultValue: "" },
            },
            renderer: CustomControlRenderer
        },
    });
});