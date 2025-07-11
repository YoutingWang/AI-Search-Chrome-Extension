// AI Search - Popup界面交互逻辑

console.log('🔧 Popup JavaScript开始加载...');

document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Popup DOM加载完成，初始化界面...');
  initializePopup();
});

// 页面初始化
function initializePopup() {
  try {
    console.log('🔧 开始初始化popup界面...');
    
    // 绑定事件监听器
    bindEventListeners();
    console.log('✅ 事件监听器绑定完成');
    
    // 检查是否有当前分析结果
    checkCurrentAnalysis();
    console.log('✅ 分析结果检查完成');
    
    // 加载已保存的API Key
    loadApiKey();
    console.log('✅ API Key加载完成');
    
    console.log('🎉 Popup初始化成功！');
  } catch (error) {
    console.error('❌ Popup初始化失败:', error);
    // 发生错误时至少显示基本界面
    showWelcomeScreen();
  }
}

// 绑定事件监听器
function bindEventListeners() {
  // 设置按钮
  document.getElementById('settingsBtn').addEventListener('click', showSettings);
  document.getElementById('closeSettingsBtn').addEventListener('click', hideSettings);
  
  // 欢迎界面的设置API Key按钮
  const setupBtn = document.getElementById('setupApiKeyBtn');
  if (setupBtn) {
    setupBtn.addEventListener('click', showSettings);
  }
  
  // API Key保存
  document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
  
  // 继续提问
  document.getElementById('sendBtn').addEventListener('click', sendFollowUpQuestion);
  document.getElementById('followUpInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendFollowUpQuestion();
    }
  });
  
  // 复制按钮
  document.getElementById('copyOriginalBtn').addEventListener('click', () => copyText('original'));
  document.getElementById('copyResultBtn').addEventListener('click', () => copyText('result'));
  
  // 重试按钮
  document.getElementById('retryBtn').addEventListener('click', retryAnalysis);
}

// 检查当前分析结果和API Key状态
function checkCurrentAnalysis() {
  chrome.runtime.sendMessage({ action: 'getCurrentAnalysis' }, (response) => {
    if (response && response.analysis) {
      console.log('📋 发现已有分析结果，使用流式显示');
      showAnalysisResult(response.analysis, true); // 使用流式显示
    } else {
      // 检查是否有API Key，如果没有则直接显示设置界面
      chrome.storage.local.get(['openai_api_key'], (result) => {
        if (!result.openai_api_key || result.openai_api_key === 'your-openai-api-key-here') {
          console.log('🔑 未设置API Key，显示设置界面');
          showSettings();
        } else {
          console.log('👋 显示欢迎界面');
          showWelcomeScreen();
        }
      });
    }
  });
}

// 显示欢迎界面
function showWelcomeScreen() {
  hideAllScreens();
  document.getElementById('welcomeScreen').style.display = 'block';
}

// 显示分析结果
function showAnalysisResult(analysis, useStreaming = false) {
  console.log('📊 开始显示分析结果，流式显示:', useStreaming);
  hideAllScreens();
  
  // 显示原始文本
  document.getElementById('originalText').textContent = analysis.originalText;
  
  // 显示分析结果
  const resultDiv = document.getElementById('analysisResult');
  
  if (useStreaming) {
    // 使用流式显示效果
    console.log('✨ 启动流式显示效果');
    resultDiv.innerHTML = '<div class="streaming-cursor">▊</div>';
    
    // 延迟一点开始流式显示，增加真实感
    setTimeout(() => {
      streamMarkdownText(resultDiv, analysis.result, 20);
    }, 500);
  } else {
    // 直接显示完整结果
    resultDiv.innerHTML = formatMarkdown(analysis.result);
  }
  
  // 显示结果界面
  document.getElementById('resultScreen').style.display = 'block';
  
  // 清空输入框
  document.getElementById('followUpInput').value = '';
}

// 显示加载状态
function showLoadingScreen() {
  hideAllScreens();
  document.getElementById('loadingScreen').style.display = 'block';
}

// 显示错误状态
function showErrorScreen(message) {
  hideAllScreens();
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorScreen').style.display = 'block';
}

// 隐藏所有界面
function hideAllScreens() {
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'none';
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('errorScreen').style.display = 'none';
}

// 发送追问
function sendFollowUpQuestion() {
  const input = document.getElementById('followUpInput');
  const question = input.value.trim();
  
  if (!question) {
    alert('请输入您的问题');
    return;
  }
  
  // 显示加载状态
  const sendBtn = document.getElementById('sendBtn');
  const btnText = sendBtn.querySelector('.btn-text');
  const btnLoading = sendBtn.querySelector('.btn-loading');
  
  sendBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  
  // 发送消息给background script
  chrome.runtime.sendMessage({
    action: 'followUpQuestion',
    question: question
  }, (response) => {
    // 恢复按钮状态
    sendBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    
    if (response && response.success) {
      // 添加到对话历史
      addToConversationHistory(question, response.result);
      
      // 清空输入框
      input.value = '';
      
      // 更新主要结果区域，使用流式显示
      const resultDiv = document.getElementById('analysisResult');
      console.log('🔄 继续提问回答，启动流式显示');
      resultDiv.innerHTML = '<div class="streaming-cursor">▊</div>';
      
      setTimeout(() => {
        streamMarkdownText(resultDiv, response.result, 25);
      }, 300);
      
    } else {
      alert('提问失败：' + (response?.error || '请稍后重试'));
    }
  });
}

