我来将 ECharts 主题文件中的可配置项替换为对应的 CSS 变量。主要替换颜色值为 `--cdm-*` 变量。

```json
{
    "color": [
        "var(--cdm-color-primary)",
        "var(--cdm-color-accent)",
        "var(--cdm-color-success)",
        "var(--cdm-color-error)",
        "var(--cdm-color-highlight)",
        "var(--cdm-color-warning)",
        "var(--cdm-color-primary-light)",
        "var(--cdm-color-primary-dark)",
        "var(--cdm-color-accent-light)"
    ],
    "backgroundColor": "var(--cdm-color-bg-primary)",
    "textStyle": {},
    "title": {
        "textStyle": {
            "color": "var(--cdm-color-text-primary)"
        },
        "subtextStyle": {
            "color": "var(--cdm-color-text-secondary)"
        }
    },
    "line": {
        "itemStyle": {
            "borderWidth": 1
        },
        "lineStyle": {
            "width": 2
        },
        "symbolSize": 4,
        "symbol": "emptyCircle",
        "smooth": false
    },
    "radar": {
        "itemStyle": {
            "borderWidth": 1
        },
        "lineStyle": {
            "width": 2
        },
        "symbolSize": 4,
        "symbol": "emptyCircle",
        "smooth": false
    },
    "bar": {
        "itemStyle": {
            "barBorderWidth": 0,
            "barBorderColor": "var(--cdm-color-border-medium)"
        }
    },
    "pie": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        }
    },
    "scatter": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        }
    },
    "boxplot": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        }
    },
    "parallel": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        }
    },
    "sankey": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        }
    },
    "funnel": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        }
    },
    "gauge": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        }
    },
    "candlestick": {
        "itemStyle": {
            "color": "var(--cdm-color-error)",
            "color0": "var(--cdm-color-success)",
            "borderColor": "var(--cdm-color-error)",
            "borderColor0": "var(--cdm-color-success)",
            "borderWidth": 1
        }
    },
    "graph": {
        "itemStyle": {
            "borderWidth": 0,
            "borderColor": "var(--cdm-color-border-medium)"
        },
        "lineStyle": {
            "width": 1,
            "color": "var(--cdm-color-border-medium)"
        },
        "symbolSize": 4,
        "symbol": "emptyCircle",
        "smooth": false,
        "color": [
            "var(--cdm-color-primary)",
            "var(--cdm-color-accent)",
            "var(--cdm-color-success)",
            "var(--cdm-color-error)",
            "var(--cdm-color-highlight)",
            "var(--cdm-color-warning)",
            "var(--cdm-color-primary-light)",
            "var(--cdm-color-primary-dark)",
            "var(--cdm-color-accent-light)"
        ],
        "label": {
            "color": "var(--cdm-color-text-primary)"
        }
    },
    "map": {
        "itemStyle": {
            "areaColor": "var(--cdm-color-bg-surface)",
            "borderColor": "var(--cdm-color-border-heavy)",
            "borderWidth": 0.5
        },
        "label": {
            "color": "var(--cdm-color-text-primary)"
        },
        "emphasis": {
            "itemStyle": {
                "areaColor": "var(--cdm-color-primary-soft)",
                "borderColor": "var(--cdm-color-primary)",
                "borderWidth": 1
            },
            "label": {
                "color": "var(--cdm-color-accent)"
            }
        }
    },
    "geo": {
        "itemStyle": {
            "areaColor": "var(--cdm-color-bg-surface)",
            "borderColor": "var(--cdm-color-border-heavy)",
            "borderWidth": 0.5
        },
        "label": {
            "color": "var(--cdm-color-text-primary)"
        },
        "emphasis": {
            "itemStyle": {
                "areaColor": "var(--cdm-color-primary-soft)",
                "borderColor": "var(--cdm-color-primary)",
                "borderWidth": 1
            },
            "label": {
                "color": "var(--cdm-color-accent)"
            }
        }
    },
    "categoryAxis": {
        "axisLine": {
            "show": true,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisTick": {
            "show": true,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisLabel": {
            "show": true,
            "color": "var(--cdm-color-text-secondary)"
        },
        "splitLine": {
            "show": false,
            "lineStyle": {
                "color": [
                    "var(--cdm-color-border-light)"
                ]
            }
        },
        "splitArea": {
            "show": false,
            "areaStyle": {
                "color": [
                    "var(--cdm-color-border-ultralight)",
                    "transparent"
                ]
            }
        }
    },
    "valueAxis": {
        "axisLine": {
            "show": false,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisTick": {
            "show": false,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisLabel": {
            "show": true,
            "color": "var(--cdm-color-text-secondary)"
        },
        "splitLine": {
            "show": true,
            "lineStyle": {
                "color": [
                    "var(--cdm-color-border-light)"
                ]
            }
        },
        "splitArea": {
            "show": false,
            "areaStyle": {
                "color": [
                    "var(--cdm-color-border-ultralight)",
                    "transparent"
                ]
            }
        }
    },
    "logAxis": {
        "axisLine": {
            "show": false,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisTick": {
            "show": false,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisLabel": {
            "show": true,
            "color": "var(--cdm-color-text-secondary)"
        },
        "splitLine": {
            "show": true,
            "lineStyle": {
                "color": [
                    "var(--cdm-color-border-light)"
                ]
            }
        },
        "splitArea": {
            "show": false,
            "areaStyle": {
                "color": [
                    "var(--cdm-color-border-ultralight)",
                    "transparent"
                ]
            }
        }
    },
    "timeAxis": {
        "axisLine": {
            "show": true,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisTick": {
            "show": true,
            "lineStyle": {
                "color": "var(--cdm-color-text-muted)"
            }
        },
        "axisLabel": {
            "show": true,
            "color": "var(--cdm-color-text-secondary)"
        },
        "splitLine": {
            "show": false,
            "lineStyle": {
                "color": [
                    "var(--cdm-color-border-light)"
                ]
            }
        },
        "splitArea": {
            "show": false,
            "areaStyle": {
                "color": [
                    "var(--cdm-color-border-ultralight)",
                    "transparent"
                ]
            }
        }
    },
    "toolbox": {
        "iconStyle": {
            "borderColor": "var(--cdm-color-text-muted)"
        },
        "emphasis": {
            "iconStyle": {
                "borderColor": "var(--cdm-color-text-primary)"
            }
        }
    },
    "legend": {
        "textStyle": {
            "color": "var(--cdm-color-text-secondary)"
        },
        "left": "center",
        "right": "auto",
        "top": "auto",
        "bottom": 15
    },
    "tooltip": {
        "axisPointer": {
            "lineStyle": {
                "color": "var(--cdm-color-border-light)",
                "width": 1
            },
            "crossStyle": {
                "color": "var(--cdm-color-border-light)",
                "width": 1
            }
        }
    },
    "timeline": {
        "lineStyle": {
            "color": "var(--cdm-color-primary)",
            "width": 2
        },
        "itemStyle": {
            "color": "var(--cdm-color-border-heavy)",
            "borderWidth": 1
        },
        "controlStyle": {
            "color": "var(--cdm-color-border-heavy)",
            "borderColor": "var(--cdm-color-border-heavy)",
            "borderWidth": 1
        },
        "checkpointStyle": {
            "color": "var(--cdm-color-primary-light)",
            "borderColor": "var(--cdm-color-text-primary)"
        },
        "label": {
            "color": "var(--cdm-color-text-muted)"
        },
        "emphasis": {
            "itemStyle": {
                "color": "var(--cdm-color-text-primary)"
            },
            "controlStyle": {
                "color": "var(--cdm-color-border-heavy)",
                "borderColor": "var(--cdm-color-border-heavy)",
                "borderWidth": 1
            },
            "label": {
                "color": "var(--cdm-color-text-muted)"
            }
        }
    },
    "visualMap": {
        "color": [
            "var(--cdm-color-error)",
            "var(--cdm-color-warning)",
            "var(--cdm-color-accent-light)"
        ]
    },
    "markPoint": {
        "label": {
            "color": "var(--cdm-color-text-primary)"
        },
        "emphasis": {
            "label": {
                "color": "var(--cdm-color-text-primary)"
            }
        }
    },
    "grid": {
        "left": "15%",
        "right": "10%",
        "top": 65,
        "bottom": 80
    }
}
```

主要替换规则：

1. 主色系 → `--cdm-color-primary` 系列
2. 背景色 → `--cdm-color-bg-*` 系列
3. 文本色 → `--cdm-color-text-*` 系列
4. 边框色 → `--cdm-color-border-*` 系列
5. 语义色 → `--cdm-color-*` (success/error/warning等)
6. RGBA值 → 对应的变量或组合变量
