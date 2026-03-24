# 开发指南

本文档提供 OpenClaw File Transfer Skill 的开发指南，包括环境设置、代码规范、测试流程和发布流程。

## 🚀 快速开始

### 环境要求

- **Node.js**: v16.0.0 或更高版本
- **npm**: v7.0.0 或更高版本
- **Git**: 版本控制

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/Ghostwritten/openclaw-file-transfer-skill.git
cd openclaw-file-transfer-skill

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发模式（热重载）
npm run dev

# 运行测试
npm test

# 运行特定测试
npm test -- context-engine.test.js
```

## 📁 项目结构

```
openclaw-file-transfer-skill/
├── src/                          # 源代码
│   ├── core/                     # 核心算法模块
│   │   ├── context-engine.js     # 智能上下文分析引擎
│   │   └── file-manager.js       # 文件管理器
│   ├── channels/                 # 通道适配器
│   │   ├── telegram-adapter.js   # Telegram适配器
│   │   ├── whatsapp-adapter.js   # WhatsApp适配器
│   │   └── discord-adapter.js    # Discord适配器
│   ├── notifications/            # 通知系统
│   │   ├── progress-notifier.js  # 进度通知
│   │   └── completion-notifier.js # 完成通知
│   ├── utils/                    # 工具函数
│   │   ├── logger.js             # 日志系统
│   │   └── validator.js          # 数据验证
│   └── index.js                  # 主入口文件
├── tests/                        # 测试套件
│   ├── unit/                     # 单元测试
│   ├── integration/              # 集成测试
│   └── e2e/                      # 端到端测试
├── docs/                         # 文档
│   ├── API.md                    # API参考
│   ├── DEVELOPMENT.md            # 开发指南（本文档）
│   └── CONTRIBUTING.md           # 贡献指南
├── examples/                     # 使用示例
└── scripts/                      # 构建和部署脚本
```

## 🛠️ 开发工作流

### 1. 创建功能分支

```bash
# 从main分支创建新分支
git checkout -b feature/your-feature-name

# 或从issue创建分支
git checkout -b fix/issue-123
```

### 2. 编写代码

遵循以下编码规范：

- 使用 **ES6+** 语法
- 每个文件一个类或主要功能模块
- 使用 **JSDoc** 注释
- 遵循 **Airbnb JavaScript Style Guide**

### 3. 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- tests/unit/context-engine.test.js

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式（开发时）
npm run test:watch
```

### 4. 代码检查

```bash
# 检查代码规范
npm run lint

# 自动修复可修复的问题
npm run lint:fix

# 代码格式化
npm run format
```

### 5. 提交代码

```bash
# 添加更改
git add .

# 提交（遵循约定式提交）
git commit -m "feat: add context analysis for image files"

# 或使用交互式提交
npm run commit
```

**提交信息格式**：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具

### 6. 推送分支

```bash
git push origin feature/your-feature-name
```

### 7. 创建Pull Request

1. 访问 GitHub 仓库
2. 点击 "New Pull Request"
3. 选择你的分支
4. 填写PR描述，关联相关issue
5. 等待代码审查

## 🧪 测试策略

### 单元测试

- **位置**: `tests/unit/`
- **覆盖范围**: 单个函数/类
- **工具**: Jest
- **目标覆盖率**: 80%+

```javascript
// 示例测试结构
describe('ClassName', () => {
  beforeEach(() => {
    // 测试前准备
  });

  afterEach(() => {
    // 测试后清理
  });

  describe('methodName', () => {
    test('should do something', () => {
      // 测试逻辑
    });

    test('should handle error case', () => {
      // 错误处理测试
    });
  });
});
```

### 集成测试

- **位置**: `tests/integration/`
- **覆盖范围**: 模块间交互
- **工具**: Jest + Supertest

### 端到端测试

- **位置**: `tests/e2e/`
- **覆盖范围**: 完整流程
- **工具**: Jest + Puppeteer

### 测试最佳实践

1. **AAA模式** (Arrange, Act, Assert)
2. **每个测试一个断言**（尽量）
3. **使用描述性测试名称**
4. **避免测试实现细节**
5. **模拟外部依赖**

## 📝 代码规范

### 命名约定

- **变量/函数**: `camelCase`
- **类**: `PascalCase`
- **常量**: `UPPER_SNAKE_CASE`
- **私有成员**: `_privateMethod`

### 文件结构

