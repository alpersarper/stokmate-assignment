import type { Locale } from '@stokmate/shared';

/**
 * Typed web message catalog (UX-009 infrastructure). `en` defines the key set;
 * `tr` is forced to cover exactly the same keys. Feature copy lands with the
 * Web Agent — foundation only ships the chrome it renders.
 */
const en = {
  appTitle: 'StokMate',
  language: 'Language',
  languageEnglish: 'English',
  languageTurkish: 'Türkçe',
  loginTitle: 'Sign in',
  productsTitle: 'Products',
  productDetailTitle: 'Product detail',
  placeholderNotice: 'Placeholder screen — feature implementation follows.',
  backToList: 'Back to products',
  goToLogin: 'Go to login',
  goToProducts: 'Go to products',
} as const;

export type MessageKey = keyof typeof en;

const tr: Record<MessageKey, string> = {
  appTitle: 'StokMate',
  language: 'Dil',
  languageEnglish: 'English',
  languageTurkish: 'Türkçe',
  loginTitle: 'Giriş yap',
  productsTitle: 'Ürünler',
  productDetailTitle: 'Ürün detayı',
  placeholderNotice: 'Yer tutucu ekran — özellik geliştirmesi devam edecek.',
  backToList: 'Ürünlere dön',
  goToLogin: 'Girişe git',
  goToProducts: 'Ürünlere git',
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, tr };
