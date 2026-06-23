import { Link } from '@/i18n/navigation';
import type { Language } from '../types/ui-state';
import { BannerMenu } from './BannerMenu';

interface DialogueHeroProps {
  image?: string;
  title: string;
  pinyin: string;
  level: number;
  listPath: string;
  language: Language;
}

/**
 * Image-as-hero for the public dialogue page. Renders the dialogue photo when
 * `image` is set, otherwise a branded Blim-red placeholder. The title/pinyin
 * overlay the bottom. Purely presentational — safe to server-render.
 */
export function DialogueHero({ image, title, pinyin, level, listPath, language }: DialogueHeroProps) {
  const backLabel = ({ uz: 'Orqaga', ru: 'Назад', en: 'Back' } as Record<string, string>)[language];
  const levelLabel = ({ uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' } as Record<string, string>)[language];
  return (
    <div className={`dlg-hero ${image ? '' : 'dlg-hero--placeholder'}`}>
      {image && <img className="dlg-hero__img" src={image} alt={`${title} — ${pinyin}`} />}
      <div className="dlg-hero__scrim" />
      <div className="dlg-hero__top">
        <Link href={listPath} className="dlg-hero__back" aria-label={backLabel}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <BannerMenu />
      </div>
      <div className="dlg-hero__body">
        <div className="dlg-hero__level">HSK {level} · {levelLabel}</div>
        <h1 className="dlg-hero__title" lang="zh-Hans">{title}</h1>
        <div className="dlg-hero__pinyin">{pinyin}</div>
      </div>
    </div>
  );
}
