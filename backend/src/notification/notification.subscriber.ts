import { EntitySubscriberInterface, EventSubscriber, InsertEvent, DataSource } from 'typeorm';
import { Action } from '../action/entities/action.entity';
import { Comment } from '../comment/entities/comment.entity';
import { Follow } from '../follow/entities/follow.entity';
import { Blog } from '../blog/entities/blog.entity';
import { Notification } from './entities/notification.entity';

// 必须确保这里有 export 关键字！
@EventSubscriber()
export class NotificationSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  async afterInsert(event: InsertEvent<any>) {
    const { entity, metadata, manager } = event;
    const notifyRepo = manager.getRepository(Notification);

    // --- 逻辑 A：处理 Action 模块 (点赞/收藏) ---
    if (metadata.target === Action) {
      const action = entity as Action;
      // 这里的 as any 是为了绕过 TypeORM findOne 的类型推断 bug
      const blog = await manager.findOneBy(Blog, { id: action.blogId } as any);
      
      if (blog && blog.authorId !== action.userId) {
        await notifyRepo.save({
          userId: blog.authorId,
          fromUserId: action.userId,
          type: action.type,
          content: action.type === 'like' ? `赞了你的文章: ${blog.title}` : `收藏了你的文章: ${blog.title}`,
          relatedId: action.blogId,
          payload: { actionId: action.id }
        });
      }
    }

    // --- 逻辑 B：处理 Comment 模块 (评论) ---
    if (metadata.target === Comment) {
      const comment = entity as Comment;
      const blog = await manager.findOneBy(Blog, { id: comment.blogId } as any);
      
      if (blog && blog.authorId !== comment.authorId) {
        await notifyRepo.save({
          userId: blog.authorId,
          fromUserId: comment.authorId,
          type: 'comment',
          content: `评论了你的文章《${blog.title}》: "${comment.content.substring(0, 20)}..."`,
          relatedId: comment.blogId,
          payload: { commentId: comment.id }
        });
      }
    }

    // --- 逻辑 C：处理 Follow 模块 (关注) ---
    if (metadata.target === Follow) {
      const follow = entity as Follow;
      await notifyRepo.save({
        userId: follow.followingId,
        fromUserId: follow.followerId,
        type: 'follow',
        content: '成为了你的新粉丝',
      });
    }
  }
}