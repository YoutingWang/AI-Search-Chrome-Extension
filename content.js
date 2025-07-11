// AI Search - Content Script
// 监听文本选择并显示悬浮按钮
// 使用立即执行函数表达式(IIFE)来避免全局作用域污染

(function() {
  'use strict';
  
  // 防止重复加载
  if (window.aiReaderExtensionLoaded) {
            console.log('🔄 AI Search已加载，跳过重复初始化');
    return;
  }
  window.aiReaderExtensionLoaded = true;
  
  // 扩展专用的命名空间，避免与页面冲突
  const AI_READER_NAMESPACE = 'ai-reader-' + Date.now();
  
      console.log('✨ AI Search正在初始化...');
  console.log('🔒 使用命名空间:', AI_READER_NAMESPACE);
  
  // 检测页面是否使用React（用于调试）
  const hasReact = !!(window.React || document.querySelector('[data-reactroot]') || 
    document.querySelector('[data-react-mount-point]') || 
    document.querySelector('*[data-reactid]'));
  
  if (hasReact) {
    console.log('⚛️ 检测到React应用，将使用安全模式');
  }

let aiReaderButton = null;
let selectedText = '';

// 创建悬浮按钮
function createAIReaderButton() {
  const button = document.createElement('div');
  button.id = 'ai-reader-button';
          button.innerHTML = '✨ AI Search';
  
  // 直接设置样式，避免影响网页
  button.style.cssText = `
    position: fixed !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    border: none !important;
    border-radius: 25px !important;
    padding: 10px 20px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4) !important;
    z-index: 999999 !important;
    transition: all 0.3s ease !important;
    opacity: 0 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    pointer-events: auto !important;
    user-select: none !important;
  `;
  
  // 鼠标悬停效果
  button.addEventListener('mouseenter', () => {
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6) !important';
    button.style.background = 'linear-gradient(135deg, #7289fe 0%, #8b5fbf 100%) !important';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4) !important';
    button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important';
  });
  
  // 点击事件
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAIAnalysis();
  });
  
  return button;
}

// 显示按钮在选中文本附近
function showButton(selection) {
          console.log('🔲 显示AI Search按钮');
  hideButton();
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  aiReaderButton = createAIReaderButton();
  
  // 计算按钮位置（在选中文本上方居中）
  const buttonLeft = Math.max(10, rect.left + rect.width / 2 - 60); // 确保不超出屏幕左边
  const buttonTop = Math.max(10, rect.top - 50); // 确保不超出屏幕顶部
  
  // 设置按钮位置
  aiReaderButton.style.left = `${buttonLeft}px`;
  aiReaderButton.style.top = `${buttonTop}px`;
  
  console.log('📌 按钮位置:', { left: buttonLeft, top: buttonTop });
  
  document.body.appendChild(aiReaderButton);
  
  // 显示动画
  setTimeout(() => {
    // 再次检查按钮是否存在，以防在延迟期间被隐藏
    if (aiReaderButton) {
    aiReaderButton.style.opacity = '1';
    }
  }, 10);
}

// 隐藏按钮
function hideButton() {
  if (aiReaderButton) {
    aiReaderButton.remove();
    aiReaderButton = null;
  }
}

// 增强的多语言检测算法（返回检测结果和置信度）
function detectLanguage(text) {
  const cleanText = text.trim();
  if (!cleanText) return { language: 'auto', confidence: 0, scores: {} };
  
  // 语言特征检测
  const patterns = {
    // 中文：包括繁体中文
    'zh': {
      regex: /[\u4e00-\u9fff\u3400-\u4dbf]/g,
      threshold: 0.25,
      priority: 1
    },
    // 英文：字母、常见英文标点
    'en': {
      regex: /[a-zA-Z]/g,
      threshold: 0.6,
      priority: 2,
      commonWords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'within', 'without', 'against', 'upon', 'throughout', 'despite', 'towards', 'beside']
    },
    // 日文：平假名、片假名、日文汉字
    'ja': {
      regex: /[\u3040-\u309f\u30a0-\u30ff]/g,
      threshold: 0.2,
      priority: 1,
      kanjiRegex: /[\u4e00-\u9faf]/g,
      commonParticles: ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'か', 'も', 'や']
    },
    // 韩文：韩文字母
    'ko': {
      regex: /[\uac00-\ud7af]/g,
      threshold: 0.25,
      priority: 1
    },
    // 俄文
    'ru': {
      regex: /[\u0400-\u04ff]/g,
      threshold: 0.3,
      priority: 1
    },
    // 德文
    'de': {
      regex: /[äöüßÄÖÜ]/g,
      threshold: 0.1,
      priority: 3,
      commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'eine', 'als', 'auch', 'dem', 'bei', 'ein', 'einer', 'um', 'an', 'wie', 'oder', 'zur', 'so', 'aus', 'aber']
    },
    // 法文
    'fr': {
      regex: /[àâäçéèêëïîôöùûüÿ]/g,
      threshold: 0.1,
      priority: 3,
      commonWords: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'mais', 'me', 'bien', 'où', 'sans']
    },
    // 西班牙文
    'es': {
      regex: /[ñáéíóúü]/g,
      threshold: 0.1,
      priority: 3,
      commonWords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'como', 'las', 'pero', 'sus', 'una', 'del', 'está', 'todo', 'más']
    },
    // 阿拉伯文
    'ar': {
      regex: /[\u0600-\u06ff]/g,
      threshold: 0.3,
      priority: 1
    },
    // 印地文
    'hi': {
      regex: /[\u0900-\u097f]/g,
      threshold: 0.3,
      priority: 1
    },
    // 泰文
    'th': {
      regex: /[\u0e00-\u0e7f]/g,
      threshold: 0.3,
      priority: 1
    }
  };
  
  const scores = {};
  const total = cleanText.length;
  
  // 计算各语言得分
  for (const [lang, config] of Object.entries(patterns)) {
    const matches = (cleanText.match(config.regex) || []).length;
    const ratio = matches / total;
    
    let score = 0;
    if (ratio >= config.threshold) {
      score = ratio * config.priority;
      
      // 英文、德文、法文、西班牙文的常见单词检测
      if (config.commonWords && lang === 'en') {
        const words = cleanText.toLowerCase().split(/\s+/);
        const commonWordCount = words.filter(word => 
          config.commonWords.includes(word.replace(/[^\w]/g, ''))
        ).length;
        if (commonWordCount > 0) {
          score += (commonWordCount / words.length) * 0.5;
        }
      }
      
      // 日文特殊处理：检查平假名比例和常见助词
      if (lang === 'ja') {
        const hiraganaCount = (cleanText.match(/[\u3040-\u309f]/g) || []).length;
        const katakanaCount = (cleanText.match(/[\u30a0-\u30ff]/g) || []).length;
        const kanjiCount = (cleanText.match(config.kanjiRegex) || []).length;
        
        // 日文通常混合使用平假名、片假名和汉字
        if (hiraganaCount > 0 && (katakanaCount > 0 || kanjiCount > 0)) {
          score += 0.3;
        }
        
        // 检查常见日文助词
        if (config.commonParticles.some(particle => cleanText.includes(particle))) {
          score += 0.2;
        }
      }
    }
    
    scores[lang] = score;
  }
  
  // 找出得分最高的语言
  const sortedScores = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);
  
  // 计算置信度（归一化到0-100）
  const maxScore = sortedScores.length > 0 ? sortedScores[0][1] : 0;
  const confidence = Math.min(Math.round(maxScore * 100), 100);
  
  const result = {
    language: sortedScores.length > 0 && maxScore > 0.1 ? sortedScores[0][0] : 'auto',
    confidence: confidence,
    scores: scores,
    alternatives: sortedScores.slice(1, 3).map(([lang, score]) => ({
      language: lang,
      confidence: Math.round(score * 100)
    }))
  };
  
  console.log('🔍 语言检测结果:', {
    text: cleanText.substring(0, 50) + (cleanText.length > 50 ? '...' : ''),
    result: result
  });
  
  return result;
}

// 根据语言获取合适的提示词和配置
function getLanguagePrompt(text, language) {
  const prompts = {
    'zh': {
      systemPrompt: `你是一个专业的中文内容解读助手，请用简洁明了的中文分析以下内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请确保回复使用简体中文。`,
      title: '🇨🇳 中文解读',
      loadingText: '正在分析中文内容...',
      responseLanguage: 'zh'
    },
    'en': {
      systemPrompt: `你是专业的英文内容解读助手，请用中文分析以下英文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请特别注意英文术语的准确翻译和文化背景说明，回复用简体中文。`,
      title: '🇺🇸 英文解读',
      loadingText: '正在分析英文内容...',
      responseLanguage: 'zh'
    },
    'ja': {
      systemPrompt: `你是专业的日文内容解读助手，请用中文分析以下日文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意日语特有的敬语、文化内涵等，回复用简体中文。`,
      title: '🇯🇵 日文解读',
      loadingText: '正在分析日文内容...',
      responseLanguage: 'zh'
    },
    'ko': {
      systemPrompt: `你是专业的韩文内容解读助手，请用中文分析以下韩文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意韩语的敬语系统和文化特色，回复用简体中文。`,
      title: '🇰🇷 韩文解读',
      loadingText: '正在分析韩文内容...',
      responseLanguage: 'zh'
    },
    'ru': {
      systemPrompt: `你是专业的俄文内容解读助手，请用中文分析以下俄文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意俄语的语法特点和文化背景，回复用简体中文。`,
      title: '🇷🇺 俄文解读',
      loadingText: '正在分析俄文内容...',
      responseLanguage: 'zh'
    },
    'de': {
      systemPrompt: `你是专业的德文内容解读助手，请用中文分析以下德文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意德语的复合词特点和文化背景，回复用简体中文。`,
      title: '🇩🇪 德文解读',
      loadingText: '正在分析德文内容...',
      responseLanguage: 'zh'
    },
    'fr': {
      systemPrompt: `你是专业的法文内容解读助手，请用中文分析以下法文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意法语的语法特点和文化背景，回复用简体中文。`,
      title: '🇫🇷 法文解读',
      loadingText: '正在分析法文内容...',
      responseLanguage: 'zh'
    },
    'es': {
      systemPrompt: `你是专业的西班牙文内容解读助手，请用中文分析以下西班牙文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意西班牙语的语法特点和文化背景，回复用简体中文。`,
      title: '🇪🇸 西班牙文解读',
      loadingText: '正在分析西班牙文内容...',
      responseLanguage: 'zh'
    },
    'ar': {
      systemPrompt: `你是专业的阿拉伯文内容解读助手，请用中文分析以下阿拉伯文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意阿拉伯语从右到左的书写方式和文化背景，回复用简体中文。`,
      title: '🇸🇦 阿拉伯文解读',
      loadingText: '正在分析阿拉伯文内容...',
      responseLanguage: 'zh'
    },
    'hi': {
      systemPrompt: `你是专业的印地文内容解读助手，请用中文分析以下印地文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意印地语的语法特点和印度文化背景，回复用简体中文。`,
      title: '🇮🇳 印地文解读',
      loadingText: '正在分析印地文内容...',
      responseLanguage: 'zh'
    },
    'th': {
      systemPrompt: `你是专业的泰文内容解读助手，请用中文分析以下泰文内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请注意泰语的语法特点和泰国文化背景，回复用简体中文。`,
      title: '🇹🇭 泰文解读',
      loadingText: '正在分析泰文内容...',
      responseLanguage: 'zh'
    },
    'auto': {
      systemPrompt: `你是专业的多语言内容解读助手，请用中文分析以下内容：\n\n"${text}"\n\n请按以下格式回答：\n1. 核心内容总结（1-2句话）\n2. 详细解释（2-3段）\n3. 相关背景或扩展信息（可选）\n\n请根据原文的语言特点进行深入分析，回复用简体中文。`,
      title: '🌐 智能解读',
      loadingText: '正在智能分析内容...',
      responseLanguage: 'zh'
    }
  };
  
  return prompts[language] || prompts['auto'];
}

// 内置API Key配置（仅供小范围朋友使用）
const EMBEDDED_CONFIG = {
  // 将你的API Key进行Base64编码后放在这里
  // 例如：btoa("sk-your-api-key-here")
  key: "c2stcHJvai1tTUxER2RrdTBNWklxX0JpdnZmQmJaWjdtMExoUEtpb2s2VS0wci1JN3NKaWRYRGhuUy1Gb3VNODNoNU9hdjNTRGJlOTNieGlfa1QzQmxia0ZKUGxPcGZtcXQ3UkFLS0p1SUZGN2FvcGZQcWVwZkZPZFVIX3E5bENha2VXN3RmMWNzVmJEeTNCMV84OHBaa0IyTnNaVUkwaUpwOEE=", // Base64编码后的API Key
  maxDaily: 1000, // 每日最大使用次数
  enabled: true // 启用内置Key
};

