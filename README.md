# 六爻

纳甲六爻起卦与排盘。纯前端应用，无后端、无数据库、无登录。历史记录保存在浏览器本地。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build      # 输出到 dist/
npm run preview    # 本地预览构建结果
npm run typecheck  # 类型检查
```

## 部署到 Vercel

1. 把本项目推到 GitHub 仓库。
2. 在 Vercel 中选择 "Add New Project"，导入该仓库。
3. Framework Preset 选择 **Vite**（通常会自动识别），其余保持默认：
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 点击 Deploy。不需要配置任何环境变量。
