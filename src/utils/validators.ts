export type FormErrors = Record<string, string>;

export const validateRequired = (value: string, fieldName: string): string => {
  if (!value.trim()) {
    return `${fieldName} обязателен для заполнения`;
  }
  return '';
};

export const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return 'Email обязателен для заполнения';
  }
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  if (!emailRegex.test(email)) {
    return 'Введите корректный email адрес';
  }
  return '';
};

export const validateMinLength = (value: string, min: number, fieldName: string): string => {
  if (value.length < min) {
    return `${fieldName} должен содержать минимум ${min} символов`;
  }
  return '';
};

export const validateMaxLength = (value: string, max: number, fieldName: string): string => {
  if (value.length > max) {
    return `${fieldName} не должен превышать ${max} символов`;
  }
  return '';
};

export const validateTitle = (title: string): string => {
  const requiredError = validateRequired(title, 'Заголовок');
  if (requiredError) return requiredError;
  const minError = validateMinLength(title, 3, 'Заголовок');
  if (minError) return minError;
  return validateMaxLength(title, 100, 'Заголовок');
};

export const validateContent = (content: string): string => {
  const requiredError = validateRequired(content, 'Содержание');
  if (requiredError) return requiredError;
  return validateMinLength(content, 10, 'Содержание');
};

export const validateNote = (content: string): string => {
  const requiredError = validateRequired(content, 'Комментарий');
  if (requiredError) return requiredError;
  return validateMaxLength(content, 500, 'Комментарий');
};

export const validateLoginForm = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validateMinLength(password, 3, 'Пароль');
  if (passwordError) errors.password = passwordError;
  return errors;
};

export const validateRegisterForm = (
  username: string,
  email: string,
  password: string
): FormErrors => {
  const errors: FormErrors = {};
  const usernameError = validateMinLength(username, 3, 'Имя пользователя');
  if (usernameError) errors.username = usernameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validateMinLength(password, 3, 'Пароль');
  if (passwordError) errors.password = passwordError;
  return errors;
};

export const validateEditProfileForm = (username: string, email: string): FormErrors => {
  const errors: FormErrors = {};
  const usernameError = validateMinLength(username, 3, 'Имя пользователя');
  if (usernameError) errors.username = usernameError;
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  return errors;
};

export const validateArticleForm = (title: string, content: string): FormErrors => {
  const errors: FormErrors = {};
  const titleError = validateTitle(title);
  if (titleError) errors.title = titleError;
  const contentError = validateContent(content);
  if (contentError) errors.content = contentError;
  return errors;
};