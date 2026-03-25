/**
 * Context Engine - 智能上下文分析引擎
 * 
 * 负责分析文件传输的上下文信息，包括：
 * 1. 聊天环境分析（群聊/私聊/频道）
 * 2. 用户意图识别（分享/备份/协作）
 * 3. 文件类型智能匹配
 * 4. 传输目标智能推荐
 * 
 * @module core/context-engine
 */

/**
 * 上下文分析结果
 * @typedef {Object} ContextAnalysis
 * @property {string} scenario - 场景类型：'share'|'backup'|'collaborate'|'archive'
 * @property {string} urgency - 紧急程度：'low'|'medium'|'high'|'critical'
 * @property {string[]} recommendedTargets - 推荐传输目标
 * @property {Object} metadata - 附加元数据
 * @property {boolean} isGroupChat - 是否群聊
 * @property {string} chatType - 聊天类型：'private'|'group'|'channel'
 * @property {string} fileCategory - 文件分类：'document'|'image'|'video'|'archive'|'code'
 */

/**
 * 文件传输上下文
 * @typedef {Object} TransferContext
 * @property {string} filePath - 文件路径
 * @property {string} fileName - 文件名
 * @property {number} fileSize - 文件大小（字节）
 * @property {string} fileType - 文件MIME类型
 * @property {string} caption - 文件描述
 * @property {Object} chatInfo - 聊天信息
 * @property {Object} userInfo - 用户信息
 * @property {Object} channelInfo - 通道信息
 * @property {string[]} history - 历史消息上下文
 */

/**
 * 智能上下文分析引擎
 */