// 获取API Key的函数
function getAPIKey() {
  // 如果启用了内置配置且在使用限制内
  if (EMBEDDED_CONFIG.enabled && EMBEDDED_CONFIG.key) {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem('daily_usage') || '{}');
    
    if (usage.date !== today) {
      // 新的一天，重置计数
      usage.date = today;
      usage.count = 0;
    }
    
    if (usage.count < EMBEDDED_CONFIG.maxDaily) {
      usage.count++;
      localStorage.setItem('daily_usage', JSON.stringify(usage));
      try {
        return atob(EMBEDDED_CONFIG.key); // 解码API Key
      } catch (e) {
        console.error('API Key解码失败');
        return null;
      }
    } else {
      showToast('今日使用次数已达上限，请明天再试', 'error');
      return null;
    }
  }
  
  // 回退到用户设置的API Key
  return localStorage.getItem('openai_api_key');
}

// 处理AI分析请求
async function handleAIAnalysis() {
  console.log('🤖 开始AI分析流程');
  
  // 获取选中的文本
  let selectedText = window.getSelection().toString().trim();
  
  // 如果没有选中文本，尝试从PDF中获取
  if (!selectedText && isPDFDocument()) {
    selectedText = getPDFSelectedText();
  }
  
  if (!selectedText) {
    showToast('请先选择要分析的文本', 'error');
    return;
  }

  console.log('📝 选中文本长度:', selectedText.length);

  // 获取API Key
  const apiKey = getAPIKey();
  if (!apiKey) {
    console.log('❌ 未找到API Key，显示设置界面');
    showSidebar();
    const shadowRoot = document.getElementById('ai-assistant-sidebar')?.shadowRoot;
    if (shadowRoot) {
      showAPIKeySetup(shadowRoot);
    }
    return;
  }
  
  // 检查Chrome扩展API是否可用
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    console.error('❌ Chrome扩展API不可用:', {
      chrome: typeof chrome,
      runtime: typeof chrome?.runtime,
      sendMessage: typeof chrome?.runtime?.sendMessage
    });
    showErrorInSidebar('扩展API不可用，请刷新页面后重试，或检查扩展是否正确安装');
    return;
  }
  
  // 检测语言
  const languageResult = detectLanguage(selectedText);
  const languageConfig = getLanguagePrompt(selectedText, languageResult.language);
  
  // 将检测结果添加到语言配置中
  languageConfig.detectionResult = languageResult;
  
  console.log('🔄 开始AI分析...', {
    textLength: selectedText.length,
    detectedLanguage: languageResult.language,
    confidence: languageResult.confidence,
    title: languageConfig.title,
    chromeAPIAvailable: !!(chrome && chrome.runtime && chrome.runtime.sendMessage)
  });
  
  // 立即显示侧边栏和选中内容
  showSidebar();
  showSelectedTextImmediately(selectedText, languageConfig);
  
  // 异步进行AI分析
  try {
  chrome.runtime.sendMessage({
    action: 'analyzeText',
    text: selectedText,
    url: window.location.href,
    language: languageResult.language,
    prompt: languageConfig.systemPrompt,
    apiKey: apiKey // 将API Key传递给background.js
  }, (response) => {
    console.log('🔄 收到API响应:', response);
    
      // 增强的响应验证和错误处理
      try {
        // 检查Chrome扩展通信错误
        if (chrome.runtime.lastError) {
          console.error('❌ Chrome扩展通信错误:', chrome.runtime.lastError);
          showErrorInSidebar(`扩展通信错误: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        // 检查响应是否存在
        if (!response) {
          console.error('❌ 没有收到响应，可能是网络超时或扩展错误');
          showErrorInSidebar('请求超时或无响应，请检查网络连接后重试');
          return;
        }
        
        // 检查响应格式
        if (typeof response !== 'object') {
          console.error('❌ 响应格式错误:', typeof response, response);
          showErrorInSidebar('响应格式错误，请重试');
          return;
        }
        
        // 检查是否成功
        if (response.success === true) {
          // 验证结果内容
          if (!response.result) {
            console.error('❌ 响应成功但没有结果内容:', response);
            showErrorInSidebar('AI分析完成但没有返回结果，请重试');
            return;
          }
          
          if (typeof response.result !== 'string') {
            console.error('❌ 结果内容格式错误:', typeof response.result, response.result);
            showErrorInSidebar('结果格式错误，请重试');
            return;
          }
          
          if (response.result.trim().length === 0) {
            console.error('❌ 结果内容为空');
            showErrorInSidebar('AI返回了空结果，请重试');
            return;
          }
          
          console.log('✅ AI分析成功，结果长度:', response.result.length);
          console.log('📝 结果预览:', response.result.substring(0, 200));
          
          // 验证侧边栏存在
          const sidebar = document.getElementById('ai-assistant-sidebar');
          if (!sidebar || !sidebar.shadowRoot) {
            console.error('❌ 侧边栏不存在或Shadow DOM访问失败');
            showErrorInSidebar('界面初始化错误，请刷新页面重试');
            return;
          }
          
          // 开始显示结果
      showAIResultInSidebar(response.result);
          
    } else {
          // 处理失败响应
      let errorMsg = '未知错误';
      
          if (response.error) {
        errorMsg = response.error;
          } else if (response.success === false) {
            errorMsg = '分析失败，请重试';
      }
      
          console.error('❌ AI分析失败:', errorMsg, response);
      showErrorInSidebar(errorMsg);
        }
        
      } catch (processingError) {
        console.error('❌ 响应处理过程中发生错误:', processingError);
        showErrorInSidebar(`处理响应时发生错误: ${processingError.message}`);
    }
  });
  } catch (sendError) {
    console.error('❌ 发送消息时发生错误:', sendError);
    showErrorInSidebar('发送请求失败，请检查扩展是否正确安装');
  }
  
  hideButton();
}

// 检查是否在输入元素中
function isInInputElement(element) {
  if (!element) return false;
  
  const inputTypes = ['INPUT', 'TEXTAREA', 'SELECT'];
  const editableTypes = ['text', 'search', 'url', 'email', 'password', 'number'];
  
  // 检查是否为输入元素
  if (inputTypes.includes(element.tagName)) {
    // 对于input元素，检查type
    if (element.tagName === 'INPUT') {
      const inputType = element.type ? element.type.toLowerCase() : 'text';
      return editableTypes.includes(inputType);
    }
    return true;
  }
  
  // 检查是否为可编辑元素
  if (element.contentEditable === 'true') {
    return true;
  }
  
  // 检查是否在可编辑元素内部
  let parent = element.parentElement;
  while (parent) {
    if (inputTypes.includes(parent.tagName) || parent.contentEditable === 'true') {
      return true;
    }
    parent = parent.parentElement;
  }
  
  return false;
}

// 文本选择处理函数
function handleTextSelection() {
  const selection = window.getSelection();
  
  // 使用增强的PDF文本选择
  const text = isPDFDocument() ? getPDFSelectedText() : selection.toString().trim();
  
  console.log('🔍 文本选择检查:', {
    isPDF: isPDFDocument(),
    text: text.substring(0, 100),
    textLength: text.length,
    selectionRangeCount: selection.rangeCount,
    rawSelection: selection.toString().substring(0, 100)
  });
    
  // 检查选择是否有效
  if (text.length === 0) {
    hideButton();
    selectedText = '';
    return;
  }
  
  // 检查文本长度是否足够（避免意外选择）
  if (text.length < 3) {
    hideButton();
    selectedText = '';
    return;
  }
  
  // 检查是否为有意义的文本（更智能的过滤）
  // 移除空白符但保留中文、英文字母
  const meaningfulText = text.replace(/[\s\r\n\t]/g, ''); // 只移除空白字符
  
  // 检查是否包含字母或中文字符
  const hasLetters = /[a-zA-Z\u4e00-\u9fff]/.test(meaningfulText);
  
  if (meaningfulText.length < 2 || !hasLetters) {
    console.log('🚫 文本不符合要求:', { 
      length: meaningfulText.length, 
      hasLetters,
      sample: meaningfulText.substring(0, 20)
    });
    hideButton();
    selectedText = '';
    return;
  }
  
  // 检查是否在输入元素中选择
  const activeElement = document.activeElement;
  if (isInInputElement(activeElement)) {
    hideButton();
    selectedText = '';
    return;
  }
  
  // 检查选择的起始位置是否在输入元素中
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const startElement = startContainer.nodeType === Node.TEXT_NODE 
      ? startContainer.parentElement 
      : startContainer;
      
    if (isInInputElement(startElement)) {
      hideButton();
      selectedText = '';
      return;
    }
  }
  
  // 通过所有检查，显示按钮
  selectedText = text;
  console.log('📝 选中文本:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  showButton(selection);
}

// 监听文本选择事件（支持PDF和普通网页）
function setupTextSelectionListeners() {
  // 使用更安全的事件监听方式，避免与React应用冲突
  let selectionTimeout;
  
  // 主要的mouseup事件 - 使用捕获阶段，优先级更高
  document.addEventListener('mouseup', (e) => {
    // 避免在我们自己的UI上触发
    if (e.target && (
      e.target.id === 'ai-reader-button' ||
      e.target.closest('#ai-assistant-sidebar') ||
      e.target.closest('#ai-reader-button')
    )) {
      return;
    }
    
    // 清除之前的定时器
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
    }
    
    // 延迟检查选择，确保选择已完成且不干扰React渲染
    selectionTimeout = setTimeout(() => {
      try {
        handleTextSelection();
      } catch (error) {
        console.warn('⚠️ 文本选择处理出错:', error);
      }
    }, 150);
  }, true); // 使用捕获阶段
  
  // 键盘选择事件 - 也使用捕获阶段
  document.addEventListener('keyup', (e) => {
    // 只处理可能影响文本选择的键
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'Home' || e.key === 'End' ||
        (e.key === 'a' && (e.ctrlKey || e.metaKey))) {
      
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      
      selectionTimeout = setTimeout(() => {
        try {
          handleTextSelection();
        } catch (error) {
          console.warn('⚠️ 键盘选择处理出错:', error);
        }
      }, 200);
    }
  }, true);
  
  // 鼠标移动时隐藏按钮（但不干扰拖拽选择）
  let mouseMoveTimeout;
  document.addEventListener('mousemove', (e) => {
    // 避免在我们的UI元素上处理
    if (e.target && (
      e.target.closest('#ai-assistant-sidebar') ||
      e.target.closest('#ai-reader-button')
    )) {
      return;
    }
    
    // 如果用户正在拖拽选择文本，不要隐藏按钮
    if (e.buttons === 1) { // 左键按下
      return;
    }
    
    if (mouseMoveTimeout) {
      clearTimeout(mouseMoveTimeout);
    }
    
    mouseMoveTimeout = setTimeout(() => {
      // 检查鼠标是否在按钮附近
      const button = document.getElementById('ai-reader-button');
      if (button) {
        const rect = button.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(e.clientX - (rect.left + rect.width / 2), 2) +
          Math.pow(e.clientY - (rect.top + rect.height / 2), 2)
        );
        
        // 如果鼠标离按钮太远，隐藏按钮
        if (distance > 100) {
          hideButton();
        }
      }
    }, 1000);
  }, { passive: true });
  
  // 对于PDF，可能需要额外的事件监听
  if (isPDFDocument()) {
    console.log('📄 为PDF文档添加额外事件监听');
    
    // PDF选择变化事件
    document.addEventListener('selectionchange', (e) => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
      
      selectionTimeout = setTimeout(() => {
        try {
          handleTextSelection();
        } catch (error) {
          console.warn('⚠️ PDF选择处理出错:', error);
        }
      }, 300);
    }, { passive: true });
    
    // 使用更长的延迟，等待PDF渲染完成
    setTimeout(() => {
      document.addEventListener('mouseup', (e) => {
        if (selectionTimeout) {
          clearTimeout(selectionTimeout);
        }
        
        selectionTimeout = setTimeout(() => {
          try {
            handleTextSelection();
          } catch (error) {
            console.warn('⚠️ PDF鼠标处理出错:', error);
          }
        }, 400);
      }, true);
    }, 2000);
  }
  
  console.log('🔧 文本选择监听器已设置 (使用安全模式)');
}

// PDF环境提示（仅在PDF环境中）
if (isPDFDocument()) {
  console.log('📄 PDF环境已准备就绪！');
  
  // 5秒后提示用户测试
  setTimeout(() => {
    console.log('📄 💡 现在可以选择PDF文本进行测试！');
    console.log('📄 💡 可用的调试命令:');
    console.log('  - aiTestPDFSelection() - 测试当前选择');
    console.log('  - aiDebugPDF() - 查看调试信息');  
    console.log('  - aiForceTestSelection() - 强制显示按钮');
  }, 3000);
}

// 安全的全局事件监听器设置
function setupGlobalEventListeners() {
// 点击页面其他地方时隐藏按钮
document.addEventListener('mousedown', (e) => {
  if (aiReaderButton && !aiReaderButton.contains(e.target)) {
    hideButton();
  }
  }, { passive: true });

// 键盘事件处理
document.addEventListener('keydown', (e) => {
  // Escape键隐藏按钮
  if (e.key === 'Escape') {
    hideButton();
    return;
  }
  
  // 如果在输入框中按键，隐藏按钮
  const activeElement = document.activeElement;
  if (isInInputElement(activeElement)) {
    hideButton();
  }
  }, { passive: true });

// 输入事件监听
document.addEventListener('input', () => {
  // 任何输入行为都隐藏按钮
  hideButton();
  }, { passive: true });

// 聚焦到输入框时隐藏按钮
document.addEventListener('focusin', (e) => {
  if (isInInputElement(e.target)) {
    hideButton();
  }
  }, { passive: true });

// 滚动时隐藏按钮
document.addEventListener('scroll', () => {
  hideButton();
  }, { passive: true, throttle: true });
  
  console.log('🔧 全局事件监听器已设置 (安全模式)');
}

// 侧边栏相关功能
let aiSidebar = null;

// 显示侧边栏
function showSidebar() {
  let sidebar = document.getElementById('ai-assistant-sidebar');

  // 如果侧边栏不存在，则创建它和它的内容
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'ai-assistant-sidebar';
    
    const shadowRoot = sidebar.attachShadow({ mode: 'open' });
    
  const style = document.createElement('style');
  style.textContent = `
      :host {
        position: fixed !important;
        top: 90px;
        right: 20px;
        width: 460px;
        height: min(800px, calc(100vh - 120px));
        min-width: 350px;
        min-height: 400px;
        background: white !important;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        flex-direction: column !important;
        border: 1px solid rgba(0,0,0,0.1) !important;
        border-radius: 12px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        overflow: hidden !important;
        resize: both;
    }
    
      * {
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
      .sidebar-header {
        position: relative !important;
        z-index: 1 !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        padding: 15px 20px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
        cursor: move !important;
        flex-shrink: 0; /* Prevent header from shrinking */
    }
    
      .sidebar-title {
        font-size: 16px !important;
        font-weight: 600 !important;
        margin: 0 !important;
      }
      
      .close-button {
        background: rgba(255, 255, 255, 0.2) !important;
        border: none !important;
        color: white !important;
        width: 30px !important;
        height: 30px !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 18px !important;
        transition: background-color 0.3s !important;
    }
    
      .close-button:hover {
        background: rgba(255, 255, 255, 0.3) !important;
    }
    
      .sidebar-content {
        flex: 1 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        padding: 20px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 20px !important;
        min-height: 0 !important;
        scrollbar-width: thin !important;
        scrollbar-color: rgba(102, 126, 234, 0.3) transparent !important;
      }
      
      .sidebar-content::-webkit-scrollbar {
        width: 6px !important;
      }
      
      .sidebar-content::-webkit-scrollbar-track {
        background: transparent !important;
    }
    
      .sidebar-content::-webkit-scrollbar-thumb {
        background: rgba(102, 126, 234, 0.3) !important;
        border-radius: 3px !important;
      }
      
      .sidebar-content::-webkit-scrollbar-thumb:hover {
        background: rgba(102, 126, 234, 0.5) !important;
    }
    
      .content-section {
        background: #f8f9fa !important;
        border-radius: 8px !important;
        padding: 15px !important;
        border: 1px solid #e9ecef !important;
      }
      
      .section-title {
        font-size: 14px !important;
        font-weight: 600 !important;
        color: #495057 !important;
        margin-bottom: 10px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
    }
    
    .ai-loading-dot {
        width: 8px;
        height: 8px;
      border-radius: 50%;
      background: #667eea;
      animation: dotPulse 1.4s infinite ease-in-out both;
    }
    
      .ai-loading-dot-1 { animation-delay: 0s; }
      .ai-loading-dot-2 { animation-delay: 0.16s; }
      .ai-loading-dot-3 { animation-delay: 0.32s; }
    
    @keyframes dotPulse {
        0%, 80%, 100% { 
          transform: scale(0);
          opacity: 0.3;
        }
        40% { 
          transform: scale(1);
          opacity: 1;
        }
    }
    
      .follow-up-container {
        background: white !important;
        border-radius: 8px !important;
        padding: 15px !important;
        border: 1px solid #e9ecef !important;
        margin-top: 10px !important;
    }
    
      .follow-up-input {
        width: 100% !important;
        padding: 10px 12px !important;
        border: 2px solid #e9ecef !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        resize: vertical !important;
        min-height: 80px !important;
        font-family: inherit !important;
    }
    
      .follow-up-input:focus {
        outline: none !important;
        border-color: #667eea !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    }
    
      .follow-up-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        border: none !important;
        padding: 10px 20px !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        margin-top: 10px !important;
        transition: opacity 0.3s !important;
    }
    
      .follow-up-button:hover {
        opacity: 0.9 !important;
      }
      
      .follow-up-button:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
      }
      
      .analysis-step {
        opacity: 0;
        transform: translateY(8px);
        animation: fadeIn 0.4s ease-out forwards;
      }

      @keyframes fadeIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .sidebar-resizer {
        position: absolute;
        background: transparent;
        z-index: 10;
      }
      .resizer-left {
        left: 0; top: 0; bottom: 0;
        width: 8px;
        cursor: ew-resize;
      }
      .resizer-bottom {
        left: 0; right: 0; bottom: 0;
        height: 8px;
        cursor: ns-resize;
      }
      .resizer-bottom-left {
        left: 0; bottom: 0;
        width: 12px; height: 12px;
        cursor: sw-resize;
        z-index: 11;
      }
      .resizer-right {
        right: 0; top: 0; bottom: 0;
        width: 8px;
        cursor: ew-resize;
      }
      .resizer-bottom-right {
        right: 0; bottom: 0;
        width: 12px; height: 12px;
        cursor: se-resize;
        z-index: 11;
      }
      .resizer-top {
        top: 0; left: 0; right: 0;
        height: 8px;
        cursor: ns-resize;
      }
      .resizer-top-left {
        top: 0; left: 0;
        width: 12px; height: 12px;
        cursor: nw-resize;
        z-index: 11;
      }
      .resizer-top-right {
        top: 0; right: 0;
        width: 12px; height: 12px;
        cursor: ne-resize;
        z-index: 11;
      }
      
      .pulsing-text {
        animation: subtlePulse 2.5s infinite ease-in-out;
    }
    
      @keyframes subtlePulse {
        0%, 100% {
          transform: translateY(0);
          opacity: 1;
        }
        50% {
          transform: translateY(-1px);
          opacity: 0.85;
        }
    }
    
      .loading-robot-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 15px auto;
        animation: robotBob 2.5s infinite ease-in-out;
      }
      @keyframes robotBob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-height: 200px;
      }
      .loading-robot-wipe {
        width: 80px;
        height: 80px;
        animation: wipeIn 1.5s ease-out forwards, 
                   robotBob 2.5s infinite ease-in-out 1.6s;
        clip-path: inset(0 100% 0 0);
      }
      @keyframes wipeIn {
        to { clip-path: inset(0 0 0 0); }
     }
      @keyframes robotBob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
    `;
    
    // --- Rebuild Shadow DOM for stability ---
    shadowRoot.innerHTML = ''; 
    shadowRoot.appendChild(style);

    // 1. Create a stable container for z-index context
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // 2. Create and add content
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.width = '100%';
    contentWrapper.style.height = '100%';
    contentWrapper.style.zIndex = '1'; 
    contentWrapper.innerHTML = `
      <div class="sidebar-header">
                        <h3 class="sidebar-title">🤖 AI Search</h3>
        <button class="close-button" id="ai-sidebar-close">×</button>
      </div>
      <div class="sidebar-content">
        <div class="content-section">
          <div class="section-title">📝 选中内容</div>
          <div id="ai-original-content"></div>
        </div>
        <div class="content-section">
          <div id="ai-result-content"></div>
        </div>
      </div>
    `;
    container.appendChild(contentWrapper);
  
    // 3. Create and add resizers
    const resizers = [
      'resizer-left', 'resizer-top', 'resizer-right', 'resizer-bottom',
      'resizer-top-left', 'resizer-top-right', 'resizer-bottom-left', 'resizer-bottom-right'
    ];
    resizers.forEach(className => {
      const resizer = document.createElement('div');
      resizer.className = `sidebar-resizer ${className}`;
      container.appendChild(resizer);
    });

    shadowRoot.appendChild(container);
    document.body.appendChild(sidebar);
    console.log('🎨 侧边栏已创建 (结构稳定版)');
  }

  // 确保事件监听器只附加一次
  if (!sidebar.dataset.listenersAttached) {
    initializeWindowBehavior(sidebar, sidebar.shadowRoot);

    const shadowRoot = sidebar.shadowRoot;
    if (shadowRoot) {
      
      // 使用事件委托来处理所有点击事件，这样更健壮
      shadowRoot.addEventListener('click', (event) => {
        const target = event.target;
        const currentSidebar = document.getElementById('ai-assistant-sidebar');

        // 检查点击的是否是关闭按钮或其子元素
        if (target.closest('#ai-sidebar-close')) {
          if(currentSidebar) {
            currentSidebar.remove();
          }
          return;
  }

        // 检查点击的是否是"发送问题"按钮
        if (target.closest('#ai-follow-up-button')) {
          const followUpButton = shadowRoot.getElementById('ai-follow-up-button');
          const followUpInput = shadowRoot.getElementById('ai-follow-up-input');
          if (followUpInput && followUpButton) {
            const question = followUpInput.value.trim();
            if (question) {
              sendFollowUpQuestion(question, followUpButton, followUpInput, shadowRoot);
            }
          }
          return;
        }
      });
      
      // keydown事件需要直接绑定在输入框上
      const followUpInput = shadowRoot.getElementById('ai-follow-up-input');
      if (followUpInput) {
        followUpInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
            const followUpButton = shadowRoot.getElementById('ai-follow-up-button');
            if (followUpButton) {
              followUpButton.click();
            }
          }
        });
      }
      
      sidebar.dataset.listenersAttached = 'true';
      console.log('🎨 侧边栏事件监听器已附加 (使用事件委托)');
    }
  }

  // 最后，确保侧边栏是可见的
  sidebar.style.display = 'block';
}

function initializeWindowBehavior(sidebar, shadowRoot) {
  const minWidth = 350;
  const minHeight = 400;

  // --- RESIZING LOGIC ---
  const resizers = shadowRoot.querySelectorAll('.sidebar-resizer');
  let currentResizer;

  for (const resizer of resizers) {
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      currentResizer = resizer;
      
      // 在 mousedown 时记录初始状态
      const initialRect = sidebar.getBoundingClientRect();
      const initialMouseX = e.clientX;
      const initialMouseY = e.clientY;

      const onMouseMoveResize = (moveEvent) => {
        if (!currentResizer) return;
        
        const deltaX = moveEvent.clientX - initialMouseX;
        const deltaY = moveEvent.clientY - initialMouseY;

        const isDraggingLeft = currentResizer.classList.contains('resizer-left') || currentResizer.classList.contains('resizer-top-left') || currentResizer.classList.contains('resizer-bottom-left');
        const isDraggingRight = currentResizer.classList.contains('resizer-right') || currentResizer.classList.contains('resizer-top-right') || currentResizer.classList.contains('resizer-bottom-right');
        const isDraggingTop = currentResizer.classList.contains('resizer-top') || currentResizer.classList.contains('resizer-top-left') || currentResizer.classList.contains('resizer-top-right');
        const isDraggingBottom = currentResizer.classList.contains('resizer-bottom') || currentResizer.classList.contains('resizer-bottom-left') || currentResizer.classList.contains('resizer-bottom-right');

        // 水平拖拽
        if (isDraggingLeft) {
          const newWidth = initialRect.width - deltaX;
          if (newWidth >= minWidth) {
            sidebar.style.width = `${newWidth}px`;
            sidebar.style.left = `${initialRect.left + deltaX}px`;
            sidebar.style.right = 'auto';
          }
        } else if (isDraggingRight) {
          const newWidth = initialRect.width + deltaX;
          if (newWidth >= minWidth) {
            sidebar.style.width = `${newWidth}px`;
          }
        }

        // 垂直拖拽
        if (isDraggingTop) {
          const newHeight = initialRect.height - deltaY;
          if (newHeight >= minHeight) {
            sidebar.style.height = `${newHeight}px`;
            sidebar.style.top = `${initialRect.top + deltaY}px`;
            sidebar.style.bottom = 'auto';
          }
        } else if (isDraggingBottom) {
          const newHeight = initialRect.height + deltaY;
          if (newHeight >= minHeight) {
            sidebar.style.height = `${newHeight}px`;
          }
        }
      };

      const onMouseUpResize = () => {
        window.removeEventListener('mousemove', onMouseMoveResize);
        window.removeEventListener('mouseup', onMouseUpResize);
        currentResizer = null;
      };

      window.addEventListener('mousemove', onMouseMoveResize);
      window.addEventListener('mouseup', onMouseUpResize);
    });
  }

  // --- DRAGGING LOGIC ---
  const header = shadowRoot.querySelector('.sidebar-header');
  if (header) {
    header.addEventListener('mousedown', (e) => {
      // Ignore clicks on buttons or resizers
      if (e.target.closest('button, .sidebar-resizer')) {
        return;
      }
      e.preventDefault();
      
      const rect = sidebar.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      const onMouseMoveDrag = (moveEvent) => {
        const newLeft = moveEvent.clientX - offsetX;
        const newTop = moveEvent.clientY - offsetY;
        
        sidebar.style.left = `${newLeft}px`;
        sidebar.style.top = `${newTop}px`;
        sidebar.style.right = 'auto'; // Break from initial 'right' positioning
        sidebar.style.bottom = 'auto';
      };

      const onMouseUpDrag = () => {
        window.removeEventListener('mousemove', onMouseMoveDrag);
        window.removeEventListener('mouseup', onMouseUpDrag);
      };

      window.addEventListener('mousemove', onMouseMoveDrag);
      window.addEventListener('mouseup', onMouseUpDrag);
    });
  }

  console.log('⚡️ 侧边栏拖拽和调整大小功能已初始化');
}

// A simple text streaming function for the analysis process
function streamTextToElement(element, text, config) {
  const { speed = 20, onComplete = () => {} } = config || {};
  element.textContent = '';
  const chars = Array.from(text);
  let currentIndex = 0;

  function addNextChar() {
    if (currentIndex < chars.length) {
      element.textContent += chars[currentIndex];
      currentIndex++;
      setTimeout(addNextChar, speed);
    } else {
      onComplete();
    }
  }
  
  // Start with a small delay
  setTimeout(addNextChar, 30);
}

// 立即显示选中文本（先渲染，再等AI结果）
function showSelectedTextImmediately(text, languageConfig) {
  // 获取侧边栏的Shadow DOM
  const sidebar = document.getElementById('ai-assistant-sidebar');
  if (!sidebar || !sidebar.shadowRoot) return;
  
  const shadowRoot = sidebar.shadowRoot;
  
  // 在函数开头声明所有变量，避免作用域问题
    const wordCount = text.length;
    const lineCount = text.split('\n').length;
    const language = languageConfig.title;
    
    // 计算语句数量
    const sentenceCount = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0).length;
    
    // 检测文本特征
    const hasChineseChars = /[\u4e00-\u9fff]/.test(text);
    const hasEnglishChars = /[a-zA-Z]/.test(text);
    const hasNumbers = /\d/.test(text);
    const hasPunctuation = /[，。！？、；：""''（）,\.!\?;:"'()]/.test(text);
    
    // 生成文本特征标签
    const features = [];
    if (hasChineseChars) features.push('中文');
    if (hasEnglishChars) features.push('英文');
    if (hasNumbers) features.push('数字');
    if (hasPunctuation) features.push('标点');
    
  // 更新选中内容（在Shadow DOM内查找）
  const originalContent = shadowRoot.getElementById('ai-original-content');
  if (originalContent) {
    // 清空所有内容，确保没有残留
    originalContent.innerHTML = '';
    
    // 重新构建完整的原文显示区域
    const originalWrapper = document.createElement('div');
    originalWrapper.innerHTML = `
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px; font-weight: 600; color: #333;">${language}</span>
            ${languageConfig.detectionResult?.confidence ? 
              `<span style="background: ${languageConfig.detectionResult.confidence > 80 ? '#e8f5e8' : languageConfig.detectionResult.confidence > 50 ? '#fff3cd' : '#f8d7da'}; 
                      color: ${languageConfig.detectionResult.confidence > 80 ? '#155724' : languageConfig.detectionResult.confidence > 50 ? '#856404' : '#721c24'}; 
                      padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600;">
                置信度 ${languageConfig.detectionResult.confidence}%
              </span>` : ''
            }
          </div>
          <span style="font-size: 12px; color: #666;">${wordCount}字 · ${lineCount}行 · ${sentenceCount}句</span>
        </div>
        <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;">
          ${features.map(feature => 
            `<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${feature}</span>`
          ).join('')}
        </div>
      </div>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; font-size: 14px; line-height: 1.6; max-height: 300px; overflow-y: auto; border-left: 4px solid #667eea;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <span style="font-size: 13px; font-weight: 600; color: #495057;">原文</span>
          <div style="flex-grow: 1; height: 1px; background-color: #e9ecef;"></div>
        </div>
        <div id="original-text-content" style="white-space: pre-wrap; word-break: break-word; min-height: 60px; line-height: 1.7;"></div>
      </div>
    `;
    
    // 添加到原文容器
    originalContent.appendChild(originalWrapper);
    
    // 单独设置文本内容，确保完整显示
    const textContentElement = originalContent.querySelector('#original-text-content');
    if (textContentElement) {
      // 首先清空元素
      textContentElement.innerHTML = '';
      textContentElement.textContent = '';
      
      // 分段设置文本，确保不会被截断
      const textParagraphs = text.split('\n').filter(p => p.trim());
      if (textParagraphs.length > 1) {
        // 如果有多段，分段显示
        textContentElement.innerHTML = textParagraphs
          .map(paragraph => `<p style="margin: 8px 0; word-wrap: break-word;">${paragraph}</p>`)
          .join('');
      } else {
        // 如果是单段，直接显示
        textContentElement.innerHTML = `<p style="margin: 8px 0; word-wrap: break-word;">${text}</p>`;
      }
      
      // 验证文本长度
      const displayedLength = textContentElement.textContent.length;
      console.log('📄 原文显示验证:', {
        originalLength: text.length,
        displayedLength: displayedLength,
        isComplete: displayedLength >= text.length * 0.95, // 允许少量差异
        textPreview: text.substring(0, 100),
        displayedPreview: textContentElement.textContent.substring(0, 100)
      });
      
      // 如果显示不完整，使用备用方法
      if (displayedLength < text.length * 0.9) {
        console.warn('⚠️ 原文显示可能不完整，使用备用方法...');
        textContentElement.innerHTML = '';
        textContentElement.textContent = text;
      }
    }
  }
  
  // 立即显示AI分析加载状态（在Shadow DOM内查找）
  const resultContent = shadowRoot.getElementById('ai-result-content');
  if (resultContent) {
    resultContent.innerHTML = `
      <div class="loading-container">
        <div class="loading-robot-wipe">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: 100%; height: 100%;">
            <defs>
              <style>
                .robot-eye-left {
                  animation: robot-eye-left-sequence 6s infinite;
                  transform-origin: center;
                }
                .robot-eye-right {
                  animation: robot-eye-right-sequence 6s infinite;
                  transform-origin: center;
                }
                .robot-eye-highlight-left {
                  animation: robot-highlight-left 6s infinite;
                  transform-origin: center;
                }
                .robot-eye-highlight-right {
                  animation: robot-highlight-right 6s infinite;
                  transform-origin: center;
                }
                
                @keyframes robot-eye-left-sequence {
                  0%, 12% { transform: scale(1) translateX(0); }
                  15%, 16% { transform: scaleY(0.1) translateX(0); }
                  19%, 32% { transform: scale(1) translateX(0); }
                  35%, 37% { transform: scale(1.1) translateX(-0.5px); }
                  40%, 42% { transform: scale(1) translateX(0.8px); }
                  45%, 47% { transform: scale(0.95) translateX(-0.3px); }
                  50%, 65% { transform: scale(1) translateX(0); }
                  68%, 70% { transform: scale(1.05) translateX(0); }
                  73%, 74% { transform: scaleY(0.15) translateX(0); }
                  77%, 79% { transform: scaleY(0.1) translateX(0); }
                  82%, 88% { transform: scale(1) translateX(0); }
                  91%, 92% { transform: scale(1.08) translateX(0); }
                  95%, 100% { transform: scale(1) translateX(0); }
                }
                
                @keyframes robot-eye-right-sequence {
                  0%, 18% { transform: scale(1) translateX(0); }
                  21%, 22% { transform: scaleY(0.12) translateX(0); }
                  25%, 35% { transform: scale(1) translateX(0); }
                  38%, 40% { transform: scale(0.98) translateX(0.6px); }
                  43%, 45% { transform: scale(1.08) translateX(-0.7px); }
                  48%, 50% { transform: scale(0.96) translateX(0.4px); }
                  53%, 62% { transform: scale(1) translateX(0); }
                  65%, 67% { transform: scale(1.03) translateX(0); }
                  70%, 72% { transform: scaleY(0.08) translateX(0); }
                  75%, 78% { transform: scaleY(0.12) translateX(0); }
                  81%, 85% { transform: scale(1) translateX(0); }
                  88%, 90% { transform: scale(1.06) translateX(0); }
                  93%, 100% { transform: scale(1) translateX(0); }
                }
                
                @keyframes robot-highlight-left {
                  0%, 12% { opacity: 0.9; transform: scale(1) translateX(0); }
                  15%, 16% { opacity: 0.3; transform: scale(0.5) translateX(0); }
                  19%, 32% { opacity: 0.9; transform: scale(1) translateX(0); }
                  35%, 37% { opacity: 1; transform: scale(1.2) translateX(-0.3px); }
                  40%, 42% { opacity: 0.8; transform: scale(0.9) translateX(0.5px); }
                  45%, 47% { opacity: 0.95; transform: scale(1.1) translateX(-0.2px); }
                  50%, 65% { opacity: 0.9; transform: scale(1) translateX(0); }
                  68%, 70% { opacity: 1; transform: scale(1.15) translateX(0); }
                  73%, 74% { opacity: 0.2; transform: scale(0.4) translateX(0); }
                  77%, 79% { opacity: 0.1; transform: scale(0.3) translateX(0); }
                  82%, 88% { opacity: 0.9; transform: scale(1) translateX(0); }
                  91%, 92% { opacity: 1; transform: scale(1.25) translateX(0); }
                  95%, 100% { opacity: 0.9; transform: scale(1) translateX(0); }
                }
                
                @keyframes robot-highlight-right {
                  0%, 18% { opacity: 0.9; transform: scale(1) translateX(0); }
                  21%, 22% { opacity: 0.25; transform: scale(0.4) translateX(0); }
                  25%, 35% { opacity: 0.9; transform: scale(1) translateX(0); }
                  38%, 40% { opacity: 0.85; transform: scale(0.95) translateX(0.4px); }
                  43%, 45% { opacity: 1; transform: scale(1.18) translateX(-0.4px); }
                  48%, 50% { opacity: 0.88; transform: scale(1.05) translateX(0.3px); }
                  53%, 62% { opacity: 0.9; transform: scale(1) translateX(0); }
                  65%, 67% { opacity: 1; transform: scale(1.12) translateX(0); }
                  70%, 72% { opacity: 0.15; transform: scale(0.35) translateX(0); }
                  75%, 78% { opacity: 0.2; transform: scale(0.4) translateX(0); }
                  81%, 85% { opacity: 0.9; transform: scale(1) translateX(0); }
                  88%, 90% { opacity: 1; transform: scale(1.22) translateX(0); }
                  93%, 100% { opacity: 0.9; transform: scale(1) translateX(0); }
                }
              </style>
            </defs>
            <path fill="#667eea" d="M84,30H16a4,4,0,0,0-4,4V80a4,4,0,0,0,4,4H84a4,4,0,0,0,4-4V34A4,4,0,0,0,84,30Z"/>
            <path fill="#fff" d="M72,50a8,8,0,1,1-8-8A8,8,0,0,1,72,50Z"/>
            <path fill="#fff" d="M44,50a8,8,0,1,1-8-8A8,8,0,0,1,44,50Z"/>
            <path class="robot-eye-right" fill="#333" d="M64,50a4,4,0,1,1-4-4A4,4,0,0,1,64,50Z"/>
            <path class="robot-eye-left" fill="#333" d="M36,50a4,4,0,1,1-4-4A4,4,0,0,1,36,50Z"/>
            <circle class="robot-eye-highlight-right" cx="61" cy="48.5" r="0.8" fill="#fff" opacity="0.9"/>
            <circle class="robot-eye-highlight-left" cx="33" cy="48.5" r="0.8" fill="#fff" opacity="0.9"/>
            <line x1="32" y1="70" x2="68" y2="70" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
            <line x1="50" y1="30" x2="50" y2="20" fill="none" stroke="#667eea" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
            <circle cx="50" cy="15" r="5" fill="#667eea"/>
          </svg>
        </div>
      </div>
    `;
  }
  
  console.log('📝 立即显示选中内容:', {
    language: languageConfig.title,
    wordCount: wordCount,
    lineCount: lineCount,
    sentenceCount: sentenceCount,
    features: features,
    textLength: text.length,
    textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    textEnd: text.length > 100 ? '...' + text.substring(text.length - 50) : ''
  });
  
  // 添加额外的验证，确保原文完整显示
  setTimeout(() => {
    const originalTextElement = shadowRoot.getElementById('original-text-content');
    if (originalTextElement) {
      const displayedText = originalTextElement.textContent || originalTextElement.innerText || '';
      const lengthDifference = Math.abs(displayedText.length - text.length);
      
      // 如果差异超过10%，认为有问题
      if (lengthDifference > text.length * 0.1) {
        console.warn('⚠️ 延迟验证：原文显示不完整！', {
          expected: text.length,
          actual: displayedText.length,
          difference: lengthDifference,
          percentage: Math.round((lengthDifference / text.length) * 100) + '%'
        });
        
        // 尝试多种修复方法
        console.log('🔧 尝试修复原文显示...');
        
        // 方法1：直接设置textContent
        originalTextElement.textContent = text;
        
        // 等待一小段时间后验证修复效果
        setTimeout(() => {
          const fixedText = originalTextElement.textContent || '';
          const fixedDifference = Math.abs(fixedText.length - text.length);
          
          if (fixedDifference <= text.length * 0.05) {
            console.log('✅ 原文显示已修复');
          } else {
            console.error('❌ 原文显示修复失败，可能需要手动检查');
            // 最后的备用方案：创建新的元素
            const backupElement = document.createElement('div');
            backupElement.style.cssText = 'margin-top: 20px; padding-right: 50px; white-space: pre-wrap; word-break: break-word; min-height: 60px;';
            backupElement.textContent = text;
            originalTextElement.parentNode.replaceChild(backupElement, originalTextElement);
          }
        }, 50);
      } else {
        console.log('✅ 原文显示验证通过');
      }
    }
  }, 150);
}

function streamTextWithLineBreaks(element, text, config) {
  const { speed = 10, onComplete = () => {} } = config || {};
  const scrollContainer = element.parentElement;

  element.innerHTML = '';
  const chars = Array.from(text);
  let currentIndex = 0;

  // 获取侧边栏的可滚动容器
  const sidebar = document.getElementById('ai-assistant-sidebar');
  const sidebarContent = sidebar?.shadowRoot?.querySelector('.sidebar-content');

  // 智能滚动控制变量（选中内容显示时通常不需要太复杂的控制）
  let userScrolled = false;
  let lastScrollTop = 0;
  
  // 监听用户滚动行为
  if (sidebarContent) {
    const handleScroll = () => {
      const currentScrollTop = sidebarContent.scrollTop;
      const maxScrollTop = sidebarContent.scrollHeight - sidebarContent.clientHeight;
      
      // 检测用户是否手动向上滚动
      if (currentScrollTop < lastScrollTop - 2) {
        userScrolled = true;
      }
      
      // 如果用户滚动到接近底部，恢复自动滚动
      if (currentScrollTop >= maxScrollTop - 50) {
        userScrolled = false;
      }
      
      lastScrollTop = currentScrollTop;
    };
    
    sidebarContent.addEventListener('scroll', handleScroll, { passive: true });
    lastScrollTop = sidebarContent.scrollTop;
  }

  function addNextChar() {
    if (currentIndex < chars.length) {
      const char = chars[currentIndex];
      if (char === '\n') {
        element.innerHTML += '<br>';
      } else {
        element.appendChild(document.createTextNode(char));
      }
      currentIndex++;
      
      // 智能自动滚动
      if (sidebarContent && !userScrolled) {
        sidebarContent.scrollTo({
          top: sidebarContent.scrollHeight,
          behavior: 'smooth'
        });
      } else if (scrollContainer && !userScrolled) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }

      setTimeout(addNextChar, speed);
    } else {
      // 完成时最终确保滚动到底部
      if (sidebarContent && !userScrolled) {
        setTimeout(() => {
          sidebarContent.scrollTo({
            top: sidebarContent.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
      onComplete();
    }
  }
  
  setTimeout(addNextChar, 100);
}

// 显示AI分析结果（流式显示）
function showAIResultInSidebar(result) {
  console.log('🎯 开始显示AI结果:', {
    resultType: typeof result,
    resultLength: result?.length || 0,
    resultPreview: result?.substring(0, 100) || 'no content'
  });
  
  // 验证输入参数
  if (!result || typeof result !== 'string' || result.trim().length === 0) {
    console.error('❌ showAIResultInSidebar: 无效的结果内容', result);
    showErrorInSidebar('结果内容无效，请重试');
    return;
  }
  
  // 获取侧边栏的Shadow DOM
  const sidebar = document.getElementById('ai-assistant-sidebar');
  if (!sidebar) {
    console.error('❌ showAIResultInSidebar: 找不到侧边栏元素');
    showErrorInSidebar('侧边栏未找到，请刷新页面重试');
    return;
  }
  
  if (!sidebar.shadowRoot) {
    console.error('❌ showAIResultInSidebar: Shadow DOM不存在');
    showErrorInSidebar('界面初始化失败，请刷新页面重试');
    return;
  }
  
  const shadowRoot = sidebar.shadowRoot;
  const resultContent = shadowRoot.getElementById('ai-result-content');
  
  if (!resultContent) {
    console.error('❌ showAIResultInSidebar: 找不到结果容器元素');
    showErrorInSidebar('结果容器未找到，请刷新页面重试');
    return;
  }
  
  try {
    console.log('🎨 开始渲染AI结果界面...');
    
    // 完全清空结果容器，确保没有任何残留内容
    resultContent.innerHTML = '';
    resultContent.textContent = '';
    
    // 创建干净的结果界面
    const resultWrapper = document.createElement('div');
    resultWrapper.innerHTML = `
      <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; font-size: 14px; line-height: 1.6; min-height: 300px; flex-grow: 1;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
          <span style="font-size: 16px;">✨</span>
          <span style="font-weight: 600; color: #495057; font-size: 16px;">AI分析结果</span>
        </div>
        <div id="ai-streaming-content" style="min-height: 250px; line-height: 1.7; color: #333;"></div>
      </div>
    `;
    
    // 添加到结果容器
    resultContent.appendChild(resultWrapper);
    console.log('✅ 结果界面HTML已创建');
    
    // 验证流式显示元素
    const streamingElement = shadowRoot.getElementById('ai-streaming-content');
    if (!streamingElement) {
      console.error('❌ 找不到流式显示元素');
      // 使用备用方案：直接显示结果
    resultContent.innerHTML = `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; font-size: 14px; line-height: 1.6;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef;">
            <span style="font-size: 16px;">✨</span>
            <span style="font-weight: 600; color: #495057; font-size: 16px;">AI分析结果</span>
          </div>
          <div style="line-height: 1.7; color: #333;">${formatMarkdownText(result)}</div>
      </div>
    `;
      // 直接添加继续提问区域
      setTimeout(() => addFollowUpSection(shadowRoot), 500);
      return;
    }
    
    console.log('🌊 开始流式显示，内容长度:', result.length);
    
    // 开始流式显示
    streamTextInSidebar(streamingElement, result, 20, () => {
      console.log('✅ 流式显示完成，添加继续提问区域');
      // 流式显示完成后，添加继续提问区域
      addFollowUpSection(shadowRoot);
    });
    
    console.log('🎯 showAIResultInSidebar 执行完成');
    
  } catch (renderError) {
    console.error('❌ 渲染AI结果时发生错误:', renderError);
    showErrorInSidebar(`显示结果时发生错误: ${renderError.message}`);
  }
}

// 在侧边栏显示加载状态（保留作为备用）
function showLoadingInSidebar() {
  const resultContent = document.getElementById('ai-result-content');
  if (resultContent) {
    resultContent.innerHTML = `
      <div class="ai-loading">
        <span>AI正在分析中</span>
        <div class="ai-loading-dots">
          <div class="ai-loading-dot"></div>
          <div class="ai-loading-dot"></div>
          <div class="ai-loading-dot"></div>
        </div>
      </div>
    `;
  }
}

// 在侧边栏显示结果（流式显示）- 已废弃，请使用showAIResultInSidebar
function showResultInSidebar(originalText, result) {
  console.warn('⚠️ showResultInSidebar已废弃，应使用showAIResultInSidebar');
  // 这个函数已废弃，不应该被调用
  // 原来的实现有Shadow DOM访问问题
}

// 流式显示文本
function streamTextInSidebar(element, text, speed = 30, onComplete = null) {
  console.log('🌊 开始流式显示文本:', {
    elementExists: !!element,
    textType: typeof text,
    textLength: text?.length || 0,
    speed: speed,
    hasCallback: !!onComplete
  });
  
  // 验证输入参数
  if (!element) {
    console.error('❌ streamTextInSidebar: 目标元素不存在');
    return;
  }
  
  if (!text || typeof text !== 'string') {
    console.error('❌ streamTextInSidebar: 无效的文本内容', text);
    element.innerHTML = '<p style="color: #c53030;">显示文本时发生错误</p>';
    return;
  }
  
  if (text.trim().length === 0) {
    console.warn('⚠️ streamTextInSidebar: 文本内容为空');
    element.innerHTML = '<p style="color: #666;">没有内容可显示</p>';
    if (onComplete) onComplete();
    return;
  }
  
  try {
  element.innerHTML = '';
  const chars = Array.from(text);
  let currentIndex = 0;
    
    console.log('📝 字符数组长度:', chars.length);
    
    // 获取侧边栏的可滚动容器
    const sidebar = document.getElementById('ai-assistant-sidebar');
    const sidebarContent = sidebar?.shadowRoot?.querySelector('.sidebar-content');
    
    // 智能滚动控制变量
    let userScrolled = false;
    let lastScrollTop = 0;
    let scrollTimeout = null;
    
    // 监听用户滚动行为
    if (sidebarContent) {
      const handleScroll = () => {
        const currentScrollTop = sidebarContent.scrollTop;
        const maxScrollTop = sidebarContent.scrollHeight - sidebarContent.clientHeight;
        
        // 检测用户是否手动向上滚动（降低阈值，更容易触发）
        if (currentScrollTop < lastScrollTop - 2) {
          userScrolled = true;
          console.log('🔍 用户手动向上滚动，暂停自动滚动');
        }
        
        // 如果用户滚动到接近底部，恢复自动滚动（增加范围，更容易恢复）
        if (currentScrollTop >= maxScrollTop - 80) {
          userScrolled = false;
          console.log('📜 用户回到底部，恢复自动滚动');
          // 隐藏新内容指示器
          hideNewContentIndicator(sidebarContent.getRootNode());
        }
        
        lastScrollTop = currentScrollTop;
        
        // 清除之前的定时器
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        // 如果用户停止滚动5秒，也恢复自动滚动
        scrollTimeout = setTimeout(() => {
          if (userScrolled) {
            const currentMaxScrollTop = sidebarContent.scrollHeight - sidebarContent.clientHeight;
            if (sidebarContent.scrollTop >= currentMaxScrollTop - 120) {
              userScrolled = false;
              console.log('⏰ 用户停止滚动，恢复自动滚动');
            }
          }
        }, 5000);
      };
      
      sidebarContent.addEventListener('scroll', handleScroll, { passive: true });
      lastScrollTop = sidebarContent.scrollTop;
    }
  
  function addNextChar() {
    if (currentIndex < chars.length) {
      currentIndex++;
      const currentText = chars.slice(0, currentIndex).join('');
        
        try {
      element.innerHTML = formatMarkdownText(currentText);
        } catch (formatError) {
          console.error('❌ 格式化文本时出错:', formatError);
          // 使用原始文本作为备用
          element.textContent = currentText;
        }
        
        // 智能自动滚动：只有当用户没有手动向上滚动时才自动滚动
        if (sidebarContent && !userScrolled) {
          sidebarContent.scrollTo({
            top: sidebarContent.scrollHeight,
            behavior: 'smooth'
          });
        }
        
        // 如果用户向上滚动了，显示"新内容"指示器
        if (sidebarContent && userScrolled) {
          showNewContentIndicator(sidebarContent);
        }
        
      setTimeout(addNextChar, speed);
    } else {
        // 流式显示完成
        try {
      element.innerHTML = formatMarkdownText(text);
        } catch (formatError) {
          console.error('❌ 最终格式化文本时出错:', formatError);
          element.textContent = text;
        }
        
        // 最终确保滚动到底部（除非用户明确向上滚动）
        if (sidebarContent && !userScrolled) {
          setTimeout(() => {
            sidebarContent.scrollTo({
              top: sidebarContent.scrollHeight,
              behavior: 'smooth'
            });
          }, 100);
        }
        
      console.log('✅ 流式显示完成');
        
        // 执行完成回调
        if (onComplete && typeof onComplete === 'function') {
          setTimeout(() => {
            try {
              onComplete();
            } catch (callbackError) {
              console.error('❌ 执行完成回调时出错:', callbackError);
            }
          }, 200);
        }
    }
  }
  
    // 开始流式显示
  addNextChar();
    
  } catch (streamError) {
    console.error('❌ 流式显示过程中发生错误:', streamError);
    element.innerHTML = '<p style="color: #c53030;">文本显示过程中发生错误</p>';
    if (onComplete) onComplete();
  }
}

// 显示新内容指示器
function showNewContentIndicator(sidebarContent) {
  const shadowRoot = sidebarContent.getRootNode();
  let indicator = shadowRoot.getElementById('new-content-indicator');
  
  // 如果指示器不存在，创建它
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'new-content-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        bottom: 80px;
        right: 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 10px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        z-index: 1000;
        animation: newContentPulse 2s infinite;
        transition: all 0.3s ease;
      ">
        <span style="margin-right: 6px;">↓</span>新内容
      </div>
      <style>
        @keyframes newContentPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6); }
        }
      </style>
    `;
    
    // 点击指示器回到底部
    indicator.addEventListener('click', () => {
      sidebarContent.scrollTo({
        top: sidebarContent.scrollHeight,
        behavior: 'smooth'
      });
      hideNewContentIndicator(shadowRoot);
    });
    
    shadowRoot.appendChild(indicator);
  }
  
  // 显示指示器
  indicator.style.display = 'block';
  indicator.style.opacity = '1';
}

// 隐藏新内容指示器
function hideNewContentIndicator(shadowRoot) {
  const indicator = shadowRoot.getElementById('new-content-indicator');
  if (indicator) {
    indicator.style.opacity = '0';
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 300);
  }
}

// 添加继续提问区域
function addFollowUpSection(shadowRoot) {
  const resultContent = shadowRoot.getElementById('ai-result-content');
  if (!resultContent) return;
  
  // 检查是否已经存在继续提问区域，避免重复添加
  const existingFollowUp = shadowRoot.getElementById('ai-follow-up-container');
  if (existingFollowUp) {
    console.log('💬 继续提问区域已存在，确保其位置正确');
    
    // 确保继续提问区域始终在最底部
    if (existingFollowUp.parentNode === resultContent) {
      // 如果已经在正确位置，就不需要移动
      const lastChild = resultContent.lastElementChild;
      if (lastChild !== existingFollowUp) {
        // 移动到最底部
        resultContent.appendChild(existingFollowUp);
        console.log('📌 继续提问区域已移动到底部');
      }
    }
    return;
  }
  
  console.log('💬 创建新的继续提问区域');
  
  // 创建一个干净的继续提问容器
  const followUpContainer = document.createElement('div');
  followUpContainer.id = 'ai-follow-up-container';
  followUpContainer.style.cssText = `
    background: white !important;
    border-radius: 12px !important;
    padding: 20px !important;
    margin-top: 25px !important;
    border: 2px solid #e3f2fd !important;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1) !important;
  `;
  
  followUpContainer.innerHTML = `
    <div style="display: flex !important; align-items: center !important; gap: 8px !important; margin-bottom: 15px !important;">
      <span style="font-size: 18px !important;">💬</span>
      <span style="font-weight: 600 !important; color: #1976d2 !important; font-size: 16px !important;">继续提问</span>
      <div style="flex: 1 !important; height: 1px !important; background: linear-gradient(to right, #e3f2fd, transparent) !important;"></div>
    </div>
    <div style="margin-bottom: 12px !important; color: #666 !important; font-size: 13px !important;">
      💡 对AI分析结果有疑问？可以继续深入探讨...
    </div>
    <textarea 
      id="ai-follow-up-input"
      placeholder="例如：请详细解释一下这个概念、这在实际中如何应用、有什么相关的案例..."
      style="
        width: 100% !important; 
        min-height: 90px !important; 
        padding: 15px !important; 
        border: 2px solid #e9ecef !important; 
        border-radius: 10px !important; 
        font-size: 14px !important; 
        font-family: inherit !important; 
        resize: vertical !important;
        line-height: 1.6 !important;
        margin-bottom: 15px !important;
        box-sizing: border-box !important;
        outline: none !important;
        transition: all 0.3s ease !important;
      "
    ></textarea>
    <div style="display: flex !important; justify-content: space-between !important; align-items: center !important;">
      <div style="font-size: 12px !important; color: #999 !important;">
        💡 提示：Ctrl/Cmd + Enter 快速发送
      </div>
      <button 
        id="ai-follow-up-button"
        style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; 
          color: white !important; 
          border: none !important; 
          padding: 12px 24px !important; 
          border-radius: 8px !important; 
          font-size: 14px !important; 
          font-weight: 600 !important; 
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          outline: none !important;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3) !important;
        "
      >
        💭 发送问题
      </button>
    </div>
  `;
  
  // 添加到结果容器的最底部
  resultContent.appendChild(followUpContainer);
  
  // 绑定输入框样式和快捷键
  const followUpInput = shadowRoot.getElementById('ai-follow-up-input');
  const followUpButton = shadowRoot.getElementById('ai-follow-up-button');
  
  if (followUpInput) {
    followUpInput.addEventListener('focus', () => {
      followUpInput.style.borderColor = '#667eea !important';
      followUpInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.15) !important';
    });
    
    followUpInput.addEventListener('blur', () => {
      followUpInput.style.borderColor = '#e9ecef !important';
      followUpInput.style.boxShadow = 'none !important';
    });
    
    // 添加快捷键支持
    followUpInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (followUpButton && !followUpButton.disabled) {
          followUpButton.click();
        }
      }
    });
  }
  
  if (followUpButton) {
    followUpButton.addEventListener('mouseenter', () => {
      followUpButton.style.transform = 'translateY(-1px)';
      followUpButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4) !important';
    });
    
    followUpButton.addEventListener('mouseleave', () => {
      followUpButton.style.transform = 'translateY(0)';
      followUpButton.style.boxShadow = '0 2px 6px rgba(102, 126, 234, 0.3) !important';
    });
  }
  
  // 清理和优化
  setTimeout(() => {
    // 确保只有一个继续提问区域
    const allFollowUpContainers = shadowRoot.querySelectorAll('#ai-follow-up-container');
    if (allFollowUpContainers.length > 1) {
      console.log('🧹 发现重复的继续提问区域，正在清理...');
      for (let i = 0; i < allFollowUpContainers.length - 1; i++) {
        allFollowUpContainers[i].remove();
      }
    }
    
    // 最终滚动到底部显示新添加的内容
    const sidebar = document.getElementById('ai-assistant-sidebar');
    const sidebarContent = sidebar?.shadowRoot?.querySelector('.sidebar-content');
    if (sidebarContent) {
      sidebarContent.scrollTo({
        top: sidebarContent.scrollHeight,
        behavior: 'smooth'
      });
    }
    
    console.log('✅ 继续提问区域已优化完成，功能持续可用');
  }, 100);
}

