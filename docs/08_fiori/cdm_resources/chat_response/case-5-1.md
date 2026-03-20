这是根据您提供的 ECharts 主题 JSON 文件和 CSS 变量文件，将所有可配置项替换为具体颜色值后的结果：

```json
{
    "version": 1,
    "themeName": "cdm-tech-theme",
    "theme": {
        "seriesCnt": "3",
        "backgroundColor": "rgba(0, 0, 0, 0)",
        "titleColor": "#ffffff",
        "subtitleColor": "#c8d9ff",
        "textColorShow": false,
        "textColor": "#ffffff",
        "markTextColor": "#ffffff",
        "color": [
            "#5a8eff",
            "#ffb74d",
            "#4cd964",
            "#ff6b6b",
            "#00e5ff",
            "#ffa726",
            "#7dabff",
            "#3a5fc8",
            "#ffd180"
        ],
        "borderColor": "rgba(90, 142, 255, 0.35)",
        "borderWidth": 0,
        "visualMapColor": [
            "#ff6b6b",
            "#ffa726",
            "#ffd180"
        ],
        "legendTextColor": "#c8d9ff",
        "kColor": "#ff6b6b",
        "kColor0": "#4cd964",
        "kBorderColor": "#ff6b6b",
        "kBorderColor0": "#4cd964",
        "kBorderWidth": 1,
        "lineWidth": 2,
        "symbolSize": 4,
        "symbol": "emptyCircle",
        "symbolBorderWidth": 1,
        "lineSmooth": false,
        "graphLineWidth": 1,
        "graphLineColor": "rgba(90, 142, 255, 0.35)",
        "mapLabelColor": "#ffffff",
        "mapLabelColorE": "#ffb74d",
        "mapBorderColor": "rgba(90, 142, 255, 0.5)",
        "mapBorderColorE": "#5a8eff",
        "mapBorderWidth": 0.5,
        "mapBorderWidthE": 1,
        "mapAreaColor": "#1a274d",
        "mapAreaColorE": "rgba(90, 142, 255, 0.15)",
        "axes": [
            {
                "type": "all",
                "name": "General Axis",
                "axisLineShow": true,
                "axisLineColor": "#a0b5ff",
                "axisTickShow": true,
                "axisTickColor": "#a0b5ff",
                "axisLabelShow": true,
                "axisLabelColor": "#c8d9ff",
                "splitLineShow": true,
                "splitLineColor": [
                    "rgba(90, 142, 255, 0.2)"
                ],
                "splitAreaShow": false,
                "splitAreaColor": [
                    "rgba(90, 142, 255, 0.08)",
                    "rgba(90, 142, 255, 0)"
                ]
            },
            {
                "type": "category",
                "name": "Category Axis",
                "axisLineShow": true,
                "axisLineColor": "#a0b5ff",
                "axisTickShow": true,
                "axisTickColor": "#a0b5ff",
                "axisLabelShow": true,
                "axisLabelColor": "#c8d9ff",
                "splitLineShow": false,
                "splitLineColor": [
                    "rgba(90, 142, 255, 0.2)"
                ],
                "splitAreaShow": false,
                "splitAreaColor": [
                    "rgba(90, 142, 255, 0.08)",
                    "rgba(90, 142, 255, 0)"
                ]
            },
            {
                "type": "value",
                "name": "Value Axis",
                "axisLineShow": false,
                "axisLineColor": "#a0b5ff",
                "axisTickShow": false,
                "axisTickColor": "#a0b5ff",
                "axisLabelShow": true,
                "axisLabelColor": "#c8d9ff",
                "splitLineShow": true,
                "splitLineColor": [
                    "rgba(90, 142, 255, 0.2)"
                ],
                "splitAreaShow": false,
                "splitAreaColor": [
                    "rgba(90, 142, 255, 0.08)",
                    "rgba(90, 142, 255, 0)"
                ]
            },
            {
                "type": "log",
                "name": "Log Axis",
                "axisLineShow": false,
                "axisLineColor": "#a0b5ff",
                "axisTickShow": false,
                "axisTickColor": "#a0b5ff",
                "axisLabelShow": true,
                "axisLabelColor": "#c8d9ff",
                "splitLineShow": true,
                "splitLineColor": [
                    "rgba(90, 142, 255, 0.2)"
                ],
                "splitAreaShow": false,
                "splitAreaColor": [
                    "rgba(90, 142, 255, 0.08)",
                    "rgba(90, 142, 255, 0)"
                ]
            },
            {
                "type": "time",
                "name": "Time Axis",
                "axisLineShow": true,
                "axisLineColor": "#a0b5ff",
                "axisTickShow": true,
                "axisTickColor": "#a0b5ff",
                "axisLabelShow": true,
                "axisLabelColor": "#c8d9ff",
                "splitLineShow": false,
                "splitLineColor": [
                    "rgba(90, 142, 255, 0.2)"
                ],
                "splitAreaShow": false,
                "splitAreaColor": [
                    "rgba(90, 142, 255, 0.08)",
                    "rgba(90, 142, 255, 0)"
                ]
            }
        ],
        "axisSeperateSetting": true,
        "toolboxColor": "#a0b5ff",
        "toolboxEmphasisColor": "#ffffff",
        "tooltipAxisColor": "rgba(90, 142, 255, 0.2)",
        "tooltipAxisWidth": 1,
        "timelineLineColor": "#5a8eff",
        "timelineLineWidth": 2,
        "timelineItemColor": "rgba(90, 142, 255, 0.5)",
        "timelineItemColorE": "#ffffff",
        "timelineCheckColor": "#7dabff",
        "timelineCheckBorderColor": "#ffffff",
        "timelineItemBorderWidth": 1,
        "timelineControlColor": "rgba(90, 142, 255, 0.5)",
        "timelineControlBorderColor": "rgba(90, 142, 255, 0.5)",
        "timelineControlBorderWidth": 1,
        "timelineLabelColor": "#a0b5ff",
        "gridLeft": "15%",
        "gridRight": "10%",
        "gridTop": 65,
        "gridBottom": 80,
        "legendLeft": "center",
        "legendRight": "auto",
        "legendTop": "auto",
        "legendBottom": 15
    }
}
```

### 主要替换逻辑说明

1. **主色系**：使用 `#5a8eff` 作为主要主题色
2. **文本颜色**：标题使用 `#ffffff`，次要文本使用 `#c8d9ff`，辅助文本使用 `#a0b5ff`
3. **语义颜色**：
   - 成功/正向：`#4cd964`
   - 警告/注意：`#ffa726`/`#ffb74d`
   - 错误/负向：`#ff6b6b`
   - 高亮：`#00e5ff`
4. **边框颜色**：使用带有透明度的主色系列，如 `rgba(90, 142, 255, 0.2)`
5. **分割线/网格线**：使用 `rgba(90, 142, 255, 0.2)`
6. **背景色**：根据上下文使用 `#1a274d`（表面色）或 `#121c3a`（次级背景）
7. **强调色**：使用 `#ffb74d` 作为辅助强调色
8. **透明效果**：保留原主题中的透明度分层逻辑，使用主色系列的透明度变体
