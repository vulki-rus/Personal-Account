import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../store/authSlice';
import type { AppDispatch, RootState } from '../store';
import { validateLoginForm, type FormErrors } from '../utils/validators';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const validationErrors = validateLoginForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      if (result) {
        navigate('/profile');
      }
    } catch (err: any) {
      if (err.message?.includes('400') || err.status === 400) {
        setServerError('Неверный email или пароль');
      } else {
        setServerError('Ошибка при входе. Попробуйте позже.');
      }
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2>Вход</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          {serverError && <div className="error-text" style={{ color: 'red', textAlign: 'center' }}>{serverError}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </form>
        <div className="auth-footer">
          <span>Нет аккаунта?</span>
          <Link to="/register">Регистрация</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;