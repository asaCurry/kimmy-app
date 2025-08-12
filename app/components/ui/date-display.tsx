import * as React from "react";

interface DateDisplayProps {
  date: string | Date | null | undefined;
  format?: "short" | "medium" | "long" | "relative" | "time" | "date";
  showTime?: boolean;
  className?: string;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = "medium",
  showTime = false,
  className = "",
}) => {
  if (!date) {
    return <span className={`text-slate-500 ${className}`}>No date</span>;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return <span className={`text-slate-500 ${className}`}>Invalid date</span>;
  }

  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  const formatDate = () => {
    switch (format) {
      case "short":
        return dateObj.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });
      case "medium":
        return dateObj.toLocaleDateString([], {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      case "long":
        return dateObj.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      case "relative":
        if (diffInHours < 1) {
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          if (diffInMinutes < 1) return "Just now";
          return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
          const hours = Math.floor(diffInHours);
          return `${hours}h ago`;
        } else if (diffInDays < 7) {
          const days = Math.floor(diffInDays);
          return `${days}d ago`;
        } else if (diffInDays < 30) {
          const weeks = Math.floor(diffInDays / 7);
          return `${weeks}w ago`;
        } else if (diffInDays < 365) {
          const months = Math.floor(diffInDays / 30);
          return `${months}mo ago`;
        } else {
          const years = Math.floor(diffInDays / 365);
          return `${years}y ago`;
        }
      case "time":
        return dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "date":
        return dateObj.toLocaleDateString();
      default:
        return dateObj.toLocaleDateString();
    }
  };

  const formatTime = () => {
    if (!showTime) return null;

    return (
      <span className="text-slate-500 ml-2">
        {dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  };

  return (
    <span className={className}>
      {formatDate()}
      {formatTime()}
    </span>
  );
};

// Specialized components for common use cases
export const RelativeDate: React.FC<
  Omit<DateDisplayProps, "format">
> = props => <DateDisplay {...props} format="relative" />;

export const ShortDate: React.FC<Omit<DateDisplayProps, "format">> = props => (
  <DateDisplay {...props} format="short" />
);

export const MediumDate: React.FC<Omit<DateDisplayProps, "format">> = props => (
  <DateDisplay {...props} format="medium" />
);

export const LongDate: React.FC<Omit<DateDisplayProps, "format">> = props => (
  <DateDisplay {...props} format="long" />
);

export const TimeOnly: React.FC<Omit<DateDisplayProps, "format">> = props => (
  <DateDisplay {...props} format="time" />
);
