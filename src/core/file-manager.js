    }
    
    // 清理分块数据（释放内存）
    if (transfer.chunks) {
      transfer.chunks.forEach(chunk => {
        chunk.data = null; // 释放Buffer内存
      });
    }
    
    // 从活动传输中移除
    this.activeTransfers.delete(transferId);
    
    return true;
  }

  /**
   * 获取所有活动传输
   * @returns {Array} 活动传输列表
   */
  getActiveTransfers() {
    return Array.from(this.activeTransfers.values()).map(transfer => ({
      transferId: transfer.id,
      fileName: path.basename(transfer.filePath),
      status: transfer.status,
      progress: transfer.progress,
      startTime: transfer.startTime
    }));
  }

  /**
   * 创建临时文件
   * @param {Buffer} data - 文件数据
   * @param {string} extension - 文件扩展名
   * @returns {Promise<string>} 临时文件路径
   */
  async createTempFile(data, extension = '.tmp') {
    await this.ensureTempDir();
    
    const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substring(2)}${extension}`;
    const tempFilePath = path.join(this.config.tempDir, tempFileName);
    
    await fs.writeFile(tempFilePath, data);
    
    return tempFilePath;
  }

  /**
   * 清理临时文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否成功清理
   */
  async cleanupTempFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * 清理所有临时文件
   * @param {number} maxAgeHours - 最大年龄（小时）
   * @returns {Promise<number>} 清理的文件数量
   */
  async cleanupAllTempFiles(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.config.tempDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.config.tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          console.warn(`Failed to process temp file ${file}: ${error.message}`);
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error(`Failed to cleanup temp files: ${error.message}`);
      return 0;
    }
  }

  /**
   * 格式化字节大小
   * @private
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * 获取管理器状态
   * @returns {Object} 管理器状态
   */
  getStatus() {
    return {
      version: '1.0.0',
      config: {
        maxFileSize: this.config.maxFileSize,
        chunkSize: this.config.chunkSize,
        allowedMimeTypesCount: this.config.allowedMimeTypes?.length || 0,
        tempDir: this.config.tempDir
      },
      activeTransfers: this.activeTransfers.size,
      tempDirExists: true, // 假设存在
      isOperational: true
    };
  }
}

export default FileManager;