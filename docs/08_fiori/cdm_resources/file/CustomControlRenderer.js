/*!
 * OpenUI5
 * (c) Copyright 2009-2024 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides default renderer for control sap.ui.layout.VerticalLayout
sap.ui.define([
], function () {
    "use strict";

    /**
     * ListitemBase renderer.
     *
     * @namespace
     */
    var Renderer = {
        apiVersion: 2
    };

    /**
     * Renders the HTML for the given control, using the provided.
     *
     * {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} rm The RenderManager that can be used for writing to the Render-Output-Buffer.
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered.
     * @public
     */
    Renderer.render = function (rm, oControl) {
        var id = oControl.getId();

        rm.openStart("div", id)
            .class("cdm-custom-control")
            .openEnd(); {
        } rm.close("div");
    };

    return Renderer;
});
