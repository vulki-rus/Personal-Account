import React, { memo } from 'react';
import type { CreateArticleProps } from '../../utils/interfaces';

const CreateArticle: React.FC<CreateArticleProps & { isLoading?: boolean; errors?: Record<string, string> }> = memo(({
  articleData,
  setArticleData,
  onSubmit,
  isLoading = false,
  errors = {}
}) => {
  return (
    <section className="card-base create-post" aria-labelledby="create-post-title">
      <h3 id="create-post-title" className="create-post-title">Создать публикацию</h3>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="post-title">Заголовок</label>
          <input
            id="post-title"
            type="text"
            placeholder="Заголовок публикации"
            value={articleData.title}
            onChange={(e) => setArticleData(prev => ({ ...prev, title: e.target.value }))}
            disabled={isLoading}
            required
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>
        <div className="form-group flex-grow">
          <label htmlFor="post-content">Контент</label>
          <textarea
            id="post-content"
            placeholder="О чем вы хотите рассказать?"
            value={articleData.content}
            onChange={(e) => setArticleData(prev => ({ ...prev, content: e.target.value }))}
            disabled={isLoading}
            required
          />
          {errors.content && <span className="error-text">{errors.content}</span>}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !articleData.title.trim() || !articleData.content.trim()}
        >
          {isLoading ? 'Публикация...' : 'Опубликовать'}
        </button>
      </form>
    </section>
  );
});

CreateArticle.displayName = 'CreateArticle';

export default CreateArticle;