import React from 'react';
import type { StoryMode } from '../../types/storyMode';
import { getStoryModeProfile } from '../../services/storyModeEngine';
import { Sparkles, Film, Compass, BookOpen, ShieldAlert } from 'lucide-react';

interface StoryModeBadgeProps {
  mode?: StoryMode;
  confidence?: number;
  size?: 'sm' | 'md';
  showCategory?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StoryModeBadge: React.FC<StoryModeBadgeProps> = ({
  mode = 'Documentary',
  confidence,
  size = 'md',
  showCategory = false,
  className = '',
  onClick,
}) => {
  const profile = getStoryModeProfile(mode);

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'Narrative':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
          dot: 'bg-purple-400',
          icon: Film,
        };
      case 'Informative':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
          dot: 'bg-cyan-400',
          icon: BookOpen,
        };
      case 'Genre':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          dot: 'bg-amber-400',
          icon: ShieldAlert,
        };
      case 'Lifestyle':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          dot: 'bg-emerald-400',
          icon: Compass,
        };
    }
  };

  const theme = getCategoryTheme(profile.category);
  const Icon = theme.icon;

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 gap-1'
      : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center rounded-full border transition-all ${theme.bg} ${sizeClasses} ${
        onClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
      } ${className}`}
      title={`${profile.label} Mode (${profile.category}): ${profile.description}`}
    >
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      <span>{profile.label}</span>

      {showCategory && (
        <span className="text-[10px] opacity-70 font-mono">
          • {profile.category}
        </span>
      )}

      {typeof confidence === 'number' && (
        <span className="ml-0.5 text-[9px] font-mono px-1 py-0.2 bg-black/40 rounded text-slate-300 border border-white/5">
          {confidence}%
        </span>
      )}
    </button>
  );
};
