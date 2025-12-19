// src/types/api.ts

// 通用接口返回结构
export interface ApiResponse<T> {
  code: number;
  msg: string | null;
  data: T;
}

// 文件上传接口返回的数据结构
export interface UploadResponse {
  url: string;      // 文件访问URL
  duration: string; // 文件时长（对于音频/视频文件）
}

// 音乐详情接口
export interface MusicDetail {
  name: string;        // 歌曲名称
  author: string;      // 歌手
  type: string;        // 音乐类型
  url: string;         // 音乐文件URL
  image: string;       // 歌曲封面
  id: number;          // 歌曲ID
  createTime: string;  // 创建时间
  updateTime: string;  // 更新时间
  duration: number;    // 时长（秒）
  status: number;      // 状态
}

// 歌单项类型（统一使用这个，删除重复的 MusicListItem）
export interface UserCollectList {
  id: number;           // 歌单ID
  name: string;         // 歌单名称
  image: string;        // 歌单封面
  create_time: string;  // 创建时间
  update_time: string;  // 更新时间
  musicCount: number;   // 歌曲数量
}

// 歌单详细信息接口（包含歌曲列表）
export interface MusicListDetail {
  id: number;           // 歌单ID
  name: string;         // 歌单名称
  image: string;        // 歌单封面
  create_time: string;  // 创建时间
  update_time: string;  // 更新时间
  musicCount: number;   // 歌曲数量
  musics: MusicDetail[]; // 歌曲列表
}

// 用户信息接口
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  status: '0' | '1';
  sex: '0' | '1';
  avatar: string;
  createTime: string;
  createPerson: string;
  updateTime: string;
  updatePerson: string;
}

// 空数据接口（用于不需要返回数据的操作）
export interface EmptyData {}

// 播放音乐接口参数
export interface PlayMusicParams {
  musicId: number;    // 音乐ID
  playlistId?: number; // 歌单ID（可选）
}

// 更新歌单封面参数
export interface UpdateCoverParams {
  image: string; // 封面图片URL
}

// 获取用户歌单请求参数
export interface GetUserPlaylistsParams {
  id: number; // 用户ID
}


// 评论接口
export interface Comment {
  id: number;
  musicId: number;
  userId: number;
  username: string;
  userAvatar: string;
  detail: string;
  createTime: string;
  status: number;
  replyCommentIds: number[]; // 子评论 id 列表
}

export interface CommentList { 
  comments: Comment[]; // 评论列表
}

export interface CommentParams {
  musicId: number;
  detail: string;
  replyCommentId?: number;
  status?: number;
}

// 多级评论展示接口（扩展Comment接口，用于前端展示）
export interface CommentWithReplies extends Comment {
  childComments?: CommentWithReplies[];
  isExpanded?: boolean;
}


export interface CommentParams {
  musicId: number;
  detail: string;
  replyCommentId?: number;
  status?: number;
}


// 定义接口返回数据的类型（与后端响应结构对应）
export interface UserStatisticData {
  totalCount: number; // 总用户数
  userCount: number; // 普通用户数
  adminCount: number; // 管理员数
  activeWeekUserCount: number; // 周活跃用户数
  activeDayUserCount: number; // 日活跃用户数
  touristCount: number; // 游客数
}

// 请求统计数据（用户请求分布等）
export interface RequestStatisticData {
  categoryCount: number; // 请求总量
  categoryMap: Array<Record<string, any>>; // 分类统计
  methodMap: Array<Record<string, any>>; // 方法统计
  differentIpCount: number; // 不同 IP 数
}


// 定义 musiclove 子项类型
export interface MusicLoveItem {
  name: string;
  love_count: number;
}

// 定义 typeLove 子项类型
export interface TypeLoveItem {
  love_count: number;
  type: string;
}

// 定义接口返回的 data 类型
export interface UserFigureData {
  id: number;
  username: string;
  email: string;
  status: string | null;
  sex: string;
  avatar: string;
  musiclove: MusicLoveItem[];
  typeLove: TypeLoveItem[];
}

// 定义接口整体响应类型
export interface UserFigureResponse {
  code: number;
  msg?: string | null;
  data?: UserFigureData | null;
}

// ========== API 响应类型别名（可选，用于明确语义） ==========

// 获取用户歌单列表响应
export type GetUserPlaylistsResponse = UserCollectList[];

// 获取歌单详情响应
export type GetMusicListDetailResponse = MusicListDetail;

// 上传文件响应
export type UploadFileResponse = UploadResponse;

// 播放歌曲响应
export type PlayMusicResponse = MusicDetail;


// 获取评论列表响应
export type GetCommentsResponse = Comment[];

// 发表评论响应
export type PostCommentResponse = Comment;

// 获取评论详情响应（包含完整回复链）
export type GetCommentDetailResponse = CommentWithReplies;

export interface UserStatisticResponse {
  code: number;
  msg?: string | null;
  data?: UserStatisticData | null;
}

export interface RequestStatisticResponse {
  code: number;
  msg?: string | null;
  data?: RequestStatisticData | null;
}

// ================= 用户听歌记录 =================
export interface MusicListenRequest {
  userId: number;
  musicId: number;
}

export interface MusicListenResponse {
  code: number;
  msg?: string | null;
  data?: Record<string, any> | null;
}
