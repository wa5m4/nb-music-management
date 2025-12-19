<template>
  <div class="pk-game-container">
    <div class="game-header">
      <h2>🎵 听歌猜曲PK</h2>
      <div class="game-status">
        <span v-if="gameState === GameState.WAITING" class="status waiting">等待中</span>
        <span v-else-if="gameState === GameState.PLAYING" class="status playing">游戏进行中</span>
        <span v-else-if="gameState === GameState.FINISHED" class="status finished">游戏结束</span>
      </div>
    </div>

    <!-- 玩家信息 - 两侧布局 -->
    <div class="players-container">
      <div v-for="(player, index) in players" :key="player.id" 
           :class="['player-card', index === 0 ? 'left-player' : 'right-player']">
        <!-- 如果有头像则显示头像，否则显示首字母 -->
        <div v-if="getPlayerAvatar(player)" class="player-avatar">
          <img 
            :src="getPlayerAvatar(player)" 
            :alt="getPlayerDisplayName(player)" 
            class="avatar-image"
            @error="handleImageError(player)"
          >
        </div>
        <div v-else class="player-avatar">
          {{ getPlayerDisplayName(player).charAt(0) }}
        </div>
        <div class="player-info">
          <div class="player-name">{{ getPlayerDisplayName(player) }}</div>
          <!-- 只显示当前用户的实时分数 -->
<!--          <div v-if="player.id === authStore.user?.id" class="player-score">分数: {{ player.score }}</div>-->
<!--          &lt;!&ndash; 另一个玩家不显示分数 &ndash;&gt;-->
<!--          <div v-else class="player-score"></div>-->
          <div v-if="player.isReady" class="player-ready">已准备</div>
        </div>
      </div>
    </div>

    <!-- 游戏区域 -->
    <div class="game-area">
      <!-- 等待房间 -->
      <div v-if="gameState === GameState.WAITING" class="waiting-room">
        <div class="waiting-message">
          <p>房间 {{ room?.roomId }}</p>
          <p v-if="players.length < 2">等待其他玩家加入...</p>
          <p v-else>匹配成功，游戏即将开始...</p>
        </div>
        <!-- 删除开始游戏按钮 -->
      </div>

      <!-- 游戏进行中 -->
      <div v-else-if="gameState === GameState.PLAYING" class="playing-room">
        <div class="round-info">
          第 {{ currentRound }}/{{ totalRounds }} 题
        </div>

        <!-- 音频播放器 -->
        <div class="audio-player">
          <audio 
            ref="audioRef" 
            :src="currentQuestion?.musicUrl" 
            controls 
            autoplay
            @loadeddata="console.log('音频加载完成')"
            @canplay="console.log('音频可以播放')"
            @error="console.error('音频播放错误')"
          >
            您的浏览器不支持音频播放
          </audio>
        </div>

        <!-- 答题区域 -->
        <div class="answer-area">
          <el-input
              v-model="userAnswer"
              placeholder="请输入歌曲名称"
              @keyup.enter="submitAnswer"
              class="answer-input"
          ></el-input>
          <el-button type="primary" @click="submitAnswer" class="submit-button">
            提交答案
          </el-button>
        </div>

        <!-- 答题结果 -->
        <div v-if="answerResult" class="answer-result">
          <div v-if="answerResult.isCorrect" class="result correct">
            ✅ 回答正确！
          </div>
          <div v-else class="result incorrect">
            ❌ 回答错误！正确答案：{{ answerResult.correctAnswer }}
          </div>
          <div class="score-info">
            获得分数：{{ answerResult.score }} | 总分：{{ answerResult.totalScore }}
          </div>
        </div>
      </div>

      <!-- 游戏结束 -->
      <div v-else-if="gameState === GameState.FINISHED" class="game-over">
        <h3>游戏结束！</h3>
        <div class="final-scores">
          <div v-for="player in players" :key="player.id" class="final-score-item">
            <div class="player-name">{{ getPlayerDisplayName(player) }}</div>
            <div class="player-final-score">{{ player.score }}分</div>
          </div>
        </div>
        <div class="winner">
          🏆 获胜者：{{ winner }}
        </div>
        <el-button type="primary" @click="restartGame" class="restart-button">
          再来一局
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { wsService, useWebSocket, WSMessageType, GameState} from '../services/websocket'
import { getUserProfile } from '../services/api'
import type { AnswerResult } from '../services/websocket';

const router = useRouter()
const authStore = useAuthStore()

