这是根据您提供的科技主题CSS文件，对垂直时间轴组件进行样式调整后的HTML代码。它采用了深邃的电子蓝紫基调，并融入了发光阴影、渐变等未来感设计元素。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>科技时间轴 · 展开/收起控件</title>
    <!-- 引入科技主题 CSS (已内联，对应 cdm-tech-theme.css 变量) -->
    <style>
        /* ===== 科技风格CSS变量定义 (cdm-tech-theme.css) ===== */
        :root {
            /* 主色 – 深邃的电子蓝紫基调 */
            --cdm-primary-50: #eef5ff;
            --cdm-primary-100: #d9e8ff;
            --cdm-primary-200: #bcd6ff;
            --cdm-primary-300: #8ebaff;
            --cdm-primary-400: #5996ff;
            --cdm-primary-500: #2b6ef0;
            --cdm-primary-600: #1a52cc;
            --cdm-primary-700: #1240a3;
            --cdm-primary-800: #0f317a;
            --cdm-primary-900: #0e2659;

            /* 辅助色 – 冷调科技灰 & 青/洋红点缀 */
            --cdm-gray-100: #f0f3f8;
            --cdm-gray-200: #dce2ec;
            --cdm-gray-300: #c2ccda;
            --cdm-gray-400: #9fadc2;
            --cdm-gray-500: #7b8aa4;
            --cdm-gray-600: #5d6b84;
            --cdm-gray-700: #3f4a60;
            --cdm-gray-800: #2a3245;
            --cdm-gray-900: #1a1f2b;

            --cdm-cyan: #0dc9cd;
            --cdm-cyan-dark: #07a8b0;
            --cdm-magenta: #d63c9e;
            --cdm-magenta-dark: #b5237e;
            --cdm-success: #2ecc83;
            --cdm-warning: #f2b541;
            --cdm-error: #e7555f;

            /* 背景 & 前景 (科技暗色倾向) */
            --cdm-bg-base: #0d111c;          /* 极深底色 */
            --cdm-bg-surface: #161c2c;        /* 表面卡片色 */
            --cdm-bg-elevated: #1e263b;       /* 更高层级 */
            --cdm-bg-inset: #0a0e18;           /* 嵌入背景 */

            /* 文字颜色 – 高对比且微带冷光 */
            --cdm-text-primary: #f0f4fe;       /* 重要文字 */
            --cdm-text-secondary: #b1c3df;     /* 次要信息 */
            --cdm-text-tertiary: #6f7d9c;      /* 提示/禁用 */
            --cdm-text-inverse: #0d111c;       /* 反色文字 */

            /* 边框 & 分割线 */
            --cdm-border-light: rgba(89, 150, 255, 0.18);
            --cdm-border-strong: rgba(89, 150, 255, 0.4);
            --cdm-border-focus: #5996ff;

            /* 阴影 – 多层次，模仿发光效果 */
            --cdm-shadow-xs: 0 2px 4px rgba(0, 10, 30, 0.6), 0 0 0 1px rgba(89, 150, 255, 0.15);
            --cdm-shadow-sm: 0 4px 8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(89, 150, 255, 0.25);
            --cdm-shadow-md: 0 8px 16px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(89, 150, 255, 0.3), 0 0 20px rgba(43, 110, 240, 0.3);
            --cdm-shadow-lg: 0 16px 32px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(89, 150, 255, 0.4), 0 0 30px rgba(43, 110, 240, 0.5);
            --cdm-shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(89, 150, 255, 0.2);

            /* 圆角 – 未来感微圆角结合直角点缀 */
            --cdm-radius-xs: 4px;
            --cdm-radius-sm: 6px;
            --cdm-radius-md: 8px;
            --cdm-radius-lg: 12px;
            --cdm-radius-xl: 20px;
            --cdm-radius-pill: 9999px;
            --cdm-radius-circular: 50%;

            /* 渐变 – 科技常用蓝紫/青绿 */
            --cdm-gradient-1: linear-gradient(135deg, #2b6ef0, #b5237e);
            --cdm-gradient-2: linear-gradient(45deg, #0dc9cd, #2b6ef0);
            --cdm-gradient-3: radial-gradient(circle at top right, #1e263b, #0d111c);

            /* 动画 & 过渡 */
            --cdm-transition-fast: 150ms cubic-bezier(0.2, 0.9, 0.4, 1);
            --cdm-transition-base: 250ms cubic-bezier(0.2, 0.9, 0.4, 1);
            --cdm-transition-slow: 400ms cubic-bezier(0.2, 0.9, 0.4, 1);

            /* 字体家族 – 科技感无衬线 */
            --cdm-font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            --cdm-font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Roboto Mono', monospace;

            /* 间距系统 */
            --cdm-space-1: 4px;
            --cdm-space-2: 8px;
            --cdm-space-3: 12px;
            --cdm-space-4: 16px;
            --cdm-space-5: 24px;
            --cdm-space-6: 32px;
            --cdm-space-8: 48px;
            --cdm-space-10: 64px;
        }

        /* ===== 基础重置 & 全局科技感背景 ===== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: var(--cdm-bg-base);
            font-family: var(--cdm-font-sans);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 20px;
            color: var(--cdm-text-primary);
        }

        /* 主卡片容器 — 科技表面 */
        .timeline-card {
            max-width: 750px;
            width: 100%;
            background: var(--cdm-bg-surface);
            border-radius: var(--cdm-radius-xl);
            box-shadow: var(--cdm-shadow-lg);
            padding: 32px 28px 28px 28px;
            backdrop-filter: blur(2px);
            border: 1px solid var(--cdm-border-light);
            transition: var(--cdm-transition-base);
        }

        h2 {
            font-weight: 600;
            font-size: 1.9rem;
            letter-spacing: -0.5px;
            background: var(--cdm-gradient-1);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 6px;
            padding-left: 12px;
            border-left: 6px solid var(--cdm-primary-400);
            filter: drop-shadow(0 0 8px var(--cdm-primary-600));
        }

        .timeline-sub {
            color: var(--cdm-text-secondary);
            margin-bottom: 36px;
            font-size: 0.95rem;
            padding-left: 18px;
            border-bottom: 1px dashed var(--cdm-border-light);
            padding-bottom: 8px;
        }

        /* ---------- 时间轴核心结构 (调整适应科技感) ---------- */
        .timeline {
            display: flex;
            flex-direction: column;
            position: relative;
            margin-left: 24px;  /* 留出更多空间 */
        }

        /* 垂直主线 — 发光蓝紫色渐变 */
        .timeline::before {
            content: '';
            position: absolute;
            left: 22px;                 /* 与节点圆心对齐 */
            top: 18px;
            bottom: 18px;
            width: 4px;
            background: linear-gradient(to bottom, var(--cdm-primary-400), var(--cdm-magenta-dark));
            border-radius: var(--cdm-radius-pill);
            transform: translateX(-50%);
            z-index: 0;
            box-shadow: 0 0 12px var(--cdm-primary-500), 0 0 4px var(--cdm-cyan);
        }

        .timeline-item {
            position: relative;
            padding-left: 64px;          /* 增大间距适应更大节点 */
            margin-bottom: 28px;
            transition: margin var(--cdm-transition-base);
        }

        .timeline-item:last-child {
            margin-bottom: 8px;
        }

        /* 节点图标 — 科技感发光双层 */
        .timeline-node {
            position: absolute;
            left: 0;
            top: 0;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3;
        }

        .node-marker {
            width: 42px;
            height: 42px;
            background: var(--cdm-bg-elevated);
            border: 2px solid var(--cdm-primary-400);
            border-radius: var(--cdm-radius-circular);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 0 3px rgba(89,150,255,0.25), 0 0 20px var(--cdm-primary-500), var(--cdm-shadow-sm);
            transition: all var(--cdm-transition-fast);
            font-weight: 600;
            font-size: 1.2rem;
            color: var(--cdm-primary-200);
            backdrop-filter: blur(2px);
        }

        .node-marker span {
            transform: scale(1);
            filter: drop-shadow(0 0 4px var(--cdm-cyan));
        }

        /* 已完成节点 — 风格强化 (填充 + 强发光) */
        .timeline-item.completed .node-marker {
            background: var(--cdm-primary-600);
            border-color: var(--cdm-cyan);
            color: white;
            box-shadow: 0 0 0 4px rgba(13,201,205,0.3), 0 0 30px var(--cdm-cyan), var(--cdm-shadow-md);
        }

        .timeline-item.completed .node-marker span {
            filter: drop-shadow(0 0 6px white);
        }

        /* 内容卡片 — 毛玻璃科技感 */
        .timeline-content {
            background: var(--cdm-bg-elevated);
            border-radius: var(--cdm-radius-lg);
            padding: 18px 22px 16px 22px;
            box-shadow: var(--cdm-shadow-md), inset 0 0 0 1px var(--cdm-border-light);
            border: 1px solid rgba(89,150,255,0.15);
            backdrop-filter: blur(4px);
            transition: var(--cdm-transition-base);
        }

        .timeline-content:hover {
            border-color: var(--cdm-primary-300);
            box-shadow: var(--cdm-shadow-lg), 0 0 20px rgba(43,110,240,0.4);
            transform: translateY(-1px);
        }

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
            gap: 16px;
            flex-wrap: wrap;
        }

        .title-section h3 {
            font-weight: 600;
            font-size: 1.3rem;
            color: var(--cdm-text-primary);
            letter-spacing: -0.3px;
            text-shadow: 0 0 8px var(--cdm-primary-600);
        }

        .title-section .date-badge {
            background: rgba(43,110,240,0.18);
            padding: 4px 14px;
            border-radius: var(--cdm-radius-pill);
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--cdm-cyan);
            letter-spacing: 0.4px;
            border: 1px solid var(--cdm-border-light);
            backdrop-filter: blur(2px);
        }

        /* 展开图标 — 科技感圆形 */
        .expand-icon {
            width: 36px;
            height: 36px;
            border-radius: var(--cdm-radius-circular);
            background: rgba(89,150,255,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--cdm-transition-base);
            color: var(--cdm-primary-300);
            font-size: 1.4rem;
            font-weight: 400;
            transform: rotate(0deg);
            border: 1px solid var(--cdm-border-light);
            box-shadow: var(--cdm-shadow-xs);
        }

        .timeline-item.expanded .expand-icon {
            transform: rotate(90deg);
            background: var(--cdm-primary-500);
            color: white;
            border-color: var(--cdm-cyan);
            box-shadow: 0 0 15px var(--cdm-primary-400);
        }

        /* 详细描述区域 — 暗色嵌入面板 */
        .detail-area {
            margin-top: 0px;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.2s;
            color: var(--cdm-text-secondary);
            font-size: 0.95rem;
            line-height: 1.65;
            border-top: 0px solid transparent;
        }

        .timeline-item.expanded .detail-area {
            max-height: 280px;          /* 足够展示内容 */
            margin-top: 18px;
            border-top: 1px solid var(--cdm-border-strong);
            padding-top: 16px;
        }

        .detail-text {
            background: var(--cdm-bg-inset);
            padding: 16px 18px;
            border-radius: var(--cdm-radius-md);
            margin-bottom: 12px;
            border-left: 4px solid var(--cdm-primary-400);
            box-shadow: var(--cdm-shadow-inner);
            color: var(--cdm-text-secondary);
            font-family: var(--cdm-font-mono);
            font-size: 0.9rem;
        }

        .detail-meta {
            display: flex;
            gap: 24px;
            font-size: 0.8rem;
            color: var(--cdm-text-tertiary);
        }

        .detail-meta i {
            font-style: normal;
            background: rgba(13,201,205,0.1);
            padding: 4px 14px;
            border-radius: var(--cdm-radius-pill);
            border: 1px solid var(--cdm-border-light);
            color: var(--cdm-cyan);
        }

        /* 底部操作栏 */
        .footer-note {
            margin-top: 36px;
            padding-top: 20px;
            text-align: center;
            border-top: 2px solid var(--cdm-border-light);
            color: var(--cdm-text-tertiary);
            font-size: 0.8rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .reset-button {
            background: transparent;
            border: 1px solid var(--cdm-primary-400);
            padding: 8px 22px;
            border-radius: var(--cdm-radius-pill);
            color: var(--cdm-primary-200);
            cursor: pointer;
            transition: var(--cdm-transition-fast);
            font-weight: 500;
            font-size: 0.9rem;
            box-shadow: var(--cdm-shadow-xs);
            backdrop-filter: blur(4px);
        }

        .reset-button:hover {
            background: var(--cdm-primary-600);
            border-color: var(--cdm-cyan);
            color: white;
            box-shadow: 0 0 18px var(--cdm-primary-500);
            transform: scale(1.02);
        }

        .reset-button:active {
            transform: scale(0.98);
        }

        /* 移动端适应 */
        @media (max-width: 550px) {
            .timeline-card { padding: 24px 16px; }
            .timeline-item { padding-left: 56px; }
            .timeline::before { left: 20px; }
            .node-marker { width: 38px; height: 38px; }
        }

        /* 微调主线与节点的衔接 — 让节点盖在线上 */
        .timeline-item .timeline-node {
            filter: drop-shadow(0 0 6px var(--cdm-primary-600));
        }

        /* 第一个和最后一个节点特殊光晕 */
        .timeline-item:first-child .node-marker {
            box-shadow: 0 0 0 4px rgba(89,150,255,0.3), 0 0 30px var(--cdm-primary-400);
        }
    </style>
</head>
<body>
    <div class="timeline-card">
        <h2>⏻ 核心进程 · 科技时间轴</h2>
        <div class="timeline-sub">里程碑 & 任务 · 点击标题展开/收起详情</div>

        <!-- 垂直时间轴容器 (类名不变, 但内部已用科技变量) -->
        <div class="timeline" id="timelineContainer">
            <!-- 条目1: 默认展开，使用科技emoji/符号 -->
            <div class="timeline-item expanded" id="item1">
                <div class="timeline-node">
                    <div class="node-marker"><span>⌁</span></div>  <!-- 科技感启动符号 -->
                </div>
                <div class="timeline-content">
                    <div class="content-header" onclick="toggleItem('item1')">
                        <div class="title-section">
                            <h3>项目启动</h3>
                            <span class="date-badge">2025-01-10</span>
                        </div>
                        <div class="expand-icon">⟫</div>  <!-- 双箭头更契合科技感 -->
                    </div>
                    <div class="detail-area">
                        <div class="detail-text">
                            ⟡ 完成团队组建，确定技术栈为 React+Node，通过立项评审。<br>
                            ⟡ 配置基础代码仓库与CI/CD雏形，启用加密传输。
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
                        <div class="expand-icon">⟫</div>
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

            <!-- 条目3: 已完成样式增强 -->
            <div class="timeline-item completed" id="item3">
                <div class="timeline-node">
                    <div class="node-marker"><span>🖌️</span></div>
                </div>
                <div class="timeline-content">
                    <div class="content-header" onclick="toggleItem('item3')">
                        <div class="title-section">
                            <h3>UI 设计与评审</h3>
                            <span class="date-badge">2025-02-15</span>
                        </div>
                        <div class="expand-icon">⟫</div>
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

            <!-- 条目4: 测试与优化 -->
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
                        <div class="expand-icon">⟫</div>
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

            <!-- 条目5: 部署上线 -->
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
                        <div class="expand-icon">⟫</div>
                    </div>
                    <div class="detail-area">
                        <div class="detail-text">
                            灰度发布、生产环境监控、文档归档。支持一键回滚，链路追踪。
                        </div>
                        <div class="detail-meta">
                            <i>计划中</i>
                            <i>预上线</i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部操作: 全部展开/收起 (保持功能不变) -->
        <div class="footer-note">
            <span>⟁ 垂直主线贯穿 · 点击卡片标题切换</span>
            <div>
                <button class="reset-button" id="expandAllBtn">全部展开</button>
                <button class="reset-button" id="collapseAllBtn">全部收起</button>
            </div>
        </div>
    </div>

    <script>
        (function() {
            // 切换单个条目 (与之前一致)
            window.toggleItem = function(itemId) {
                const item = document.getElementById(itemId);
                if (!item) return;
                item.classList.toggle('expanded');
            };

            const container = document.getElementById('timelineContainer');
            const expandBtn = document.getElementById('expandAllBtn');
            const collapseBtn = document.getElementById('collapseAllBtn');

            function getAllItems() {
                return Array.from(document.querySelectorAll('.timeline-item'));
            }

            expandBtn.addEventListener('click', function() {
                getAllItems().forEach(item => item.classList.add('expanded'));
            });

            collapseBtn.addEventListener('click', function() {
                getAllItems().forEach(item => item.classList.remove('expanded'));
            });

            // 确保初始状态: item1展开，其余收起 (与html一致)
        })();
    </script>
    <!-- 设计说明：完全遵循 cdm-tech-theme.css 变量，主线发光渐变，节点毛玻璃，整体暗色调+蓝紫霓虹 -->
</body>
</html>
```

### 科技时间轴的功能与视觉亮点

您可以通过点击每个卡片标题来展开或收起其详细内容，底部按钮则支持批量操作。整个组件的视觉风格已全面向科技主题靠拢。

- **核心交互**：点击卡片左侧的标题区域或右侧的图标，即可切换该时间条目的展开/收起状态。底部“全部展开”和“全部收起”按钮提供了全局控制。
- **科技视觉风格**：页面采用了您提供的深色主题，主色调为电子蓝紫。时间轴线变为发光的渐变线，节点图标带有霓虹光晕和毛玻璃效果，卡片也具备了发光阴影和边框，整体营造出强烈的未来感。
- **状态区分**：已完成的时间条目（如“UI 设计与评审”）的节点图标会变为填充色并发出更强的光芒，与进行中的条目清晰区分。
