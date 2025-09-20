import * as React from "react";

interface InsightsRequestCardProps {
  type: "comprehensive" | "health" | "growth" | "behavior";
  title: string;
  description: string;
  icon: string;
  colorScheme: "blue" | "green" | "purple" | "yellow";
  onClick: () => void;
}

const colorConfig = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    hover: "hover:bg-blue-500/20",
    titleColor: "text-blue-200",
    descColor: "text-blue-300",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    hover: "hover:bg-green-500/20",
    titleColor: "text-green-200",
    descColor: "text-green-300",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    hover: "hover:bg-purple-500/20",
    titleColor: "text-purple-200",
    descColor: "text-purple-300",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    hover: "hover:bg-yellow-500/20",
    titleColor: "text-yellow-200",
    descColor: "text-yellow-300",
  },
};

export const InsightsRequestCard: React.FC<InsightsRequestCardProps> = ({
  type,
  title,
  description,
  icon,
  colorScheme,
  onClick,
}) => {
  const colors = colorConfig[colorScheme];

  return (
    <button
      onClick={onClick}
      className={`p-3 ${colors.bg} border ${colors.border} rounded-lg text-left ${colors.hover} transition-colors cursor-pointer`}
      data-type={type}
    >
      <div className={`font-medium ${colors.titleColor} text-sm`}>
        {icon} {title}
      </div>
      <div className={`text-xs ${colors.descColor} mt-1`}>{description}</div>
    </button>
  );
};
