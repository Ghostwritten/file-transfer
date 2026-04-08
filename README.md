# File Transfer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-%40ghostwritten%2Ffile--transfer-red)](https://www.npmjs.com/package/@ghostwritten/file-transfer)
[![ClawHub](https://img.shields.io/badge/ClawHub-file--transfer-orange)](https://clawhub.ai/skills/file-transfer)

A context-aware file transfer library for AI agents. Intelligently transfers files based on conversation context — group chat vs private chat, urgency, file type — with MIME validation, chunked reading, and progress tracking.

Works with any AI agent framework: **OpenClaw**, **Claude (Anthropic)**, **OpenAI**, or standalone Node.js.

## Features

- **Context-Aware**: Detects group/private chat, infers transfer intent (share, backup, collaborate, archive)
- **Smart Validation**: MIME type checking, size limits, chunked reading for large files
- **Telegram Adapter**: Progress tracking and transfer status (simulated; real API integration planned)
- **Extensible**: Adapter pattern — WhatsApp and Discord adapters planned
- **Platform-Agnostic**: No dependency on any specific AI framework

## Installation

### npm

```bash
npm install @ghostwritten/file-transfer
```

### ClawHub (OpenClaw skill registry)

```bash
clawhub install file-transfer
```

### From Source

```bash
git clone https://github.com/Ghostwritten/file-transfer.git
cd file-transfer
npm install
```

## Quick Start

```javascript
import { FileTransferSkill } from '@ghostwritten/file-transfer';

const skill = new FileTransferSkill({
  channels: {
    telegram: { enabled: true, maxFileSize: 50 * 1024 * 1024 }
  }
});

const result = await skill.sendFileWithContext({
  file: '/path/to/report.pdf',
  caption: 'Weekly team report',
  context: { chatId: '-1003655501651' }
});

console.log(result.context.scenario);   // 'collaborate'
console.log(result.context.urgency);    // 'medium'
console.log(result.stats.size);         // '1.2 MB'
```

## AI Agent Integration

### OpenClaw

Install via ClawHub and reference in your OpenClaw agent:

```bash
clawhub install file-transfer
```

```yaml
# agent.yaml
skills:
  - file-transfer
```

The skill exposes `sendFileWithContext` and `getTransferHistory` as callable tools within OpenClaw's skill runtime.

### Claude (Anthropic SDK)

Use as a tool in a Claude tool-use workflow:

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { FileTransferSkill } from '@ghostwritten/file-transfer';

const client = new Anthropic();
const skill = new FileTransferSkill({
  channels: { telegram: { enabled: true } }
});

// Define tool for Claude
const tools = [{
  name: 'send_file',
  description: 'Send a file to a chat with context-aware analysis',
  input_schema: {
    type: 'object',
    properties: {
      file:    { type: 'string', description: 'Absolute path to the file' },
      chatId:  { type: 'string', description: 'Telegram chat ID' },
      caption: { type: 'string', description: 'File description' }
    },
    required: ['file', 'chatId']
  }
}];

// Execute tool call from Claude's response
async function handleToolCall(toolName, toolInput) {
  if (toolName === 'send_file') {
    return skill.sendFileWithContext({
      file: toolInput.file,
      caption: toolInput.caption,
      context: { chatId: toolInput.chatId }
    });
  }
}
```

### OpenAI (Function Calling)

```javascript
import OpenAI from 'openai';
import { FileTransferSkill } from '@ghostwritten/file-transfer';

const openai = new OpenAI();
const skill = new FileTransferSkill({
  channels: { telegram: { enabled: true } }
});

const functions = [{
  name: 'send_file',
  description: 'Send a file to a Telegram chat with smart context detection',
  parameters: {
    type: 'object',
    properties: {
      file:    { type: 'string', description: 'Path to the file' },
      chatId:  { type: 'string', description: 'Telegram chat ID' },
      caption: { type: 'string' }
    },
    required: ['file', 'chatId']
  }
}];

// Handle function call from OpenAI response
async function handleFunctionCall(name, args) {
  if (name === 'send_file') {
    return skill.sendFileWithContext({
      file: args.file,
      caption: args.caption,
      context: { chatId: args.chatId }
    });
  }
}
```

### Standalone / Custom Agent

Use core modules directly without any AI framework:

```javascript
import { ContextEngine, FileManager, TelegramAdapter } from '@ghostwritten/file-transfer';

// Analyze context
const engine = new ContextEngine();
const analysis = await engine.analyzeContext({
  fileName: 'report.pdf',
  fileSize: 1024000,
  fileType: 'application/pdf',
  chatInfo: { isGroupChat: true, chatType: 'group' }
});
// { scenario: 'collaborate', urgency: 'medium', confidence: 0.85, fileCategory: 'document' }

// Validate file
const manager = new FileManager();
const validation = await manager.validateFile('/path/to/file.pdf');
// { valid: true, size: 1024000, mimeType: 'application/pdf', ... }

// Send via Telegram
const adapter = new TelegramAdapter({ maxFileSize: 50 * 1024 * 1024 });
const result = await adapter.sendFile({
  filePath: '/path/to/file.pdf',
  chatId: '-1003655501651',
  caption: 'Document sharing'
});
```

## Context Analysis

The `ContextEngine` returns structured analysis for every transfer:

| Field | Values | Description |
|-------|--------|-------------|
| `scenario` | `share` `backup` `collaborate` `archive` | Inferred transfer intent |
| `urgency` | `low` `medium` `high` `critical` | Priority level |
| `confidence` | `0.0` – `1.0` | Analysis confidence score |
| `fileCategory` | `document` `image` `video` `archive` `code` | File classification |

## Configuration

```javascript
const skill = new FileTransferSkill({
  contextEngine: {
    enableAI: false,          // AI-enhanced analysis (future)
    maxHistoryLength: 10      // Context history window
  },
  file: {
    maxFileSize: 100 * 1024 * 1024,   // 100MB default
    chunkSize:    10 * 1024 * 1024,   // 10MB chunks
    allowedMimeTypes: [
      'application/pdf', 'image/jpeg', 'image/png',
      'video/mp4', 'application/zip', 'text/plain'
      // ...see docs/API.md for full list
    ],
    tempDir: '/tmp/file-transfer'
  },
  channels: {
    telegram: {
      enabled: true,
      maxFileSize: 50 * 1024 * 1024   // Telegram 50MB limit
    }
  }
});
```

## Architecture

```
file-transfer/
├── src/
│   ├── index.js                   # FileTransferSkill — main entry
│   ├── core/
│   │   ├── context-engine.js      # Context analysis engine
│   │   └── file-manager.js        # File validation & management
│   ├── adapters/
│   │   └── telegram-adapter.js    # Telegram platform adapter
│   └── utils/
│       └── format.js              # Shared utilities
├── tests/
│   ├── unit/                      # Unit tests (41 passing)
│   └── integration/
├── docs/
│   ├── API.md
│   └── DEVELOPMENT.md
└── examples/
```

## Testing

```bash
npm test                   # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report
```

## Documentation

- [API Reference](./docs/API.md)
- [Development Guide](./docs/DEVELOPMENT.md)

## Roadmap

- [ ] Real Telegram Bot API integration
- [ ] WhatsApp adapter
- [ ] Discord adapter
- [ ] Transfer history persistence
- [ ] AI-enhanced context analysis

## License

MIT — see [LICENSE](LICENSE) for details.
