import axios from 'axios';
import type { 
  RegisterResponse, 
  ArticlesResponse, 
  Article, 
  User, 
  Note, 
  NotesResponse,
  UpdateUserPayload,
  UserFile
} from './interfaces';

const API_URL = 'http://localhost:1337/api';

const $api = axios.create({
  baseURL: API_URL,
});

$api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  async register(formData: Record<string, string>): Promise<RegisterResponse> {
    const { data } = await $api.post<RegisterResponse>('/auth/local/register', formData);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await $api.get<User>('/users/me?populate=avatar');
    return data;
  },

  async login(formData: Record<string, string>): Promise<RegisterResponse> {
    const { data } = await $api.post<RegisterResponse>('/auth/local', {
      identifier: formData.email,
      password: formData.password
    });
    return data;
  },

  async updateUser(userId: number, updateData: UpdateUserPayload): Promise<User> {
    const { data } = await $api.put<User>(`/users/${userId}`, updateData);
    return data;
  },

  async uploadFile(file: File): Promise<UserFile[]> {
    const formData = new FormData();
    formData.append('files', file);
    const { data } = await $api.post<UserFile[]>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Articles
  async getArticles(): Promise<ArticlesResponse> {
    const { data } = await $api.get<ArticlesResponse>('/articles?populate=author&sort=createdAt:desc');
    
    // Для каждой статьи получаем количество комментариев
    const articlesWithCounts = await Promise.all(
      data.data.map(async (article: Article) => {
        try {
          const notesResponse = await $api.get<NotesResponse>(`/notes?filters[article][documentId][$eq]=${article.documentId}`);
          return {
            ...article,
            notesCount: notesResponse.data.data.length
          };
        } catch {
          return { ...article, notesCount: 0 };
        }
      })
    );
    
    return { ...data, data: articlesWithCounts };
  },

  async getArticlesByAuthor(authorDocumentId: string): Promise<ArticlesResponse> {
    const { data } = await $api.get<ArticlesResponse>(
      `/articles?populate=author&sort=createdAt:desc&filters[author][documentId][$eq]=${authorDocumentId}`
    );
    
    const articlesWithCounts = await Promise.all(
      data.data.map(async (article: Article) => {
        try {
          const notesResponse = await $api.get<NotesResponse>(`/notes?filters[article][documentId][$eq]=${article.documentId}`);
          return {
            ...article,
            notesCount: notesResponse.data.data.length
          };
        } catch {
          return { ...article, notesCount: 0 };
        }
      })
    );
    
    return { ...data, data: articlesWithCounts };
  },

  async getCommentedArticles(userDocumentId: string): Promise<ArticlesResponse> {
    const notesResponse = await $api.get<NotesResponse>(`/notes?populate=article&filters[author][documentId][$eq]=${userDocumentId}`);
    
    const articleIds: string[] = [];
    notesResponse.data.data.forEach(note => {
      const articleDocId = typeof note.article === 'object' && note.article !== null 
        ? note.article.documentId 
        : null;
      if (articleDocId && !articleIds.includes(articleDocId)) {
        articleIds.push(articleDocId);
      }
    });
    
    if (articleIds.length === 0) {
      return { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };
    }
    
    const articlesPromises = articleIds.map(async (id) => {
      const articleRes = await $api.get<{ data: Article }>(`/articles/${id}?populate=author`);
      const notesRes = await $api.get<NotesResponse>(`/notes?filters[article][documentId][$eq]=${id}`);
      return {
        ...articleRes.data.data,
        notesCount: notesRes.data.data.length
      };
    });
    const articlesResponses = await Promise.all(articlesPromises);
    
    return { data: articlesResponses, meta: { pagination: { page: 1, pageSize: articlesResponses.length, pageCount: 1, total: articlesResponses.length } } };
  },

  async createArticle(articleData: { title: string; content: string; author: string }): Promise<{ data: Article }> {
    const { data } = await $api.post<{ data: Article }>('/articles', {
      data: {
        title: articleData.title,
        content: articleData.content,
        author: articleData.author
      }
    });
    return { data: { ...data.data, notesCount: 0 } };
  },

  async updateArticle(documentId: string, articleData: { title: string; content: string }): Promise<{ data: Article }> {
    const { data } = await $api.put<{ data: Article }>(`/articles/${documentId}`, {
      data: {
        title: articleData.title,
        content: articleData.content,
      }
    });
    return data;
  },

  async deleteArticle(documentId: string): Promise<boolean> {
    await $api.delete(`/articles/${documentId}`);
    return true;
  },

  // Notes (Comments)
  async getNotesByArticle(articleDocumentId: string): Promise<NotesResponse> {
    const { data } = await $api.get<NotesResponse>(
      `/notes?populate=author&filters[article][documentId][$eq]=${articleDocumentId}&sort=createdAt:asc`
    );
    return data;
  },

  async createNote(noteData: { content: string; author: string; article: string }): Promise<{ data: Note }> {
    const { data } = await $api.post<{ data: Note }>('/notes', {
      data: {
        text: noteData.content,
        author: noteData.author,
        article: noteData.article
      }
    });
    return data;
  },

  async deleteNote(documentId: string): Promise<boolean> {
    await $api.delete(`/notes/${documentId}`);
    return true;
  },

  async updateNote(documentId: string, content: string): Promise<{ data: Note }> {
    const { data } = await $api.put<{ data: Note }>(`/notes/${documentId}`, {
      data: { text: content }
    });
    return data;
  },
};