// 格式化Markdown文本
function formatMarkdownText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:#e9ecef;padding:2px 4px;border-radius:3px;">$1</code>')
    .replace(/### (.*)/g, '<h3 style="font-size:16px;margin:10px 0 5px 0;color:#495057;">$1</h3>')
    .replace(/## (.*)/g, '<h2 style="font-size:18px;margin:15px 0 8px 0;color:#495057;">$1</h2>')
    .replace(/# (.*)/g, '<h1 style="font-size:20px;margin:15px 0 10px 0;color:#495057;">$1</h1>')
    .replace(/\n\n/g, '</p><p style="margin:8px 0;">')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/, '<p style="margin:8px 0;">$1</p>')
    .replace(/<p[^>]*><\/p>/g, '');
}

// 在侧边栏显示错误
function showErrorInSidebar(error) {
  // 获取侧边栏的Shadow DOM
  const sidebar = document.getElementById('ai-assistant-sidebar');
  if (!sidebar || !sidebar.shadowRoot) return;
  
  const shadowRoot = sidebar.shadowRoot;
  const resultContent = shadowRoot.getElementById('ai-result-content');
  
  if (resultContent) {
    // 检查是否是API Key相关错误
    if (error.includes('API Key') || error.includes('api_key') || error.includes('401') || error.includes('请先设置')) {
      console.log('🔑 检测到API Key错误，显示设置界面...');
      // 如果是API Key错误，只更新结果区域，不影响"选中内容"
      resultContent.innerHTML = ''; // 先清空，避免冲突
      showAPIKeySetup(shadowRoot); 
    } else {
      resultContent.innerHTML = `
        <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 15px;">❌</div>
          <div style="font-size: 16px; font-weight: 600; color: #c53030; margin-bottom: 10px;">分析失败</div>
          <div style="font-size: 14px; color: #742a2a; margin-bottom: 15px; line-height: 1.5;">${error}</div>
          
          <div style="background: #ffeaea; border-radius: 6px; padding: 15px; margin: 15px 0; text-align: left;">
            <div style="font-size: 12px; font-weight: 600; color: #c53030; margin-bottom: 8px;">🔍 常见解决方案：</div>
            <div style="font-size: 11px; color: #742a2a; line-height: 1.4;">
              • 检查OpenAI API Key是否正确设置<br>
              • 确认网络连接正常，可以访问openai.com<br>
              • 检查API Key是否有足够的使用额度<br>
              • 稍等片刻后重试，可能是临时的服务问题
            </div>
          </div>
          
          <button 
            id="retry-analysis-btn"
            style="
              background: #667eea; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 6px; 
              font-size: 12px; 
              cursor: pointer;
              margin-right: 10px;
            "
          >
            🔄 重试分析
          </button>
          
          <button 
            id="setup-api-key-btn"
            style="
              background: #48bb78; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 6px; 
              font-size: 12px; 
              cursor: pointer;
            "
          >
            🔑 设置API Key
          </button>
        </div>
      `;
      
      // 绑定重试和设置按钮的事件
      const retryBtn = shadowRoot.getElementById('retry-analysis-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          showRetryAnalysis(shadowRoot);
        });
      }
      
      const setupBtn = shadowRoot.getElementById('setup-api-key-btn');
      if (setupBtn) {
        setupBtn.addEventListener('click', () => {
          showAPIKeySetup(shadowRoot);
        });
      }
    }
  }
}

