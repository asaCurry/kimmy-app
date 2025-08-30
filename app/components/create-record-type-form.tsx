import * as React from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { Plus, ArrowLeft } from "lucide-react";
import { useDynamicFields } from "~/hooks/use-dynamic-fields";
import { DynamicFieldEditor } from "~/components/ui/dynamic-field-editor";
import { CategoryTypeahead } from "~/components/ui/category-typeahead";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface CreateRecordTypeFormProps {
  householdId: string;
  createdBy: number;
  category?: string; // Optional - if not provided, user can select
  existingCategories?: string[]; // Optional - existing categories to show as suggestions
  existingRecordType?: any; // For editing mode
  isEditing?: boolean; // Whether this is edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export const CreateRecordTypeForm: React.FC<CreateRecordTypeFormProps> = ({
  householdId,
  createdBy,
  category: initialCategory,
  existingCategories,
  existingRecordType,
  isEditing = false,
  onSuccess,
  onCancel,
  showBackButton = false,
  className = "",
}) => {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  const [formData, setFormData] = React.useState({
    name: existingRecordType?.name || "",
    description: existingRecordType?.description || "",
    category: initialCategory || existingRecordType?.category || "",
    icon: existingRecordType?.icon || "📝",
    color: existingRecordType?.color || "blue",
    allowPrivate: existingRecordType?.allowPrivate === 1 || false,
  });

  // Use the dynamic fields hook
  const {
    fields,
    addField,
    removeField,
    updateField,
    reorderField,
    toggleField,
    duplicateField,
    serialize,
  } = useDynamicFields({
    initialFields: existingRecordType?.fields || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category.trim()) {
      alert("Please enter a name and select a category for the record type");
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("_action", isEditing ? "update-record-type" : "create-record-type");
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("description", formData.description);
    formDataToSubmit.append("category", formData.category);
    formDataToSubmit.append("householdId", householdId);
    formDataToSubmit.append("fields", serialize());
    formDataToSubmit.append("icon", formData.icon);
    formDataToSubmit.append("color", formData.color);
    formDataToSubmit.append("allowPrivate", formData.allowPrivate.toString());
    if (!isEditing) {
      formDataToSubmit.append("createdBy", createdBy.toString());
    }

    fetcher.submit(formDataToSubmit, {
      method: "post",
    });
  };

  // Handle form submission response
  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        // Show success toast
        toast.success(isEditing ? "Record type updated successfully!" : "Record type created successfully!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Redirect after a brief delay to let user see the toast
        const timer = setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            // Default behavior: reload the page
            window.location.reload();
          }
        }, 1000); // Reduced delay since toast is less intrusive

        return () => clearTimeout(timer);
      } else if (fetcher.data.error) {
        // Show error toast
        toast.error(fetcher.data.error || (isEditing ? "Failed to update record type" : "Failed to create record type"), {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
  }, [fetcher.data, onSuccess]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">
              Record Type Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Meal, Exercise, Medication"
              className="bg-slate-700 border-slate-600 text-slate-200"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-slate-200">
              Category *
            </Label>
            <CategoryTypeahead
              value={formData.category}
              onChange={value => setFormData({ ...formData, category: value })}
              placeholder="Select or type a category..."
              className="bg-slate-600 text-slate-200"
              required
              householdId={householdId}
              allowCreate={true}
              maxSuggestions={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon" className="text-slate-200">
              Icon
            </Label>
            <Select
              value={formData.icon}
              onValueChange={value => setFormData({ ...formData, icon: value })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                <SelectValue placeholder="Choose an icon" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="📝">📝 Note</SelectItem>
                <SelectItem value="🏥">🏥 Health</SelectItem>
                <SelectItem value="🎓">🎓 Education</SelectItem>
                <SelectItem value="⭐">⭐ Achievement</SelectItem>
                <SelectItem value="🎯">🎯 Goal</SelectItem>
                <SelectItem value="💊">💊 Medication</SelectItem>
                <SelectItem value="🏃">🏃 Activity</SelectItem>
                <SelectItem value="🍽️">🍽️ Meal</SelectItem>
                <SelectItem value="😴">😴 Sleep</SelectItem>
                <SelectItem value="🎨">🎨 Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className="text-slate-200">
              Color
            </Label>
            <Select
              value={formData.color}
              onValueChange={value =>
                setFormData({ ...formData, color: value })
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                <SelectValue placeholder="Choose a color" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="pink">Pink</SelectItem>
                <SelectItem value="indigo">Indigo</SelectItem>
                <SelectItem value="gray">Gray</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-slate-200">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe what this record type is for..."
            rows={3}
            className="bg-slate-700 border-slate-600 text-slate-200"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="allowPrivate"
            checked={formData.allowPrivate}
            onCheckedChange={checked =>
              setFormData({ ...formData, allowPrivate: checked })
            }
          />
          <Label htmlFor="allowPrivate" className="text-slate-200">
            Allow private records
          </Label>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">Fields</h3>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => addField("text")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Text Field
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addField("number")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Number Field
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => addField("select")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Select Field
              </Button>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-medium text-slate-200 mb-2">
                No fields added yet
              </h4>
              <p className="text-slate-400 mb-4">
                Add fields to define what information will be collected for this
                record type.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => addField("text")}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Field
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <DynamicFieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={(fieldId, updates) => updateField(fieldId, updates)}
                  onDelete={fieldId => removeField(fieldId)}
                  onDuplicate={fieldId => duplicateField(fieldId)}
                  onToggleActive={fieldId => toggleField(fieldId)}
                  onReorder={reorderField}
                  index={index}
                  totalFields={fields.length}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          {showBackButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          <Button
            type="submit"
            disabled={
              isSubmitting || !formData.name.trim() || !formData.category.trim()
            }
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Record Type" : "Create Record Type")}
          </Button>

          {!showBackButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
