'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Remove current locale from pathname and add new one
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <button
      onClick={() => switchLocale(locale === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
      title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">{locale.toUpperCase()}</span>
    </button>
  );
}