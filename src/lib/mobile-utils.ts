/**
 * Утилиты для улучшения работы на мобильных устройствах
 */

/**
 * Определяет, является ли устройство мобильным
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Определяет, является ли устройство iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Определяет, является ли устройство Android
 */
export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

/**
 * Получает высоту viewport с учетом адресной строки браузера
 */
export const getViewportHeight = (): number => {
  return window.innerHeight;
};

/**
 * Устанавливает CSS переменную для реальной высоты viewport
 * Полезно для iOS Safari, где адресная строка влияет на viewport
 */
export const setViewportHeight = (): void => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

/**
 * Предотвращает scroll при открытии клавиатуры на iOS
 */
export const preventKeyboardScroll = (): void => {
  if (isIOS()) {
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
  }
};

/**
 * Инициализирует все мобильные оптимизации
 */
export const initMobileOptimizations = (): void => {
  // Устанавливаем начальную высоту viewport
  setViewportHeight();

  // Обновляем высоту при изменении размера окна
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);

  // Предотвращаем проблемы с клавиатурой
  preventKeyboardScroll();

  // Добавляем класс для определения типа устройства
  if (isMobileDevice()) {
    document.documentElement.classList.add('is-mobile');
  }
  if (isIOS()) {
    document.documentElement.classList.add('is-ios');
  }
  if (isAndroid()) {
    document.documentElement.classList.add('is-android');
  }
};

/**
 * Вибрация при успешном действии (если поддерживается)
 */
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light'): void => {
  if ('vibrate' in navigator) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 50;
    navigator.vibrate(duration);
  }
};

/**
 * Проверяет, установлено ли приложение как PWA
 */
export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};
