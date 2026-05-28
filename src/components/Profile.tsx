import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { logout, selectUser, selectIsAuth, updateUserProfile } from '../store/authSlice';
import { 
  fetchArticles, 
  deleteArticle, 
  updateArticle,
  createArticle,
  fetchCommentedArticles,
  selectArticles, 
  selectArticlesLoading, 
  selectArticlesError,
  selectMyArticles,
  selectCommentedArticles
} from '../store/articlesSlice';
import type { Article } from '../utils/interfaces';
import UserInfo from './profile/UserInfo';
import EditProfile from './profile/EditProfile';
import CreateArticle from './articles/CreateArticle';
import ArticleList from './articles/ArticleList';
import StatusWrapper from './hoc/StatusWrapper';
import { validateArticleForm, type FormErrors } from '../utils/validators';

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [articleData, setArticleData] = useState({ title: '', content: '' });
  const [isPublishing, setIsPublishing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [articleErrors, setArticleErrors] = useState<FormErrors>({});
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const isAuth = useSelector(selectIsAuth);
  const user = useSelector(selectUser);
  const articles = useSelector(selectArticles);
  const articlesLoading = useSelector(selectArticlesLoading);
  const articlesError = useSelector(selectArticlesError);
  const myArticles = useSelector(selectMyArticles);
  const commentedArticles = useSelector(selectCommentedArticles);

  useEffect(() => {
    if (isAuth && user) {
      dispatch(fetchArticles());
      dispatch(fetchCommentedArticles(user.documentId));
    }
  }, [isAuth, user, dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleUpdateUser = useCallback(async (userData: { username: string; email: string }) => {
    if (!user) return;
    await dispatch(updateUserProfile({ userId: user.id, updateData: userData })).unwrap();
  }, [user, dispatch]);

  const handleCreateArticle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateArticleForm(articleData.title, articleData.content);
    if (Object.keys(errors).length > 0) {
      setArticleErrors(errors);
      return;
    }
    setArticleErrors({});
    
    if (!user?.documentId || !isAuth) {
      alert("Ошибка: пользователь не авторизован");
      return;
    }
    
    setIsPublishing(true);
    try {
      await dispatch(createArticle({ 
        title: articleData.title, 
        content: articleData.content, 
        author: user.documentId 
      })).unwrap();
      setArticleData({ title: '', content: '' });
      await dispatch(fetchArticles());
      await dispatch(fetchCommentedArticles(user.documentId));
    } catch (err) {
      alert("Ошибка при публикации");
    } finally {
      setIsPublishing(false);
    }
  }, [user, isAuth, articleData, dispatch]);

  const handleDeleteArticle = useCallback(async (documentId: string) => {
    if (!isAuth || !documentId) return;
    if (!window.confirm("Вы уверены, что хотите удалить эту статью?")) return;
    try {
      await dispatch(deleteArticle(documentId)).unwrap();
    } catch (err) {
      console.error("Ошибка удаления:", err);
      alert("Не удалось удалить статью на сервере");
    }
  }, [isAuth, dispatch]);

  const handleEditArticle = useCallback((article: Article) => {
    setEditingArticle(article);
    let contentText = '';
    if (typeof article.content === 'string') {
      contentText = article.content;
    } else if (Array.isArray(article.content)) {
      contentText = article.content[0]?.children?.[0]?.text || '';
    }
    setArticleData({ title: article.title, content: contentText });
  }, []);

  const handleUpdateArticle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    const errors = validateArticleForm(articleData.title, articleData.content);
    if (Object.keys(errors).length > 0) {
      setArticleErrors(errors);
      return;
    }
    setArticleErrors({});
    setIsPublishing(true);
    try {
      await dispatch(updateArticle({
        documentId: editingArticle.documentId,
        title: articleData.title,
        content: articleData.content
      })).unwrap();
      setEditingArticle(null);
      setArticleData({ title: '', content: '' });
      await dispatch(fetchArticles());
    } catch (err) {
      alert("Ошибка при обновлении");
    } finally {
      setIsPublishing(false);
    }
  }, [editingArticle, articleData, dispatch]);

  if (!user) {
    return <StatusWrapper loading={true} error={null}>null</StatusWrapper>;
  }

  return (
    <main className="dashboard-grid">
      <UserInfo
        user={user}
        onLogout={handleLogout}
        onEditClick={() => setShowEditModal(true)}
      />
      
      <CreateArticle
        articleData={articleData}
        setArticleData={setArticleData}
        onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle}
        isLoading={isPublishing}
        errors={articleErrors}
      />
      
      {editingArticle && (
        <div className="edit-mode-banner">
          <span>Редактирование: {editingArticle.title}</span>
          <button onClick={() => { setEditingArticle(null); setArticleData({ title: '', content: '' }); }}>
            Отменить
          </button>
        </div>
      )}

      <StatusWrapper 
        loading={articlesLoading} 
        error={articlesError} 
        isEmpty={articles.length === 0 && !articlesLoading}
      >
        <ArticleList
          articles={articles}
          myArticles={myArticles}
          commentedArticles={commentedArticles}
          onDelete={handleDeleteArticle}
          onEditArticle={handleEditArticle}
          currentUserDocumentId={user?.documentId}
        />
      </StatusWrapper>

      {showEditModal && (
        <EditProfile
          user={user}
          onUpdate={handleUpdateUser}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </main>
  );
};

export default Profile;