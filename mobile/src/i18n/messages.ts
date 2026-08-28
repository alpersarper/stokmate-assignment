import type { Locale } from '@stokmate/shared';

/**
 * Typed mobile message catalog (UX-009 infrastructure). `en` defines the key
 * set; `tr` is forced to cover exactly the same keys. Feature copy lands with
 * the Mobile Agent — foundation only ships the chrome it renders.
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
  openProductList: 'Open product list',
  openProductDetail: 'Open product detail #1',
  backToLogin: 'Back to login',
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
  openProductList: 'Ürün listesini aç',
  openProductDetail: 'Ürün detayını aç #1',
  backToLogin: 'Girişe dön',
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, tr };
