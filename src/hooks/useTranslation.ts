import { useMemo } from 'react';
import { useTexts, SiteText } from './useTexts';

interface TranslationOptions {
  defaultValue?: string;
  [key: string]: any;
}

/**
 * Hook для получения переводов (совместим с i18next интерфейсом)
 * Сейчас берет данные из БД, в будущем легко заменить на react-i18next
 * 
 * @param namespace - опциональный namespace (например, 'nav', 'hero')
 * @returns { t: function, ready: boolean } - функция t() для получения текстов и флаг готовности
 * 
 * @example
 * const { t } = useTranslation('nav');
 * <span>{t('home')}</span> // Вернет значение для 'nav.home'
 * 
 * @example
 * const { t } = useTranslation();
 * <span>{t('nav.home')}</span> // Вернет значение для 'nav.home'
 */
export function useTranslation(namespace?: string) {
  const { data: texts = [], isLoading } = useTexts();

  // Создаем словарь ключ -> значение
  const translations = useMemo(() => {
    const dict: Record<string, string> = {};
    texts.forEach((text: SiteText) => {
      dict[text.key] = text.value;
    });
    return dict;
  }, [texts]);

  // Функция t() как в i18next
  const t = useMemo(() => {
    return (key: string, options?: TranslationOptions) => {
      // Поддержка namespace:key или key с префиксом namespace
      let fullKey = key;
      if (namespace) {
        // Если ключ уже начинается с namespace, используем как есть
        if (key.startsWith(namespace + '.')) {
          fullKey = key;
        } else {
          // Добавляем namespace к ключу (даже если в ключе есть точки)
          fullKey = `${namespace}.${key}`;
        }
      }

      const value = translations[fullKey] || options?.defaultValue || key;
      
      // Простая интерполяция {{variable}}
      if (options) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          return options[varName]?.toString() || match;
        });
      }
      
      return value;
    };
  }, [translations, namespace]);

  return { t, ready: !isLoading && texts.length > 0, i18n: { language: 'uk' } };
}

