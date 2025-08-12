import * as React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Trash2, Copy, Eye, EyeOff, GripVertical } from "lucide-react";
import type { DynamicField, FieldType } from "~/lib/types/dynamic-fields";
import { getFieldTypeConfig } from "~/lib/utils/dynamic-fields";

interface DynamicFieldEditorProps {
  field: DynamicField;
  onUpdate: (fieldId: string, updates: Partial<DynamicField>) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate: (fieldId: string) => void;
  onToggleActive: (fieldId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  index: number;
  totalFields: number;
}

export const DynamicFieldEditor: React.FC<DynamicFieldEditorProps> = ({
  field,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleActive,
  onReorder,
  index,
  totalFields
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const fieldConfig = getFieldTypeConfig(field.type);
  
  // Debug: Log the field data to see what we're getting
  console.log("DynamicFieldEditor - field:", field);
  console.log("DynamicFieldEditor - field.type:", field.type);
  console.log("DynamicFieldEditor - field.options:", field.options);
  console.log("DynamicFieldEditor - fieldConfig:", fieldConfig);

  // Safety check for fieldConfig
  if (!fieldConfig) {
    console.error("DynamicFieldEditor - No field config found for type:", field.type);
    return (
      <div className="border border-red-600 rounded-lg bg-red-900/20 p-4">
        <p className="text-red-400">Error: Unknown field type "{field.type}"</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<DynamicField>) => {
    onUpdate(field.id, updates);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${field.label}"?`)) {
      onDelete(field.id);
    }
  };

  const handleDuplicate = () => {
    onDuplicate(field.id);
  };

  const handleToggleActive = () => {
    onToggleActive(field.id);
  };

  return (
    <div className="border border-slate-600 rounded-lg bg-slate-800/50">
      {/* Field Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-600">
        <div className="flex items-center space-x-3">
          {onReorder && (
            <Button
              variant="ghost"
              size="sm"
              className="cursor-grab hover:cursor-grabbing text-slate-400 hover:text-slate-300"
              disabled={totalFields <= 1}
            >
              <GripVertical className="w-4 h-4" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{fieldConfig.icon}</span>
            <div>
              <h4 className="font-medium text-slate-200">{field.label}</h4>
              <p className="text-sm text-slate-400">{fieldConfig.label}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-300"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDuplicate}
            className="text-slate-400 hover:text-slate-300"
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Field Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`label-${field.id}`}>Label</Label>
              <Input
                id={`label-${field.id}`}
                value={field.label}
                onChange={(e) => handleUpdate({ label: e.target.value })}
                placeholder="Field label"
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`name-${field.id}`}>Name</Label>
              <Input
                id={`name-${field.id}`}
                value={field.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                placeholder="Field name"
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Field Type and Required */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Field Type</Label>
              <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300">
                {fieldConfig.label}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Required</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => handleUpdate({ required: checked })}
                />
                <span className="text-sm text-slate-400">
                  {field.required ? "Required" : "Optional"}
                </span>
              </div>
            </div>
          </div>

          {/* Placeholder and Help Text */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
              <Input
                id={`placeholder-${field.id}`}
                value={field.placeholder || ""}
                onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                placeholder="Placeholder text"
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`helpText-${field.id}`}>Help Text</Label>
              <Input
                id={`helpText-${field.id}`}
                value={field.helpText || ""}
                onChange={(e) => handleUpdate({ helpText: e.target.value })}
                placeholder="Help text"
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
          </div>

          {/* Validation Rules */}
          {field.type === "number" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`min-${field.id}`}>Minimum Value</Label>
                <Input
                  id={`min-${field.id}`}
                  type="number"
                  value={field.validation?.min || ""}
                  onChange={(e) => handleUpdate({
                    validation: {
                      ...field.validation,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="No minimum"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`max-${field.id}`}>Maximum Value</Label>
                <Input
                  id={`max-${field.id}`}
                  type="number"
                  value={field.validation?.max || ""}
                  onChange={(e) => handleUpdate({
                    validation: {
                      ...field.validation,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="No maximum"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Text Length Validation */}
          {(field.type === "text" || field.type === "textarea" || field.type === "email" || field.type === "url" || field.type === "phone") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`minLength-${field.id}`}>Minimum Length</Label>
                <Input
                  id={`minLength-${field.id}`}
                  type="number"
                  value={field.validation?.minLength || ""}
                  onChange={(e) => handleUpdate({
                    validation: {
                      ...field.validation,
                      minLength: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="No minimum"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`maxLength-${field.id}`}>Maximum Length</Label>
                <Input
                  id={`maxLength-${field.id}`}
                  type="number"
                  value={field.validation?.maxLength || ""}
                  onChange={(e) => handleUpdate({
                    validation: {
                      ...field.validation,
                      maxLength: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  placeholder="No maximum"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Select Options */}
          {field.type === "select" && (
            <div className="space-y-2">
              <Label htmlFor={`options-${field.id}`}>Options (comma-separated)</Label>
              <Textarea
                id={`options-${field.id}`}
                value={(() => {
                  try {
                    if (field.options && Array.isArray(field.options)) {
                      return field.options.map(opt => {
                        if (typeof opt === 'object' && opt.label) {
                          return opt.label;
                        } else if (typeof opt === 'string') {
                          return opt;
                        }
                        return '';
                      }).filter(Boolean).join(", ");
                    }
                    return "";
                  } catch (error) {
                    console.error("Error processing options:", error);
                    return "";
                  }
                })()}
                onChange={(e) => {
                  try {
                    const options = e.target.value.split(",").map((opt, index) => ({
                      value: opt.trim().toLowerCase().replace(/\s+/g, "_"),
                      label: opt.trim()
                    })).filter(opt => opt.label);
                    
                    handleUpdate({ options });
                  } catch (error) {
                    console.error("Error updating options:", error);
                  }
                }}
                placeholder="Option 1, Option 2, Option 3"
                rows={3}
                className="bg-slate-700 border-slate-600 text-slate-200"
              />
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-600">
            <div className="flex items-center space-x-2">
              <Switch
                checked={field.isActive}
                onCheckedChange={handleToggleActive}
              />
              <span className="text-sm text-slate-400">
                {field.isActive ? "Field is active" : "Field is inactive"}
              </span>
            </div>
            
            <div className="text-sm text-slate-500">
              Order: {index + 1} of {totalFields}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
