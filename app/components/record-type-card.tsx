import * as React from "react";
import { IconCard } from "~/components/ui/interactive-card";
import { CardContent } from "~/components/ui/card";
import { INTERACTIVE_CARD_STYLES } from "~/components/ui/interactive-card";
import type { RecordType } from "~/lib/utils";

interface RecordTypeCardProps {
  recordType: RecordType;
  onSelect?: () => void;
}

export const RecordTypeCard: React.FC<RecordTypeCardProps> = ({ recordType, onSelect }) => {
  const icon = (
    <div className={`text-xl sm:text-2xl p-1.5 sm:p-2 rounded-lg bg-slate-700/50 ${recordType.color ? 'shadow-lg' : ''} flex-shrink-0`}>
      {recordType.icon || "📝"}
    </div>
  );

  const fieldCount = `${recordType.fields.length} field${recordType.fields.length !== 1 ? 's' : ''}`;

  return (
    <IconCard
      icon={icon}
      title={recordType.name}
      description={recordType.description}
      onClick={onSelect}
    >
      <CardContent className={INTERACTIVE_CARD_STYLES.content}>
        <p className="text-sm text-slate-500">{fieldCount}</p>
      </CardContent>
    </IconCard>
  );
};