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

// ========== API 响应类型别名（可选，用于明确语义） ==========

// 获取用户歌单列表响应
export type GetUserPlaylistsResponse = UserCollectList[];

// 获取歌单详情响应
export type GetMusicListDetailResponse = MusicListDetail;

// 上传文件响应
export type UploadFileResponse = UploadResponse;

// 播放歌曲响应
export type PlayMusicResponse = MusicDetail;