export class ContextEngine {
  /**
   * 创建上下文引擎实例
   * @param {Object} config - 引擎配置
   */
  constructor(config = {}) {
    this.config = {
      enableAI: config.enableAI ?? false,
      maxHistoryLength: config.maxHistoryLength ?? 10,
      scenarioWeights: config.scenarioWeights ?? {
        share: 1.0,
        backup: 0.8,
        collaborate: 1.2,
        archive: 0.6
      },
      ...config
    };

    // 文件类型到场景的映射
    this.fileTypeToScenario = {
      // 文档类
      'application/pdf': 'share',
      'application/msword': 'collaborate',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'collaborate',
      'text/plain': 'share',
      'text/markdown': 'collaborate',
      
      // 图片类
      'image/jpeg': 'share',
      'image/png': 'share',
      'image/gif': 'share',
      'image/svg+xml': 'collaborate',
      
      // 视频类
      'video/mp4': 'share',
      'video/quicktime': 'share',
      
      // 压缩包
      'application/zip': 'archive',
      'application/x-rar-compressed': 'archive',
      'application/x-tar': 'archive',
      
      // 代码
      'text/javascript': 'collaborate',
      'application/json': 'collaborate',
      'text/x-python': 'collaborate'
    };

    // 场景优先级规则
    this.scenarioRules = {
      share: {
        urgency: 'medium',
        recommendedTargets: ['current_chat', 'related_chats'],
        notificationLevel: 'normal'
      },
      backup: {
        urgency: 'low',
        recommendedTargets: ['backup_folder', 'cloud_storage'],
        notificationLevel: 'silent'
      },
      collaborate: {
        urgency: 'high',
        recommendedTargets: ['collaborators', 'team_chat'],
        notificationLevel: 'important'
      },
      archive: {
        urgency: 'low',
        recommendedTargets: ['archive_folder', 'long_term_storage'],
        notificationLevel: 'silent'
      }
    };

    // 文件分类映射
    this.fileCategories = {
      document: ['application/pdf', 'application/msword', 'text/plain', 'text/markdown'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/quicktime'],
      archive: ['application/zip', 'application/x-rar-compressed', 'application/x-tar'],
      code: ['text/javascript', 'application/json', 'text/x-python']
    };
  }

  /**
   * 确定传输场景
   * @private
   */
  determineScenario(context) {
    // 1. 基于文件类型
    const fileBasedScenario = this.fileTypeToScenario[context.fileType];
    if (fileBasedScenario) {
      return fileBasedScenario;
    }
    
    // 2. 基于聊天类型
    if (context.chatInfo?.isGroupChat) {
      return 'collaborate';
    }
    
    // 3. 基于文件大小
    if (context.fileSize > 50 * 1024 * 1024) { // 大于50MB
      return 'archive';
    }
    
    // 4. 默认场景
    return 'share';
  }

  /**
   * 确定紧急程度
   * @private
   */
  determineUrgency(context, scenario) {
    const rule = this.scenarioRules[scenario];
    if (rule) {
      return rule.urgency;
    }
    
    // 基于文件大小和聊天类型
    if (context.fileSize > 100 * 1024 * 1024) { // 大于100MB
      return 'high';
    }
    
    if (context.chatInfo?.isGroupChat) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * 确定推荐目标
   * @private
   */
  determineTargets(context, scenario) {
    const rule = this.scenarioRules[scenario];
    if (rule) {
      return rule.recommendedTargets;
    }
    
    // 默认目标
    if (context.chatInfo?.isGroupChat) {
      return ['current_chat', 'group_members'];
    }
    
    return ['current_chat'];
  }

  /**
   * 分类文件类型
   * @private
   */
  categorizeFile(fileType) {
    for (const [category, types] of Object.entries(this.fileCategories)) {
      if (types.includes(fileType)) {
        return category;
      }
    }
    
    return 'document'; // 默认分类
  }
      },
      collaborate: {
        urgency: 'high',
        recommendedTargets: ['team_chat', 'project_folder'],
        notificationLevel: 'important'
      },
      archive: {
        urgency: 'low',
        recommendedTargets: ['archive_folder', 'long_term_storage'],
        notificationLevel: 'silent'
      }
    };
  }

  /**
   * 分析文件传输上下文
   * @param {TransferContext} context - 传输上下文
   * @returns {Promise<ContextAnalysis>} 上下文分析结果
   */
  async analyze(context) {
    try {
      // 1. 基础信息提取
      const baseInfo = this.extractBaseInfo(context);
      
      // 2. 场景识别
      const scenario = this.identifyScenario(context, baseInfo);
      
      // 3. 紧急程度评估
      const urgency = this.assessUrgency(context, scenario);
      
      // 4. 目标推荐
      const recommendedTargets = this.recommendTargets(context, scenario);
      
      // 5. 元数据构建
      const metadata = this.buildMetadata(context, scenario);

      return {
        scenario,
        urgency,
        recommendedTargets,
        metadata,
        isGroupChat: context.chatInfo?.isGroupChat ?? false,
        chatType: this.determineChatType(context),
        fileCategory: this.categorizeFile(context.fileType),
        timestamp: new Date().toISOString(),
        confidence: this.calculateConfidence(context, scenario)
      };
    } catch (error) {
      console.error('Context analysis failed:', error);
      return this.getFallbackAnalysis(context);
    }
  }

  /**
   * 提取基础信息
   * @private
   */
  extractBaseInfo(context) {
    return {
      fileSizeMB: context.fileSize / (1024 * 1024),
      hasCaption: !!context.caption && context.caption.trim().length > 0,
      isLargeFile: context.fileSize > 10 * 1024 * 1024, // 10MB
      isMediaFile: context.fileType?.startsWith('image/') || context.fileType?.startsWith('video/'),
      isDocument: context.fileType?.startsWith('application/') || context.fileType?.startsWith('text/')
    };
  }

  /**
   * 识别传输场景
   * @private
   */
  identifyScenario(context, baseInfo) {
    // 1. 基于文件类型
    const typeBasedScenario = this.fileTypeToScenario[context.fileType] || 'share';
    
    // 2. 基于聊天上下文
    const chatBasedScenario = this.analyzeChatContext(context);
    
    // 3. 基于文件大小
    const sizeBasedScenario = baseInfo.isLargeFile ? 'backup' : 'share';
    
    // 4. 基于历史消息
    const historyBasedScenario = this.analyzeHistory(context.history);
    
    // 加权计算最终场景
    const scores = {
      share: 0,
      backup: 0,
      collaborate: 0,
      archive: 0
    };
    
    // 类型权重
    scores[typeBasedScenario] += this.config.scenarioWeights[typeBasedScenario] || 1.0;
    
    // 聊天上下文权重
    if (chatBasedScenario) {
      scores[chatBasedScenario] += 0.5;
    }
    
    // 文件大小权重
    if (sizeBasedScenario === 'backup') {
      scores.backup += 0.3;
    }
    
    // 历史消息权重
    if (historyBasedScenario) {
      scores[historyBasedScenario] += 0.4;
    }
    
    // 返回得分最高的场景
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  /**
   * 分析聊天上下文
   * @private
   */
  analyzeChatContext(context) {
    if (!context.chatInfo) return null;
    
    const { chatInfo } = context;
    
    // 群聊通常用于协作
    if (chatInfo.isGroupChat) {
      return 'collaborate';
    }
    
    // 频道通常用于分享
    if (chatInfo.type === 'channel') {
      return 'share';
    }
    
    // 私聊根据历史判断
    if (context.history && context.history.length > 0) {
      const lastMessages = context.history.slice(-3);
      const hasProjectKeywords = lastMessages.some(msg => 
        msg.toLowerCase().includes('project') || 
        msg.toLowerCase().includes('team') ||
        msg.toLowerCase().includes('collaborate')
      );
      
      if (hasProjectKeywords) {
        return 'collaborate';
      }
    }
    
    return null;
  }

  /**
   * 分析历史消息
   * @private
   */
  analyzeHistory(history) {
    if (!history || history.length === 0) return null;
    
    const recentHistory = history.slice(-5);
    const text = recentHistory.join(' ').toLowerCase();
    
    if (text.includes('backup') || text.includes('save') || text.includes('store')) {
      return 'backup';
    }
    
    if (text.includes('project') || text.includes('team') || text.includes('work together')) {
      return 'collaborate';
    }
    
    if (text.includes('archive') || text.includes('old') || text.includes('history')) {
      return 'archive';
    }
    
    return null;
  }

  /**
   * 评估紧急程度
   * @private
   */
  assessUrgency(context, scenario) {
    const rules = this.scenarioRules[scenario];
    if (!rules) return 'medium';
    
    let urgency = rules.urgency;
    
    // 根据文件大小调整
    if (context.fileSize > 50 * 1024 * 1024) { // 50MB
      urgency = this.increaseUrgency(urgency);
    }
    
    // 根据聊天类型调整
    if (context.chatInfo?.type === 'channel') {
      urgency = this.increaseUrgency(urgency);
    }
    
    // 根据时间调整（如果是工作时间）
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 18) {
      urgency = this.increaseUrgency(urgency);
    }
    
    return urgency;
  }

  /**
   * 提高紧急程度
   * @private
   */
  increaseUrgency(current) {
    const levels = ['low', 'medium', 'high', 'critical'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : current;
  }

  /**
   * 推荐传输目标
   * @private
   */
  recommendTargets(context, scenario) {
    const baseTargets = this.scenarioRules[scenario]?.recommendedTargets || ['current_chat'];
    const targets = [...baseTargets];
    
    // 根据文件类型添加特定目标
    if (context.fileType?.startsWith('image/')) {
      targets.push('image_gallery');
    }
    
    if (context.fileType?.startsWith('video/')) {
      targets.push('video_library');
    }
    
    if (context.fileType === 'application/pdf') {
      targets.push('document_repository');
    }
    
    // 去重并返回
    return [...new Set(targets)];
  }

  /**
   * 构建元数据
   * @private
   */
  buildMetadata(context, scenario) {
    return {
      fileType: context.fileType,
      fileSize: context.fileSize,
      fileName: context.fileName,
      scenario,
      analyzedAt: new Date().toISOString(),
      engineVersion: '1.0.0',
      features: {
        hasCaption: !!context.caption,
        isGroupChat: context.chatInfo?.isGroupChat ?? false,
        historyLength: context.history?.length ?? 0
      }
    };
  }

  /**
   * 确定聊天类型
   * @private
   */
  determineChatType(context) {
    if (!context.chatInfo) return 'private';
    
    if (context.chatInfo.isGroupChat) return 'group';
    if (context.chatInfo.type === 'channel') return 'channel';
    return 'private';
  }

  /**
   * 文件分类
   * @private
   */
  categorizeFile(fileType) {
    if (!fileType) return 'unknown';
    
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.startsWith('text/')) return 'document';
    if (fileType.startsWith('application/')) {
      if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('excel')) {
        return 'document';
      }
      if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
        return 'archive';
      }
    }
    return 'other';
  }

  /**
   * 计算置信度
   * @private
   */
  calculateConfidence(context, scenario) {
    let confidence = 0.7; // 基础置信度
    
    // 文件类型明确
    if (this.fileTypeToScenario[context.fileType]) {
      confidence += 0.1;
    }
    
    // 有聊天上下文
    if (context.chatInfo) {
      confidence += 0.1;
    }
    
    // 有历史消息
    if (context.history && context.history.length > 0) {
      confidence += 0.1;
    }
    
    // 有文件描述
    if (context.caption && context.caption.trim().length > 0) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 获取降级分析结果
   * @private
   */
  getFallbackAnalysis(context) {
    return {
      scenario: 'share',
      urgency: 'medium',
      recommendedTargets: ['current_chat'],
      metadata: {
        fileType: context.fileType,
        fileSize: context.fileSize,
        fileName: context.fileName,
        isFallback: true
      },
      isGroupChat: false,
      chatType: 'private',
      fileCategory: this.categorizeFile(context.fileType),
      timestamp: new Date().toISOString(),
      confidence: 0.5
    };
  }

  /**
   * 分析传输上下文
   * @param {TransferContext} context - 传输上下文
   * @returns {Promise<ContextAnalysis>} 上下文分析结果
   */
  async analyzeContext(context) {
    try {
      // 1. 确定场景
      const scenario = this.determineScenario(context);
      
      // 2. 确定紧急程度
      const urgency = this.determineUrgency(context, scenario);
      
      // 3. 确定推荐目标
      const recommendedTargets = this.determineTargets(context, scenario);
      
      // 4. 确定文件分类
      const fileCategory = this.categorizeFile(context.fileType);
      
      // 5. 计算置信度
      const confidence = this.calculateConfidence(context, scenario);
      
      // 6. 构建分析结果
      const analysis = {
        scenario,
        urgency,
        recommendedTargets,
        metadata: {
          fileType: context.fileType,
          fileSize: context.fileSize,
          fileName: context.fileName,
          chatType: context.chatInfo?.chatType || 'private',
          userIntent: this.extractUserIntent(context)
        },
        isGroupChat: context.chatInfo?.isGroupChat || false,
        chatType: context.chatInfo?.chatType || 'private',
        fileCategory,
        timestamp: new Date().toISOString(),
        confidence
      };
      
      return analysis;
    } catch (error) {
      console.warn(`Context analysis failed: ${error.message}, using fallback`);
      return this.getFallbackAnalysis(context);
    }
  }

  /**
   * 提取用户意图
   * @private
   */
  extractUserIntent(context) {
    const caption = context.caption || '';
    const history = context.history || [];
    
    // 简单的关键词匹配
    const keywords = {
      share: ['分享', '发送', '给', '转发', 'share', 'send'],
      backup: ['备份', '保存', '存储', 'backup', 'save'],
      collaborate: ['协作', '合作', '编辑', '修改', 'collaborate', 'edit'],
      archive: ['归档', '存档', '整理', 'archive', 'organize']
    };
    
    const allText = [caption, ...history].join(' ').toLowerCase();
    
    for (const [intent, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (allText.includes(word.toLowerCase())) {
          return intent;
        }
      }
    }
    
    return 'unknown';
  }

  /**
   * 获取引擎状态
   * @returns {Object} 引擎状态信息
   */
  getStatus() {
    return {
      version: '1.0.0',
      config: this.config,
      scenarios: Object.keys(this.scenarioRules),
      fileTypes: Object.keys(this.fileTypeToScenario),
      isOperational: true,
      lastAnalysis: new Date().toISOString()
    };
  }
}

export default ContextEngine;