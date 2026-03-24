/**
 * Context Engine 单元测试
 * 
 * 测试智能上下文分析引擎的核心功能
 */

import { ContextEngine } from '../../src/core/context-engine.js';

describe('ContextEngine', () => {
  let contextEngine;

  beforeEach(() => {
    contextEngine = new ContextEngine({
      enableAI: false,
      maxHistoryLength: 5
    });
  });

  describe('构造函数', () => {
    test('应该使用默认配置创建实例', () => {
      const engine = new ContextEngine();
      expect(engine.config).toBeDefined();
      expect(engine.config.enableAI).toBe(false);
      expect(engine.config.maxHistoryLength).toBe(10);
    });

    test('应该使用自定义配置创建实例', () => {
      const customConfig = {
        enableAI: true,
        maxHistoryLength: 20,
        scenarioWeights: {
          share: 2.0,
          backup: 1.0
        }
      };
      
      const engine = new ContextEngine(customConfig);
      expect(engine.config.enableAI).toBe(true);
      expect(engine.config.maxHistoryLength).toBe(20);
      expect(engine.config.scenarioWeights.share).toBe(2.0);
    });
  });

  describe('analyze方法', () => {
    test('应该成功分析基本文件传输上下文', async () => {
      const context = {
        filePath: '/path/to/document.pdf',
        fileName: 'document.pdf',
        fileSize: 1024 * 1024, // 1MB
        fileType: 'application/pdf',
        caption: '团队周报',
        chatInfo: {
          isGroupChat: true,
          type: 'group'
        },
        userInfo: {
          id: 'user123',
          name: '测试用户'
        },
        history: ['早上好', '这是本周的周报']
      };

      const result = await contextEngine.analyze(context);

      expect(result).toBeDefined();
      expect(result.scenario).toBeDefined();
      expect(result.urgency).toBeDefined();
      expect(result.recommendedTargets).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.isGroupChat).toBe(true);
      expect(result.chatType).toBe('group');
      expect(result.fileCategory).toBe('document');
      expect(result.timestamp).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('应该处理缺少可选字段的上下文', async () => {
      const minimalContext = {
        filePath: '/path/to/image.jpg',
        fileName: 'image.jpg',
        fileSize: 500 * 1024, // 500KB
        fileType: 'image/jpeg'
        // 没有caption, chatInfo, history
      };

      const result = await contextEngine.analyze(minimalContext);

      expect(result).toBeDefined();
      expect(result.scenario).toBe('share'); // 图片默认分享
      expect(result.isGroupChat).toBe(false); // 默认不是群聊
      expect(result.chatType).toBe('private'); // 默认私聊
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('应该处理未知文件类型', async () => {
      const context = {
        filePath: '/path/to/unknown.xyz',
        fileName: 'unknown.xyz',
        fileSize: 1024,
        fileType: 'application/unknown'
      };

      const result = await contextEngine.analyze(context);

      expect(result).toBeDefined();
      expect(result.scenario).toBe('share'); // 未知类型默认分享
      expect(result.fileCategory).toBe('other');
    });

    test('应该处理大文件场景', async () => {
      const context = {
        filePath: '/path/to/large-video.mp4',
        fileName: 'large-video.mp4',
        fileSize: 200 * 1024 * 1024, // 200MB
        fileType: 'video/mp4',
        chatInfo: { isGroupChat: false }
      };

      const result = await contextEngine.analyze(context);

      expect(result).toBeDefined();
      // 大文件可能被识别为备份场景
      expect(['share', 'backup']).toContain(result.scenario);
    });
  });

  describe('场景识别', () => {
    test('应该正确识别文档协作场景', async () => {
      const context = {
        filePath: '/path/to/project-plan.docx',
        fileName: 'project-plan.docx',
        fileSize: 2 * 1024 * 1024,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        caption: '项目计划草案',
        chatInfo: {
          isGroupChat: true,
          type: 'group'
        },
        history: ['我们需要制定项目计划', '这是初步草案']
      };

      const result = await contextEngine.analyze(context);

      expect(result.scenario).toBe('collaborate');
      expect(result.urgency).toBe('high');
      expect(result.recommendedTargets).toContain('team_chat');
    });

    test('应该正确识别图片分享场景', async () => {
      const context = {
        filePath: '/path/to/vacation.jpg',
        fileName: 'vacation.jpg',
        fileSize: 3 * 1024 * 1024,
        fileType: 'image/jpeg',
        caption: '度假照片',
        chatInfo: {
          isGroupChat: false,
          type: 'private'
        }
      };

      const result = await contextEngine.analyze(context);

      expect(result.scenario).toBe('share');
      expect(result.recommendedTargets).toContain('image_gallery');
    });

    test('应该正确识别备份场景', async () => {
      const context = {
        filePath: '/path/to/backup.zip',
        fileName: 'backup.zip',
        fileSize: 50 * 1024 * 1024,
        fileType: 'application/zip',
        caption: '数据库备份',
        history: ['需要备份数据库', '这是最新的备份文件']
      };

      const result = await contextEngine.analyze(context);

      expect(result.scenario).toBe('backup');
      expect(result.urgency).toBe('low');
      expect(result.recommendedTargets).toContain('backup_folder');
    });
  });

  describe('紧急程度评估', () => {
    test('应该根据场景设置基础紧急程度', async () => {
      const collaborateContext = {
        filePath: '/path/to/doc.docx',
        fileName: 'doc.docx',
        fileSize: 1024,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        chatInfo: { isGroupChat: true }
      };

      const backupContext = {
        filePath: '/path/to/backup.zip',
        fileName: 'backup.zip',
        fileSize: 1024,
        fileType: 'application/zip'
      };

      const collaborateResult = await contextEngine.analyze(collaborateContext);
      const backupResult = await contextEngine.analyze(backupContext);

      expect(collaborateResult.urgency).toBe('high');
      expect(backupResult.urgency).toBe('low');
    });

    test('应该为大文件提高紧急程度', async () => {
      const context = {
        filePath: '/path/to/huge-file.bin',
        fileName: 'huge-file.bin',
        fileSize: 100 * 1024 * 1024, // 100MB
        fileType: 'application/octet-stream',
        chatInfo: { isGroupChat: false }
      };

      const result = await contextEngine.analyze(context);

      // 大文件应该有更高的紧急程度
      expect(['medium', 'high', 'critical']).toContain(result.urgency);
    });
  });

  describe('目标推荐', () => {
    test('应该为不同文件类型推荐合适的目标', async () => {
      const imageContext = {
        filePath: '/path/to/photo.png',
        fileName: 'photo.png',
        fileSize: 1024,
        fileType: 'image/png'
      };

      const pdfContext = {
        filePath: '/path/to/document.pdf',
        fileName: 'document.pdf',
        fileSize: 1024,
        fileType: 'application/pdf'
      };

      const imageResult = await contextEngine.analyze(imageContext);
      const pdfResult = await contextEngine.analyze(pdfContext);

      expect(imageResult.recommendedTargets).toContain('image_gallery');
      expect(pdfResult.recommendedTargets).toContain('document_repository');
    });

    test('应该为协作场景推荐团队相关目标', async () => {
      const context = {
        filePath: '/path/to/project.md',
        fileName: 'project.md',
        fileSize: 1024,
        fileType: 'text/markdown',
        chatInfo: { isGroupChat: true },
        history: ['团队项目文档']
      };

      const result = await contextEngine.analyze(context);

      expect(result.recommendedTargets).toContain('team_chat');
      expect(result.recommendedTargets).toContain('project_folder');
    });
  });

  describe('错误处理', () => {
    test('应该在分析失败时返回降级结果', async () => {
      // 模拟一个会引发错误的情况
      const invalidContext = {
        filePath: null,
        fileName: null,
        fileSize: null,
        fileType: null
      };

      const result = await contextEngine.analyze(invalidContext);

      expect(result).toBeDefined();
      expect(result.scenario).toBe('share'); // 降级默认场景
      expect(result.confidence).toBe(0.5); // 降级置信度
      expect(result.metadata.isFallback).toBe(true);
    });
  });

  describe('getStatus方法', () => {
    test('应该返回引擎状态信息', () => {
      const status = contextEngine.getStatus();

      expect(status).toBeDefined();
      expect(status.version).toBe('1.0.0');
      expect(status.config).toBeDefined();
      expect(status.scenarios).toBeInstanceOf(Array);
      expect(status.fileTypes).toBeInstanceOf(Array);
      expect(status.isOperational).toBe(true);
      expect(status.lastAnalysis).toBeDefined();
    });
  });

  describe('文件分类', () => {
    test('应该正确分类各种文件类型', () => {
      const testCases = [
        { mimeType: 'image/jpeg', expected: 'image' },
        { mimeType: 'video/mp4', expected: 'video' },
        { mimeType: 'audio/mpeg', expected: 'audio' },
        { mimeType: 'text/plain', expected: 'document' },
        { mimeType: 'application/pdf', expected: 'document' },
        { mimeType: 'application/zip', expected: 'archive' },
        { mimeType: 'application/octet-stream', expected: 'other' },
        { mimeType: null, expected: 'unknown' }
      ];

      testCases.forEach(({ mimeType, expected }) => {
        const context = {
          filePath: '/path/to/file',
          fileName: 'file',
          fileSize: 1024,
          fileType: mimeType
        };

        // 直接测试分类逻辑
        const category = contextEngine.categorizeFile(mimeType);
        expect(category).toBe(expected);
      });
    });
  });

  describe('置信度计算', () => {
    test('应该为完整上下文提供高置信度', async () => {
      const completeContext = {
        filePath: '/path/to/file.pdf',
        fileName: 'file.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        caption: '详细说明',
        chatInfo: { isGroupChat: true, type: 'group' },
        history: ['相关讨论1', '相关讨论2'],
        userInfo: { id: 'user1' }
      };

      const result = await contextEngine.analyze(completeContext);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('应该为不完整上下文提供较低置信度', async () => {
      const incompleteContext = {
        filePath: '/path/to/file.xyz',
        fileName: 'file.xyz',
        fileSize: 1024,
        fileType: 'application/unknown'
        // 缺少caption, chatInfo, history
      };

      const result = await contextEngine.analyze(incompleteContext);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });
});