import { m } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import { WoodSign } from './HomeParts';
import { useTranslation } from 'react-i18next';
import { setSoundEnabled, useSoundEnabled } from '../audio/settings';
import { playSpeech, stopSpeech } from '../audio/speech';
import { setLang, type UiLang } from '../i18n';

/** The child's support language for meanings and translations. */
export function useUiLang(): UiLang {
  const { i18n } = useTranslation();
  return i18n.language === 'zh' ? 'zh' : 'en';
}

export function Stars({
  count,
  max = 3,
  size = 'md',
  animate = false,
}: {
  count: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Pop the earned stars in one by one (stage results). */
  animate?: boolean;
}) {
  const px = size === 'lg' ? 56 : size === 'sm' ? 16 : 24;
  return (
    <span
      className="inline-flex items-center gap-0.5 whitespace-nowrap"
      role="img"
      aria-label={`${count}/${max} ★`}
      data-stars={count}
    >
      {Array.from({ length: max }, (_, i) => {
        const earned = i < count;
        const star = (
          <Icon
            name="star"
            weight="fill"
            size={px}
            className={earned ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'}
          />
        );
        return animate && earned ? (
          <m.span
            key={i}
            className="inline-flex"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: [0, 1.3, 1], rotate: 0 }}
            transition={{ delay: 0.3 + i * 0.3, duration: 0.4 }}
          >
            {star}
          </m.span>
        ) : (
          <span key={i} className="inline-flex">
            {star}
          </span>
        );
      })}
    </span>
  );
}

/** Word picture, or a friendly placeholder until the image exists. */
export function WordImage({
  src,
  alt,
  className = '',
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src)
    return (
      <div
        className={`flex aspect-square items-center justify-center rounded-2xl bg-amber-100 text-amber-400 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon name="picture" size="40%" />
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`aspect-square rounded-2xl bg-white object-contain ${className}`}
    />
  );
}

/**
 * Plays a word/sentence MP3 (music fades down meanwhile). Hidden while audio has not been
 * generated yet. Each tap plays the button's *current* src from the start.
 */
export function AudioButton({
  src,
  label,
  size = 'md',
}: {
  src?: string;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const playing = useRef<HTMLAudioElement | null>(null);
  useEffect(
    () => () => {
      if (playing.current) stopSpeech();
    },
    [],
  );
  if (!src) return null;
  const cls =
    size === 'sm'
      ? 'bg-sky-500 px-2 py-1'
      : size === 'lg'
        ? 'h-16 w-16 border-b-4 border-sky-700 bg-gradient-to-b from-sky-400 to-blue-600 ring-4 ring-white'
        : 'bg-sky-500 px-4 py-2';
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-sm active:scale-95 ${cls}`}
      onClick={() => {
        playing.current = playSpeech(src);
      }}
    >
      <Icon name="sound" weight="fill" size={size === 'sm' ? 20 : size === 'lg' ? 34 : 26} />
    </button>
  );
}

/** The 🔊 / 🔇 switch for background music and sound effects (remembered). */
export function SoundToggle() {
  const { t } = useTranslation();
  const on = useSoundEnabled();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? t('common.soundOn') : t('common.soundOff')}
      title={on ? t('common.soundOn') : t('common.soundOff')}
      onClick={() => setSoundEnabled(!on)}
      className={`inline-flex items-center justify-center rounded-full border-2 bg-white px-2 ${on ? 'border-amber-300 text-amber-600' : 'border-slate-200 text-slate-400'}`}
      data-testid="sound-toggle"
    >
      <Icon name={on ? 'sound' : 'soundOff'} size={22} />
    </button>
  );
}

/**
 * The top bar. `sign` shows the title on a small hanging wooden sign (the Sampan Kata game,
 * from Yang's mockup) and lets the scene behind show through.
 */
export function Header({
  title,
  backHref,
  sign = false,
}: {
  title: string;
  backHref?: string;
  sign?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const next: UiLang = i18n.language === 'zh' ? 'en' : 'zh';
  return (
    <header
      className={`sticky top-0 z-10 flex gap-2 py-2 ${sign ? 'items-start bg-transparent px-3' : 'items-center bg-amber-50/95 px-4 backdrop-blur'}`}
    >
      {backHref ? (
        <a
          href={backHref}
          aria-label={t('common.back')}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm active:scale-95"
        >
          <Icon name="back" weight="bold" size={22} />
        </a>
      ) : (
        <span className="min-w-11" />
      )}
      {sign ? (
        <div className="flex min-w-0 flex-1 justify-center">
          <WoodSign title={title} level={1} compact />
        </div>
      ) : (
        <h1 className="flex-1 truncate text-center text-xl font-bold text-amber-700">{title}</h1>
      )}
      <SoundToggle />
      <button
        type="button"
        aria-label={`${t('common.language')}: ${t('common.switchTo')}`}
        className="rounded-full border-2 border-amber-300 bg-white px-3 text-sm font-semibold text-amber-700"
        onClick={() => setLang(next)}
      >
        {t('common.switchTo')}
      </button>
    </header>
  );
}

/**
 * A question's instruction. Mount it once per new question (key the view by question +
 * attempt): it takes focus, so keyboard focus is never lost and screen readers announce it.
 */
export function Ask({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h2 ref={ref} tabIndex={-1} className="mb-2 text-center text-slate-600 outline-none">
      {children}
    </h2>
  );
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  return (
    <div
      className="mb-4 h-3 w-full overflow-hidden rounded-full bg-amber-100"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <div
        className="h-full rounded-full bg-amber-500 transition-all"
        style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
      />
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-3xl px-4 pt-2 pb-10">{children}</main>;
}

export function PrimaryButton(props: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const cls =
    // A chunky "game button": darker bottom edge that squashes when pressed.
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-b-4 border-amber-700 bg-amber-500 px-6 py-3 text-lg font-bold text-white shadow active:translate-y-0.5 active:border-b-2 disabled:border-slate-400 disabled:bg-slate-300 disabled:shadow-none disabled:active:translate-y-0';
  if (props.href)
    return (
      <a href={props.href} className={cls}>
        {props.children}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={props.onClick} disabled={props.disabled}>
      {props.children}
    </button>
  );
}

/**
 * Accessible modal built on the native <dialog>: showModal() makes the page behind it inert
 * (focus cannot escape), Escape closes it, a tap on the backdrop closes it, and focus returns
 * to the element that opened it.
 */
export function Dialog({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', ''); // jsdom / very old browsers
    const onCancel = (e: Event) => {
      e.preventDefault(); // let React unmount it instead of the browser closing it
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      opener?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className="m-auto mb-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-0 backdrop:bg-black/40 sm:mb-auto sm:rounded-3xl"
      onClick={(e) => {
        // The content wrapper fills the dialog, so a click whose target is the <dialog>
        // itself landed on the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="p-5">
        {children}
        <div className="mt-4 text-center">
          <PrimaryButton onClick={onClose}>{t('common.close')}</PrimaryButton>
        </div>
      </div>
    </dialog>
  );
}
