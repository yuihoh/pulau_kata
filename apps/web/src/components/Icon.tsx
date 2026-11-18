/**
 * The app's own icon set (Phosphor Icons, MIT; docs/licences/). Emoji look different on
 * Android, iPhone and Windows, so every UI symbol goes through here instead. Each icon is
 * imported on its own, so only the ones listed end up in the bundle.
 */
import type { IconProps, IconWeight } from '@phosphor-icons/react/dist/lib/types';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { BackpackIcon } from '@phosphor-icons/react/dist/csr/Backpack';
import { BoatIcon } from '@phosphor-icons/react/dist/csr/Boat';
import { BookOpenIcon } from '@phosphor-icons/react/dist/csr/BookOpen';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { ConfettiIcon } from '@phosphor-icons/react/dist/csr/Confetti';
import { CubeIcon } from '@phosphor-icons/react/dist/csr/Cube';
import { FireIcon } from '@phosphor-icons/react/dist/csr/Fire';
import { FlaskIcon } from '@phosphor-icons/react/dist/csr/Flask';
import { HandPointingIcon } from '@phosphor-icons/react/dist/csr/HandPointing';
import { HeadphonesIcon } from '@phosphor-icons/react/dist/csr/Headphones';
import { ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { LightbulbIcon } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { LockSimpleIcon } from '@phosphor-icons/react/dist/csr/LockSimple';
import { MapTrifoldIcon } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { PauseIcon } from '@phosphor-icons/react/dist/csr/Pause';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play';
import { PuzzlePieceIcon } from '@phosphor-icons/react/dist/csr/PuzzlePiece';
import { SmileyIcon } from '@phosphor-icons/react/dist/csr/Smiley';
import { SparkleIcon } from '@phosphor-icons/react/dist/csr/Sparkle';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/csr/SpeakerHigh';
import { SpeakerSlashIcon } from '@phosphor-icons/react/dist/csr/SpeakerSlash';
import { StarIcon } from '@phosphor-icons/react/dist/csr/Star';
import { TranslateIcon } from '@phosphor-icons/react/dist/csr/Translate';
import { TrophyIcon } from '@phosphor-icons/react/dist/csr/Trophy';

const ICONS = {
  back: ArrowLeftIcon,
  bag: BackpackIcon,
  blocks: CubeIcon,
  boat: BoatIcon,
  book: BookOpenIcon,
  check: CheckIcon,
  done: CheckCircleIcon,
  fire: FireIcon,
  hint: LightbulbIcon,
  lab: FlaskIcon,
  left: CaretLeftIcon,
  listen: HeadphonesIcon,
  lock: LockSimpleIcon,
  map: MapTrifoldIcon,
  party: ConfettiIcon,
  pause: PauseIcon,
  pencil: PencilSimpleIcon,
  picture: ImageIcon,
  play: PlayIcon,
  puzzle: PuzzlePieceIcon,
  right: CaretRightIcon,
  smile: SmileyIcon,
  sound: SpeakerHighIcon,
  soundOff: SpeakerSlashIcon,
  sparkle: SparkleIcon,
  star: StarIcon,
  tap: HandPointingIcon,
  translate: TranslateIcon,
  trophy: TrophyIcon,
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/**
 * A UI icon. Decorative by default (hidden from screen readers, so the button or text next
 * to it carries the meaning); pass `label` when the icon is the only content.
 */
export function Icon({
  name,
  size = '1.25em',
  weight = 'duotone',
  label,
  className = '',
  ...rest
}: {
  name: IconName;
  size?: string | number;
  weight?: IconWeight;
  label?: string;
  className?: string;
} & Omit<IconProps, 'weight' | 'size'>) {
  const C = ICONS[name];
  return (
    <C
      size={size}
      weight={weight}
      className={`inline-block shrink-0 ${className}`}
      data-icon={name}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    />
  );
}
