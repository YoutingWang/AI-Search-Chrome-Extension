// AI Search - Background Script (Service Worker)
// 处理API调用和消息传递

// OpenAI API配置
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

// 存储当前分析结果和对话历史
let currentAnalysis = null;
let conversationHistory = [];

// 获取API Key
async function getApiKey(passedApiKey = null) {
  // 如果传递了API Key，直接使用
  if (passedApiKey) {
    console.log('✅ 使用传递的API Key');
    return passedApiKey;
  }
  
  // 优先从storage读取
  try {
    const result = await chrome.storage.local.get(['openai_api_key']);
    if (result.openai_api_key) {
      console.log('✅ 从storage获取到API Key');
      return result.openai_api_key;
    }
  } catch (error) {
    console.error('⚠️ 从storage读取API Key失败:', error);
  }

  // 如果storage中没有，则检查硬编码的Key（仅用于开发测试）
  // 生产环境中应删除此部分或确保其为空
  const hardcodedKey = ''; // 请将你的开发用Key填在这里，如果不用则留空

  if (hardcodedKey) {
    console.log('✅ 使用硬编码API Key (仅限开发)');
    return hardcodedKey;
  }

  console.log('❌ 未找到有效的API Key');
  return null;
}

// 调用OpenAI API
async function callOpenAI(prompt, isFollowUp = false, customPrompt = null, language = 'auto', passedApiKey = null) {
  console.log('🚀 开始调用OpenAI API:', {
    promptLength: prompt?.length || 0,
    isFollowUp,
    hasCustomPrompt: !!customPrompt,
    language,
    hasPassedApiKey: !!passedApiKey
  });
  
  try {
    const apiKey = await getApiKey(passedApiKey);
    
    if (!apiKey) {
      const error = new Error('请先设置OpenAI API Key');
      console.error('❌ API Key错误:', error.message);
      throw error;
    }
    
    console.log('✅ API Key验证通过，准备构建请求...');
    
    // 构建消息历史
    let messages;
    if (isFollowUp && conversationHistory.length > 0) {
      messages = [...conversationHistory, {
        role: "user",
        content: prompt
      }];
    } else {
      // 初次分析，重置对话历史
      conversationHistory = [];
      
      // 如果有自定义提示词（来自content.js），直接使用；否则使用默认提示词
      if (customPrompt) {
        // 使用content.js传来的完整prompt
        messages = [
          {
            role: "user", 
            content: customPrompt
          }
        ];
      } else {
        // 使用默认的简化prompt
        const systemMessages = {
          'zh': "你是一个专业的中文内容解读助手，擅长用简单直白的语言帮助没有背景知识的用户快速理解学术论文、技术文档、新闻报道等复杂中文内容。",
          'en': "你是一个专业的英文内容解读助手，擅长分析英文内容，用简单中文为中国用户解释，特别注重专业术语的准确翻译和文化背景说明，帮助用户快速理解。",
          'ja': "你是一个专业的日文内容解读助手，擅长用浅显中文解释日文内容的文化背景和深层含义，特别注意日语敬语体系和文化内涵的说明。",
          'ko': "你是一个专业的韩文内容解读助手，擅长将复杂的韩文内容转化为简单中文，重点说明韩语敬语系统和韩国文化特色。",
          'ru': "你是一个专业的俄文内容解读助手，擅长用简单中文解析俄文内容，特别注意俄语语法特点和文化背景的说明。",
          'de': "你是一个专业的德文内容解读助手，擅长解释德文内容中的复合词和专业概念，用简单中文帮助用户理解德国文化背景。",
          'fr': "你是一个专业的法文内容解读助手，擅长用法语文化视角解读内容，用简单中文说明语法特点和文化背景。",
          'es': "你是一个专业的西班牙文内容解读助手，擅长解析西班牙语文化语境，用简单中文帮助理解拉美和西班牙文化差异。",
          'ar': "你是一个专业的阿拉伯文内容解读助手，擅长处理从右向左书写的内容，用简单中文解释阿拉伯文化背景和语言特点。",
          'hi': "你是一个专业的印地文内容解读助手，擅长解释印度文化背景下的内容，用简单中文说明印地语语法和文化特色。",
          'th': "你是一个专业的泰文内容解读助手，擅长解析泰国文化语境，用简单中文说明泰语语法特点和文化背景。",
          'auto': "你是一个专业的多语言内容解读助手，能够解析各类复杂内容（学术、技术、新闻等），用简单中文帮助用户快速理解核心信息。"
        };

        const defaultPrompt = `你是一个专业的AI内容解读助手，擅长用简单直白的语言，帮助没有背景知识的用户快速理解各种复杂内容（例如学术论文、技术说明、新闻报道、产品介绍、百科内容等）。

请仔细阅读以下文本，全面理解后再开始解释。

请根据以下文本，用通俗易懂的方式解释，并按照以下格式回复：

1. **一句话总结**  
用一句话概括它大致在讲什么，让用户先有方向感。

2. **简单解释（2-3段）**  
用非常清晰的语言分段讲解主要内容，避免复杂术语，如需用术语请用括号简单说明。

3. **为什么重要/有用（可选）**  
简单告诉用户这个内容在实际中有什么意义，或者可以用来做什么。

需要解读的内容：
"${prompt}"

请用简体中文回复。`;

        messages = [
          {
            role: "system",
            content: systemMessages[language] || systemMessages['auto']
          },
          {
            role: "user", 
            content: defaultPrompt
          }
        ];
      }
    }
    
    const requestBody = {
      model: OPENAI_MODEL,
      messages: messages,
      temperature: 0.3,
      max_tokens: 1024
    };
    
    console.log('📤 发送API请求:', {
      model: OPENAI_MODEL,
      messagesCount: messages.length,
      temperature: 0.3,
      max_tokens: 1024,
      url: OPENAI_API_URL
    });
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('⏰ API请求超时 (30秒)');
      controller.abort();
    }, 30000); // 30秒超时
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📥 收到API响应:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: {
        'content-type': response.headers.get('content-type'),
        'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
        'x-ratelimit-reset': response.headers.get('x-ratelimit-reset')
      }
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ 无法解析错误响应:', parseError);
        errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
      }
      
      const errorMessage = `API调用失败: ${response.status} - ${errorData.error?.message || '未知错误'}`;
      console.error('❌ API响应错误:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // 特殊错误处理
      if (response.status === 401) {
        throw new Error('API Key无效或已过期，请检查您的OpenAI API Key');
      } else if (response.status === 429) {
        throw new Error('API调用频率过高，请稍后重试。如果您使用的是免费账户，可能已达到使用限制');
      } else if (response.status === 402) {
        throw new Error('API账户余额不足，请检查您的OpenAI账户余额');
      } else if (response.status >= 500) {
        throw new Error('OpenAI服务器暂时不可用，请稍后重试');
      }
      
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ 无法解析成功响应:', parseError);
      throw new Error('API响应格式错误，无法解析结果');
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ API响应格式异常:', data);
      throw new Error('API响应格式异常，未包含预期的结果');
    }
    
    const result = data.choices[0].message.content;
    
    console.log('✅ API调用成功:', {
      resultLength: result?.length || 0,
      usage: data.usage,
      model: data.model,
      finishReason: data.choices[0].finish_reason
    });
    
    // 更新对话历史
    conversationHistory.push({
      role: "user",
      content: prompt
    });
    conversationHistory.push({
      role: "assistant", 
      content: result
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ OpenAI API调用错误:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      isAbortError: error.name === 'AbortError',
      isNetworkError: error.message.includes('fetch'),
      isTimeoutError: error.message.includes('超时')
    });
    
    // 根据错误类型提供更有用的错误信息
    if (error.name === 'AbortError') {
      throw new Error('请求超时：API调用时间过长，请检查网络连接或稍后重试');
    } else if (error.message.includes('fetch')) {
      throw new Error('网络连接失败：无法连接到OpenAI服务器，请检查网络连接');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('网络错误：可能是网络连接问题或防火墙阻止了请求');
    }
    
    throw error;
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔔 Background收到消息:', request.action);
  
  if (request.action === 'analyzeText') {
    // 处理文本分析请求
    console.log('📝 开始处理文本分析请求:', {
      textLength: request.text?.length || 0,
      url: request.url?.substring(0, 50) + '...',
      language: request.language,
      hasApiKey: !!request.apiKey
    });
    
    handleTextAnalysis(request.text, request.url, request.language, request.prompt, request.apiKey)
      .then(result => {
        console.log('✅ 文本分析成功');
        currentAnalysis = {
          originalText: request.text,
          result: result,
          url: request.url,
          language: request.language,
          timestamp: new Date().toISOString()
        };
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('❌ 文本分析失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '分析失败，请稍后重试' 
        });
      });
    
    // 异步响应
    return true;
    
  } else if (request.action === 'showResult') {
    // 处理显示结果请求（从content script发来）
    console.log('🎯 Background接收到显示结果请求');
    
    // 更新当前分析结果
    currentAnalysis = {
      originalText: request.originalText,
      result: request.result,
      url: request.url,
      timestamp: new Date().toISOString()
    };
    
    // 尝试向当前打开的popup发送消息
    chrome.runtime.sendMessage({
      action: 'showResult',
      originalText: request.originalText,
      result: request.result,
      url: request.url
    }).catch(() => {
      // 如果popup没有打开，消息发送会失败，这是正常的
      console.log('💡 Popup未打开，结果已保存，等待用户打开popup');
    });
    
    return true;
    
  } else if (request.action === 'followUpQuestion') {
    // 处理追问
    handleFollowUpQuestion(request.question)
      .then(result => {
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('追问失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '追问失败，请稍后重试' 
        });
      });
    
    return true;
    
  } else if (request.action === 'getCurrentAnalysis') {
    // 获取当前分析结果
    sendResponse({ analysis: currentAnalysis });
    
  } else if (request.action === 'setApiKey') {
    // 设置API Key
    chrome.storage.local.set({ openai_api_key: request.apiKey })
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
    
  } else if (request.action === 'getApiKey') {
    // 获取API Key状态
    chrome.storage.local.get(['openai_api_key'])
      .then(result => {
        sendResponse({ 
          success: true, 
          hasApiKey: !!result.openai_api_key,
          apiKeyLength: result.openai_api_key ? result.openai_api_key.length : 0
        });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
    
  } else if (request.action === 'testApiKey') {
    // 测试API Key
    (async () => {
      try {
        const result = await aiDiagnostic.testApiKey();
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true;
    
  } else if (request.action === 'testFullCall') {
    // 测试完整API调用
    (async () => {
      try {
        const result = await aiDiagnostic.testFullCall();
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true;
  }
});

// 处理文本分析
async function handleTextAnalysis(text, url, language = 'auto', customPrompt = null, passedApiKey = null) {
  if (!text || text.length < 10) {
    throw new Error('选中的文本太短，请选择更多内容');
  }
  
  if (text.length > 4000) {
    text = text.substring(0, 4000) + '...';
  }
  
  console.log('🔄 处理文本分析:', {
    textLength: text.length,
    language: language,
    url: url.substring(0, 50) + '...',
    hasCustomPrompt: !!customPrompt,
    hasPassedApiKey: !!passedApiKey
  });
  
  return await callOpenAI(text, false, customPrompt, language, passedApiKey);
}

// 处理追问
async function handleFollowUpQuestion(question) {
  if (!question || !question.trim()) {
    throw new Error('请输入有效的问题');
  }
  
  return await callOpenAI(question, true);
}

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
      console.log('AI Search已安装');
});

// 🔧 诊断工具 - 用于调试API调用问题
const aiDiagnostic = {
  // 测试API Key是否有效
  async testApiKey() {
    try {
      console.log('🔑 开始测试API Key...');
      const apiKey = await getApiKey();
      console.log('🔑 API Key状态:', apiKey ? '已设置' : '未设置');
      
      if (!apiKey) {
        console.log('❌ 请先设置API Key');
        return { success: false, error: '未设置API Key' };
      }
      
      console.log('🔑 API Key长度:', apiKey.length);
      console.log('🔑 API Key前缀:', apiKey.substring(0, 7) + '...');
      
      // 测试API连接 - 使用models端点，更轻量级
      console.log('🌐 测试网络连接到OpenAI...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏰ 连接测试超时 (10秒)');
        controller.abort();
      }, 10000);
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'AI-Reader-Extension/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📥 连接测试响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API连接测试成功');
        console.log('📊 可用模型数量:', data.data?.length || 0);
        console.log('🤖 检查gpt-4o模型:', data.data?.some(m => m.id === 'gpt-4o') ? '可用' : '不可用');
        return { 
          success: true, 
          message: 'API连接正常',
          modelCount: data.data?.length || 0,
          hasGPT4o: data.data?.some(m => m.id === 'gpt-4o')
        };
      } else {
        const error = await response.json().catch(() => ({ error: { message: '无法解析错误响应' } }));
        console.log('❌ API连接测试失败:', {
          status: response.status,
          error: error.error?.message
        });
        
        if (response.status === 401) {
          return { success: false, error: 'API Key无效或已过期' };
        } else if (response.status === 429) {
          return { success: false, error: 'API调用频率过高或账户余额不足' };
        } else {
          return { success: false, error: error.error?.message || 'API测试失败' };
        }
      }
    } catch (error) {
      console.log('❌ 诊断失败:', error);
      
      if (error.name === 'AbortError') {
        return { success: false, error: '网络连接超时' };
      } else if (error.message.includes('fetch')) {
        return { success: false, error: '无法连接到OpenAI服务器，请检查网络连接' };
      }
      
      return { success: false, error: error.message };
    }
  },
  
  // 测试完整的API调用流程
  async testFullCall() {
    console.log('🧪 开始完整API调用测试...');
    try {
      const result = await callOpenAI('Hello, this is a test message. Please respond in Chinese.');
      console.log('✅ 完整API调用成功:', result.substring(0, 100) + '...');
      return { success: true, result, resultLength: result.length };
    } catch (error) {
      console.log('❌ 完整API调用失败:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  // 检查网络连通性
  async testNetwork() {
    console.log('🌐 检查网络连通性...');
    const tests = [
      { name: 'Google', url: 'https://www.google.com', timeout: 5000 },
      { name: 'OpenAI', url: 'https://api.openai.com', timeout: 10000 }
    ];
    
    const results = {};
    
    for (const test of tests) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), test.timeout);
        
        const start = Date.now();
        await fetch(test.url, { 
          method: 'HEAD', 
          signal: controller.signal,
          mode: 'no-cors' 
        });
        const duration = Date.now() - start;
        
        clearTimeout(timeoutId);
        results[test.name] = { success: true, duration };
        console.log(`✅ ${test.name} 连接成功 (${duration}ms)`);
      } catch (error) {
        results[test.name] = { success: false, error: error.message };
        console.log(`❌ ${test.name} 连接失败:`, error.message);
      }
    }
    
    return results;
  },
  
  // 综合诊断
  async fullDiagnosis() {
    console.log('🔍 === 开始综合诊断 ===');
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      apiKey: await this.testApiKey(),
      network: await this.testNetwork()
    };
    
    // 如果API Key测试通过，再测试完整调用
    if (diagnosis.apiKey.success) {
      diagnosis.fullCall = await this.testFullCall();
    }
    
    console.log('📋 诊断结果汇总:', diagnosis);
    
    // 生成诊断报告
    let report = '📋 === AI Search诊断报告 ===\n';
    report += `🕐 时间: ${new Date().toLocaleString()}\n\n`;
    
    report += `🔑 API Key状态: ${diagnosis.apiKey.success ? '✅ 正常' : '❌ 异常'}\n`;
    if (!diagnosis.apiKey.success) {
      report += `   错误: ${diagnosis.apiKey.error}\n`;
    }
    
    report += `🌐 网络连接:\n`;
    for (const [name, result] of Object.entries(diagnosis.network)) {
      report += `   ${name}: ${result.success ? '✅ 正常' : '❌ 异常'}`;
      if (result.success) {
        report += ` (${result.duration}ms)`;
      } else {
        report += ` - ${result.error}`;
      }
      report += '\n';
    }
    
    if (diagnosis.fullCall) {
      report += `🤖 API调用测试: ${diagnosis.fullCall.success ? '✅ 正常' : '❌ 异常'}\n`;
      if (!diagnosis.fullCall.success) {
        report += `   错误: ${diagnosis.fullCall.error}\n`;
      }
    }
    
    report += '\n💡 建议操作:\n';
    if (!diagnosis.apiKey.success) {
      report += '1. 检查并重新设置OpenAI API Key\n';
    }
    if (!diagnosis.network.OpenAI?.success) {
      report += '2. 检查网络连接，可能需要VPN\n';
    }
    if (diagnosis.apiKey.success && diagnosis.network.OpenAI?.success && diagnosis.fullCall && !diagnosis.fullCall.success) {
      report += '3. API调用参数可能有问题，请检查扩展代码\n';
    }
    
    console.log(report);
    return diagnosis;
  }
};

console.log('🔧 诊断工具已加载，在控制台运行:');
console.log('  - aiDiagnostic.testApiKey() // 测试API Key');
console.log('  - aiDiagnostic.testFullCall() // 测试完整API调用');
console.log('  - aiDiagnostic.testNetwork() // 测试网络连接');
console.log('  - aiDiagnostic.fullDiagnosis() // 综合诊断（推荐）'); 