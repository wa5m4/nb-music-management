// ...existing code...
/**
 * 程序化打开歌曲弹窗的函数
 * 用法：
 *   import { openMusicModal } from '@/services/musicModal';
 *   openMusicModal(123);
 *
 * 实现说明：
 * - 在 document.body 新建容器并挂载一个临时 Vue app 渲染 MusicModal 组件
 * - 弹窗内部通过 emits('close') 通知关闭后卸载并移除容器
 */
import { createApp, h } from 'vue';
import MusicModal from '../components/MusicModal.vue';

export function openMusicModal(musicId: number) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const app = createApp({
    render() {
      return h(MusicModal, {
        musicId,
        onClose: () => {
          // 弹窗关闭时卸载 app 并移除 DOM 节点
          app.unmount();
          if (container.parentNode) container.parentNode.removeChild(container);
        }
      });
    }
  });

  app.mount(container);
}