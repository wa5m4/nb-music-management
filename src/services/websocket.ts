import { ref } from 'vue'

// WebSocket 连接状态
export enum WSConnectionState {
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    ERROR = 'ERROR'
}

// WebSocket 消息类型
export enum WSMessageType {
    // 连接相关
    CONNECT = 'CONNECT',
    DISCONNECT = 'DISCONNECT',

    // PK游戏相关
    JOIN_ROOM = 'JOIN_ROOM',
    ROOM_JOINED = 'ROOM_JOINED',
    PLAYER_JOINED = 'PLAYER_JOINED',
    MATCH_SUCCESS = 'MATCH_SUCCESS',

    // 游戏状态
    GAME_START = 'GAME_START',
    GAME_WAITING = 'GAME_WAITING',
    GAME_NEXT_ROUND = 'GAME_NEXT_ROUND',
    GAME_END = 'GAME_END',
    GAME_OVER = 'GAME_OVER',

    // 题目相关
    QUESTION_MUSIC = 'QUESTION_MUSIC',
    ANSWER_SUBMIT = 'ANSWER_SUBMIT',
    ANSWER_RESULT = 'ANSWER_RESULT',
    ANSWER_RESULT_TIMEOUT = 'ANSWER_RESULT_TIMEOUT',

    // 错误消息
    ERROR = 'ERROR'
}

// WebSocket 消息接口
export interface WSMessage {
    type: WSMessageType
    data: any
    timestamp?: number
    userId?: string
}

// PK游戏房间信息
export interface PKRoom {
    roomId: string
    players: PKPlayer[]
    gameState: GameState
    currentRound: number
    totalRounds: number
}

// PK玩家信息
export interface PKPlayer {
    id: string
    username: string
    score: number
    isReady: boolean
    avatar?: string
}

// 游戏状态
export enum GameState{
    WAITING = 'WAITING',
    PLAYING = 'PLAYING',
    FINISHED = 'FINISHED'
}

// 题目信息
export interface QuestionData {
    musicUrl: string
    musicId: string
    duration: number
    round: number
    totalRounds: number
}

// 答题结果
export interface AnswerResult {
    isCorrect: boolean
    correctAnswer: string
    userAnswer: string
    score: number
    totalScore: number
    round: number
    userId?: string  // 确保包含userId字段
}

// 超时答题结果接口
export interface AnswerResultTimeout {
    user1Status: number
    user2Status: number
    isCorrect: boolean
    user1score: number
    user2score: number
    userAnswer: string
    correctAnswer: string
    round: number
}

// 游戏结束接口
export interface GameOverData {
    room: string
    round: string
    user1Score: string
    user2Score: string
    totalRound: string
}

// WebSocket 服务类
class WebSocketService {
    private ws: WebSocket | null = null
    private url: string = ''
    // private reconnectAttempts: number = 0
    private messageHandlers: Map<WSMessageType, Function[]> = new Map()

    // 响应式状态
    public state = ref<WSConnectionState>(WSConnectionState.DISCONNECTED)
    public room = ref<PKRoom | null>(null)
    public currentQuestion = ref<QuestionData | null>(null)
    public players = ref<PKPlayer[]>([])
    public gameState = ref<GameState>(GameState.WAITING)
    public currentRound = ref<number>(0)
    public totalRounds = ref<number>(5)
    public error = ref<string>('')

    // 初始化消息处理器
    private initializeMessageHandlers() {
        this.on(WSMessageType.ROOM_JOINED, (data: { room: PKRoom }) => {
            this.room.value = data.room
            this.players.value = data.room.players
            this.gameState.value = data.room.gameState
            this.currentRound.value = data.room.currentRound
            this.totalRounds.value = data.room.totalRounds
        })

        this.on(WSMessageType.PLAYER_JOINED, (data: { players: PKPlayer[] }) => {
            this.players.value = data.players
        })

        // 匹配成功消息处理器
        this.on(WSMessageType.MATCH_SUCCESS, (data: { message: string }) => {
            console.log('匹配成功:', data.message)
            this.gameState.value = GameState.WAITING
        })

        this.on(WSMessageType.GAME_START, (data: { round: number }) => {
            this.gameState.value = GameState.PLAYING
            this.currentRound.value = data.round
        })

        // 题目消息处理器（适配后端格式）
        this.on(WSMessageType.QUESTION_MUSIC, (data: any) => {
            const questionData: QuestionData = {
                musicUrl: data.musicUrl,
                musicId: data.musicId || '',
                duration: parseInt(data.duration) || 30,
                round: parseInt(data.round) || 1,
                totalRounds: parseInt(data.totalRound) || 5
            }
            this.currentQuestion.value = questionData
            this.currentRound.value = questionData.round  // 添加当前回合数更新
            this.totalRounds.value = questionData.totalRounds  // 添加总回合数更新
            this.gameState.value = GameState.PLAYING
            console.log('收到音乐题目:', questionData)
        })

        // 答题结果处理器 - 按照GAME_OVER的逻辑更新玩家分数
        this.on(WSMessageType.ANSWER_RESULT, (data: any) => {
            const answerResult: AnswerResult = {
                isCorrect: data.isCorrect,
                correctAnswer: data.correctAnswer,
                userAnswer: data.userAnswer,
                score: data.score,
                totalScore: 0,
                round: data.round
            }
            console.log('答题结果:', answerResult)
            
            // 按照GAME_OVER的逻辑更新玩家分数
            if (this.players.value.length >= 1) {
                this.players.value[0].score = parseInt(data.user1Score || data.score || 0)
            }
            if (this.players.value.length >= 2) {
                this.players.value[1].score = parseInt(data.user2Score || data.score || 0)
            }
        })

        // 超时答题结果处理器
        this.on(WSMessageType.ANSWER_RESULT_TIMEOUT, (data: AnswerResultTimeout) => {
            console.log('超时答题结果:', data)
            this.gameState.value = GameState.WAITING
        })

        this.on(WSMessageType.GAME_NEXT_ROUND, (data: { round: number, question: QuestionData }) => {
            this.currentRound.value = data.round
            this.currentQuestion.value = data.question
        })

        this.on(WSMessageType.GAME_END, (data: { finalScores: PKPlayer[] }) => {
            this.gameState.value = GameState.FINISHED
            this.players.value = data.finalScores
            console.log('游戏结束，最终得分:', data.finalScores)
        })

        // 游戏结束处理器（全大写）
        this.on(WSMessageType.GAME_OVER, (data: GameOverData) => {
            console.log('游戏结束(GAME_OVER):', data)
            this.gameState.value = GameState.FINISHED
            // 更新玩家分数
            if (this.players.value.length >= 1) {
                this.players.value[0].score = parseInt(data.user1Score)
            }
            if (this.players.value.length >= 2) {
                this.players.value[1].score = parseInt(data.user2Score)
            }
            this.currentRound.value = parseInt(data.round)
            this.totalRounds.value = parseInt(data.totalRound)
        })

        this.on(WSMessageType.ERROR, (data: { message: string }) => {
            this.error.value = data.message
        })
    }

