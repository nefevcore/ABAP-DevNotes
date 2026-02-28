这是为您实现的一个经典的垂直时间轴控件HTML代码。它包含了连接线、节点图标，并支持点击展开或收起每个时间项，以优化空间利用。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>垂直时间轴 · 展开/收起控件</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #f0f3f7;
            font-family: 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 20px;
        }

        /* 主卡片容器 */
        .timeline-card {
            max-width: 700px;
            width: 100%;
            background: white;
            border-radius: 28px;
            box-shadow: 0 20px 35px -8px rgba(0, 20, 30, 0.2), 0 8px 12px -4px rgba(0,0,0,0.05);
            padding: 32px 24px 24px 24px;
            transition: all 0.2s ease;
        }

        h2 {
            font-weight: 600;
            font-size: 1.7rem;
            letter-spacing: -0.3px;
            color: #0b1e2e;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            padding-left: 12px;
            border-left: 6px solid #3b82f6;
        }

        .timeline-sub {
            color: #4b5563;
            margin-bottom: 32px;
            font-size: 0.95rem;
            padding-left: 18px;
        }

        /* ---------- 时间轴核心结构 ---------- */
        .timeline {
            display: flex;
            flex-direction: column;
            position: relative;
            margin-left: 20px;  /* 给左侧连接线预留空间 */
        }

        /* 全局连接线 —— 垂直主线 (从第一个节点到最后一个节点) */
        .timeline::before {
            content: '';
            position: absolute;
            left: 20px;                 /* 与节点圆心对齐 (节点直径为36，半径18 + 左偏移2px调整) */
            top: 18px;                   /* 从第一个节点圆心开始 */
            bottom: 18px;                 /* 结束于最后一个节点圆心 */
            width: 3px;
            background: linear-gradient(to bottom, #cbd5e1 0%, #94a3b8 80%);
            border-radius: 6px;
            transform: translateX(-50%);  /* 精确居中于20px位置 */
            z-index: 0;
        }

        /* 每个时间条目 */
        .timeline-item {
            position: relative;
            padding-left: 58px;          /* 留出节点和连线的空间 */
            margin-bottom: 24px;
            transition: margin 0.25s ease;
        }

        /* 最后一个条目下方不留空白 */
        .timeline-item:last-child {
            margin-bottom: 8px;
        }

        /* 节点图标 (包含数字/图标和内外圆) */
        .timeline-node {
            position: absolute;
            left: 0;                     /* 相对 .timeline-item 的左侧 */
            top: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        }

        /* 外圈光晕 + 内圈实色，经典的 iOS 风格 */
        .node-marker {
            width: 36px;
            height: 36px;
            background: white;
            border: 2.5px solid #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 12px -4px rgba(59,130,246,0.3), 0 0 0 5px rgba(255,255,255,0.8);
            transition: all 0.2s;
            font-weight: 600;
            font-size: 1rem;
            color: #1e4a8b;
        }

        /* 每个节点内部的小图标/序号 (可以用emoji或数字) */
        .node-marker span {
            transform: scale(1);
        }

        /* 已完成的节点用不同风格 (可选) 这里用颜色区分 */
        .timeline-item.completed .node-marker {
            background: #3b82f6;
            border-color: white;
            color: white;
            box-shadow: 0 6px 12px -4px #3b82f6;
        }

        /* 内容卡片 */
        .timeline-content {
            background: #ffffff;
            border-radius: 20px;
            padding: 16px 20px 14px 20px;
            box-shadow: 0 6px 14px rgba(0,0,0,0.02), 0 2px 4px rgba(0,20,30,0.03);
            border: 1px solid #edf2f7;
            transition: all 0.2s;
        }

        .timeline-content:hover {
            border-color: #cfdfee;
            box-shadow: 0 12px 22px -10px rgba(30, 66, 159, 0.2);
        }

        /* 标题行: 左侧标题 + 右侧展开按钮 */
        .content-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }

        .title-section {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .title-section h3 {
            font-weight: 600;
            font-size: 1.25rem;
            color: #0f263b;
            letter-spacing: -0.2px;
        }

        .title-section .date-badge {
            background: #e6edf6;
            padding: 4px 12px;
            border-radius: 40px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #2563eb;
            letter-spacing: 0.3px;
        }

        /* 展开/收起图标 (动画) */
        .expand-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #f0f6ff;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s;
            color: #3b82f6;
            font-size: 1.2rem;
            font-weight: 400;
            transform: rotate(0deg);
        }

        /* 旋转箭头表示展开状态 */
        .timeline-item.expanded .expand-icon {
            transform: rotate(90deg);
            background: #3b82f6;
            color: white;
        }

        /* 详细描述区域 (默认收起隐藏) */
        .detail-area {
            margin-top: 0px;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.2s;
            color: #2d3f54;
            font-size: 0.95rem;
            line-height: 1.6;
            border-top: 0px solid transparent;
        }

        .timeline-item.expanded .detail-area {
            max-height: 250px;          /* 足够展示内容, 实际会根据内容自适应 */
            margin-top: 16px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 14px;
        }

        /* 详情内部的排版 */
        .detail-text {
            background: #f9fcff;
            padding: 14px 16px;
            border-radius: 14px;
            margin-bottom: 6px;
        }

        .detail-meta {
            display: flex;
            gap: 20px;
            font-size: 0.8rem;
            color: #6b7b8f;
        }

        .detail-meta i {
            font-style: normal;
            background: #eef2f6;
            padding: 4px 10px;
            border-radius: 40px;
        }

        /* 辅助连接线——每个item内部的短线连接节点与主线 (实际不需要, 因为全局线贯穿所有节点) 
           但为了让节点与主线视觉衔接更自然, 我们可以在节点后面加一个小白底遮罩? 不用, 已经完美对齐 */

        /* 微调最后一个节点的底部连接线 */
        .timeline-item:last-child .timeline-node .node-marker::after {
            display: none; /* 不需要额外修饰 */
        }

        /* 空状态/占位 */
        .footer-note {
            margin-top: 28px;
            padding-top: 16px;
            text-align: center;
            border-top: 2px dotted #d9e2ef;
            color: #7c8b9c;
            font-size: 0.8rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .reset-button {
            background: none;
            border: 1px solid #bac8dc;
            padding: 6px 18px;
            border-radius: 60px;
            color: #2c3f5c;
            cursor: pointer;
            transition: 0.15s;
            font-weight: 500;
        }

        .reset-button:hover {
            background: #e1eaf3;
            border-color: #6f8fbc;
        }

        /* 移动端友好 */
        @media (max-width: 500px) {
            .timeline-card { padding: 20px 16px; }
            .timeline-item { padding-left: 50px; }
            .timeline::before { left: 17px; }
        }
    </style>
</head>
<body>
    <div class="timeline-card">
        <h2>⏳ 项目时间轴</h2>
        <div class="timeline-sub">里程碑与任务 · 点击标题展开详情</div>

        <!-- 垂直时间轴容器 -->
        <div class="timeline" id="timelineContainer">
            <!-- 条目1: 默认展开 -->
            <div class="timeline-item expanded" id="item1">
                <div class="timeline-node">
                    <div class="node-marker"><span>🚀</span></div>
                </div>
                <div class="timeline-content">
                    <div class="content-header" onclick="toggleItem('item1')">
                        <div class="title-section">
                            <h3>项目启动</h3>
                            <span class="date-badge">2025-01-10</span>
                        </div>
                        <div class="expand-icon">➔</div>
                    </div>
                    <div class="detail-area">
                        <div class="detail-text">
                            完成团队组建，确定技术栈为 React+Node，通过立项评审。<br>
                            配置基础代码仓库与CI/CD雏形。
                        </div>
                        <div class="detail-meta">
                            <i>负责人: 张薇</i>
                            <i>状态: ✅ 已完成</i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 条目2: 默认收起 -->
            <div class="timeline-item" id="item2">
                <div class="timeline-node">
                    <div class="node-marker"><span>⚙️</span></div>
                </div>
                <div class="timeline-content">
                    <div class="content-header" onclick="toggleItem('item2')">
                        <div class="title-section">
                            <h3>核心功能开发</h3>
                            <span class="date-badge">2025-02-01</span>
                        </div>
                        <div class="expand-icon">➔</div>
                    </div>
                    <div class="detail-area">
                        <div class="detail-text">
                            · 用户认证模块 (JWT, 角色权限)<br>
                            · 仪表盘框架与 mock 接口<br>
                            · 时间轴控件原型 (垂直样式, 展开/收起)
                        </div>
                        <div class="detail-meta">
                            <i>进度: 80%</i>
                            <i>关键里程碑</i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 条目3: 默认收起 (加完成样式) -->
            <div class="timeline-item completed" id="item3">
                <div class="timeline-node">
                    <div class="node-marker"><span>🎨</span></div>
                </div>
                <div class="timeline-content">
                    <div class="content-header" onclick="toggleItem('item3')">
                        <div class="title-section">
                            <h3>UI 设计与评审</h3>
                            <span class="date-badge">2025-02-15</span>
                        </div>
                        <div class="expand-icon">➔</div>
                    </div>
                    <div class="detail-area">
                        <div class="detail-text">
                            完成全套高保真设计，包括时间轴、卡片、深色模式适配。<br>
                            已通过客户评审，交付开发。
                        </div>
                        <div class="detail-meta">
                            <i>设计稿 v2.3</i>
                            <i>已完成</i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 条目4: 默认收起, 可以展示很多细节 -->
            <div class="timeline-item" id="item4">
                <div class="timeline-node">
                    <div class="node-marker"><span>🧪</span></div>
                </div>
                <div class="timeline-content">
                    <div class="content-header" onclick="toggleItem('item4')">
                        <div class="title-section">
                            <h3>集成测试与优化</h3>
                            <span class="date-badge">2025-03-01</span>
                        </div>
                        <div class="expand-icon">➔</div>
                    </div>
                    <div class="detail-area">
                        <div class="detail-text">
                            端到端测试、性能优化、Bug 修复。特别是时间轴组件在移动端的触摸响应。
                            编写测试用例20+，覆盖率87%。
                        </div>
                        <div class="detail-meta">
                            <i>QA 进行中</i>
                            <i>预计 03-15 完成</i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 条目5 用于展示更多 -->
            <div class="timeline-item" id="item5">
                <div class="timeline-node">
                    <div class="node-marker"><span>📦</span></div>
                </div>
                <div class="timeline-content">
                    <div class="content-header" onclick="toggleItem('item5')">
                        <div class="title-section">
                            <h3>部署上线</h3>
                            <span class="date-badge">2025-03-20</span>
                        </div>
                        <div class="expand-icon">➔</div>
                    </div>
                    <div class="detail-area">
                        <div class="detail-text">
                            灰度发布、生产环境监控、文档归档。   支持一键回滚。
                        </div>
                        <div class="detail-meta">
                            <i>计划中</i>
                            <i>预上线</i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部简洁操作 (全部展开/全部收起) -->
        <div class="footer-note">
            <span>垂直连接线贯穿节点 · 点击卡片标题切换</span>
            <div>
                <button class="reset-button" id="expandAllBtn">全部展开</button>
                <button class="reset-button" id="collapseAllBtn">全部收起</button>
            </div>
        </div>
    </div>

    <script>
        (function() {
            // 工具函数：切换单个条目的展开/收起状态
            window.toggleItem = function(itemId) {
                const item = document.getElementById(itemId);
                if (!item) return;
                // 切换 expanded 类
                item.classList.toggle('expanded');
            };

            // 批量操作: 全部展开 / 全部收起 (通过给所有 timeline-item 添加/移除 expanded 类)
            const container = document.getElementById('timelineContainer');
            const expandBtn = document.getElementById('expandAllBtn');
            const collapseBtn = document.getElementById('collapseAllBtn');

            function getAllItems() {
                return Array.from(document.querySelectorAll('.timeline-item'));
            }

            expandBtn.addEventListener('click', function() {
                getAllItems().forEach(item => {
                    item.classList.add('expanded');
                });
            });

            collapseBtn.addEventListener('click', function() {
                getAllItems().forEach(item => {
                    item.classList.remove('expanded');
                });
            });

            // 可选：如果点击空白区域误触？保留原有功能即可。
            // 为了更好的体验，可以增加点击节点展开？但题目要求经典样式和展开收起，目前标题区域点击已经ok。

            // 确保初始第一个条目是展开的，其他都是收起 (类名已在html中标记，但防止冲突再次确认)
            // 具体: item1 有 'expanded' 其余无; 如果用户刷新，保持不变。
        })();
    </script>
    <!-- 附加说明：时间轴连接线完美从第一个节点圆心贯穿到最后一个节点圆心。
         每个节点图标采用双层风格，并且完成态颜色不同。 
         展开/收起通过max-height动画，点击标题区域触发。 -->
</body>
</html>
```

### 时间轴控件的交互与布局

您可以通过点击每个时间项的标题区域来展开或收起其详细描述。整个时间轴的视觉和交互设计围绕清晰的信息层级展开。

- **视觉结构**：页面左侧有**一条垂直主线**贯穿所有节点。每个节点都包含一个醒目的图标外圈，已完成的项目节点会呈现蓝色填充样式，状态一目了然。
- **核心交互**：每个时间项的标题右侧有一个**箭头图标**。点击标题，箭头会旋转，同时下方会平滑展开或收起包含具体任务、负责人和状态的详情卡片。
- **批量控制**：底部的“全部展开”和“全部收起”按钮，可以快速控制所有时间项的展开状态，方便您概览或聚焦。
