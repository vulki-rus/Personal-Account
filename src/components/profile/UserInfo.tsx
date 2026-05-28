import React, { memo, useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { UserInfoProps } from '../../utils/interfaces';
import { changeAvatar, selectUser, getMe } from '../../store/authSlice';
import type { AppDispatch } from '../../store';

const UserInfo: React.FC<UserInfoProps> = memo(({ user, onLogout, onEditClick }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector(selectUser);

  useEffect(() => {
    // Обновляем данные пользователя при монтировании
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    if (currentUser?.avatar?.url) {
      setAvatarUrl(`http://localhost:1337${currentUser.avatar.url}`);
    } else {
      setAvatarUrl(null);
    }
  }, [currentUser]);

  if (!user || !user.username) {
    return (
      <aside className="profile-card">
        <p>Загрузка профиля...</p>
      </aside>
    );
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await dispatch(changeAvatar(file)).unwrap();
      await dispatch(getMe());
      alert('Аватар успешно обновлен!');
    } catch (err) {
      console.error('Ошибка при загрузке аватара:', err);
      alert('Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <aside className="profile-card">
      <div 
        className="profile-avatar-wrapper"
        onClick={handleAvatarClick}
        style={{ cursor: 'pointer', width: '100px', height: '100px', margin: '0 auto' }}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={`Аватар пользователя ${user.username}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '40px'
            }}
          >
            {user.username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        {isUploading && <div className="avatar-overlay">Загрузка...</div>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      <h2 className="auth-title">{user.username}</h2>
      <p className="auth-title">{user.email}</p>
      <nav className="profile-actions" aria-label="Управление профилем">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onEditClick}
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="btn btn-primary"
        >
          Выйти
        </button>
      </nav>
    </aside>
  );
});

UserInfo.displayName = 'UserInfo';

export default UserInfo;