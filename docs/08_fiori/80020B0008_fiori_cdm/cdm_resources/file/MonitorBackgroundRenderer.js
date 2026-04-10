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
        var sSrc = oControl.getSrc();
        var sPosition = oControl.getPosition();
        var sSize = oControl.getSize();
        var sRepeat = oControl.getRepeat();
        var fOpacity = oControl.getOpacity();
        var iZIndex = oControl.getZIndex();
        var bFixed = oControl.getFixed();
        var sBackgroundColor = oControl.getBackgroundColor();

        rm.openStart("div", oControl.getId())
            .class("cdm-monitor-background")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("z-index", iZIndex)
            .style("pointer-events", "none");

        // 设置背景样式
        if (sSrc) {
            var sBackgroundImage = `url('${sSrc}')`;
            var sBackgroundAttachment = bFixed ? "fixed" : "scroll";

            rm.style("background-image", sBackgroundImage)
                .style("background-position", sPosition)
                .style("background-size", sSize)
                .style("background-repeat", sRepeat)
                .style("background-attachment", sBackgroundAttachment)
                .style("opacity", fOpacity.toString())
                .style("background-color", sBackgroundColor);
        } else {
            rm.style("background-color", sBackgroundColor);
        }

        rm.openEnd().close("div");
    };

    return Renderer;
});