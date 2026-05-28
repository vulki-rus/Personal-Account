export interface User {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  avatar?: { id: number; url: string; name: string } | null;
}

export interface UserFile {
  id: number;
  url: string;
  name: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  avatar?: number;
}

export interface RegisterResponse {
  jwt: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'list' | 'image';
  children: {
    type: 'text';
    text: string;
    bold?: boolean;
    italic?: boolean;
  }[];
}

export interface Note {
  id: number;
  documentId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  author?: User;
  article?: { documentId: string } | string | null;
}

export interface Article {
  id: number;
  documentId: string;
  title: string;
  content: string | ContentBlock[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  author?: User;
  notes?: Note[];
  notesCount?: number;
  isCommentedByUser?: boolean;
}

export interface ArticlesState {
  items: Article[];
  loading: boolean;
  error: string | null;
}

export interface ArticlesResponse {
  data: Article[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface NotesState {
  [articleId: string]: Note[];
}

export interface NotesResponse {
  data: Note[];
  meta: {
    pagination: {
      total: number;
    };
  };
}

export interface UserInfoProps {
  user: User | null;
  onLogout: () => void;
  onEditClick: () => void;
}

export interface CreateArticleProps {
  articleData: { title: string; content: string };
  setArticleData: React.Dispatch<React.SetStateAction<{ title: string; content: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export interface ArticleCardProps {
  article: Article;
  onDelete: (documentId: string) => void;
  onEdit: (article: Article) => void;
  currentUserDocumentId?: string | null;
}

export interface ArticleListProps {
  articles: Article[];
  myArticles: Article[];
  commentedArticles: Article[];
  onDelete: (documentId: string) => void;
  onEditArticle: (article: Article) => void;
  currentUserDocumentId?: string | null;
  loading?: boolean;
  error?: string | null;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface StatusWrapperProps {
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}