// 显示API Key设置界面
function showAPIKeySetup(shadowRoot) {
  // 如果没有传入shadowRoot，则获取它
  if (!shadowRoot) {
    const sidebar = document.getElementById('ai-assistant-sidebar');
    if (!sidebar || !sidebar.shadowRoot) return;
    shadowRoot = sidebar.shadowRoot;
  }
  
  const resultContent = shadowRoot.getElementById('ai-result-content');
  if (resultContent) {
    resultContent.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 15px;">🔑</div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #333;">设置OpenAI API Key</div>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.5;">
          首次使用需要配置OpenAI API Key<br>
          <strong>您的API Key仅存储在本地浏览器，绝对安全</strong>
        </div>
        
        <div style="background: #e3f2fd; border-radius: 6px; padding: 12px; margin-bottom: 20px; text-align: left;">
          <div style="font-size: 12px; font-weight: 600; color: #1976d2; margin-bottom: 6px;">💡 如何获取API Key：</div>
          <div style="font-size: 11px; color: #1565c0; line-height: 1.4;">
            1. 访问 <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #1976d2;">platform.openai.com/api-keys</a><br>
            2. 登录或注册OpenAI账号<br>
            3. 点击"Create new secret key"创建新密钥<br>
            4. 复制生成的API Key到下方输入框
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <input 
            type="password" 
            id="api-key-input" 
            placeholder="请输入您的OpenAI API Key" 
            style="
              width: 100%; 
              padding: 12px; 
              border: 2px solid #e9ecef; 
              border-radius: 8px; 
              font-size: 14px;
              box-sizing: border-box;
              transition: border-color 0.3s;
            "
          />
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button 
            id="test-api-key-btn" 
            style="
              background: #48bb78;
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
            "
          >
            🧪 测试连接
          </button>
          
          <button 
            id="save-api-key-btn" 
            style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
            "
          >
            💾 保存设置
          </button>
        </div>
        
        <button 
          id="get-api-key-btn" 
          style="
            background: #f8f9fa;
            color: #667eea;
            border: 2px solid #667eea;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s;
            margin-top: 15px;
          "
        >
          🌐 获取API Key
        </button>
        
        <div style="margin-top: 20px; font-size: 12px; color: #999; line-height: 1.4;">
          💡 提示：访问 <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #667eea;">platform.openai.com</a> 获取您的API Key
        </div>
      </div>
    `;
    
    // 添加事件监听器
    const apiKeyInput = shadowRoot.getElementById('api-key-input');
    const saveBtn = shadowRoot.getElementById('save-api-key-btn');
    const testBtn = shadowRoot.getElementById('test-api-key-btn');
    const getKeyBtn = shadowRoot.getElementById('get-api-key-btn');
    
    // 输入框焦点样式
    apiKeyInput.addEventListener('focus', () => {
      apiKeyInput.style.borderColor = '#667eea';
      apiKeyInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
    });
    
    apiKeyInput.addEventListener('blur', () => {
      apiKeyInput.style.borderColor = '#e9ecef';
      apiKeyInput.style.boxShadow = 'none';
    });
    
    // 保存API Key按钮事件
    saveBtn.addEventListener('click', () => saveAPIKey(shadowRoot));
    
    // 测试API Key按钮事件
    testBtn.addEventListener('click', async () => {
      const apiKey = apiKeyInput.value.trim();
      
      if (!apiKey) {
        showToast('❌ 请先输入API Key', 'error');
        return;
      }
      
      if (!apiKey.startsWith('sk-')) {
        showToast('❌ API Key格式错误，应以"sk-"开头', 'error');
        return;
      }
      
      // 显示测试中状态
      testBtn.innerHTML = '🧪 测试中...';
      testBtn.style.background = '#95a5a6';
      testBtn.disabled = true;
      
      try {
        // 测试API调用
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'AI-Reader-Extension-Test/1.0'
          }
        });
        
        if (response.ok) {
          showToast('✅ API Key有效，连接成功！', 'success');
        } else {
          const error = await response.json();
          showToast(`❌ 连接失败: ${error.error.message}`, 'error');
        }
      } catch (error) {
        showToast(`❌ 网络错误: ${error.message}`, 'error');
      } finally {
        // 恢复按钮状态
        testBtn.innerHTML = '🧪 测试连接';
        testBtn.style.background = '#48bb78';
        testBtn.disabled = false;
      }
    });
    
    // 获取API Key按钮事件
    getKeyBtn.addEventListener('click', () => {
      window.open('https://platform.openai.com/api-keys', '_blank');
    });
    
    console.log('🔑 已显示API Key设置界面');
  }
}

// 保存API Key
function saveAPIKey(shadowRoot) {
  const apiKeyInput = shadowRoot.getElementById('api-key-input');
  const saveBtn = shadowRoot.getElementById('save-api-key-btn');
  
  if (!apiKeyInput) return;
  
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    // 输入框为空时的提示
    apiKeyInput.style.borderColor = '#e74c3c';
    apiKeyInput.placeholder = '请输入API Key';
    setTimeout(() => {
      apiKeyInput.style.borderColor = '#e9ecef';
      apiKeyInput.placeholder = '请输入您的OpenAI API Key';
    }, 2000);
    return;
  }
  
  // 验证API Key格式
  if (!apiKey.startsWith('sk-')) {
    apiKeyInput.style.borderColor = '#e74c3c';
    showToast('❌ API Key格式错误，应以"sk-"开头', 'error');
    setTimeout(() => {
      apiKeyInput.style.borderColor = '#e9ecef';
    }, 2000);
    return;
  }
  
  // 显示保存中状态
  saveBtn.innerHTML = '💾 保存中...';
  saveBtn.style.background = '#95a5a6';
  saveBtn.disabled = true;
  
  // 通过background script保存API Key
  chrome.runtime.sendMessage({
    action: 'setApiKey',
    apiKey: apiKey
  }, (response) => {
    if (response && response.success) {
      console.log('✅ API Key已保存');
      showToast('✅ API Key保存成功！', 'success');
      
      // 成功后显示重新分析按钮
      setTimeout(() => {
        showRetryAnalysis(shadowRoot);
      }, 1500);
    } else {
      console.error('保存API Key失败:', response?.error);
      showToast('❌ 保存失败，请重试', 'error');
      saveBtn.innerHTML = '💾 保存设置';
      saveBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      saveBtn.disabled = false;
    }
  });
}

// 显示重新分析界面
function showRetryAnalysis(shadowRoot) {
  const resultContent = shadowRoot.getElementById('ai-result-content');
  if (resultContent) {
    resultContent.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #27ae60;">设置完成！</div>
        <div style="font-size: 14px; color: #666; margin-bottom: 20px;">
          API Key已成功保存，现在可以开始AI分析了
        </div>
        
        <button 
          id="retry-analysis-btn" 
          style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          "
        >
          🚀 重新分析
        </button>
      </div>
    `;
    
    // 重新分析按钮事件
    const retryBtn = shadowRoot.getElementById('retry-analysis-btn');
    retryBtn.addEventListener('click', () => {
      if (selectedText) {
        handleAIAnalysis();
      } else {
        showToast('请重新选择要分析的文本', 'info');
      }
    });
  }
}

