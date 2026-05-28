import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../utils/api';
import type { ArticlesState, Article, Note } from '../utils/interfaces';
import type { RootState } from './index';

const initialState: ArticlesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchArticles = createAsyncThunk(
  'articles/fetchAll',
  async () => {
    const response = await api.getArticles();
    return response.data;
  }
);

export const fetchArticlesByAuthor = createAsyncThunk(
  'articles/fetchByAuthor',
  async (authorDocumentId: string) => {
    const response = await api.getArticlesByAuthor(authorDocumentId);
    return response.data;
  }
);

export const fetchCommentedArticles = createAsyncThunk(
  'articles/fetchCommented',
  async (userDocumentId: string) => {
    const response = await api.getCommentedArticles(userDocumentId);
    return response.data;
  }
);

export const createArticle = createAsyncThunk(
  'articles/create',
  async ({ title, content, author }: { title: string; content: string; author: string }) => {
    const response = await api.createArticle({ title, content, author });
    return response.data;
  }
);

export const updateArticle = createAsyncThunk(
  'articles/update',
  async ({ documentId, title, content }: { documentId: string; title: string; content: string }) => {
    const response = await api.updateArticle(documentId, { title, content });
    return response.data;
  }
);

export const deleteArticle = createAsyncThunk(
  'articles/delete',
  async (documentId: string) => {
    const notesResponse = await api.getNotesByArticle(documentId);
    const notes = notesResponse.data;
    
    if (notes && notes.length > 0) {
      for (const note of notes) {
        await api.deleteNote(note.documentId);
      }
    }
    
    await api.deleteArticle(documentId);
    return documentId;
  }
);

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearArticles: (state) => {
      state.items = [];
      state.error = null;
    },
    incrementArticleNotesCount: (state, action: PayloadAction<string>) => {
      const article = state.items.find(a => a.documentId === action.payload);
      if (article) {
        article.notesCount = (article.notesCount || 0) + 1;
      }
    },
    decrementArticleNotesCount: (state, action: PayloadAction<string>) => {
      const article = state.items.find(a => a.documentId === action.payload);
      if (article && article.notesCount && article.notesCount > 0) {
        article.notesCount = article.notesCount - 1;
      }
    },
    addNoteToArticle: (state, action: PayloadAction<{ articleDocumentId: string; note: Note }>) => {
      const article = state.items.find(a => a.documentId === action.payload.articleDocumentId);
      if (article) {
        if (!article.notes) article.notes = [];
        if (!article.notes.find(n => n.documentId === action.payload.note.documentId)) {
          article.notes.push(action.payload.note);
          article.notesCount = article.notes.length;
        }
      }
    },
    removeNoteFromArticle: (state, action: PayloadAction<{ articleDocumentId: string; noteDocumentId: string }>) => {
      const article = state.items.find(a => a.documentId === action.payload.articleDocumentId);
      if (article && article.notes) {
        article.notes = article.notes.filter(n => n.documentId !== action.payload.noteDocumentId);
        article.notesCount = article.notes.length;
      }
    },
    setArticleCommentedFlag: (state, action: PayloadAction<{ articleDocumentId: string; isCommented: boolean }>) => {
      const article = state.items.find(a => a.documentId === action.payload.articleDocumentId);
      if (article) {
        article.isCommentedByUser = action.payload.isCommented;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action: PayloadAction<Article[]>) => {
        state.loading = false;
        state.items = action.payload.map(article => ({
          ...article,
          notesCount: article.notesCount || article.notes?.length || 0,
          isCommentedByUser: false
        }));
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load articles';
      })
      .addCase(fetchCommentedArticles.fulfilled, (state, action: PayloadAction<Article[]>) => {
        const commentedDocIds = action.payload.map(a => a.documentId);
        state.items = state.items.map(article => ({
          ...article,
          isCommentedByUser: commentedDocIds.includes(article.documentId)
        }));
        action.payload.forEach(article => {
          if (!state.items.find(a => a.documentId === article.documentId)) {
            state.items.push({ 
              ...article, 
              notesCount: article.notesCount || article.notes?.length || 0, 
              isCommentedByUser: true 
            });
          }
        });
      })
      .addCase(createArticle.fulfilled, (state, action: PayloadAction<Article>) => {
        state.items = [{ ...action.payload, notes: [], notesCount: 0, isCommentedByUser: false }, ...state.items];
      })
      .addCase(updateArticle.fulfilled, (state, action: PayloadAction<Article>) => {
        const index = state.items.findIndex(a => a.documentId === action.payload.documentId);
        if (index !== -1) {
          state.items[index] = { 
            ...action.payload, 
            notesCount: state.items[index].notesCount, 
            notes: state.items[index].notes,
            isCommentedByUser: state.items[index].isCommentedByUser 
          };
        }
      })
      .addCase(deleteArticle.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(a => a.documentId !== action.payload);
      });
  },
});

export const { 
  clearArticles, 
  incrementArticleNotesCount, 
  decrementArticleNotesCount,
  addNoteToArticle, 
  removeNoteFromArticle,
  setArticleCommentedFlag
} = articlesSlice.actions;

export const selectArticles = (state: RootState) => state.articles.items;
export const selectArticlesLoading = (state: RootState) => state.articles.loading;
export const selectArticlesError = (state: RootState) => state.articles.error;
export const selectCurrentUserDocumentId = (state: RootState) => state.auth.user?.documentId;

export const selectMyArticles = createSelector(
  [selectArticles, selectCurrentUserDocumentId],
  (articles, currentUserDocumentId) => {
    return articles.filter(article => article.author?.documentId === currentUserDocumentId);
  }
);

export const selectCommentedArticles = createSelector(
  [selectArticles, selectCurrentUserDocumentId],
  (articles, currentUserDocumentId) => {
    return articles.filter(article => 
      article.isCommentedByUser === true ||
      article.notes?.some(note => {
        const noteAuthorId = typeof note.author === 'object' && note.author !== null 
          ? note.author.documentId 
          : null;
        return noteAuthorId === currentUserDocumentId;
      })
    );
  }
);

export default articlesSlice.reducer;