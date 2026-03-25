# OpenClaw File Transfer Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-orange)](https://openclaw.ai)

A context-aware file transfer skill for the OpenClaw ecosystem. Intelligently transfers files based on conversation context (group chat vs private chat) with smart notifications and progress tracking.

## 🚀 Features

- **Context-Aware Transfers**: Automatically detects group/private chat contexts
- **Smart Notifications**: Progressive feedback with completion/error handling
- **Multi-Channel Support**: Telegram, WhatsApp, Discord (extensible)
- **File Management**: Type validation, size limits, progress tracking
- **Enterprise Ready**: Audit logs, permission controls, encryption ready

## 📦 Installation

### As an OpenClaw Skill
```bash
openclaw skill install openclaw-file-transfer-skill
```

### From Source
```bash
git clone https://github.com/Ghostwritten/openclaw-file-transfer-skill.git
cd openclaw-file-transfer-skill
npm install
```

## 🎯 Quick Start

### Basic Usage
```javascript
const fileTransfer = require('openclaw-file-transfer-skill');

// Smart file transfer based on context
await fileTransfer.send({
  file: "/path/to/document.pdf",
  context: "Team weekly report sharing",
  options: {
    notifyAll: true,      // Notify all group members
    showProgress: true    // Show transfer progress
  }
});
```

### Telegram Adapter Usage
```javascript
import { TelegramAdapter } from './src/adapters/telegram-adapter.js';

// Create Telegram adapter
const telegramAdapter = new TelegramAdapter({
  maxFileSize: 50 * 1024 * 1024, // 50MB
  chunkSize: 10 * 1024 * 1024    // 10MB chunks
});

// Send file to Telegram
const result = await telegramAdapter.sendFile({
  filePath: '/path/to/document.pdf',
  chatId: '-1003655501651', // Group chat ID (starts with '-100')
  caption: 'Project document sharing',
  options: {
    disableNotification: false,
    forceDocument: true
  }
});

console.log('Transfer result:', result);
console.log('Transfer ID:', result.transferId);
console.log('Message ID:', result.messageId);
console.log('Context analysis:', result.analysis);

// Get transfer status
const status = telegramAdapter.getTransferStatus(result.transferId);
console.log('Transfer status:', status);

// Get all active transfers
const activeTransfers = telegramAdapter.getActiveTransfers();
console.log('Active transfers:', activeTransfers);
```

### OpenClaw Integration
```javascript
// In your OpenClaw skill
import { TelegramAdapter } from 'openclaw-file-transfer-skill/src/adapters/telegram-adapter.js';

module.exports = {
  name: "file-transfer",
  description: "Context-aware file transfer",
  
  async execute(context, args) {
    // Create Telegram adapter
    const telegramAdapter = new TelegramAdapter();
    
    // Get file path (from message attachment or args)
    const filePath = context.message.attachments?.[0]?.path || args.file;
    
    if (!filePath) {
      return {
        success: false,
        message: 'Please provide file path or attachment'
      };
    }
    
    try {
      // Smart file transfer
      const result = await telegramAdapter.sendFile({
        filePath,
        chatId: context.chat.id,
        caption: context.message.text || 'File sharing',
        options: {
          disableNotification: context.chat.type === 'group' // Silent in groups
        }
      });
      
      return {
        success: true,
        message: `✅ File transferred successfully!\n📁 File type: ${result.analysis.fileCategory}\n🎯 Scenario: ${result.analysis.scenario}\n⏱️ Duration: ${result.duration}ms`,
        details: result
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ File transfer failed: ${error.message}`,
        error: error.message
      };
    }
  }
};
```

## 🏗️ Architecture

```
openclaw-file-transfer-skill/
├── src/
│   ├── core/              # Core algorithms
│   │   ├── context-engine.js      # Context analysis
│   │   ├── target-selector.js     # Target selection
│   │   └── file-manager.js        # File management
│   ├── channels/          # Channel adapters
│   │   ├── telegram-adapter.js    # Telegram
│   │   ├── whatsapp-adapter.js    # WhatsApp
│   │   └── discord-adapter.js     # Discord
│   ├── notifications/     # Notification system
│   │   ├── progress-notifier.js   # Progress updates
│   │   ├── completion-notifier.js # Completion notices
│   │   └── error-handler.js       # Error handling
│   └── utils/             # Utilities
│       ├── logger.js              # Logging
│       └── config-manager.js      # Configuration
├── tests/                 # Test suites
├── docs/                  # Documentation
└── examples/              # Usage examples
```

## 📚 Documentation

- [API Reference](./docs/API.md)
- [Configuration Guide](./docs/CONFIGURATION.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🔧 Configuration

Create `.env` file:
```env
# File transfer settings
MAX_FILE_SIZE=100MB
ALLOWED_TYPES=pdf,docx,jpg,png
NOTIFICATION_LEVEL=detailed

# Channel configurations
TELEGRAM_ENABLED=true
WHATSAPP_ENABLED=false
DISCORD_ENABLED=true
```

Or use configuration file:
```json
{
  "defaults": {
    "maxFileSize": "100MB",
    "allowedTypes": ["pdf", "docx", "jpg", "png"],
    "notificationLevel": "detailed"
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "maxSize": "2GB"
    },
    "whatsapp": {
      "enabled": false,
      "maxSize": "100MB"
    }
  }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenClaw](https://openclaw.ai) for the amazing ecosystem
- All contributors who help improve this skill
- The open-source community for inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Ghostwritten/openclaw-file-transfer-skill/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Ghostwritten/openclaw-file-transfer-skill/discussions)
- **Documentation**: [Docs](./docs/)

---

Made with ❤️ for the OpenClaw community