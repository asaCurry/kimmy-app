import * as React from "react";
import { IconCard } from "~/components/ui/interactive-card";
import { cn } from "~/lib/utils";

interface CategoryCardProps {
  category: string;
  recordCount: number;
  onSelect?: () => void;
}

const getIcon = (category: string): string => {
  switch (category) {
    case "Health":
      return "🏥";
    case "Activities":
      return "🎯";
    case "Personal":
      return "👤";
    default:
      return "📁";
  }
};

const getGradient = (category: string): string => {
  switch (category) {
    case "Health":
      return "from-emerald-500/20 to-blue-500/20";
    case "Activities":
      return "from-orange-500/20 to-red-500/20";
    case "Personal":
      return "from-purple-500/20 to-pink-500/20";
    default:
      return "from-slate-600/20 to-slate-700/20";
  }
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  recordCount,
  onSelect,
}) => {
  const icon = (
    <div className="text-2xl sm:text-3xl bg-slate-800/50 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
      {getIcon(category)}
    </div>
  );

  const description = `${recordCount} record type${recordCount !== 1 ? "s" : ""}`;

  return (
    <IconCard
      className={cn(`bg-gradient-to-br ${getGradient(category)}`)}
      icon={icon}
      title={category}
      description={description}
      onClick={onSelect}
    />
  );
};
