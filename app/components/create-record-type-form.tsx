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
import { CategorySelect } from "~/components/ui/category-select";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useHousehold } from "~/contexts/household-context";
import type { User } from "~/db/schema";

interface CreateRecordTypeFormProps {
  householdId: string;
  createdBy: number;
  category?: string; // Optional - if not provided, user can select
  _existingCategories?: string[]; // Optional - existing categories to show as suggestions
  existingRecordType?: any; // For editing mode
  isEditing?: boolean; // Whether this is edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
  showBackButton?: boolean;
  className?: string;
  householdMembers?: User[]; // Optional - will use hook if not provided
}

export const CreateRecordTypeForm: React.FC<CreateRecordTypeFormProps> = ({
  householdId,
  createdBy,
  category: initialCategory,
  _existingCategories,
  existingRecordType,
  isEditing = false,
  onSuccess,
  onCancel,
  showBackButton = false,
  className = "",
  householdMembers: propHouseholdMembers,
}) => {
  const fetcher = useFetcher();

  // Get household members from context if not provided as prop
  const { householdMembers: contextHouseholdMembers } = useHousehold();
  const householdMembers = propHouseholdMembers || contextHouseholdMembers;

  const isSubmitting = fetcher.state === "submitting";

  const [formData, setFormData] = React.useState({
    name: existingRecordType?.name || "",
    description: existingRecordType?.description || "",
    category: initialCategory || existingRecordType?.category || "",
    icon: existingRecordType?.icon || "📝",
    color: existingRecordType?.color || "blue",
    allowPrivate: existingRecordType?.allowPrivate === 1 || false,
    visibleToMembers: existingRecordType?.visibleToMembers
      ? JSON.parse(existingRecordType.visibleToMembers)
      : ([] as number[]), // member IDs, empty = all members
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
      toast.error(
        "Please enter a name and select a category for the record type"
      );
      return;
    }

    const formDataToSubmit = new FormData();
    formDataToSubmit.append(
      "_action",
      isEditing ? "update-record-type" : "create-record-type"
    );
    formDataToSubmit.append("name", formData.name);
    formDataToSubmit.append("description", formData.description);
    formDataToSubmit.append("category", formData.category);
    formDataToSubmit.append("householdId", householdId);
    formDataToSubmit.append("fields", serialize());
    formDataToSubmit.append("icon", formData.icon);
    formDataToSubmit.append("color", formData.color);
    formDataToSubmit.append("allowPrivate", formData.allowPrivate.toString());
    formDataToSubmit.append(
      "visibleToMembers",
      JSON.stringify(formData.visibleToMembers)
    );
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
        toast.success(
          isEditing
            ? "Record type updated successfully!"
            : "Record type created successfully!",
          {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

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
        toast.error(
          fetcher.data.error ||
            (isEditing
              ? "Failed to update record type"
              : "Failed to create record type"),
          {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }
    }
  }, [fetcher.data, onSuccess, isEditing]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-6">
          {/* Name field - always full width for better mobile UX */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-200">
              Record Type Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Meal, Exercise, Medication"
              className="bg-slate-700 border-slate-600 text-slate-200 text-base sm:text-sm"
              required
            />
          </div>

          {/* Category field - always full width for better mobile UX */}
          <div className="space-y-2">
            <CategorySelect
              value={formData.category}
              onChange={value => setFormData({ ...formData, category: value })}
              placeholder="Select a category..."
              className="bg-slate-600 text-slate-200"
              required
              householdId={householdId}
              label="Category"
            />
          </div>

          {/* Icon and Color - side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="icon" className="text-slate-200">
                Icon
              </Label>
              <Select
                value={formData.icon}
                onValueChange={value =>
                  setFormData({ ...formData, icon: value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 text-base sm:text-sm min-h-[44px] sm:min-h-[36px]">
                  <SelectValue placeholder="Choose an icon">
                    {formData.icon && (
                      <span className="text-xl">{formData.icon}</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 max-h-64 overflow-y-auto text-base sm:text-sm">
                  {/* General & Documents */}
                  <SelectItem value="📝">📝 Note</SelectItem>
                  <SelectItem value="📋">📋 Checklist</SelectItem>
                  <SelectItem value="📄">📄 Document</SelectItem>
                  <SelectItem value="📊">📊 Report</SelectItem>
                  <SelectItem value="📈">📈 Progress</SelectItem>
                  <SelectItem value="📅">📅 Schedule</SelectItem>
                  <SelectItem value="⏰">⏰ Reminder</SelectItem>
                  <SelectItem value="🔖">🔖 Bookmark</SelectItem>

                  {/* Health & Wellness */}
                  <SelectItem value="🏥">🏥 Health</SelectItem>
                  <SelectItem value="💊">💊 Medication</SelectItem>
                  <SelectItem value="🩺">🩺 Medical</SelectItem>
                  <SelectItem value="💉">💉 Treatment</SelectItem>
                  <SelectItem value="🦷">🦷 Dental</SelectItem>
                  <SelectItem value="👁️">👁️ Vision</SelectItem>
                  <SelectItem value="🧠">🧠 Mental Health</SelectItem>
                  <SelectItem value="❤️">❤️ Wellness</SelectItem>
                  <SelectItem value="😴">😴 Sleep</SelectItem>
                  <SelectItem value="💤">💤 Rest</SelectItem>

                  {/* Food & Nutrition */}
                  <SelectItem value="🍽️">🍽️ Meal</SelectItem>
                  <SelectItem value="🍎">🍎 Nutrition</SelectItem>
                  <SelectItem value="🥗">🥗 Healthy Food</SelectItem>
                  <SelectItem value="🍕">🍕 Food</SelectItem>
                  <SelectItem value="☕">☕ Beverage</SelectItem>
                  <SelectItem value="💧">💧 Hydration</SelectItem>
                  <SelectItem value="🧊">🧊 Water</SelectItem>

                  {/* Activities & Exercise */}
                  <SelectItem value="🏃">🏃 Activity</SelectItem>
                  <SelectItem value="💪">💪 Exercise</SelectItem>
                  <SelectItem value="🚴">🚴 Cycling</SelectItem>
                  <SelectItem value="🏊">🏊 Swimming</SelectItem>
                  <SelectItem value="🧘">🧘 Meditation</SelectItem>
                  <SelectItem value="🚶">🚶 Walking</SelectItem>
                  <SelectItem value="⚽">⚽ Sports</SelectItem>
                  <SelectItem value="🏋️">🏋️ Strength</SelectItem>
                  <SelectItem value="🤸">🤸 Flexibility</SelectItem>

                  {/* Education & Learning */}
                  <SelectItem value="🎓">🎓 Education</SelectItem>
                  <SelectItem value="📚">📚 Study</SelectItem>
                  <SelectItem value="✏️">✏️ Writing</SelectItem>
                  <SelectItem value="🔬">🔬 Science</SelectItem>
                  <SelectItem value="🧮">🧮 Math</SelectItem>
                  <SelectItem value="📖">📖 Reading</SelectItem>
                  <SelectItem value="🎭">🎭 Arts</SelectItem>
                  <SelectItem value="🎵">🎵 Music</SelectItem>
                  <SelectItem value="🎤">🎤 Practice</SelectItem>

                  {/* Work & Career */}
                  <SelectItem value="💼">💼 Work</SelectItem>
                  <SelectItem value="💻">💻 Computer</SelectItem>
                  <SelectItem value="📞">📞 Call</SelectItem>
                  <SelectItem value="📧">📧 Email</SelectItem>
                  <SelectItem value="🤝">🤝 Meeting</SelectItem>
                  <SelectItem value="🎯">🎯 Goal</SelectItem>
                  <SelectItem value="📉">📉 Analysis</SelectItem>
                  <SelectItem value="🔍">🔍 Research</SelectItem>

                  {/* Finance & Money */}
                  <SelectItem value="💰">💰 Money</SelectItem>
                  <SelectItem value="💳">💳 Payment</SelectItem>
                  <SelectItem value="🏦">🏦 Banking</SelectItem>
                  <SelectItem value="💹">💹 Investment</SelectItem>
                  <SelectItem value="💵">💵 Budget</SelectItem>
                  <SelectItem value="🧾">🧾 Receipt</SelectItem>

                  {/* Home & Family */}
                  <SelectItem value="🏠">🏠 Home</SelectItem>
                  <SelectItem value="👨‍👩‍👧‍👦">👨‍👩‍👧‍👦 Family</SelectItem>
                  <SelectItem value="🧹">🧹 Cleaning</SelectItem>
                  <SelectItem value="🍳">🍳 Cooking</SelectItem>
                  <SelectItem value="🛒">🛒 Shopping</SelectItem>
                  <SelectItem value="📦">📦 Package</SelectItem>
                  <SelectItem value="🔧">🔧 Maintenance</SelectItem>
                  <SelectItem value="🌱">🌱 Gardening</SelectItem>

                  {/* Travel & Transportation */}
                  <SelectItem value="✈️">✈️ Travel</SelectItem>
                  <SelectItem value="🚗">🚗 Car</SelectItem>
                  <SelectItem value="🚌">🚌 Transit</SelectItem>
                  <SelectItem value="🚲">🚲 Bike</SelectItem>
                  <SelectItem value="🗺️">🗺️ Navigation</SelectItem>
                  <SelectItem value="🏨">🏨 Hotel</SelectItem>
                  <SelectItem value="🎒">🎒 Trip</SelectItem>

                  {/* Entertainment & Hobbies */}
                  <SelectItem value="🎨">🎨 Creative</SelectItem>
                  <SelectItem value="🎮">🎮 Gaming</SelectItem>
                  <SelectItem value="📺">📺 Entertainment</SelectItem>
                  <SelectItem value="🎬">🎬 Movies</SelectItem>
                  <SelectItem value="📷">📷 Photography</SelectItem>
                  <SelectItem value="🎪">🎪 Events</SelectItem>
                  <SelectItem value="🎁">🎁 Gifts</SelectItem>
                  <SelectItem value="🎉">🎉 Celebration</SelectItem>

                  {/* Nature & Weather */}
                  <SelectItem value="🌞">🌞 Sunny</SelectItem>
                  <SelectItem value="🌧️">🌧️ Rainy</SelectItem>
                  <SelectItem value="❄️">❄️ Cold</SelectItem>
                  <SelectItem value="🌿">🌿 Nature</SelectItem>
                  <SelectItem value="🌸">🌸 Seasonal</SelectItem>
                  <SelectItem value="🌊">🌊 Water</SelectItem>
                  <SelectItem value="🏔️">🏔️ Mountain</SelectItem>

                  {/* Achievements & Goals */}
                  <SelectItem value="⭐">⭐ Achievement</SelectItem>
                  <SelectItem value="🏆">🏆 Trophy</SelectItem>
                  <SelectItem value="🎖️">🎖️ Medal</SelectItem>
                  <SelectItem value="🔥">🔥 Streak</SelectItem>
                  <SelectItem value="💯">💯 Perfect</SelectItem>
                  <SelectItem value="✅">✅ Complete</SelectItem>
                  <SelectItem value="🎊">🎊 Success</SelectItem>

                  {/* Emotions & Mood */}
                  <SelectItem value="😊">😊 Happy</SelectItem>
                  <SelectItem value="😌">😌 Calm</SelectItem>
                  <SelectItem value="😔">😔 Sad</SelectItem>
                  <SelectItem value="😤">😤 Frustrated</SelectItem>
                  <SelectItem value="🤗">🤗 Grateful</SelectItem>
                  <SelectItem value="🥱">🥱 Tired</SelectItem>
                  <SelectItem value="⚡">⚡ Energetic</SelectItem>

                  {/* Misc & Symbols */}
                  <SelectItem value="🔔">🔔 Notification</SelectItem>
                  <SelectItem value="⚠️">⚠️ Important</SelectItem>
                  <SelectItem value="❓">❓ Question</SelectItem>
                  <SelectItem value="💡">💡 Idea</SelectItem>
                  <SelectItem value="🔑">🔑 Key</SelectItem>
                  <SelectItem value="🎲">🎲 Random</SelectItem>
                  <SelectItem value="🌟">🌟 Special</SelectItem>
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
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100 text-base sm:text-sm min-h-[44px] sm:min-h-[36px]">
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

          {/* Description field - always full width */}
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
              className="bg-slate-700 border-slate-600 text-slate-200 text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Member Visibility Controls */}
        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label className="text-slate-200">Available for members</Label>
            <p className="text-sm text-slate-400 mb-2">
              Choose which household members can create records of this type.
              Select "All members" to make it available to everyone.
            </p>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="all-members"
                  checked={formData.visibleToMembers.length === 0}
                  onChange={e => {
                    if (e.target.checked) {
                      setFormData({ ...formData, visibleToMembers: [] });
                    } else {
                      // When unchecking "all members", select current user only as fallback
                      setFormData({
                        ...formData,
                        visibleToMembers: [createdBy],
                      });
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all duration-200"
                />
                <label
                  htmlFor="all-members"
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  All household members
                </label>
              </div>

              <div className="text-xs text-slate-500 ml-6">
                Or select specific members:
              </div>

              {householdMembers && householdMembers.length > 0 && (
                <div className="ml-6 space-y-2">
                  {householdMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`member-${member.id}`}
                        checked={
                          formData.visibleToMembers.length === 0 ||
                          formData.visibleToMembers.includes(member.id)
                        }
                        onChange={e => {
                          if (formData.visibleToMembers.length === 0) {
                            // If "all members" was selected, switching to specific selection
                            if (!e.target.checked) {
                              // User is unchecking a member when all were selected
                              // Select all other members except this one
                              const allOtherMembers = householdMembers
                                .filter(m => m.id !== member.id)
                                .map(m => m.id);
                              setFormData({
                                ...formData,
                                visibleToMembers: allOtherMembers,
                              });
                            }
                            // If checking when all selected, do nothing (already selected)
                          } else {
                            // Normal toggle behavior for specific selection
                            if (e.target.checked) {
                              const newMembers = [
                                ...formData.visibleToMembers,
                                member.id,
                              ];
                              // If all members are now selected, switch to "all members" mode
                              if (
                                newMembers.length === householdMembers.length
                              ) {
                                setFormData({
                                  ...formData,
                                  visibleToMembers: [],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  visibleToMembers: newMembers,
                                });
                              }
                            } else {
                              const newMembers =
                                formData.visibleToMembers.filter(
                                  (id: number) => id !== member.id
                                );
                              setFormData({
                                ...formData,
                                visibleToMembers: newMembers,
                              });
                            }
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer transition-all duration-200"
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        className="text-sm text-slate-300 cursor-pointer"
                      >
                        {member.name}
                        {member.role === "admin" && (
                          <span className="ml-1 text-xs text-blue-400">
                            (Admin)
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.visibleToMembers.length > 0 && (
              <div className="text-xs text-slate-400 mt-2 p-2 bg-slate-800 rounded">
                This record type will only appear for:{" "}
                {householdMembers
                  ?.filter(m => formData.visibleToMembers.includes(m.id))
                  .map(m => m.name)
                  .join(", ")}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">Fields</h3>
            <div className="flex flex-wrap gap-2">
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
                  existingFieldNames={fields.map(f => f.name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-4 pt-8 border-t border-slate-700">
          {showBackButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 min-h-[44px] text-base sm:text-sm"
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
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 min-h-[44px] text-base sm:text-sm flex-1 sm:flex-initial"
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Record Type"
                : "Create Record Type"}
          </Button>

          {!showBackButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 min-h-[44px] text-base sm:text-sm"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