    // 连接 WebSocket
    public connect(userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.state.value = WSConnectionState.CONNECTING;
                this.ws = new WebSocket(`${this.url}/${userId}`);

                this.ws.onopen = () => {
                    this.state.value = WSConnectionState.CONNECTED;
                    // this.reconnectAttempts = 0;
                    this.error.value = '';
                    console.log('WebSocket 连接成功');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        // 解析后端发送的标准JSON格式消息
                        const message: WSMessage = JSON.parse(event.data)
                        this.handleMessage(message)
                    } catch (error) {
                        console.error('解析消息失败:', error)
                    }
                }

                this.ws.onclose = () => {
                    this.state.value = WSConnectionState.DISCONNECTED
                    console.log('WebSocket 连接关闭')
                    // this.attemptReconnect(userId)
                }

                this.ws.onerror = (error) => {
                    this.state.value = WSConnectionState.ERROR
                    this.error.value = 'WebSocket 连接错误'
                    console.error('WebSocket 错误:', error)
                    reject(error)
                }
            } catch (error) {
                this.state.value = WSConnectionState.ERROR
                this.error.value = '创建 WebSocket 失败'
                reject(error)
            }
        })
    }

    // 构造函数
    constructor(url: string = 'ws://localhost:9527/ws/pk') {
        this.url = url;
        this.initializeMessageHandlers();
    }

    // 断开连接
    public disconnect() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
        this.state.value = WSConnectionState.DISCONNECTED
        this.room.value = null
        this.players.value = []
        this.gameState.value = GameState.WAITING
        this.currentQuestion.value = null
        this.error.value = ''
    }

    // 发送消息
    public send(message: WSMessage) {
        if (this.ws && this.state.value === WSConnectionState.CONNECTED) {
            this.ws.send(JSON.stringify(message))
        } else {
            console.error('WebSocket 未连接，无法发送消息')
        }
    }

    // 处理接收到的消息
    private handleMessage(message: WSMessage) {
        const handlers = this.messageHandlers.get(message.type)
        if (handlers) {
            handlers.forEach(handler => handler(message.data))
        }
    }

    // 注册消息处理器
    public on(type: WSMessageType, handler: Function) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, [])
        }
        this.messageHandlers.get(type)!.push(handler)
    }

    // 移除消息处理器
    public off(type: WSMessageType, handler: Function) {
        const handlers = this.messageHandlers.get(type)
        if (handlers) {
            const index = handlers.indexOf(handler)
            if (index > -1) {
                handlers.splice(index, 1)
            }
        }
    }

    // 尝试重连
// // 加入房间
    // public joinRoom(roomId?: string) {
    //     // this.send({
    //     //     type: WSMessageType.JOIN_ROOM,
    //     //     data: { roomId }
    //     // })
    // }

    // 提交答案
    public submitAnswer(answer: string) {
        this.send({
            type: WSMessageType.ANSWER_SUBMIT,
            data: { answer }
        })
    }

    // 准备游戏
    public readyGame() {
        this.send({
            type: WSMessageType.GAME_START,
            data: {}
        })
    }
}

// 创建 WebSocket 服务实例
export const wsService = new WebSocketService()

// 组合式函数，方便在组件中使用
export function useWebSocket() {
    return {
        wsService,
        connectionState: wsService.state,
        room: wsService.room,
        players: wsService.players,
        gameState: wsService.gameState,
        currentQuestion: wsService.currentQuestion,
        currentRound: wsService.currentRound,
        totalRounds: wsService.totalRounds,
        error: wsService.error
    }
}