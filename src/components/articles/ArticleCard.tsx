import React, { memo, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { ArticleCardProps, Note, ContentBlock } from '../../utils/interfaces';
import { createNote, deleteNote, fetchNotesByArticle, selectNotesByArticle } from '../../store/notesSlice';
import { selectUser } from '../../store/authSlice';
import { setArticleCommentedFlag } from '../../store/articlesSlice';
import type { AppDispatch, RootState } from '../../store';
import { validateNote, type FormErrors } from '../../utils/validators';

const ArticleCard: React.FC<ArticleCardProps> = memo(({ 
  article, 
  onDelete, 
  onEdit,
  currentUserDocumentId 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentErrors, setCommentErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector(selectUser);
  const notes = useSelector((state: RootState) => selectNotesByArticle(article.documentId)(state));

  if (!article) return null;

  const contentText = useMemo(() => {
    if (!article.content) return "Пустая публикация";
    if (typeof article.content === 'string') {
      return article.content || "Пустая публикация";
    }
    if (Array.isArray(article.content)) {
      const firstBlock = article.content[0] as ContentBlock;
      if (firstBlock?.children?.[0]?.text) {
        return firstBlock.children[0].text;
      }
    }
    return "Пустая публикация";
  }, [article.content]);

  const formattedDate = useMemo(() => {
    return new Date(article.createdAt).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [article.createdAt]);

  const isAuthor = currentUserDocumentId === article.author?.documentId;

  const handleToggleComments = useCallback(async () => {
    if (!showComments) {
      await dispatch(fetchNotesByArticle(article.documentId));
    }
    setShowComments(prev => !prev);
  }, [showComments, article.documentId, dispatch]);

  const handleAddComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateNote(newComment);
    if (error) {
      setCommentErrors({ comment: error });
      return;
    }
    setCommentErrors({});
    setIsSubmitting(true);
    try {
      await dispatch(createNote({
        content: newComment,
        author: currentUser?.documentId || '',
        article: article.documentId,
        currentUser: currentUser!
      })).unwrap();
      setNewComment('');
      await dispatch(fetchNotesByArticle(article.documentId));
      // Просто обновляем флаг, что эта статья прокомментирована пользователем
      dispatch(setArticleCommentedFlag({ 
        articleDocumentId: article.documentId, 
        isCommented: true 
      }));
    } catch (err) {
      setCommentErrors({ comment: 'Ошибка при добавлении комментария' });
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, currentUser, article.documentId, dispatch]);

  const handleDeleteComment = useCallback(async (noteDocumentId: string) => {
    if (!window.confirm('Удалить комментарий?')) return;
    try {
      await dispatch(deleteNote({ 
        documentId: noteDocumentId, 
        articleDocumentId: article.documentId,
        currentUserDocumentId: currentUserDocumentId || ''
      })).unwrap();
      
      // Получаем обновленные комментарии
      const result = await dispatch(fetchNotesByArticle(article.documentId)).unwrap();
      const updatedNotes = result.notes;
      
      // Проверяем, остались ли ещё комментарии пользователя
      const hasUserComments = updatedNotes.some(
        (note: Note) => note.author?.documentId === currentUserDocumentId
      );
      
      dispatch(setArticleCommentedFlag({ 
        articleDocumentId: article.documentId, 
        isCommented: hasUserComments 
      }));
    } catch (err) {
      alert('Ошибка при удалении комментария');
    }
  }, [article.documentId, currentUserDocumentId, dispatch]);

  const displayNotesCount = article.notesCount !== undefined ? article.notesCount : notes.length;

  return (
    <article className="post-card">
      <header className="post-header">
        <h4 className="post-title">{article.title || "Без заголовка"}</h4>
        <time className="post-date" dateTime={article.createdAt}>
          {formattedDate}
        </time>
      </header>
      <p className="post-content">{contentText}</p>
      <footer className="post-footer">
        <span>{displayNotesCount} комментариев</span>
        <button 
          className="link-btn post-action"
          onClick={handleToggleComments}
        >
          {showComments ? 'Скрыть комментарии' : 'Комментарии'}
        </button>
        {isAuthor && (
          <>
            <button
              type="button"
              onClick={() => onEdit(article)}
              className="link-btn"
              aria-label="Редактировать публикацию"
            >
              Редактировать
            </button>
            <button
              type="button"
              onClick={() => onDelete(article.documentId)}
              className="link-btn danger"
              aria-label="Удалить публикацию"
            >
              Удалить
            </button>
          </>
        )}
      </footer>
      
      {showComments && (
        <div className="comments-section">
          {notes.length === 0 && (
            <p>Нет комментариев. Будьте первым!</p>
          )}
          {notes.map((note: Note) => (
            <div key={note.documentId} className="comment-item">
              <div className="comment-header">
                <strong>{note.author?.username || 'Пользователь'}</strong>
                <small>{new Date(note.createdAt).toLocaleString('ru-RU')}</small>
              </div>
              <p className="comment-text">{note.text}</p>
              {currentUserDocumentId === note.author?.documentId && (
                <button
                  onClick={() => handleDeleteComment(note.documentId)}
                  className="delete-comment-btn"
                >
                  Удалить
                </button>
              )}
            </div>
          ))}
          
          {currentUser && (
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                placeholder="Написать комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              />
              {commentErrors.comment && <span className="error-text">{commentErrors.comment}</span>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
});

ArticleCard.displayName = 'ArticleCard';

export default ArticleCard;