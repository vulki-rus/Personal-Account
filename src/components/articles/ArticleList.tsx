import React, { memo, useState, useMemo, useCallback } from 'react';
import ArticleCard from './ArticleCard';
import type { ArticleListProps, Article } from '../../utils/interfaces';

type FilterType = 'all' | 'my' | 'commented';

const FilterButtons = memo(({ 
  filter, 
  onFilterChange, 
  counts 
}: { 
  filter: FilterType; 
  onFilterChange: (type: FilterType) => void; 
  counts: { all: number; my: number; commented: number };
}) => (
  <div className="feed-filters">
    <button 
      type="button" 
      className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
      onClick={() => onFilterChange('all')}
    >
      Все публикации ({counts.all})
    </button>
    <button 
      type="button" 
      className={`filter-btn ${filter === 'my' ? 'active' : ''}`}
      onClick={() => onFilterChange('my')}
    >
      Мои публикации ({counts.my})
    </button>
    <button 
      type="button" 
      className={`filter-btn ${filter === 'commented' ? 'active' : ''}`}
      onClick={() => onFilterChange('commented')}
    >
      Прокомментированные ({counts.commented})
    </button>
  </div>
));

FilterButtons.displayName = 'FilterButtons';

const ArticleList: React.FC<ArticleListProps> = memo(({
  articles,
  onDelete,
  onEditArticle,
  currentUserDocumentId,
  myArticles = [],
  commentedArticles = []
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredArticles = useMemo(() => {
    switch (filter) {
      case 'my':
        return myArticles;
      case 'commented':
        return commentedArticles;
      default:
        return articles;
    }
  }, [filter, articles, myArticles, commentedArticles]);

  const counts = useMemo(() => ({
    all: articles.length,
    my: myArticles.length,
    commented: commentedArticles.length
  }), [articles.length, myArticles.length, commentedArticles.length]);

  const handleFilterChange = useCallback((type: FilterType) => {
    setFilter(type);
  }, []);

  if (articles.length === 0) {
    return (
      <section className="posts-feed-full">
        <p className="empty-message">Публикаций пока нет...</p>
      </section>
    );
  }

  return (
    <section className="posts-feed-full">
      <FilterButtons 
        filter={filter} 
        onFilterChange={handleFilterChange} 
        counts={counts} 
      />
      <ul className="feed-list">
        {filteredArticles.map((article: Article) => (
          <li key={article.documentId} className="feed-item">
            <ArticleCard
              article={article}
              onDelete={onDelete}
              onEdit={onEditArticle}
              currentUserDocumentId={currentUserDocumentId}
            />
          </li>
        ))}
      </ul>
    </section>
  );
});

ArticleList.displayName = 'ArticleList';

export default ArticleList;