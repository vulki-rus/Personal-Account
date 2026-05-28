import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../utils/api';
import type { AuthState, RegisterResponse, User, UpdateUserPayload, UserFile } from '../utils/interfaces';

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('jwt'),
  loading: false,
  error: null,
};

export const register = createAsyncThunk(
  'auth/register',
  async (formData: { username: string; email: string; password: string }) => {
    const response = await api.register(formData);
    localStorage.setItem('jwt', response.jwt);
    return response;
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (formData: { email: string; password: string }) => {
    const response = await api.login(formData);
    localStorage.setItem('jwt', response.jwt);
    return response;
  }
);

export const getMe = createAsyncThunk(
  'auth/getMe',
  async () => {
    const response = await api.getMe();
    return response;
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      throw new Error('No token');
    }
    const user = await api.getMe();
    return user;
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({ userId, updateData }: { userId: number; updateData: UpdateUserPayload }) => {
    const response = await api.updateUser(userId, updateData);
    return response;
  }
);

export const changeAvatar = createAsyncThunk(
  'auth/changeAvatar',
  async (file: File) => {
    const uploadedFiles = await api.uploadFile(file);
    const avatar = uploadedFiles[0];
    const token = localStorage.getItem('jwt');
    const base64Url = token!.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const { id: userId } = JSON.parse(jsonPayload);
    
    await api.updateUser(userId, { avatar: avatar.id });
    return avatar;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('jwt');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<RegisterResponse>) => {
        state.loading = false;
        state.token = action.payload.jwt;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Registration failed';
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<RegisterResponse>) => {
        state.loading = false;
        state.token = action.payload.jwt;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(getMe.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(getMe.rejected, (state) => {
        state.loading = false;
      })
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(changeAvatar.fulfilled, (state, action: PayloadAction<UserFile>) => {
        if (state.user) {
          state.user.avatar = action.payload;
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuth = (state: { auth: AuthState }) => !!state.auth.token;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;