// 解构 WebSocket 服务状态
const { room, players, gameState, currentQuestion, currentRound, totalRounds } = useWebSocket()

// 组件状态
const audioRef = ref<HTMLAudioElement | null>(null)
const userAnswer = ref('')
const answerResult = ref<AnswerResult | null>(null)
const winner = ref('')
const playerDetails = ref<{[key: string]: any}>({}) // 改为对象存储玩家信息

// 获取玩家详细信息
const fetchPlayerDetails = async (playerId: string) => {
  try {
    const response = await getUserProfile(playerId)
    console.log('获取用户信息成功:', response.data)
    
    // 直接赋值到响应式对象
    playerDetails.value[playerId] = response.data
    
    // 强制更新玩家列表以触发重新渲染
    players.value = [...players.value]
    
  } catch (error) {
    console.error('获取玩家信息失败:', error)
    // 如果获取失败，使用默认信息
    playerDetails.value[playerId] = {
      username: `用户${playerId}`,
      avatar: null
    }
  }
}

// 获取玩家头像 - 添加调试信息
const getPlayerAvatar = (player: any) => {
  const detail = playerDetails.value[player.id]
  const avatar = detail?.data.avatar || null
  console.log(`玩家 ${player.id} 的头像URL:`, avatar)
  return avatar
}

// 获取玩家显示名称 - 添加调试信息
const getPlayerDisplayName = (player: any) => {
  const detail = playerDetails.value[player.id]
  const name = detail?.data?.username || player.username || `用户${player.id}`
  console.log(`玩家 ${player.id} 的显示名称:`, name)
  return name
}

// 处理匹配成功消息
const handleMatchSuccess = async (data: any) => {
  console.log('匹配成功:', data)
  
  // 根据后端返回的user1Id和user2Id获取玩家信息
  const { user1Id, user2Id } = data
  
  // 先获取玩家信息
  if (user1Id) {
    await fetchPlayerDetails(user1Id.toString())
  }
  
  if (user2Id) {
    await fetchPlayerDetails(user2Id.toString())
  }
  
  // 更新玩家列表 - 直接使用从API获取的实际用户名
  const newPlayers = []
  if (user1Id) {
    const user1Detail = playerDetails.value[user1Id.toString()]
    newPlayers.push({
      id: user1Id.toString(),
      username: user1Detail?.username || `用户${user1Id}`, // 直接使用API返回的用户名
      score: 0,
      isReady: false
    })
  }
  if (user2Id) {
    const user2Detail = playerDetails.value[user2Id.toString()]
    newPlayers.push({
      id: user2Id.toString(),
      username: user2Detail?.username || `用户${user2Id}`, // 直接使用API返回的用户名
      score: 0,
      isReady: false
    })
  }
  
  // 更新玩家列表
  players.value = newPlayers
  // gameState.value = GameState.WAITING
}

// 计算获胜者
const computedWinner = computed(() => {
  if (players.value.length === 0) return ''
  
  // 按分数排序，分数高的获胜
  const sortedPlayers = [...players.value].sort((a, b) => b.score - a.score)
  
  // 如果分数相同，则平局
  if (sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score) {
    return '平局'
  }
  
  const winnerPlayer = sortedPlayers[0]
  return getPlayerDisplayName(winnerPlayer)
})

// 监听游戏状态变化
onMounted(async () => {
  if (!authStore.isLogin) {
    router.push('/login')
    return
  }

  // 连接 WebSocket
  try {
    await wsService.connect(authStore.user?.id?.toString() || '')
    
    // 监听匹配成功
    wsService.on(WSMessageType.MATCH_SUCCESS, handleMatchSuccess)
    
    // 监听答题结果
    wsService.on(WSMessageType.ANSWER_RESULT, handleAnswerResult)
    
    // 监听游戏结束
    wsService.on(WSMessageType.GAME_OVER, handleGameOver)
    
    // 添加题目消息监听
    wsService.on(WSMessageType.QUESTION_MUSIC, handleQuestionMusic)

  } catch (error) {
    console.error('连接失败:', error)
  }
})

onUnmounted(() => {
  // 断开 WebSocket 连接
  wsService.off(WSMessageType.MATCH_SUCCESS, handleMatchSuccess)
  wsService.off(WSMessageType.ANSWER_RESULT, handleAnswerResult)
  wsService.off(WSMessageType.GAME_OVER, handleGameOver)
  wsService.off(WSMessageType.QUESTION_MUSIC, handleQuestionMusic) // 添加题目消息解绑
  wsService.disconnect()
})

