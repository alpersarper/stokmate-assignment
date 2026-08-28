import { Navigate, Route, Routes } from 'react-router';
import { LoginPage } from '@/auth/LoginPage';
import { useI18n } from '@/i18n';
import { ProductDetailPage } from '@/products/ProductDetailPage';
import { ProductListPage } from '@/products/ProductListPage';

function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-600">
      {t('language')}
      <select
        className="rounded border border-neutral-300 px-2 py-1"
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'en' | 'tr')}
      >
        <option value="en">{t('languageEnglish')}</option>
        <option value="tr">{t('languageTurkish')}</option>
      </select>
    </label>
  );
}

export default function App() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
        <span className="font-semibold">{t('appTitle')}</span>
        <LanguageSwitch />
      </header>
      <main className="px-6">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
