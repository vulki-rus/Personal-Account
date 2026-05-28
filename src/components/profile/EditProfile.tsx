import React, { useState, memo } from 'react';
import type { User } from '../../utils/interfaces';
import { validateEditProfileForm, type FormErrors } from '../../utils/validators';

interface EditProfileProps {
  user: User;
  onUpdate: (userData: { username: string; email: string }) => Promise<void>;
  onClose: () => void;
}

const EditProfile: React.FC<EditProfileProps> = memo(({ user, onUpdate, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateEditProfileForm(username, email);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await onUpdate({ username, email });
      onClose();
    } catch (err) {
      setErrors({ form: 'Ошибка при обновлении профиля' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Редактировать профиль</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-username">Имя пользователя</label>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          {errors.form && <div className="error-text">{errors.form}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

EditProfile.displayName = 'EditProfile';

export default EditProfile;