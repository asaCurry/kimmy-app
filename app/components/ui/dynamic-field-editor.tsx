import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Switch } from "./switch";
import { Textarea } from "./textarea";
import { Eye, EyeOff, Copy, Trash2, GripVertical } from "lucide-react";
import type { DynamicField } from "~/lib/types/dynamic-fields";
import { getFieldTypeConfig } from "~/lib/utils/dynamic-fields/field-creation";
import { createSelectOption, validateSelectOptions } from "~/lib/utils/dynamic-fields/select-options";

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

          {/* Default Value */}
          {field.type !== "select" && (
            <div className="space-y-2">
              <Label htmlFor={`defaultValue-${field.id}`}>Default Value</Label>
              {field.type === "checkbox" ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.defaultValue === true}
                    onCheckedChange={(checked) => handleUpdate({ defaultValue: checked })}
                  />
                  <span className="text-sm text-slate-400">
                    {field.defaultValue === true ? "Checked by default" : "Unchecked by default"}
                  </span>
                </div>
              ) : field.type === "number" ? (
                <Input
                  id={`defaultValue-${field.id}`}
                  type="number"
                  value={field.defaultValue || ""}
                  onChange={(e) => handleUpdate({ defaultValue: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Default number value"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              ) : (
                <Input
                  id={`defaultValue-${field.id}`}
                  value={field.defaultValue || ""}
                  onChange={(e) => handleUpdate({ defaultValue: e.target.value || undefined })}
                  placeholder="Default value"
                  className="bg-slate-700 border-slate-600 text-slate-200"
                />
              )}
            </div>
          )}

          {/* Select Options */}
          {field.type === "select" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label>Options</Label>
                  {field.options && field.options.length > 0 && (
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                      {field.options.length} option{field.options.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = prompt("Enter options separated by commas:");
                      if (input) {
                        const options = input.split(",").map(opt => createSelectOption(opt.trim())).filter(opt => opt.label);
                        if (options.length > 0) {
                          handleUpdate({ options });
                        }
                      }
                    }}
                    className="text-xs"
                    title="Import multiple options from a comma-separated list"
                  >
                    Import
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOption = createSelectOption(`Option ${(field.options?.length || 0) + 1}`);
                      const newOptions = [...(field.options || []), newOption];
                      handleUpdate({ options: newOptions });
                    }}
                    className="text-xs"
                    title="Add a new option to the list"
                  >
                    Add Option
                  </Button>
                  {field.options && field.options.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to clear all options?")) {
                          handleUpdate({ options: [] });
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                      title="Remove all options from this field"
                    >
                      Clear All
                    </Button>
                  )}
                  {field.options && field.options.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const sortedOptions = [...(field.options || [])].sort((a, b) => 
                          a.label.localeCompare(b.label)
                        );
                        handleUpdate({ options: sortedOptions });
                      }}
                      className="text-xs"
                      title="Sort options alphabetically by label"
                    >
                      Sort
                    </Button>
                  )}
                  {field.options && field.options.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const optionsText = (field.options || []).map(opt => opt.label).join(", ");
                        navigator.clipboard.writeText(optionsText).then(() => {
                          alert("Options copied to clipboard!");
                        });
                      }}
                      className="text-xs"
                      title="Copy options as comma-separated list to clipboard"
                    >
                      Export
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {field.options && Array.isArray(field.options) && field.options.length > 0 ? (
                  field.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border border-slate-600 rounded-md bg-slate-700/50">
                      <div className="flex flex-col space-y-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (index > 0) {
                              const newOptions = [...(field.options || [])];
                              [newOptions[index], newOptions[index - 1]] = [newOptions[index - 1], newOptions[index]];
                              handleUpdate({ options: newOptions });
                            }
                          }}
                          disabled={index === 0}
                          className="text-slate-400 hover:text-slate-300 hover:bg-slate-600 p-1 h-4 w-4"
                          title="Move option up"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (index < (field.options?.length || 0) - 1) {
                              const newOptions = [...(field.options || [])];
                              [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
                              handleUpdate({ options: newOptions });
                            }
                          }}
                          disabled={index === (field.options?.length || 0) - 1}
                          className="text-slate-400 hover:text-slate-300 hover:bg-slate-600 p-1 h-4 w-4"
                          title="Move option down"
                        >
                          ↓
                        </Button>
                      </div>
                      <Input
                        value={option.label || ""}
                        onChange={(e) => {
                          const newOptions = [...(field.options || [])];
                          const newLabel = e.target.value;
                          const newValue = createSelectOption(newLabel).value;
                          newOptions[index] = { ...newOptions[index], label: newLabel, value: newValue };
                          const validatedOptions = validateSelectOptions(newOptions);
                          handleUpdate({ options: validatedOptions });
                        }}
                        placeholder="Option label"
                        className="flex-1 text-xs bg-slate-700 border-slate-600 text-slate-200"
                      />
                      <Input
                        value={option.value || ""}
                        onChange={(e) => {
                          const newOptions = [...(field.options || [])];
                          newOptions[index] = { ...newOptions[index], value: e.target.value };
                          const validatedOptions = validateSelectOptions(newOptions);
                          handleUpdate({ options: validatedOptions });
                        }}
                        placeholder="option_value"
                        className="w-24 text-xs bg-slate-700 border-slate-600 text-slate-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = [...(field.options || [])];
                          const duplicatedOption = { ...newOptions[index] };
                          duplicatedOption.label = `${duplicatedOption.label} (Copy)`;
                          duplicatedOption.value = createSelectOption(duplicatedOption.label).value;
                          newOptions.splice(index + 1, 0, duplicatedOption);
                          const validatedOptions = validateSelectOptions(newOptions);
                          handleUpdate({ options: validatedOptions });
                        }}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 p-1 h-6 w-6"
                        title="Duplicate this option"
                      >
                        +
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = field.options?.filter((_, i) => i !== index) || [];
                          const validatedOptions = validateSelectOptions(newOptions);
                          handleUpdate({ options: validatedOptions });
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-6 w-6"
                        title="Delete this option"
                      >
                        ×
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">
                    No options defined. Click "Add Option" to get started.
                  </div>
                )}
              </div>
              
              {/* Default Value for Select */}
              {field.options && field.options.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor={`defaultValue-${field.id}`}>Default Value</Label>
                  <select
                    id={`defaultValue-${field.id}`}
                    value={field.defaultValue || ""}
                    onChange={(e) => handleUpdate({ defaultValue: e.target.value || undefined })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm"
                  >
                    <option value="">No default value</option>
                    {field.options.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Preview */}
              {field.options && field.options.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-3 bg-slate-900 border border-slate-600 rounded-md">
                    <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm">
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options.map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-2">
                      This is how your select field will appear to users
                    </p>
                  </div>
                </div>
              )}
              
              {field.options && field.options.length > 0 && (
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• <strong>Label:</strong> What users see in the dropdown</p>
                  <p>• <strong>Value:</strong> What gets stored (auto-generated from label)</p>
                  <p>• <strong>Order:</strong> Use ↑↓ buttons to reorder options</p>
                  <p>• <strong>Import:</strong> Paste comma-separated options to add multiple at once</p>
                  
                  {/* Validation Status */}
                  {(() => {
                    const values = field.options.map(opt => opt.value);
                    const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
                    const hasDuplicates = duplicates.length > 0;
                    
                    if (hasDuplicates) {
                      return (
                        <div className="mt-2 p-2 bg-red-900/20 border border-red-600 rounded text-red-400">
                          ⚠️ Warning: Duplicate values detected. This may cause issues.
                        </div>
                      );
                    }
                    
                    return (
                      <div className="mt-2 p-2 bg-green-900/20 border border-green-600 rounded text-green-400">
                        ✓ All options are valid
                      </div>
                    );
                  })()}
                </div>
              )}
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
