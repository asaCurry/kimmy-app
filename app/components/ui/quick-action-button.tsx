import React from 'react';
import { useNavigate } from 'react-router';

interface QuickActionButtonProps {
  to: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  to,
  icon,
  title,
  description,
  color
}) => {
  const navigate = useNavigate();

  // Create a mapping of color variants to ensure Tailwind includes them
  const colorVariants = {
    blue: {
      from: 'from-blue-1200',
      to: 'to-blue-700',
      hoverFrom: 'hover:from-blue-700',
      hoverTo: 'hover:to-blue-800',
      border: 'border-blue-500/20',
      shadow: 'hover:shadow-blue-500/25',
      text: 'text-blue-200'
    },
    emerald: {
      from: 'from-emerald-1200',
      to: 'to-emerald-700',
      hoverFrom: 'hover:from-emerald-700',
      hoverTo: 'hover:to-emerald-800',
      border: 'border-emerald-500/20',
      shadow: 'hover:shadow-emerald-500/25',
      text: 'text-emerald-200'
    },
    purple: {
      from: 'from-purple-1200',
      to: 'to-purple-700',
      hoverFrom: 'hover:from-purple-700',
      hoverTo: 'hover:to-purple-800',
      border: 'border-purple-500/20',
      shadow: 'hover:shadow-purple-500/25',
      text: 'text-purple-200'
    },
    orange: {
      from: 'from-orange-1200',
      to: 'to-orange-700',
      hoverFrom: 'hover:from-orange-700',
      hoverTo: 'hover:to-orange-800',
      border: 'border-orange-500/20',
      shadow: 'hover:shadow-orange-500/25',
      text: 'text-orange-200'
    },
    pink: {
      from: 'from-pink-1200',
      to: 'to-pink-700',
      hoverFrom: 'hover:from-pink-700',
      hoverTo: 'hover:to-pink-800',
      border: 'border-pink-500/20',
      shadow: 'hover:shadow-pink-500/25',
      text: 'text-pink-200'
    }
  };

  const colors = colorVariants[color as keyof typeof colorVariants] || colorVariants.blue;

  return (
    <button
      onClick={() => navigate(to)}
      className={`p-6 bg-gradient-to-br ${colors.from} ${colors.to} ${colors.hoverFrom} ${colors.hoverTo} rounded-lg border ${colors.border} transition-all hover:shadow-lg ${colors.shadow} text-left`}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className={`text-sm ${colors.text}`}>{description}</p>
    </button>
  );
};
