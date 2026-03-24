/**
 * File Manager 单元测试
 * 
 * 测试文件管理器的核心功能：验证、分块、传输管理
 */

import { FileManager } from '../../src/core/file-manager.js';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

// 模拟file-type模块
jest.mock('file-type', () => ({
  fileTypeFromFile: jest.fn()
}));

describe('FileManager', () => {
  let fileManager;
  let testFilePath;
  let testFileContent;

  beforeEach(async () => {
    fileManager = new FileManager({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      chunkSize: 5 * 1024 * 1024, // 5MB
      tempDir: '/tmp/openclaw-test'
    });

    // 创建测试文件
    testFileContent = Buffer.alloc(10 * 1024, 'test content'); // 10KB
    testFilePath = path.join('/tmp', `test-file-${Date.now()}.txt`);
    await fs.writeFile(testFilePath, testFileContent);
  });

  afterEach(async () => {
    // 清理测试文件
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // 文件可能已被删除
    }
  });

  describe('构造函数', () => {
    test('应该使用默认配置创建实例', () => {
      const manager = new FileManager();
      expect(manager.config).toBeDefined();
      expect(manager.config.maxFileSize).toBe(100 * 1024 * 1024); // 100MB
      expect(manager.config.chunkSize).toBe(10 * 1024 * 1024); // 10MB
      expect(manager.config.allowedMimeTypes).toBeInstanceOf(Array);
      expect(manager.config.tempDir).toBe('/tmp/openclaw-file-transfer');
    });

    test('应该使用自定义配置创建实例', () => {
      const customConfig = {
        maxFileSize: 200 * 1024 * 1024,
        chunkSize: 20 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        tempDir: '/custom/temp/dir'
      };
      
      const manager = new FileManager(customConfig);
      expect(manager.config.maxFileSize).toBe(200 * 1024 * 1024);
      expect(manager.config.chunkSize).toBe(20 * 1024 * 1024);
      expect(manager.config.allowedMimeTypes).toEqual(['image/jpeg', 'image/png']);
      expect(manager.config.tempDir).toBe('/custom/temp/dir');
    });
  });

  describe('validateFile方法', () => {
    test('应该成功验证有效文件', async () => {
      // 模拟file-type检测
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });

      const result = await fileManager.validateFile(testFilePath);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toBe(path.basename(testFilePath));
      expect(result.metadata.size).toBe(testFileContent.length);
      expect(result.mimeType).toBe('text/plain');
      expect(result.size).toBe(testFileContent.length);
      expect(result.modified).toBeInstanceOf(Date);
    });

    test('应该拒绝超过大小限制的文件', async () => {
      // 创建一个大文件（超过50MB限制）
      const largeFilePath = path.join('/tmp', `large-file-${Date.now()}.bin`);
      const largeContent = Buffer.alloc(60 * 1024 * 1024); // 60MB
      await fs.writeFile(largeFilePath, largeContent);

      const result = await fileManager.validateFile(largeFilePath);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed');
      expect(result.size).toBe(largeContent.length);

      // 清理
      await fs.unlink(largeFilePath);
    });

    test('应该拒绝不存在的文件', async () => {
      const nonExistentPath = '/tmp/non-existent-file-123456.txt';
      
      const result = await fileManager.validateFile(nonExistentPath);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    test('应该拒绝不允许的MIME类型', async () => {
      // 配置只允许图片类型
      const restrictedManager = new FileManager({
        allowedMimeTypes: ['image/jpeg', 'image/png']
      });

      fileTypeFromFile.mockResolvedValue({ mime: 'application/pdf' });

      const result = await restrictedManager.validateFile(testFilePath);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is not allowed');
      expect(result.mimeType).toBe('application/pdf');
    });

    test('应该在file-type失败时使用扩展名推断', async () => {
      fileTypeFromFile.mockRejectedValue(new Error('Detection failed'));

      const result = await fileManager.validateFile(testFilePath);

      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('text/plain'); // .txt扩展名推断
    });

    test('应该计算文件哈希', async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });

      const result = await fileManager.validateFile(testFilePath);

      expect(result.hash).toBeDefined();
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256格式
    });
  });

  describe('prepareTransfer方法', () => {
    test('应该成功准备文件传输', async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });

      const result = await fileManager.prepareTransfer(testFilePath, {
        chunkSize: 2 * 1024 // 2KB
      });

      expect(result.success).toBe(true);
      expect(result.transferId).toBeDefined();
      expect(result.transferId).toMatch(/^transfer_\d+_[a-f0-9]{8}_[a-z0-9]+$/);
      expect(result.validation.isValid).toBe(true);
      expect(result.totalChunks).toBe(5); // 10KB / 2KB = 5个分块
      expect(result.chunkSize).toBe(2 * 1024);
      expect(result.chunks).toBeInstanceOf(Array);
      expect(result.chunks.length).toBe(5);
      expect(result.estimatedTime).toBeGreaterThan(0);
    });

    test('应该拒绝无效文件的传输', async () => {
      const nonExistentPath = '/tmp/non-existent-file-123456.txt';
      
      const result = await fileManager.prepareTransfer(nonExistentPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
      expect(result.transferId).toBeNull();
    });

    test('应该使用自定义分块大小', async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });

      const customChunkSize = 1 * 1024; // 1KB
      const result = await fileManager.prepareTransfer(testFilePath, {
        chunkSize: customChunkSize
      });

      expect(result.chunkSize).toBe(customChunkSize);
      expect(result.totalChunks).toBe(10); // 10KB / 1KB = 10个分块
    });
  });

  describe('readChunk方法', () => {
    let transferId;

    beforeEach(async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });
      const preparation = await fileManager.prepareTransfer(testFilePath, {
        chunkSize: 2 * 1024 // 2KB
      });
      transferId = preparation.transferId;
    });

    test('应该成功读取文件分块', async () => {
      const chunk = await fileManager.readChunk(transferId, 0);

      expect(chunk).toBeDefined();
      expect(chunk.index).toBe(0);
      expect(chunk.start).toBe(0);
      expect(chunk.end).toBe(2 * 1024);
      expect(chunk.size).toBe(2 * 1024);
      expect(chunk.data).toBeInstanceOf(Buffer);
      expect(chunk.data.length).toBe(2 * 1024);
      expect(chunk.hash).toBeDefined();
      expect(chunk.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('应该读取最后一个分块（可能不完整）', async () => {
      // 10KB文件，2KB分块，最后一个分块是第4个（0-3）
      const chunk = await fileManager.readChunk(transferId, 4);

      expect(chunk.index).toBe(4);
      expect(chunk.size).toBe(2 * 1024); // 最后一个也是2KB
    });

    test('应该拒绝无效的传输ID', async () => {
      await expect(fileManager.readChunk('invalid-transfer-id', 0))
        .rejects.toThrow('Transfer not found');
    });

    test('应该拒绝无效的分块索引', async () => {
      await expect(fileManager.readChunk(transferId, 10)) // 只有5个分块
        .rejects.toThrow('Invalid chunk index');
      
      await expect(fileManager.readChunk(transferId, -1))
        .rejects.toThrow('Invalid chunk index');
    });
  });

  describe('updateProgress方法', () => {
    let transferId;

    beforeEach(async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });
      const preparation = await fileManager.prepareTransfer(testFilePath, {
        chunkSize: 2 * 1024 // 2KB
      });
      transferId = preparation.transferId;
    });

    test('应该更新传输进度', () => {
      const progress = fileManager.updateProgress(transferId, 2); // 完成2个分块

      expect(progress).toBeDefined();
      expect(progress.transferId).toBe(transferId);
      expect(progress.totalChunks).toBe(5);
      expect(progress.completedChunks).toBe(2);
      expect(progress.percentage).toBe(40); // 2/5 = 40%
      expect(progress.transferredBytes).toBe(4 * 1024); // 2个分块 * 2KB
      expect(progress.totalBytes).toBe(10 * 1024);
      expect(progress.speed).toBeGreaterThanOrEqual(0);
      expect(progress.estimatedTime).toBeGreaterThanOrEqual(0);
      expect(progress.elapsedTime).toBeGreaterThan(0);
    });

    test('应该在传输完成时更新状态', () => {
      // 完成所有分块
      const progress = fileManager.updateProgress(transferId, 5);

      expect(progress.percentage).toBe(100);
      expect(progress.completedChunks).toBe(5);
      
      const status = fileManager.getTransferStatus(transferId);
      expect(status.status).toBe('completed');
      expect(status.endTime).toBeDefined();
    });

    test('应该拒绝无效的传输ID', () => {
      expect(() => fileManager.updateProgress('invalid-transfer-id', 1))
        .toThrow('Transfer not found');
    });
  });

  describe('getTransferStatus方法', () => {
    let transferId;

    beforeEach(async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });
      const preparation = await fileManager.prepareTransfer(testFilePath);
      transferId = preparation.transferId;
    });

    test('应该获取传输状态', () => {
      const status = fileManager.getTransferStatus(transferId);

      expect(status.exists).toBe(true);
      expect(status.transferId).toBe(transferId);
      expect(status.status).toBe('ready');
      expect(status.filePath).toBe(testFilePath);
      expect(status.fileName).toBe(path.basename(testFilePath));
      expect(status.fileSize).toBe(testFileContent.length);
      expect(status.totalChunks).toBe(2); // 10KB / 5MB分块 = 1个分块，但最小是2？
      expect(status.completedChunks).toBe(0);
      expect(status.progress).toBeNull();
      expect(status.startTime).toBeDefined();
      expect(status.endTime).toBeNull();
      expect(status.options).toBeDefined();
    });

    test('应该处理不存在的传输', () => {
      const status = fileManager.getTransferStatus('non-existent-id');

      expect(status.exists).toBe(false);
      expect(status.error).toContain('not found');
    });
  });

  describe('cleanupTransfer方法', () => {
    let transferId;

    beforeEach(async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });
      const preparation = await fileManager.prepareTransfer(testFilePath);
      transferId = preparation.transferId;
    });

    test('应该成功清理已完成的传输', async () => {
      // 标记为完成
      fileManager.updateProgress(transferId, 2); // 假设2个分块都完成
      
      const result = await fileManager.cleanupTransfer(transferId);
      
      expect(result).toBe(true);
      
      // 验证传输已被移除
      const status = fileManager.getTransferStatus(transferId);
      expect(status.exists).toBe(false);
    });

    test('应该拒绝清理未完成的传输（除非强制）', async () => {
      await expect(fileManager.cleanupTransfer(transferId))
        .rejects.toThrow('not completed');
      
      // 强制清理应该成功
      const forcedResult = await fileManager.cleanupTransfer(transferId, true);
      expect(forcedResult).toBe(true);
    });

    test('应该处理不存在的传输', async () => {
      const result = await fileManager.cleanupTransfer('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('createTempFile和cleanupTempFile方法', () => {
    test('应该创建和清理临时文件', async () => {
      const testData = Buffer.from('test temporary data');
      
      // 创建临时文件
      const tempFilePath = await fileManager.createTempFile(testData, '.txt');
      
      expect(tempFilePath).toBeDefined();
      expect(tempFilePath).toContain(fileManager.config.tempDir);
      expect(tempFilePath).toMatch(/\.txt$/);
      
      // 验证文件存在
      const stats = await fs.stat(tempFilePath);
      expect(stats.size).toBe(testData.length);
      
      // 清理临时文件
      const cleanupResult = await fileManager.cleanupTempFile(tempFilePath);
      expect(cleanupResult).toBe(true);
      
      // 验证文件已被删除
      await expect(fs.access(tempFilePath)).rejects.toThrow();
    });

    test('应该处理清理不存在的文件', async () => {
      const result = await fileManager.cleanupTempFile('/tmp/non-existent-file.txt');
      expect(result).toBe(false);
    });
  });

  describe('getActiveTransfers方法', () => {
    test('应该获取所有活动传输', async () => {
      fileTypeFromFile.mockResolvedValue({ mime: 'text/plain' });
      
      // 准备多个传输
      await fileManager.prepareTransfer(testFilePath);
      await fileManager.prepareTransfer(testFilePath);
      
      const activeTransfers = fileManager.getActiveTransfers();
      
      expect(activeTransfers).toBeInstanceOf(Array);
      expect(activeTransfers.length).toBe(2);
      
      activeTransfers.forEach(transfer => {
        expect(transfer.transferId).toBeDefined();
        expect(transfer.fileName).toBe(path.basename(testFilePath));
        expect(transfer.status).toBe('ready');
        expect(transfer.progress).toBeDefined();
        expect(transfer.startTime).toBeDefined();
      });
    });

    test('应该在无活动传输时返回空数组', () => {
      const activeTransfers = fileManager.getActiveTransfers();
      expect(activeTransfers).toEqual([]);
    });
  });

  describe('formatBytes方法', () => {
    test('应该正确格式化字节大小', () => {
      const testCases = [
        { bytes: 0, expected: '0 Bytes' },
        { bytes: 1023, expected: '1023 Bytes' },
        { bytes: 1024, expected: '1 KB' },
        { bytes: 1024 * 1024, expected: '1 MB' },
        { bytes: 1024 * 1024 * 1024, expected: '1 GB' },
        { bytes: 1024 * 1024 * 1024 * 1024, expected: '1 TB' },
        { bytes: 1500, expected: '1.46 KB' },
        { bytes: 1500000, expected: '1.43 MB' }
      ];
      
      testCases.forEach(({ bytes, expected }) => {
        const formatted = fileManager.formatBytes(bytes);
        expect(formatted).toBe(expected);
      });
    });

    test('应该支持自定义小数位数', () => {
      expect(fileManager.formatBytes(1500, 0)).toBe('1 KB');
      expect(fileManager.formatBytes(1500, 3)).toBe('1.465 KB');
    });
  });

  describe('getStatus方法', () => {
    test('应该返回管理器状态', () => {
      const status = fileManager.getStatus();
      
      expect(status).toBeDefined();
      expect(status.version).toBe('1.0.0');
      expect(status.config).toBeDefined();
      expect(status.config.maxFileSize).toBe(50 * 1024 * 1024);
      expect(status.config.chunkSize).toBe(5 * 1024 * 1024);
      expect(status.config.allowedMimeTypesCount).toBeGreaterThan(0);
      expect(status.config.tempDir).toBe('/tmp/openclaw-test');
      expect(status.activeTransfers).toBe(0);
      expect(status.tempDirExists).toBe(true);
      expect(status.isOperational).toBe(true);
    });
  });

  describe('MIME类型推断', () => {
    test('应该根据扩展名正确推断MIME类型', ()