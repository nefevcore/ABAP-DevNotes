sap.ui.define([
    "sap/ui/core/Control",
    "cdm/ui/control/MonitorBackgroundRenderer",
], function (
    Control, MonitorBackgroundRenderer
) {
    "use strict";

    return Control.extend("cdm.ui.control.MonitorBackground", {
        metadata: {
            properties: {
                // 背景图片URL
                src: { type: "string", defaultValue: "" },
                // 背景位置
                position: { type: "string", defaultValue: "center center" },
                // 背景大小
                size: { type: "string", defaultValue: "cover" },
                // 背景重复
                repeat: { type: "string", defaultValue: "no-repeat" },
                // 透明度
                opacity: { type: "float", defaultValue: 1 },
                // Z轴层级
                zIndex: { type: "int", defaultValue: 0 },
                // 是否固定背景
                fixed: { type: "boolean", defaultValue: false },
                // 背景颜色（图片加载失败时显示）
                backgroundColor: { type: "string", defaultValue: "transparent" }
            },
            aggregations: {},
            events: {},
            renderer: MonitorBackgroundRenderer
        }
    });
});