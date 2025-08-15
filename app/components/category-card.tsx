import { IconCard } from "~/components/ui/interactive-card";
import { cn } from "~/lib/utils";

interface CategoryCardProps {
  category: string;
  recordCount: number;
  onSelect?: () => void;
}

interface CategoryConfig {
  icon: string;
  gradient: string;
  description: string;
}

const getCategoryConfig = (category: string): CategoryConfig => {
  const configs: Record<string, CategoryConfig> = {
    Health: {
      icon: "🏥",
      gradient: "from-emerald-500/20 to-blue-500/20",
      description:
        "Medical records, appointments, medications, and health tracking",
    },
    Activities: {
      icon: "🎯",
      gradient: "from-orange-500/20 to-red-500/20",
      description: "Sports, hobbies, events, and recreational activities",
    },
    Personal: {
      icon: "👤",
      gradient: "from-purple-500/20 to-pink-500/20",
      description: "Personal development, goals, achievements, and self-care",
    },
    Education: {
      icon: "📚",
      gradient: "from-blue-500/20 to-indigo-500/20",
      description:
        "School progress, learning milestones, and educational achievements",
    },
    Finance: {
      icon: "💰",
      gradient: "from-green-500/20 to-emerald-500/20",
      description: "Budget tracking, expenses, savings, and financial goals",
    },
    Travel: {
      icon: "✈️",
      gradient: "from-cyan-500/20 to-blue-500/20",
      description:
        "Vacations, trips, travel memories, and destination experiences",
    },
    Food: {
      icon: "🍽️",
      gradient: "from-amber-500/20 to-orange-500/20",
      description:
        "Meal planning, recipes, dining experiences, and nutrition tracking",
    },
    Home: {
      icon: "🏠",
      gradient: "from-stone-500/20 to-slate-500/20",
      description:
        "Home maintenance, projects, improvements, and household tasks",
    },
    Work: {
      icon: "💼",
      gradient: "from-slate-500/20 to-gray-500/20",
      description:
        "Career milestones, work achievements, and professional development",
    },
    Social: {
      icon: "👥",
      gradient: "from-pink-500/20 to-rose-500/20",
      description:
        "Social events, friendships, relationships, and community activities",
    },
    Technology: {
      icon: "💻",
      gradient: "from-violet-500/20 to-purple-500/20",
      description: "Tech projects, digital skills, and technology learning",
    },
    Creative: {
      icon: "🎨",
      gradient: "from-fuchsia-500/20 to-pink-500/20",
      description:
        "Art projects, creative endeavors, and artistic achievements",
    },
    Fitness: {
      icon: "💪",
      gradient: "from-red-500/20 to-pink-500/20",
      description:
        "Exercise routines, fitness goals, and physical achievements",
    },
    Spiritual: {
      icon: "🙏",
      gradient: "from-yellow-500/20 to-amber-500/20",
      description: "Spiritual practices, meditation, and personal growth",
    },
  };

  return (
    configs[category] || {
      icon: "📁",
      gradient: "from-slate-600/20 to-slate-700/20",
      description: "General records and miscellaneous information",
    }
  );
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  recordCount,
  onSelect,
}) => {
  const config = getCategoryConfig(category);

  const icon = (
    <div className="text-2xl sm:text-3xl bg-slate-800/50 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
      {config.icon}
    </div>
  );

  const recordDescription = `${recordCount} record type${recordCount !== 1 ? "s" : ""}`;

  return (
    <IconCard
      className={cn(`bg-gradient-to-br ${config.gradient}`)}
      icon={icon}
      title={category}
      description={`${recordDescription} • ${config.description}`}
      onClick={onSelect}
    />
  );
};
