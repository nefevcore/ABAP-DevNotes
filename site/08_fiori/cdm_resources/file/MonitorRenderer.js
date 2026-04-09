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
        var oMonitor = oControl;
        var id = oMonitor.getId();

        // 大屏容器
        rm.openStart("div", id)
            .class("cdm-monitor-container")
            .openEnd(); {

            // 背景
            var aBackgrounds = oMonitor.getAggregation("backgrounds") || [];
            aBackgrounds.forEach(function (oBackground) {
                rm.renderControl(oBackground);
            });

            // 抬头
            var oHeader = oMonitor.getAggregation("header");
            if (oHeader) {
                rm.renderControl(oHeader);
            }

            // 组件
            rm.openStart("main", id)
                .class("cdm-monitor-main")
                .class(oControl.getGridName())
                .openEnd(); {
                var aComponents = oMonitor.getAggregation("components") || [];
                aComponents.forEach((oComponent) => {
                    rm.renderControl(oComponent);
                });
            } rm.close("main");

        } rm.close("div");
    };

    return Renderer;
});