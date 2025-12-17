<template>
  <div class="mm-overlay" @keydown.esc="close" tabindex="0">
    <div class="mm-backdrop" @click.self="close"></div>

    <div class="mm-modal" role="dialog" aria-modal="true" aria-label="音乐详情">
      <button class="mm-close" @click="close" aria-label="关闭">×</button>

      <div class="mm-content">
        <!-- 左侧：歌曲信息和封面 -->
        <div class="left-pane">
          <div class="music-info">
            <h1 class="music-title">{{ music?.name || '未知歌曲' }}</h1>
            <div class="music-sub">
              <span class="artist">{{ music?.author }}</span>
              <span class="sep">·</span>
              <span class="duration">{{ formatTime(music?.duration) }}</span>
            </div>
          </div>

          <div class="cover-wrap">
            <img class="cover" :src="music?.image || ''" alt="cover" />
          </div>
        </div>

        <!-- 右侧：评论区域 -->
        <div class="right-pane">
          <div class="comments-top">
            <div class="comments-header">
              <h3 class="comments-title">
                评论
                <span class="count">（{{ totalComments }}）</span>
              </h3>
            </div>

            <div class="comments-scroll">
              <!-- 加载状态 -->
              <div v-if="loadingComments" class="loading-comments">加载评论中...</div>
              <div v-else-if="commentError" class="error-comments">{{ commentError }}</div>
              
              <!-- 评论列表 -->
              <CommentItem
                v-for="c in commentsForDisplay"
                :key="c.id + '-' + c.depth"
                :comment="c"
                :depth="c.depth"
                @expand="handleExpand"
                @reply="startReply(c.id)"
                
              />
              
              <div v-if="!loadingComments && commentsForDisplay.length === 0" class="no-comments">
                暂无评论
              </div>
            </div>
          </div>

          <!-- 评论输入区域 -->
          <div class="comments-bottom">
            <div class="input-header">
              <div v-if="replyCommentId !== null" class="replying-note">
                回复 评论 ID: {{ replyCommentId }}
                <button class="link small" @click="cancelReply">取消</button>
              </div>
              <div v-else class="new-note">发表评论</div>
            </div>

            <textarea 
              v-model="inputText" 
              class="input-area" 
              :placeholder="replyCommentId ? '输入回复内容...' : '输入你的评论...'"
              ref="commentInput"
            />

            <div class="input-actions">
              

              <div class="actions-right">
                <button 
                  class="btn-primary" 
                  @click="submit" 
                  :disabled="submitting || !inputText.trim()"
                >
                  {{ submitting ? '提交中...' : replyCommentId ? '回复评论' : '发表评论' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue';
import { watch } from 'vue';
import type { Comment } from '../types/api';
import { 
  getMusicDetail, 
  getCommentsByMusic, 
  getCommentById, 
  postComment as apiPostComment,
  getUserProfile
} from '../services/api';

// 扩展的评论接口，添加前端需要的状态字段
interface ExtendedComment extends Comment {
  isExpanded: boolean;      // 是否展开显示子评论
  depth: number;            // 评论深度（0=一级评论）
  childComments: ExtendedComment[];  // 已加载的子评论
  isLoading: boolean;       // 是否正在加载子评论
  isLoaded: boolean;        // 子评论是否已加载过
}

export default defineComponent({
  name: 'MusicModal',
  props: { 
    musicId: { 
      type: Number, 
      required: true 
    } 
  },
  emits: ['close'],
  
  components: {
    // 评论项组件
    CommentItem: defineComponent({
      name: 'CommentItem',
      props: {
        comment: { type: Object as () => ExtendedComment, required: true },
        depth: { type: Number, default: 0 }
      },
      emits: ['expand', 'reply'],
      setup(props, { emit }) {
        // 调试：监听 comment.detail
        watch(() => props.comment.detail, (val) => {
          console.log('DEBUG comment.detail ->', props.comment.id, val);
        }, { immediate: true });

        // 如果评论缺少用户信息（头像/用户名），尝试根据 userId 补全
        async function ensureUserInfo() {
          try {
            const c = props.comment as any;
            if ((!c.userAvatar || !c.username) && c.userId) {
              const resp: any = await getUserProfile(c.userId);
              const u = resp?.data?.data ?? resp?.data ?? resp;
              if (u) {
                c.username = u.username ?? c.username;
                c.userAvatar = u.avatar ?? u.avatarUrl ?? c.userAvatar;
              }
            }
          } catch (e) {
            // 忽略错误，保留已有数据
          }
        }

        ensureUserInfo();

        // 处理展开/收起
        function onExpand() { emit('expand', props.comment.id); }

        // 处理回复（触发父组件显示底部输入框用于回复）
        function onReply() { emit('reply', props.comment.id); }

        return { onExpand, onReply };
      },
      template: `
  <div 
    class="comment-item" 
    :class="{ 
      'expanded': comment.isExpanded, 
      'child': depth > 0,
      'loading': comment.isLoading 
    }" 
    :style="{ 
      marginLeft: depth > 0 ? \`\${Math.min(depth * 28, 160)}px\` : '0' 
    }"
  >
    <!-- 用户头像（小型圆形框） -->
    <div class="avatar-frame" style="position:absolute;left:12px;top:10px;width:40px;height:40px;border-radius:50%;overflow:hidden;background:#fff;border:1px solid rgba(16,20,36,0.06);display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(16,20,36,0.04);">
      <img 
        class="avatar" 
        :src="comment.userAvatar || '/default-avatar.svg'" 
        :alt="comment.username + '的头像'"
        @error="handleAvatarError"
        style="width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.05);color:red;"
      />
    </div>
    
    <!-- 评论内容区域 -->
    <div class="content">
      <!-- 评论元信息 -->
      <div class="meta" style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:16px;">
        <strong class="name" style="font-weight:500;font-size:14px;color:#333;flex-shrink:0;">{{ comment.username }}</strong>
        <span class="time" style="color:#888888;font-size:11px;white-space:nowrap;flex-shrink:0;font-weight:400;">{{ formatTime(comment.createTime) }}</span>
      </div>
      
      <!-- 评论内容 -->
      <div class="detail">{{ comment.detail }}</div>
      
      <!-- 操作按钮 -->
      <div class="ops">
        <!-- 回复按钮 -->
        <button class="link reply-btn" @click="onReply" style="font-size:11px;padding:2px 6px;border:none;background:none;color:#4b6cff;cursor:pointer;text-decoration:underline;">回复</button>
        
           <!-- 展开/收起按钮：统一承担加载与展开 -->
          <button 
            v-if="(comment.replyCommentIds && comment.replyCommentIds.length > 0) || (comment.childComments && comment.childComments.length > 0)"
            class="link toggle-btn" 
            @click="onExpand"
            style="font-size:11px;padding:2px 6px;border:none;background:none;color:#4b6cff;cursor:pointer;text-decoration:underline;"
          >
             {{ comment.isExpanded ? '收起' : '展开(' + ((comment.childComments && comment.childComments.length) || (comment.replyCommentIds ? comment.replyCommentIds.length : 0)) + ')' }}
           </button>
        
        
      </div>
      
    </div>
`,
      methods: {
        // 格式化时间显示
        formatTime(timeStr: string) {
          try {
            if (!timeStr) return '未知时间';
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return '时间格式错误';
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
          } catch (e) {
            return '时间解析错误';
          }
        },

        // 处理头像加载失败
        handleAvatarError(event: Event) {
          const img = event.target as HTMLImageElement;
          // 防止反复触发 onerror 导致循环
          (img as any).onerror = null;
          img.src = '/default-avatar.svg';
        }
      }
    })
  },
  
  setup(props, { emit }) {
    
    
    // 响应式数据
    const music = ref<any>(null);  // 歌曲信息
    const roots = ref<ExtendedComment[]>([]);  // 一级评论列表
    const commentsForDisplay = ref<ExtendedComment[]>([]);  // 扁平化的显示列表
    const allCommentsMap = ref<Map<number, ExtendedComment>>(new Map());  // 所有已加载评论的映射
    
    // 回复相关状态
    const replyCommentId = ref<number | null>(null);
    const inputText = ref('');
    const submitting = ref(false);
    const commentInput = ref<HTMLTextAreaElement | null>(null);
    // 本地当前登录用户缓存（用于新建评论立即显示头像/昵称）
    const localUser = ref<any>(null);
    // 用户缓存（避免重复请求）
    const userCache = new Map<number, any>();
    
    // 加载状态
    const loadingComments = ref(false);
    const commentError = ref<string | null>(null);
    const totalComments = ref(0);  // 评论总数
    
    
    
    // 统一归一化后端返回的评论字段，确保 username/userAvatar/detail 可用
    function normalizeCommentRaw(raw: any) {
      if (!raw || typeof raw !== 'object') return raw;
      const user = raw.user || {};
      // 后端可能用 id/commentId/comment_id 返回评论 id
      const id = raw.id ?? raw.commentId ?? raw.comment_id;
      const username = raw.username ?? raw.userName ?? user.username ?? user.name ?? '';
      const userAvatar = raw.userAvatar ?? raw.avatar ?? raw.avatarUrl ?? user.avatar ?? user.avatarUrl ?? '';
      const detail = raw.detail ?? raw.content ?? raw.text ?? raw.comment ?? '';
      const createTime = raw.createTime ?? raw.create_time ?? raw.createdAt ?? raw.created_at ?? '';
      let replyCommentIds: number[] = raw.replyCommentIds ?? raw.replyIds ?? [];
      if (!Array.isArray(replyCommentIds) && Array.isArray(raw.replies)) {
        replyCommentIds = raw.replies.map((r: any) => r.id).filter((x: any) => typeof x === 'number');
      }
      return {
        ...raw,
        id,
        userId: raw.userId ?? user.id,
        username,
        userAvatar,
        detail,
        createTime,
        replyCommentIds
      };
    }

    // 1. 加载歌曲信息
    async function loadMusic() {
      try {
        const m = await getMusicDetail(props.musicId);
        music.value = m;
      } catch (err) {
        console.error('加载歌曲信息失败:', err);
      }
    }
    
    // 2. 加载一级评论（初始加载）
    async function loadRootComments() {
      loadingComments.value = true;
      commentError.value = null;
      
      try {
        const comments = await getCommentsByMusic(props.musicId);
        const normalized = Array.isArray(comments) ? comments.map((c: any) => normalizeCommentRaw(c)) : [];
        
        if (!Array.isArray(comments)) {
          throw new Error(`API返回的数据不是数组: ${typeof comments}`);
        }
        
        // 构建一个集合，包含所有作为子评论出现的 id，避免它们在根列表重复显示
        const childIdSet = new Set<number>();
        normalized.forEach((c: any) => {
          if (Array.isArray(c.replyCommentIds)) {
            c.replyCommentIds.forEach((id: number) => childIdSet.add(id));
          }
        });

        // 初始化一级评论（仅保留不在 childIdSet 中的项），设置扩展字段
        roots.value = normalized.filter((c: any) => !childIdSet.has(c.id)).map((comment: any) => {
          const extendedComment: ExtendedComment = {
            ...comment,
            isExpanded: false,
            depth: 0,
            childComments: [],
            isLoading: false,
            isLoaded: false
          };
          
          // 保存到映射表中，便于快速查找
          allCommentsMap.value.set(comment.id, extendedComment);
          return extendedComment;
        });
        
        // 按创建时间倒序排序（最新的在前）
        roots.value.sort((a, b) => {
          const timeA = new Date(a.createTime).getTime();
          const timeB = new Date(b.createTime).getTime();
          return timeB - timeA;
        });
        
        // 更新评论总数（包含父+子总量）
        totalComments.value = normalized.length;
        
        // 构建显示列表
        buildDisplayList();

        // 补全已加载评论的用户信息（使用缓存，避免重复请求）
        await ensureAllUsersForLoadedComments();
        
        
        
      } catch (err: any) {
        console.error('加载评论失败:', err);
        commentError.value = '加载评论失败: ' + (err.message || '未知错误');
        roots.value = [];
        commentsForDisplay.value = [];
      } finally {
        loadingComments.value = false;
      }
    }

    // 根据 userId 拉取用户信息并缓存
    async function fetchAndCacheUser(userId: number) {
      if (!userId) return null;
      if (userCache.has(userId)) return userCache.get(userId);
      try {
        const resp: any = await getUserProfile(userId);
        const u = resp?.data?.data ?? resp?.data ?? resp;
        userCache.set(userId, u);
        return u;
      } catch (e) {
        return null;
      }
    }

    // 从本地存储获取当前登录用户信息，供新建评论时立即回填头像/昵称
    function loadLocalUser() {
      if (localUser.value) return localUser.value;
      try {
        const fromUserInfo = localStorage.getItem('userInfo');
        if (fromUserInfo) {
          localUser.value = JSON.parse(fromUserInfo);
          return localUser.value;
        }
      } catch (e) {}
      try {
        const fromUser = localStorage.getItem('user');
        if (fromUser) {
          localUser.value = JSON.parse(fromUser);
          return localUser.value;
        }
      } catch (e) {}
      return null;
    }

    // 对当前所有已加载到映射表的评论，确保 username 和 userAvatar 被补全
    async function ensureAllUsersForLoadedComments() {
      const promises: Promise<void>[] = [];
      allCommentsMap.value.forEach((comment) => {
        const c: any = comment;
        if ((!c.username || !c.userAvatar) && c.userId) {
          const p = fetchAndCacheUser(c.userId).then((u) => {
            if (u) {
              c.username = u.username ?? c.username;
              c.userAvatar = u.avatar ?? u.avatarUrl ?? c.userAvatar;
            }
          });
          promises.push(p);
        }
      });
      if (promises.length > 0) await Promise.all(promises);
    }
    
    // 3. 构建扁平化的显示列表
    // 根据isExpanded状态决定是否显示子评论
    function buildDisplayList() {
      const out: ExtendedComment[] = [];
      
      // 深度优先遍历函数
      function dfs(comment: ExtendedComment) {
        out.push(comment);
        
        // 如果评论已展开且有子评论，递归添加子评论
        if (comment.isExpanded && comment.childComments && comment.childComments.length > 0) {
          comment.childComments.forEach(child => dfs(child));
        }
      }
      
      // 从所有一级评论开始遍历
      roots.value.forEach(root => {
        dfs(root);
      });
      
      commentsForDisplay.value = out;
    }
    
    // 4. 加载单个评论的详细信息（包括其子评论）
    // 这是懒加载的核心：点击"加载回复"时调用
    async function loadCommentWithReplies(commentId: number) {
      const comment = allCommentsMap.value.get(commentId);
      if (!comment) return;

      if (comment.isLoading) return;
      if (comment.isLoaded) return;

      comment.isLoading = true;

      try {
        const commentDetail = normalizeCommentRaw(await getCommentById(commentId));
        Object.assign(comment, commentDetail);

        // 补全当前评论的用户信息（若缺失）
        try {
          const c: any = comment;
          if ((!c.username || !c.userAvatar) && c.userId) {
            const u = await fetchAndCacheUser(c.userId);
            if (u) {
              c.username = u.username ?? c.username;
              c.userAvatar = u.avatar ?? u.avatarUrl ?? c.userAvatar;
            }
          }
        } catch {}

        if (commentDetail.replyCommentIds && commentDetail.replyCommentIds.length > 0) {
          await loadChildComments(comment, commentDetail.replyCommentIds);
        }

        comment.isLoaded = true;
      } catch (err) {
        console.error(`加载评论 ${commentId} 失败:`, err);
        commentError.value = `加载评论失败: ${err}`;
      } finally {
        comment.isLoading = false;
        buildDisplayList();
      }
    }
    
    // 5. 加载子评论（递归加载）
    // 遍历子评论ID列表，逐个获取详情
    async function loadChildComments(parentComment: ExtendedComment, childIds: number[]) {
      for (let i = 0; i < childIds.length; i++) {
        const childId = childIds[i];
        if (allCommentsMap.value.has(childId)) continue;

        try {
          const childDetail = normalizeCommentRaw(await getCommentById(childId));
          const childComment: ExtendedComment = {
            ...childDetail,
            isExpanded: false,
            depth: parentComment.depth + 1,
            childComments: [],
            isLoading: false,
            isLoaded: false
          };

          // 补全子评论的用户信息（若缺失）
          try {
            const cc: any = childComment;
            if ((!cc.username || !cc.userAvatar) && cc.userId) {
              const u = await fetchAndCacheUser(cc.userId);
              if (u) {
                cc.username = u.username ?? cc.username;
                cc.userAvatar = u.avatar ?? u.avatarUrl ?? cc.userAvatar;
              }
            }
          } catch {}

          parentComment.childComments.push(childComment);
          allCommentsMap.value.set(childId, childComment);

          if (childDetail.replyCommentIds && childDetail.replyCommentIds.length > 0) {
            await loadChildComments(childComment, childDetail.replyCommentIds);
          }
        } catch (err) {
          console.error(`加载子评论 ${childId} 失败:`, err);
        }
      }

      if (parentComment.childComments.length > 0) {
        parentComment.childComments.sort(
          (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        );
      }
    }
    
    // 6. 处理展开/收起按钮点击
    // 切换评论的展开状态
    function handleExpand(commentId: number) {
      const comment = allCommentsMap.value.get(commentId);
      if (!comment) return;

      const newState = !comment.isExpanded;
      comment.isExpanded = newState;

      if (newState && !comment.isLoaded && comment.replyCommentIds && comment.replyCommentIds.length > 0) {
        loadCommentWithReplies(commentId);
      } else {
        buildDisplayList();
      }
    }
    
    // 7. 处理回复按钮点击
    // 设置正在回复的评论ID，并聚焦到输入框
    function startReply(commentId?: number) {
      if (commentId == null) return;
      replyCommentId.value = commentId;
      nextTick(() => {
        if (commentInput.value) commentInput.value.focus();
      });
    }
    
    // 8. 取消回复
    // 清空回复状态
    function cancelReply() {
      replyCommentId.value = null;
      inputText.value = '';
    }
    
    // 9. 提交评论或回复
    // 调用API提交评论，然后刷新评论列表
    async function submit() {
      if (submitting.value) return;
      const text = inputText.value.trim();
      if (!text) return;

      submitting.value = true;

      //try {
        // 调用API提交评论
                const payload: any = {
                  musicId: props.musicId,
                  detail: text
                };
                if (replyCommentId.value) {
                  payload.replyCommentId = replyCommentId.value;
                }
                const createdRaw = await apiPostComment(payload as any);
                const created = normalizeCommentRaw(createdRaw);

                // 确保创建后的评论有 id
                

        // 优先进行本地乐观更新，避免整列表刷新导致闪烁
        const newComment: ExtendedComment = {
          ...created,
          isExpanded: false,
          depth: 0,
          childComments: [],
          isLoading: false,
          isLoaded: false
        } as unknown as ExtendedComment;

        // 尝试补全新评论的用户信息（若缺失）
        try {
          const c: any = newComment;
          // 优先使用接口获取的用户信息
          if ((!c.username || !c.userAvatar) && c.userId) {
            const u = await fetchAndCacheUser(c.userId);
            if (u) {
              c.username = u.username ?? c.username;
              c.userAvatar = u.avatar ?? u.avatarUrl ?? c.userAvatar;
            }
          }
          // 如果接口未返回 userId 或头像，尝试使用本地登录信息填充
          if (!c.userAvatar || !c.username) {
            const local = loadLocalUser();
            if (local) {
              c.username = c.username || local.username || local.email;
              c.userAvatar = c.userAvatar || local.avatar || local.avatarUrl;
              c.userId = c.userId || local.id;
            }
          }
        } catch {}

        if (replyCommentId.value) {
          // 作为回复：放入父评论的子级
          const parent = allCommentsMap.value.get(replyCommentId.value);
          if (parent) {
            newComment.depth = parent.depth + 1;
            parent.childComments = parent.childComments || [];
            parent.childComments.unshift(newComment);
            parent.isExpanded = true; // 自动展开以展示新回复
            parent.isLoaded = false; // 标记需重新拉取子评论以刷新
            // 维护父评论的 replyCommentIds（若存在）
            if (Array.isArray((parent as any).replyCommentIds)) {
              (parent as any).replyCommentIds.unshift((newComment as any).id);
            }
            allCommentsMap.value.set((newComment as any).id, newComment);
            totalComments.value += 1;
            buildDisplayList();
          } else {
            // 找不到父评论（极端情况），退回到刷新根评论 + 懒加载父
            await loadRootComments();
            await loadCommentWithReplies(replyCommentId.value);
          }
        } else {
          // 顶级评论：插入根列表顶部
          newComment.depth = 0;
          roots.value.unshift(newComment);
          allCommentsMap.value.set((newComment as any).id, newComment);
          totalComments.value += 1;
          buildDisplayList();
        }

        // 若为子评论，刷新父评论的子评论列表以同步服务端数据
        if (replyCommentId.value) {
          await loadCommentWithReplies(replyCommentId.value);
        }

        // 清空输入和回复状态
cancelReply();
      //} catch (err) {
      //  console.error('❌ 提交评论失败:', err);
      //  alert('提交评论失败，请重试');
      //} finally {
        submitting.value = false;
        submitting.value = false;
      //}
    }

    // 处理来自 CommentItem 的内联回复提交
    
    
    // 11. 工具函数：格式化时间（秒 -> MM:SS）
    function formatTime(sec?: number) {
      if (!sec) return '--:--';
      const s = Math.floor(Number(sec) || 0);
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      return `${mm}:${ss}`;
    }
    
    // 12. 关闭弹窗
    function close() {
      console.log('🚪 关闭弹窗');
      emit('close');
    }
    
    // 13. 组件挂载时初始化
    onMounted(async () => {
console.log('🚀 组件挂载完成，开始初始化...');
      try {
        await loadMusic();        // 加载歌曲信息
        await loadRootComments(); // 加载一级评论
        console.log('✅ 初始化完成');
      } catch (err) {
        console.error('❌ 初始化失败:', err);
      }
      console.groupEnd();
    });
    
    // 导出所有响应式数据和方法
    return {
      // 数据
      music,
      roots,
      commentsForDisplay,
      totalComments,
      
      // 状态
      loadingComments,
      commentError,
      replyCommentId,
      inputText,
      submitting,
      commentInput,
      
      // 方法
      formatTime,
      handleExpand,
      startReply,
      cancelReply,
      submit,
      close
    };
  }
});
</script>

<style scoped>
/* 弹窗整体样式 */
.mm-overlay { 
  position: fixed; 
  inset: 0; 
  z-index: 10000; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

.mm-backdrop { 
  position: absolute; 
  inset: 0; 
  background: rgba(10, 12, 20, 0.25); 
  backdrop-filter: blur(4px); 
}

.mm-modal { 
  position: relative; 
  width: 1700px; 
  height: 900px; 
  background: linear-gradient(180deg, #fbfcff, #f7f9ff); 
  border-radius: 14px; 
  overflow: hidden; 
  z-index: 2; 
  box-shadow: 0 14px 40px rgba(20, 24, 40, 0.12); 
  padding: 24px; 
  display: flex;
  flex-direction: column;
}

.mm-close { 
  position: absolute; 
  right: 16px; 
  top: 16px; 
  border: none; 
  background: transparent; 
  font-size: 24px; 
  cursor: pointer; 
  color: #444; 
  z-index: 3;
}

/* 内容区域布局 */
.mm-content { 
  display: flex; 
  gap: 30px; 
  align-items: stretch; 
  flex: 1; 
  min-height: 0; 
  overflow: hidden; 
}

/* 左侧歌曲信息区域 */
.left-pane { 
  flex: 2; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 24px; 
  padding: 12px; 
  min-height: 0; 
}

.music-info { 
  text-align: center; 
  margin-top: 12px; 
}

.music-title { 
  margin: 0; 
  font-size: 28px; 
  color: #222; 
}

.music-sub { 
  color: #666; 
  margin-top: 8px; 
  font-size: 16px; 
}

.cover-wrap { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  width: 100%; 
}

.cover { 
  width: 45%; 
  max-width: 500px; 
  border-radius: 12px; 
  box-shadow: 0 12px 34px rgba(16, 20, 36, 0.06); 
  object-fit: cover; 
}

/* 右侧评论区域 */
.right-pane { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 16px; 
  padding: 12px; 
  min-height: 0; 
}

.comments-top { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  overflow: hidden; 
}

.comments-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.comments-title { 
  margin: 0; 
  font-size: 20px; 
  color: #222; 
}

.count { 
  color: #888; 
  font-size: 14px; 
  margin-left: 8px; 
}

/* 评论滚动区域 */
.comments-scroll { 
  flex: 1; 
  overflow-y: auto; 
  overflow-x: hidden; 
  display: flex; 
  flex-direction: column; 
  gap: 10px; 
  padding-right: 8px; 
  max-height: 650px; 
}

/* 评论项样式 */
.comment-item { 
  position: relative;
  display: flex; 
  gap: 10px; 
  padding: 12px 10px 10px 64px; 
  border-radius: 8px; 
  background: #fff; 
  box-shadow: 0 2px 8px rgba(16, 20, 36, 0.03); 
  align-items: flex-start; 
  min-height: 56px; 
  transition: background-color 0.2s;
}

.comment-item.child { 
  background: transparent; 
  box-shadow: none; 
}

.comment-item.loading { 
  opacity: 0.7; 
}

.comment-item:hover { 
  background-color: #f8f9ff; 
}

/* 用户头像 */
.avatar-frame {
  position: absolute;
  left: 12px;
  top: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(16,20,36,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(16,20,36,0.04);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.05);
  display: block;
}

/* 评论内容区域 */
.content { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
  min-width: 0; 
}

/* 元信息区域：用户名在左，时间固定在最右侧 */
.meta { 
  font-size: 12px; 
  color: #a6abb3; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  min-width: 0;
  width: 100%;
  gap: 20px; /* 进一步增加间距 */
}

.name { 
  color: #21c521; 
  font-weight: 500; 
  font-size: 13px; 
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time { 
  color: #888888; /* 使用更明显的灰色 */
  font-size: 11px; 
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
  font-weight: 400; /* 确保字体粗细正常 */
}

.status { 
  color: #a6abb3; 
  font-size: 12px; 
}



/* 加载动画 */
@keyframes loading-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ccc;
  border-top-color: #2e8bff;
  border-radius: 50%;
  animation: loading-spin 1s linear infinite;
  margin-right: 5px;
  vertical-align: middle;
}

/* 评论输入区域 */
.comments-bottom { 
  border-top: 1px solid rgba(0, 0, 0, 0.04); 
  padding-top: 12px; 
  display: flex; 
  flex-direction: column; 
  gap: 10px; 
  flex-shrink: 0; 
}

.input-header { 
  font-size: 14px; 
  color: #666; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
}

.replying-note { 
  color: #4b6cff; 
  font-weight: 500; 
}

.new-note { 
  color: #666; 
}

/* 输入框 */
.input-area { 
  width: 100%; 
  min-height: 80px; 
  border-radius: 8px; 
  border: 1px solid rgba(16, 20, 36, 0.06); 
  padding: 10px; 
  resize: vertical; 
  font-size: 14px; 
  font-family: inherit;
  transition: border-color 0.2s;
}

.input-area:focus { 
  outline: none; 
  border-color: #4b6cff; 
  box-shadow: 0 0 0 2px rgba(75, 108, 255, 0.1); 
}

/* 输入操作区域 */
.input-actions { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 10px; 
}

.status-select { 
  border-radius: 6px; 
  padding: 6px 8px; 
  border: 1px solid rgba(16, 20, 36, 0.06); 
  background: #fafbff; 
  font-size: 13px; 
  color: #333;
  cursor: pointer;
}

.btn-primary { 
  padding: 8px 12px; 
  border-radius: 6px; 
  background: #2e8bff; 
  color: #fff; 
  border: none; 
  cursor: pointer; 
  font-size: 14px; 
  font-weight: 500;
  transition: background-color 0.2s;
  min-width: 100px;
}

.btn-primary:hover:not(:disabled) { 
  background: #1a7cff; 
}

.btn-primary:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
}

.small { 
  font-size: 12px; 
  margin-left: 8px; 
}

/* 加载状态样式 */
.loading-comments { 
  text-align: center; 
  padding: 40px 20px; 
  color: #666; 
  font-size: 14px; 
}

.error-comments { 
  text-align: center; 
  padding: 20px; 
  color: #ff4757; 
  background: rgba(255, 71, 87, 0.1); 
  border-radius: 8px; 
  margin: 10px; 
  font-size: 14px; 
}

.no-comments { 
  color: #999; 
  text-align: center; 
  padding: 40px 20px; 
  font-size: 14px; 
}

/* 滚动条样式 */
.comments-scroll::-webkit-scrollbar {
  width: 6px;
}

.comments-scroll::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.comments-scroll::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.comments-scroll::-webkit-scrollbar-thumb:hover {
  background: #b8b8b8;
}

/* 响应式调整 */
@media (max-width: 1800px) {
  .mm-modal {
    width: 90vw;
    height: 90vh;
  }
}

@media (max-width: 1200px) {
  .mm-content {
    flex-direction: column;
  }
  
  .left-pane, .right-pane {
    flex: none;
  }
  
  .left-pane {
    max-height: 40%;
  }
  
  .right-pane {
    max-height: 60%;
  }
}
</style>