```javascript
// 1. 导入依赖
import { something } from 'module';

// 2. 常量定义
const CONSTANT_VALUE = 'value';

// 3. 类定义
export class MyClass {
  // 4. 构造函数
  constructor(config) {
    this.config = config;
  }

  // 5. 公共方法
  publicMethod() {
    // 实现
  }

  // 6. 私有方法
  _privateMethod() {
    // 实现
  }
}

// 7. 辅助函数
function helperFunction() {
  // 实现
}

// 8. 默认导出
export default MyClass;
```

### 错误处理

```javascript
// 使用try-catch处理异步错误
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  // 记录错误
  logger.error('Operation failed', { error });
  
  // 抛出有意义的错误
  throw new Error(`Failed to perform operation: ${error.message}`);
}

// 使用错误类型
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```

### 日志记录

```javascript
import logger from '../utils/logger.js';

// 不同级别的日志
logger.debug('Debug message');
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message', { metadata: 'additional info' });
```

## 🔧 调试

### Node.js 调试

```bash
# 使用--inspect标志
node --inspect src/index.js

# 或使用nodemon进行开发调试
npm run dev
```

### VS Code 调试配置

在 `.vscode/launch.json` 中添加：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current File",
      "program": "${file}",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${relativeFile}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Chrome DevTools

1. 启动应用：`node --inspect src/index.js`
2. 打开 Chrome，访问 `chrome://inspect`
3. 点击 "Open dedicated DevTools for Node"

## 📦 依赖管理

### 添加新依赖

```bash
# 生产依赖
npm install package-name --save

# 开发依赖
npm install package-name --save-dev

# 精确版本
npm install package-name@1.2.3 --save-exact
```

### 更新依赖

```bash
# 检查过时的包
npm outdated

# 更新所有包
npm update

# 更新特定包
npm update package-name

# 使用npm-check-updates
npx npm-check-updates -u
npm install
```

### 安全审计

```bash
# 检查安全漏洞
npm audit

# 自动修复漏洞
npm audit fix

# 强制修复
npm audit fix --force
```

## 🚢 发布流程

### 版本管理

项目使用 [Standard Version](https://github.com/conventional-changelog/standard-version) 进行版本管理。

```bash
# 准备发布（更新版本号、生成CHANGELOG）
npm run release

# 预发布版本
npm run release -- --prerelease alpha

# 首次发布
npm run release -- --first-release
```

### 发布到 npm

```bash
# 1. 登录npm
npm login

# 2. 构建项目
npm run build

# 3. 发布
npm publish

# 4. 发布公开测试版
npm publish --tag beta
```

### 发布到 ClawHub

```bash
# 1. 安装clawhub CLI
npm install -g clawhub

# 2. 登录
clawhub login

# 3. 发布技能
clawhub publish
```

## 🔍 性能优化

### 内存管理

```javascript
// 及时释放大对象
largeObject = null;

// 使用流处理大文件
const stream = fs.createReadStream('large-file.txt');
stream.pipe(process.stdout);

// 避免内存泄漏
const cleanup = () => {
  clearInterval(intervalId);
  removeEventListener('event', handler);
};
```

### 异步优化

```javascript
// 使用Promise.all并行处理
const results = await Promise.all([
  fetchData1(),
  fetchData2(),
  fetchData3()
]);

// 限制并发数
import pLimit from 'p-limit';
const limit = pLimit(5); // 最多5个并发

const promises = items.map(item => 
  limit(() => processItem(item))
);
```

## 🐛 常见问题

### 测试失败

1. **清理测试环境**：确保每个测试后清理资源
2. **检查模拟**：确保正确模拟外部依赖
3. **时间相关测试**：使用Jest的假定时器

### 构建错误

1. **清理node_modules**：`rm -rf node_modules && npm install`
2. **检查Node版本**：确保使用正确版本
3. **查看详细错误**：`npm run build -- --verbose`

### 依赖冲突

1. **使用精确版本**：在package.json中固定版本
2. **检查peerDependencies**：确保兼容性
3. **使用npm ls**：查看依赖树

## 📚 学习资源

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [Jest 测试框架](https://jestjs.io/)
- [ESLint 代码检查](https://eslint.org/)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 获取帮助

- **GitHub Issues**: 报告bug或请求功能
- **Discord社区**: 加入OpenClaw社区讨论
- **代码审查**: 提交PR前请求审查

---

**Happy Coding!** 🚀