<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-content">
        <div class="ai-avatar">
          <i class="el-icon-chat-dot-round"></i>
        </div>
        <div class="header-info">
          <h1>AI 智能助手</h1>
          <p class="status">在线 · 随时为您服务</p>
        </div>
      </div>
    </div>

    <div class="chat-box" ref="chatBox">
      <div class="welcome-message" v-if="messages.length === 0">
        <div class="welcome-avatar">
          <i class="el-icon-chat-dot-round"></i>
        </div>
        <div class="welcome-content">
          <h3>欢迎使用 AI 智能助手</h3>
          <p>我是您的智能助手，可以回答各种问题、提供建议和帮助。请随时向我提问！</p>
        </div>
      </div>

      <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
        <div v-if="message.role === 'user'" class="message user-message">
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime() }}</div>
          </div>
          <div class="user-avatar">
            <i class="el-icon-user"></i>
          </div>
        </div>

        <div v-else class="message ai-message">
          <div class="ai-avatar">
            <i class="el-icon-chat-dot-round"></i>
          </div>
          <div class="message-content">
            <div class="message-text">
              <span :ref="el => { if (el && message.isActive) aiMessageElement = el }">{{ message.displayedContent }}</span>
              <span v-if="message.isTyping" class="typing-cursor">|</span>
            </div>
            <div class="message-time">{{ formatTime() }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-container">
      <form @submit.prevent="sendMessage" class="input-form">
        <div class="input-wrapper">
          <input
              v-model="userInput"
              type="text"
              placeholder="输入您的问题..."
              class="chat-input"
              :disabled="isSending"
          />
          <button type="submit" class="send-btn" :disabled="!userInput.trim() || isSending">
            <i class="el-icon-s-promotion"></i>
            <span v-if="isSending">发送中...</span>
            <span v-else>发送</span>
          </button>
        </div>
        <div class="input-hint">
          <span>按 Enter 发送，Shift + Enter 换行</span>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Chat',
  setup() {
    const userInput = ref('')
    const messages = ref([])
    const aiMessageElement = ref(null)
    const isSending = ref(false)

    const formatTime = () => {
      const now = new Date()
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    }

    const typeWriter = async (element, text, message) => {
      if (!element) return

      message.isTyping = true

      for (let i = 0; i < text.length; i++) {
        element.textContent += text[i]
        element.offsetHeight
        await new Promise(resolve => setTimeout(resolve, 30))
      }

      message.isTyping = false
    }

    const sendMessage = async () => {
      if (!userInput.value.trim() || isSending.value) return

      isSending.value = true

      // 添加用户消息
      messages.value.push({
        role: 'user',
        content: userInput.value
      })

      // 添加 AI 消息
      const aiMessage = {
        role: 'ai',
        content: '',
        displayedContent: '',
        isTyping: false,
        isActive: true
      }
      messages.value.push(aiMessage)

      try {
        const a = userInput.value
        userInput.value = ''

        const response = await fetch('http://192.168.95.146:9527/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'token': localStorage.getItem('token') || ''
          },
          body: `message=${encodeURIComponent(a)}`
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('无法读取响应流')
        }

        const decoder = new TextDecoder('utf-8')
        await new Promise(resolve => setTimeout(resolve, 100))

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            aiMessage.content = aiMessageElement.value?.textContent || aiMessage.displayedContent
            aiMessage.isActive = false
            break
          }

          const chunk = decoder.decode(value, { stream: true })

          let element = aiMessageElement.value
          let retryCount = 0
          while (!element && retryCount < 20) {
            await new Promise(resolve => setTimeout(resolve, 50))
            element = aiMessageElement.value
            retryCount++
          }

          if (element) {
            await typeWriter(element, chunk, aiMessage)
          } else {
            aiMessage.displayedContent += chunk
          }
        }

      } catch (error) {
        console.error('调用AI接口失败:', error)
        const errorMsg = '抱歉，AI服务暂时不可用，请稍后重试'
        if (aiMessageElement.value) {
          aiMessageElement.value.textContent = errorMsg
        } else {
          aiMessage.displayedContent = errorMsg
        }
        aiMessage.content = errorMsg
        aiMessage.isTyping = false
        aiMessage.isActive = false
      } finally {
        isSending.value = false
      }

      // 滚动到底部
      setTimeout(() => {
        const chatBox = document.querySelector('.chat-box')
        if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight
        }
      }, 100)
    }

    return {
      userInput,
      messages,
      aiMessageElement,
      isSending,
      sendMessage,
      formatTime,
    }
  },
}
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.chat-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.ai-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.header-info h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.status {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.chat-box {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.welcome-message {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.welcome-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.welcome-content h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 18px;
}

.welcome-content p {
  margin: 0;
  color: #7f8c8d;
  line-height: 1.5;
}

.message-wrapper {
  margin-bottom: 20px;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 70%;
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.ai-message {
  margin-right: auto;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.user-message .message-content {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.ai-message .message-content {
  background: white;
  color: #2c3e50;
}

.message-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 5px;
}

.user-avatar, .ai-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background: #ecf0f1;
  color: #7f8c8d;
}

.ai-avatar {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.input-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  background: white;
}

.chat-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input:disabled {
  background: #f8f9fa;
  opacity: 0.7;
}

.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.input-hint {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #7f8c8d;
}

.typing-cursor {
  animation: blink 1s infinite;
  color: #667eea;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 滚动条样式 */
.chat-box::-webkit-scrollbar {
  width: 6px;
}

.chat-box::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.chat-box::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.chat-box::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-container {
    margin: 0;
    border-radius: 0;
    height: 100vh;
  }

  .message {
    max-width: 85%;
  }

  .chat-header {
    padding: 15px;
  }

  .header-info h1 {
    font-size: 20px;
  }
}
</style>