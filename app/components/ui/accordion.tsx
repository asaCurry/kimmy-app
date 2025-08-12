import * as React from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "~/lib/utils";
import type { RecordType } from "~/db/schema";

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionItemProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  memberId: number;
  category: string;
  recordType: RecordType;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  className,
}) => {
  return <div className={cn("space-y-2", className)}>{children}</div>;
};

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className,
  memberId,
  category,
  recordType,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        "border border-slate-700 rounded-lg bg-slate-800/50",
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-t-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
              {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <Link
            to={`/member/${memberId}/category/${encodeURIComponent(category)}/record/${recordType?.id}`}
          >
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              New {recordType?.name}
            </Button>
          </Link>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-700">{children}</div>
      )}
    </div>
  );
};
