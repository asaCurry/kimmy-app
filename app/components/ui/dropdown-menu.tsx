import * as React from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  trigger,
  align = "right",
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-56 rounded-md border border-slate-700 bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
            align === "left" ? "left-0" : "right-0",
            className
          )}
        >
          <div className="py-1">{children}</div>
        </div>
      )}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onClick,
  to,
  className,
  icon,
}) => {
  const baseClasses =
    "flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors";

  if (to) {
    return (
      <Link to={to} className={cn(baseClasses, className)} onClick={onClick}>
        {icon && <span className="mr-3 h-4 w-4">{icon}</span>}
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(baseClasses, className)}
      onClick={onClick}
    >
      {icon && <span className="mr-3 h-4 w-4">{icon}</span>}
      {children}
    </button>
  );
};

interface DropdownMenuSeparatorProps {
  className?: string;
}

export const DropdownMenuSeparator: React.FC<DropdownMenuSeparatorProps> = ({
  className,
}) => {
  return (
    <div className={cn("my-1 h-px bg-slate-700", className)} role="separator" />
  );
};