// 显示提示消息
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'} !important;
    color: white !important;
    padding: 12px 20px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    z-index: 1000000 !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    animation: slideInRight 0.3s ease !important;
  `;
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 3秒后自动移除
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// 发送追问
function sendFollowUpQuestion(question, followUpButton, followUpInput, shadowRoot) {
  if (!question || !question.trim()) return;
  
  // 保存原始问题以便显示
  const originalQuestion = question.trim();
  
  // 清空输入框
  if (followUpInput) {
    followUpInput.value = '';
  }
  
  // 禁用按钮，显示加载状态
  if (followUpButton) {
    followUpButton.disabled = true;
    followUpButton.textContent = '思考中...';
  }
  
  // 获取结果容器，但不替换内容，而是添加新的对话
  const resultContent = shadowRoot.getElementById('ai-result-content');
  if (!resultContent) return;
  
  // 创建新的对话容器，添加到现有内容下方
  const conversationItem = document.createElement('div');
  conversationItem.style.cssText = `
    margin-top: 20px !important;
    border-top: 2px solid #e9ecef !important;
    padding-top: 20px !important;
  `;
  
  // 显示用户问题
  const questionSection = document.createElement('div');
  questionSection.style.cssText = `
    background: #e3f2fd !important;
    border-radius: 8px !important;
    padding: 15px !important;
    margin-bottom: 15px !important;
    border-left: 4px solid #2196f3 !important;
  `;
  questionSection.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <span style="font-size: 16px;">❓</span>
      <span style="font-weight: 600; color: #1976d2; font-size: 14px;">您的追问</span>
    </div>
    <div style="color: #1565c0; line-height: 1.5; font-size: 14px;">${originalQuestion}</div>
  `;
  
  // 创建AI回答加载区域
  const answerSection = document.createElement('div');
  answerSection.style.cssText = `
    background: #f8f9fa !important;
    border-radius: 8px !important;
    padding: 15px !important;
    border: 1px solid #e9ecef !important;
  `;
  answerSection.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px;">
      <span style="font-size: 16px;">🤖</span>
      <span style="font-weight: 600; color: #495057; font-size: 14px;">AI回答</span>
    </div>
    <div id="ai-follow-up-streaming-${Date.now()}" style="min-height: 60px;">
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 10px;">🤔</div>
        <div style="font-size: 14px; color: #666; margin-bottom: 10px;">AI正在思考您的问题...</div>
        <div style="display: flex; justify-content: center; gap: 4px;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #667eea; animation: dotPulse 1.4s infinite ease-in-out both;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #667eea; animation: dotPulse 1.4s infinite ease-in-out both; animation-delay: 0.16s;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #667eea; animation: dotPulse 1.4s infinite ease-in-out both; animation-delay: 0.32s;"></div>
        </div>
      </div>
    </div>
  `;
  
  // 添加到对话容器
  conversationItem.appendChild(questionSection);
  conversationItem.appendChild(answerSection);
  
  // 将对话容器插入到继续提问区域之前
  const followUpContainer = shadowRoot.getElementById('ai-follow-up-container');
  if (followUpContainer) {
    resultContent.insertBefore(conversationItem, followUpContainer);
  } else {
    resultContent.appendChild(conversationItem);
  }
  
  // 滚动到新添加的内容
  const sidebar = document.getElementById('ai-assistant-sidebar');
  const sidebarContent = sidebar?.shadowRoot?.querySelector('.sidebar-content');
  if (sidebarContent) {
    setTimeout(() => {
      conversationItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
  
  // 发送追问请求
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    console.error('❌ Chrome扩展API不可用，无法发送追问请求');
    if (followUpButton) {
      followUpButton.disabled = false;
      followUpButton.textContent = '发送问题';
    }
    const streamingElement = answerSection.querySelector('[id^="ai-follow-up-streaming-"]');
    if (streamingElement) {
      streamingElement.innerHTML = `
        <div style="text-align: center; color: #c53030; padding: 15px;">
          <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
          <div style="font-size: 14;">扩展API不可用，请刷新页面后重试</div>
        </div>
      `;
    }
    return;
  }
  
  try {
  chrome.runtime.sendMessage({
    action: 'followUpQuestion',
      question: originalQuestion
  }, (response) => {
      // 恢复按钮状态
      if (followUpButton) {
        followUpButton.disabled = false;
        followUpButton.textContent = '发送问题';
      }
      
      const streamingElement = answerSection.querySelector('[id^="ai-follow-up-streaming-"]');
      if (!streamingElement) return;
      
    if (response && response.success) {
        // 开始流式显示AI回答
        streamTextInSidebar(streamingElement, response.result, 25, () => {
          // 回答完成后，确保继续提问区域仍然可用
          console.log('✅ 追问回答完成，继续提问功能保持可用');
          
          // 滚动到底部，确保用户能看到继续提问区域
          if (sidebarContent) {
            setTimeout(() => {
              sidebarContent.scrollTo({
                top: sidebarContent.scrollHeight,
                behavior: 'smooth'
              });
            }, 200);
          }
        });
    } else {
        // 显示错误
        streamingElement.innerHTML = `
          <div style="text-align: center; color: #c53030; padding: 15px;">
            <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
            <div style="font-size: 14; margin-bottom: 5px;">回答失败</div>
            <div style="font-size: 12; color: #666;">${response?.error || '提问失败，请重试'}</div>
          </div>
        `;
      }
    });
  } catch (sendError) {
    console.error('❌ 发送追问请求时发生错误:', sendError);
    if (followUpButton) {
      followUpButton.disabled = false;
      followUpButton.textContent = '发送问题';
    }
    const streamingElement = answerSection.querySelector('[id^="ai-follow-up-streaming-"]');
    if (streamingElement) {
      streamingElement.innerHTML = `
        <div style="text-align: center; color: #c53030; padding: 15px;">
          <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
          <div style="font-size: 14;">发送请求失败，请重试</div>
        </div>
      `;
    }
  }
}

// 检测PDF环境（增强版）
function isPDFDocument() {
  // 1. 检查MIME类型 - 这是最可靠的方式
  if (document.contentType === 'application/pdf') {
    return true;
  }
    
    // 2. 检查URL路径
  if (window.location.pathname.toLowerCase().endsWith('.pdf')) {
    return true;
  }
    
  // 3. 检查是否有全屏的embed元素，这通常是PDF查看器
  const embed = document.querySelector('embed[type="application/pdf"]');
  if (embed && (embed.offsetWidth > window.innerWidth * 0.8 || embed.offsetHeight > window.innerHeight * 0.8)) {
    return true;
  }
  
  // 4. 检查是否有PDF.js的特定元素
  if (document.querySelector('#viewerContainer.pdfViewer')) {
    return true;
  }
  
  // 如果以上都不满足，则认为不是PDF
  return false;
}

// 增强PDF文本选择检测
function getPDFSelectedText() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    console.log('📄 PDF: 没有选择内容');
    return '';
  }
  
  let text = selection.toString().trim();
  console.log('📄 PDF原始选择文本:', text);
  
  // 对于不同类型的PDF查看器进行特殊处理
  if (window.location.href.includes('pdfjs') || document.querySelector('#viewer')) {
    // PDF.js特殊处理
    console.log('📄 检测到PDF.js环境');
    const range = selection.getRangeAt(0);
    if (range) {
      text = range.toString().trim();
      
      // 清理PDF.js可能产生的额外空白和字符
      text = text.replace(/\s+/g, ' ');
      text = text.replace(/[\r\n]+/g, '\n');
    }
  } else if (document.contentType === 'application/pdf') {
    // Chrome内置PDF查看器
    console.log('📄 检测到Chrome内置PDF查看器');
    
    // 尝试从不同的DOM结构获取文本
    const textSpans = document.querySelectorAll('span');
    if (textSpans.length > 0) {
      // 如果有span元素，可能是文本层
      console.log('📄 发现PDF文本层');
    }
  }
  
  // 清理文本
  text = text.trim();
  
  console.log('📄 PDF最终选择文本:', text, '长度:', text.length);
  return text;
}

// PDF环境下的样式调整
function adjustForPDFEnvironment() {
  if (!isPDFDocument()) return;
  
  // 为PDF环境添加特殊样式
  const pdfStyle = document.createElement('style');
  pdfStyle.textContent = `
    /* PDF环境下的特殊样式 */
    #ai-assistant-sidebar {
      z-index: 99999 !important; /* 确保在PDF查看器之上 */
    }
    
    /* 针对PDF.js的调整 */
    .pdfViewer #ai-assistant-sidebar {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
    }
  `;
  document.head.appendChild(pdfStyle);
  
  console.log('🔍 PDF环境检测完成，已应用特殊样式');
}

// 初始化PDF支持
function initializePDFSupport() {
  if (isPDFDocument()) {
    console.log('📄 检测到PDF文档，启用PDF模式');
    adjustForPDFEnvironment();
    
    // PDF加载完成后再初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(adjustForPDFEnvironment, 1000);
      });
    }
  }
}

// PDF调试和测试函数
function debugPDFEnvironment() {
  if (isPDFDocument()) {
    console.log('📄 PDF环境调试信息:');
    console.log('- URL:', window.location.href);
    console.log('- contentType:', document.contentType);
    console.log('- title:', document.title);
    console.log('- #viewer存在:', !!document.querySelector('#viewer'));
    console.log('- #viewerContainer存在:', !!document.querySelector('#viewerContainer'));
    console.log('- .pdfViewer存在:', !!document.querySelector('.pdfViewer'));
    console.log('- embed[type="application/pdf"]存在:', !!document.querySelector('embed[type="application/pdf"]'));
    
    console.log('📄 正在设置调试函数...');
  }
}

// 全局调试函数（独立设置）
function setupGlobalDebugFunctions() {
  try {
    console.log('🔧 开始设置全局调试函数...');
    
    // 确保window对象可用
    if (typeof window === 'undefined') {
      console.error('❌ window对象不可用');
      return;
    }
    
    // 测试PDF文本选择的函数
    console.log('🔧 设置 aiTestPDFSelection...');
    window.aiTestPDFSelection = function() {
      console.log('📄 === 增强PDF文本选择测试 ===');
      const selection = window.getSelection();
      const rawText = selection.toString();
      
      console.log('- rangeCount:', selection.rangeCount);
      console.log('- 原始选择文本长度:', rawText.length);
      console.log('- 原始选择文本内容:', rawText.substring(0, 200));
      
      // 尝试多种方式获取选择的文本
      console.log('📄 尝试其他获取文本的方法:');
      
      // 方法1: 检查document.getSelection()
      const docSelection = document.getSelection();
      console.log('- document.getSelection()长度:', docSelection.toString().length);
      
      // 方法2: 检查是否有PDF.js的文本层
      const textLayer = document.querySelector('.textLayer');
      if (textLayer) {
        console.log('- 发现PDF.js文本层');
        const selectedInTextLayer = textLayer.querySelector('.selected, [data-selected]');
        if (selectedInTextLayer) {
          console.log('- 文本层中的选择:', selectedInTextLayer.textContent);
        }
      }
      
      // 方法3: 检查embed元素
      const embedElement = document.querySelector('embed[type="application/pdf"]');
      if (embedElement) {
        console.log('- 发现PDF embed元素');
        try {
          // 尝试访问embed的选择
          if (embedElement.contentDocument) {
            const embedSelection = embedElement.contentDocument.getSelection();
            console.log('- embed选择文本:', embedSelection.toString());
          }
        } catch (e) {
          console.log('- embed访问受限:', e.message);
        }
      }
      
      // 方法4: 使用事件监听检测
      console.log('- 添加临时监听器检测选择...');
      let detectedText = '';
      const tempListener = () => {
        const tempSelection = window.getSelection();
        detectedText = tempSelection.toString();
        console.log('- 事件监听到的选择:', detectedText);
      };
      
      document.addEventListener('selectionchange', tempListener);
      setTimeout(() => {
        document.removeEventListener('selectionchange', tempListener);
      }, 1000);
      
      // 方法5: 强制获取视觉选择
      setTimeout(() => {
        console.log('📄 === 延迟检测结果 ===');
        const delayedSelection = window.getSelection();
        const delayedText = delayedSelection.toString();
        console.log('- 延迟获取的文本:', delayedText);
        
        if (delayedText.length > 0) {
          console.log('✅ 检测到文本，尝试显示按钮');
          selectedText = delayedText;
          if (typeof showButton === 'function' && delayedSelection.rangeCount > 0) {
            showButton(delayedSelection);
          }
        } else {
          console.log('❌ 仍然无法检测到选择的文本');
          console.log('💡 建议:');
          console.log('1. 确保文本真的被选择（蓝色高亮）');
          console.log('2. 选择完毕后立即运行命令，不要等待');
          console.log('3. 尝试运行 aiForceCreateButton() 手动创建按钮');
        }
      }, 500);
      
      // 手动触发文本选择处理
      console.log('📄 手动触发文本选择处理...');
      if (typeof handleTextSelection === 'function') {
        handleTextSelection();
      } else {
        console.error('handleTextSelection函数不可用');
      }
    };
    
    // PDF调试信息函数
    console.log('🔧 设置 aiDebugPDF...');
    window.aiDebugPDF = function() {
      console.log('📄 === PDF完整调试信息 ===');
      console.log('isPDFDocument():', typeof isPDFDocument === 'function' ? isPDFDocument() : 'function不可用');
      console.log('当前选择文本:', window.getSelection().toString());
      console.log('AI按钮存在:', !!document.getElementById('ai-reader-button'));
      
      if (typeof selectedText !== 'undefined') {
        console.log('选中文本长度:', selectedText.length);
        console.log('选中文本内容:', selectedText.substring(0, 100));
      } else {
        console.log('selectedText变量未定义');
      }
      
      console.log('当前URL:', window.location.href);
      console.log('页面标题:', document.title);
    };
    
    // 强制测试选择功能
    console.log('🔧 设置 aiForceTestSelection...');
    window.aiForceTestSelection = function() {
      console.log('📄 === 强制测试选择功能 ===');
      const text = window.getSelection().toString().trim();
      if (text) {
        console.log('📄 检测到选择文本:', text.substring(0, 50));
        if (typeof selectedText !== 'undefined') {
          selectedText = text;
        }
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          console.log('📄 尝试显示按钮...');
          if (typeof showButton === 'function') {
            showButton(selection);
          } else {
            console.error('showButton函数不可用');
          }
        }
      } else {
        console.log('📄 没有检测到选择的文本，请先选择一些文本');
      }
    };
    
    // 手动创建按钮（不依赖选择检测）
    console.log('🔧 设置 aiForceCreateButton...');
    window.aiForceCreateButton = function(testText) {
      console.log('📄 === 手动强制创建按钮 ===');
      
      // 使用提供的文本或默认文本
      const text = testText || '测试文本，用于验证按钮功能';
      selectedText = text;
      
      console.log('📄 使用文本:', text);
      
      // 手动创建选择对象
      const fakeSelection = {
        rangeCount: 1,
        getRangeAt: function() {
          return {
            getBoundingClientRect: function() {
              return {
                left: window.innerWidth / 2 - 100,
                top: window.innerHeight / 2 - 100,
                width: 200,
                height: 20
              };
            }
          };
        }
      };
      
      console.log('📄 创建按钮...');
      if (typeof showButton === 'function') {
        showButton(fakeSelection);
        console.log('✅ 按钮已创建！应该能看到 "✨ AI Search" 按钮');
      } else {
        console.error('❌ showButton函数不可用');
      }
    };
    
    // 直接触发AI分析（跳过选择检测）
    console.log('🔧 设置 aiDirectAnalyze...');
    window.aiDirectAnalyze = function(text) {
      console.log('📄 === 直接触发AI分析 ===');
      
      const analyzeText = text || window.getSelection().toString().trim() || '请提供要分析的文本';
      
      if (!analyzeText || analyzeText === '请提供要分析的文本') {
        console.log('❌ 需要提供文本，使用方法: aiDirectAnalyze("你的文本")');
        return;
      }
      
      console.log('📄 分析文本:', analyzeText.substring(0, 100));
      selectedText = analyzeText;
      
      // 直接调用分析函数
      if (typeof handleAIAnalysis === 'function') {
        handleAIAnalysis();
        console.log('✅ 已触发AI分析，应该会显示侧边栏');
      } else {
        console.error('❌ handleAIAnalysis函数不可用');
      }
    };
    
    // 检查API Key状态
    console.log('🔧 设置 aiCheckAPIKey...');
    window.aiCheckAPIKey = function() {
      console.log('🔑 === 检查API Key状态 ===');
      chrome.runtime.sendMessage({
        action: 'getApiKey'
      }, (response) => {
        if (response && response.success) {
          console.log('✅ API Key状态检查完成:');
          console.log('  - 是否已设置:', response.hasApiKey ? '是' : '否');
          console.log('  - API Key长度:', response.apiKeyLength);
          if (response.hasApiKey) {
            console.log('🎉 API Key已正确设置，可以开始使用AI分析功能');
          } else {
            console.log('⚠️ 尚未设置API Key，请先设置');
          }
        } else {
          console.error('❌ 检查API Key状态失败:', response?.error);
        }
      });
    };
    
    // 添加诊断工具接口 - 在content script中调用background的诊断功能
    console.log('🔧 设置 aiDiagnostic...');
    window.aiDiagnostic = {
      // 测试API Key
      testApiKey: function() {
        console.log('🔑 开始测试API Key...');
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'testApiKey'
          }, (response) => {
            if (response && response.success) {
              console.log('✅ API Key测试成功:', response.data);
              resolve(response.data);
            } else {
              console.log('❌ API Key测试失败:', response?.error);
              resolve({ success: false, error: response?.error || '测试失败' });
            }
          });
        });
      },
      
      // 测试完整API调用
      testFullCall: function() {
        console.log('🧪 开始完整API调用测试...');
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({
            action: 'testFullCall'
          }, (response) => {
            if (response && response.success) {
              console.log('✅ 完整API调用测试成功:', response.data);
              resolve(response.data);
            } else {
              console.log('❌ 完整API调用测试失败:', response?.error);
              resolve({ success: false, error: response?.error || '测试失败' });
            }
          });
        });
      },
      
      // 综合诊断
      fullDiagnosis: async function() {
        console.log('🔍 === 开始综合诊断 ===');
        
        const diagnosis = {
          timestamp: new Date().toISOString(),
          apiKey: null,
          fullCall: null
        };
        
        try {
          // 测试API Key
          diagnosis.apiKey = await this.testApiKey();
          
          // 如果API Key正常，测试完整调用
          if (diagnosis.apiKey.success) {
            diagnosis.fullCall = await this.testFullCall();
          }
          
          // 生成诊断报告
          console.log('📋 === 诊断结果汇总 ===');
          console.log('🕐 时间:', new Date().toLocaleString());
          console.log('🔑 API Key状态:', diagnosis.apiKey.success ? '✅ 正常' : '❌ 异常');
          if (!diagnosis.apiKey.success) {
            console.log('   错误:', diagnosis.apiKey.error);
          }
          
          if (diagnosis.fullCall) {
            console.log('🤖 API调用测试:', diagnosis.fullCall.success ? '✅ 正常' : '❌ 异常');
            if (!diagnosis.fullCall.success) {
              console.log('   错误:', diagnosis.fullCall.error);
            }
          }
          
          console.log('\n💡 建议操作:');
          if (!diagnosis.apiKey.success) {
            console.log('1. 检查并重新设置OpenAI API Key');
            console.log('   可以运行: aiSetApiKey("你的新API-Key")');
          }
          if (diagnosis.apiKey.success && diagnosis.fullCall && !diagnosis.fullCall.success) {
            console.log('2. API调用失败，可能是网络或配置问题');
            console.log('3. 检查控制台错误信息获取更多详情');
          }
          if (diagnosis.apiKey.success && diagnosis.fullCall && diagnosis.fullCall.success) {
            console.log('🎉 所有测试通过！扩展应该可以正常工作');
          }
          
          return diagnosis;
          
        } catch (error) {
          console.error('❌ 诊断过程出错:', error);
          return { success: false, error: error.message };
        }
      }
    };
    
    // 设置API Key的便捷函数
    console.log('🔧 设置 aiSetApiKey...');
    window.aiSetApiKey = function(apiKey) {
      if (!apiKey || !apiKey.startsWith('sk-')) {
        console.log('❌ 请提供有效的API Key（以sk-开头）');
        console.log('💡 用法: aiSetApiKey("sk-proj-你的API-Key")');
        return;
      }
      
      console.log('🔑 正在设置API Key...');
      chrome.runtime.sendMessage({
        action: 'setApiKey',
        apiKey: apiKey
      }, (response) => {
        if (response && response.success) {
          console.log('✅ API Key设置成功！');
          console.log('💡 现在可以运行 aiDiagnostic.fullDiagnosis() 测试');
        } else {
          console.log('❌ API Key设置失败:', response?.error);
        }
      });
    };
    
    console.log('📄 ✅ 调试函数已成功加载到全局作用域:');
    console.log('  - aiTestPDFSelection() - 增强PDF文本选择测试');
    console.log('  - aiDebugPDF() - 显示完整调试信息');
    console.log('  - aiForceTestSelection() - 强制测试当前选择');
    console.log('  - aiForceCreateButton() - 手动创建按钮（无需选择）');
    console.log('  - aiDirectAnalyze("文本") - 直接分析指定文本');
    console.log('  - aiCheckAPIKey() - 检查API Key设置状态');
    console.log('  - aiDiagnostic.fullDiagnosis() - 综合诊断');
    console.log('  - aiSetApiKey("sk-proj-你的API-Key") - 设置API Key');
    
    // 验证函数是否真的设置成功
    setTimeout(() => {
      console.log('🔧 验证函数设置状态:');
      console.log('  - aiTestPDFSelection:', typeof window.aiTestPDFSelection);
      console.log('  - aiDebugPDF:', typeof window.aiDebugPDF);
      console.log('  - aiForceTestSelection:', typeof window.aiForceTestSelection);
      console.log('  - aiForceCreateButton:', typeof window.aiForceCreateButton);
      console.log('  - aiDirectAnalyze:', typeof window.aiDirectAnalyze);
      console.log('  - aiCheckAPIKey:', typeof window.aiCheckAPIKey);
      console.log('  - aiDiagnostic.fullDiagnosis:', typeof window.aiDiagnostic.fullDiagnosis);
      console.log('  - aiSetApiKey:', typeof window.aiSetApiKey);
    }, 100);
    
  } catch (error) {
    console.error('📄 调试函数设置失败:', error);
  }
}

// === 初始化扩展功能 ===
    console.log('🚀 开始初始化AI Search功能...');

// 延迟初始化，等待页面稳定（避免与React hydration冲突）
setTimeout(() => {
  try {
    // 1. 设置文本选择监听器
    setupTextSelectionListeners();
    
    // 2. 设置全局事件监听器
    setupGlobalEventListeners();
    
    // 3. 启动PDF支持
initializePDFSupport();

    // 4. 设置全局调试函数
setupGlobalDebugFunctions();
    
            console.log('✅ AI Search初始化完成');
    console.log('🌐 当前环境:', window.location.hostname);
    console.log('📱 设备模式:', isPDFDocument() ? 'PDF模式' : '网页模式');
    console.log('⚛️ React检测:', hasReact ? '已检测到React' : '未检测到React');
    
  } catch (error) {
            console.error('❌ AI Search初始化失败:', error);
  }
}, hasReact ? 500 : 100); // React页面延迟更长，避免冲突

// PDF调试（开发阶段）
if (isPDFDocument()) {
  setTimeout(debugPDFEnvironment, 1500);
}

})(); // IIFE结束