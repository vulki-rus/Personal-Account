import React from 'react';
import { useDispatch } from 'react-redux';
import { clearError } from '../../store/authSlice';
import type { StatusWrapperProps } from '../../utils/interfaces';

const StatusWrapper: React.FC<StatusWrapperProps> = ({
  loading,
  error,
  isEmpty,
  children,
  loadingComponent = <div className="auth-screen auth-card"><h2 className="auth-title">Загрузка...</h2></div>
}) => {
  const dispatch = useDispatch();

  if (loading) return <>{loadingComponent}</>;
  if (error) return <div className="auth-screen auth-card">
    <h2 className="auth-title">Ошибка: {error}</h2>
    <button
      className="btn btn-primary"
      onClick={() => dispatch(clearError())}
    >Назад</button>
  </div>;
  if (isEmpty) return <div className="empty-state">Данных пока нет</div>;
  return <>{children}</>;
};

export default StatusWrapper;