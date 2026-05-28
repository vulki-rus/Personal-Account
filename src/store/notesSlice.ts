import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../utils/api';
import type { Note, User } from '../utils/interfaces';
import type { RootState } from './index';
import { incrementArticleNotesCount, decrementArticleNotesCount } from './articlesSlice';

interface NotesByArticle {
  [articleId: string]: Note[];
}

const initialState: NotesByArticle = {};

export const fetchNotesByArticle = createAsyncThunk(
  'notes/fetchByArticle',
  async (articleDocumentId: string) => {
    const response = await api.getNotesByArticle(articleDocumentId);
    return { articleDocumentId, notes: response.data };
  }
);

export const createNote = createAsyncThunk(
  'notes/create',
  async ({ content, author, article, currentUser }: { content: string; author: string; article: string; currentUser: User }, { dispatch }) => {
    const response = await api.createNote({ content, author, article });
    const noteWithAuthor = {
      ...response.data,
      author: currentUser
    };
    dispatch(incrementArticleNotesCount(article));
    return { note: noteWithAuthor, articleDocumentId: article };
  }
);

export const deleteNote = createAsyncThunk(
  'notes/delete',
  async ({ documentId, articleDocumentId, currentUserDocumentId }: { documentId: string; articleDocumentId: string; currentUserDocumentId: string }, { dispatch }) => {
    await api.deleteNote(documentId);
    dispatch(decrementArticleNotesCount(articleDocumentId));
    return { documentId, articleDocumentId, currentUserDocumentId };
  }
);

export const updateNote = createAsyncThunk(
  'notes/update',
  async ({ documentId, content, articleDocumentId }: { documentId: string; content: string; articleDocumentId: string }) => {
    const response = await api.updateNote(documentId, content);
    return { note: response.data, articleDocumentId };
  }
);

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    clearNotes: () => {
      return {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotesByArticle.fulfilled, (state, action: PayloadAction<{ articleDocumentId: string; notes: Note[] }>) => {
        state[action.payload.articleDocumentId] = action.payload.notes;
      })
      .addCase(createNote.fulfilled, (state, action: PayloadAction<{ note: Note; articleDocumentId: string }>) => {
        const articleId = action.payload.articleDocumentId;
        if (!state[articleId]) {
          state[articleId] = [];
        }
        state[articleId] = [...state[articleId], action.payload.note];
      })
      .addCase(deleteNote.fulfilled, (state, action: PayloadAction<{ documentId: string; articleDocumentId: string; currentUserDocumentId: string }>) => {
        const articleId = action.payload.articleDocumentId;
        if (state[articleId]) {
          state[articleId] = state[articleId].filter(n => n.documentId !== action.payload.documentId);
        }
      })
      .addCase(updateNote.fulfilled, (state, action: PayloadAction<{ note: Note; articleDocumentId: string }>) => {
        const articleId = action.payload.articleDocumentId;
        if (state[articleId]) {
          const index = state[articleId].findIndex(n => n.documentId === action.payload.note.documentId);
          if (index !== -1) {
            state[articleId][index] = action.payload.note;
          }
        }
      });
  },
});

export const { clearNotes } = notesSlice.actions;

export const selectNotesByArticle = (articleDocumentId: string) => (state: RootState) => 
  state.notes[articleDocumentId] || [];

export default notesSlice.reducer;