// 处理收到题目消息
const handleQuestionMusic = (data: any) => {
  console.log('收到题目消息:', data)
  // 这里不需要做任何处理，因为WebSocket服务已经自动更新了currentQuestion
  // 只需要确保音频播放器能自动播放即可
}

// 处理游戏结束
const handleGameOver = (data: any) => {
  console.log('游戏结束数据:', data)
  // 更新获胜者
  winner.value = computedWinner.value
  console.log('获胜者:', winner.value)
}

// 处理答题结果 - 更新玩家分数
const handleAnswerResult = (data: AnswerResult) => {
  console.log('答题结果数据:', data)
  answerResult.value = data
  
  // 根据userId更新对应玩家的分数
  if (data.userId) {
    const playerIndex = players.value.findIndex(p => p.id === data.userId.toString())
    if (playerIndex !== -1) {
      // 更新对应玩家的分数
      players.value[playerIndex].score = data.score || 0
      console.log(`更新玩家 ${data.userId} 的分数为: ${data.score}`)
    } else {
      console.warn(`未找到玩家ID: ${data.userId}`)
    }
  } else {
    console.warn('答题结果数据中缺少userId字段')
  }
  
  // 3秒后清空结果
  setTimeout(() => {
    answerResult.value = null
  }, 3000)
}

// 删除开始游戏方法
// const startGame = () => {
//   wsService.readyGame()
// }

// 提交答案
const submitAnswer = () => {
  if (!userAnswer.value.trim()) return
  wsService.submitAnswer(userAnswer.value.trim())
  userAnswer.value = ''
}

// 重新开始游戏
const restartGame = () => {
  // 重置游戏状态
  gameState.value = GameState.WAITING
  currentRound.value = 0
  totalRounds.value = 5
  currentQuestion.value = null
  answerResult.value = null
  userAnswer.value = ''
  winner.value = ''
  players.value = []
  playerDetails.value = {} // 清空玩家信息
  
  // 重新加入房间进行匹配
  wsService.connect(authStore.user?.id?.toString() || '')
}

// 处理图片加载错误
const handleImageError = (player: any) => {
  console.error(`头像加载失败:`, getPlayerAvatar(player))
  
  // 直接设置头像为null
  if (playerDetails.value[player.id]) {
    playerDetails.value[player.id].avatar = null
  } else {
    playerDetails.value[player.id] = { avatar: null }
  }
  
  // 强制更新
  playerDetails.value = { ...playerDetails.value }
}
</script>

<style scoped>
.pk-game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.game-header h2 {
  margin: 0;
  color: #333;
}

.status {
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: bold;
}

.status.waiting {
  background: #e6f7ff;
  color: #1890ff;
}

.status.playing {
  background: #f6ffed;
  color: #52c41a;
}

.status.finished {
  background: #fff2e8;
  color: #fa8c16;
}

.players-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.player-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 180px;
}

.left-player {
  justify-content: flex-start;
}

.right-player {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.right-player .player-avatar {
  margin-right: 0;
  margin-left: 15px;
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  margin-right: 15px;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-info {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.player-score {
  color: #666;
  margin-bottom: 5px;
}

.player-ready {
  color: #52c41a;
  font-size: 12px;
}

.game-area {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.waiting-room {
  text-align: center;
  padding: 50px 0;
}

.waiting-message {
  margin-bottom: 30px;
}

.waiting-message p {
  margin: 10px 0;
  color: #666;
}

.start-button {
  padding: 10px 30px;
  font-size: 16px;
}

.playing-room {
  text-align: center;
}

.round-info {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.audio-player {
  margin-bottom: 30px;
}

.audio-player audio {
  width: 100%;
  max-width: 400px;
}

.answer-area {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.answer-input {
  width: 300px;
}

.answer-result {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background: #f0f2f5;
}

.result {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.result.correct {
  color: #52c41a;
}

.result.incorrect {
  color: #ff4d4f;
}

.score-info {
  color: #666;
}

.game-over {
  text-align: center;
  padding: 30px 0;
}

.game-over h3 {
  margin-bottom: 30px;
  color: #333;
}

.final-scores {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
}

.final-score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.player-final-score {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
  margin-top: 10px;
}

.winner {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #fa8c16;
}

.restart-button {
  padding: 10px 30px;
  font-size: 16px;
}
</style>