// 添加到对话历史
function addToConversationHistory(question, answer) {
  const historyDiv = document.getElementById('conversationHistory');
  const historyContent = document.getElementById('historyContent');
  
  // 创建对话项
  const conversationItem = document.createElement('div');
  conversationItem.className = 'conversation-item';
  
  conversationItem.innerHTML = `
    <div class="question">
      <strong>📝 您的提问：</strong>
      <p>${escapeHtml(question)}</p>
    </div>
    <div class="answer">
      <strong>🤖 AI回答：</strong>
      <div>${formatMarkdown(answer)}</div>
    </div>
  `;
  
  historyContent.appendChild(conversationItem);
  historyDiv.style.display = 'block';
  
  // 滚动到最新对话
  conversationItem.scrollIntoView({ behavior: 'smooth' });
}

// 复制文本
function copyText(type) {
  let text = '';
  
  if (type === 'original') {
    text = document.getElementById('originalText').textContent;
  } else if (type === 'result') {
    text = document.getElementById('analysisResult').textContent;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    // 显示复制成功提示
    showToast('复制成功！');
  }).catch(err => {
    console.error('复制失败:', err);
    alert('复制失败，请手动选择文本复制');
  });
}

// 显示设置面板
function showSettings() {
  document.getElementById('settingsPanel').style.display = 'block';
}

// 隐藏设置面板
function hideSettings() {
  document.getElementById('settingsPanel').style.display = 'none';
}

// 加载API Key
function loadApiKey() {
  chrome.storage.local.get(['openai_api_key'], (result) => {
    if (result.openai_api_key) {
      document.getElementById('apiKeyInput').value = result.openai_api_key;
    }
  });
}

// 保存API Key
function saveApiKey() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  
  if (!apiKey) {
    alert('请输入有效的API Key');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    alert('API Key格式不正确，应该以 sk- 开头');
    return;
  }
  
  chrome.runtime.sendMessage({
    action: 'setApiKey',
    apiKey: apiKey
  }, (response) => {
    if (response && response.success) {
      showToast('API Key保存成功！');
      hideSettings();
    } else {
      alert('保存失败：' + (response?.error || '请重试'));
    }
  });
}

// 重试分析
function retryAnalysis() {
  checkCurrentAnalysis();
}



// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 显示Toast提示
function showToast(message) {
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 显示动画
  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 10);
  
  // 3秒后自动隐藏
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// 流式显示文本的函数
function typeWriterEffect(element, text, speed = 50) {
  element.innerHTML = '';
  let i = 0;
  
  function typeChar() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeChar, speed);
    }
  }
  
  typeChar();
}

// 流式显示Markdown格式文本（优化版，支持中文）
function streamMarkdownText(element, text, speed = 30) {
  element.innerHTML = '';
  
  // 将文本分割成更小的单位（适合中文）
  const chars = Array.from(text); // 支持emoji和中文字符
  let currentIndex = 0;
  let isComplete = false;
  
  function addNextChar() {
    if (currentIndex < chars.length && !isComplete) {
      currentIndex++;
      const currentText = chars.slice(0, currentIndex).join('');
      
      // 实时格式化并显示
      element.innerHTML = formatMarkdown(currentText);
      
      // 滚动到最新内容
      element.scrollTop = element.scrollHeight;
      
      setTimeout(addNextChar, speed);
    } else {
      // 确保最终显示完整的格式化文本
      element.innerHTML = formatMarkdown(text);
      isComplete = true;
      console.log('✅ 流式显示完成');
    }
  }
  
  addNextChar();
}

// 优化的Markdown格式化函数
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1');
}

// 监听来自background和content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Popup收到消息:', request.action);
  
  if (request.action === 'showResult') {
    // 显示分析结果（来自content script）
    console.log('🎯 显示AI分析结果');
    showAnalysisResult({
      originalText: request.originalText,
      result: request.result,
      url: request.url,
      timestamp: new Date().toISOString()
    }, true); // true表示使用流式显示
    
  } else if (request.action === 'showLoading') {
    // 显示加载界面
    console.log('⏳ 显示加载界面');
    showLoadingScreen();
    
  } else if (request.action === 'showAnalysisResult') {
    // 兼容旧的消息格式
    showAnalysisResult({
      originalText: request.originalText,
      result: request.result,
      url: request.url,
      timestamp: new Date().toISOString()
    });
  }
});
  
console.log('AI Search Popup已加载'); 