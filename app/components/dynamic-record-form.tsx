import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFetcher, useNavigate } from "react-router";
import {
  PageHeader,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Label,
  LoadingSpinner
} from "~/components/ui";
import { DynamicField } from "~/components/ui/form-field";
import type { FamilyMember } from "~/lib/utils";
import type { RecordType as DbRecordType } from "~/db/schema";
import { createRecordSchema } from "~/lib/utils/dynamic-fields/schema-generation";

// Local interface that extends the database RecordType with parsed fields
interface ParsedRecordType extends Omit<DbRecordType, "fields"> {
  fields: any[]; // Will be converted to DynamicField format
}

interface DynamicRecordFormProps {
  member?: FamilyMember;
  recordType: ParsedRecordType;
  familyId: string;
  memberId?: number;
  createdBy?: number;
  onBack?: () => void;
  onSubmit?: (data: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
}

export const DynamicRecordForm: React.FC<DynamicRecordFormProps> = ({
  member,
  recordType,
  familyId,
  memberId,
  createdBy,
  onBack,
  onSubmit: customOnSubmit,
  onCancel,
  initialData,
  isSubmitting: customIsSubmitting = false,
  mode = "create",
}) => {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const isSubmitting = customIsSubmitting || fetcher.state === "submitting";

  // Generate schema based on record type fields
  
  // Ensure fields is always an array
  const normalizedFields = Array.isArray(recordType.fields) ? recordType.fields : [];
  
  const schema = createRecordSchema(normalizedFields);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      title: mode === "edit" && initialData ? initialData.title : recordType.name,
      content: mode === "edit" && initialData ? initialData.content || "" : "",
      tags: mode === "edit" && initialData ? initialData.tags || "" : "",
      isPrivate: mode === "edit" && initialData ? Boolean(initialData.isPrivate) : false,
      datetime: mode === "edit" && initialData && initialData.datetime 
        ? new Date(initialData.datetime).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      ...Object.fromEntries(
        normalizedFields.map(field => {
          if (mode === "edit" && initialData && initialData.content) {
            try {
              const parsedContent = JSON.parse(initialData.content);
              const fieldValue = parsedContent.fields?.[`field_${field.id}`];
              if (fieldValue !== undefined) {
                return [`field_${field.id}`, fieldValue];
              }
            } catch (error) {
              console.error("Failed to parse initial content:", error);
            }
          }
          return [
            `field_${field.id}`,
            field.type === "checkbox"
              ? false
              : field.type === "number"
                ? undefined
                : "",
          ];
        })
      ),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "fields" as any,
  });

  const watchedIsPrivate = watch("isPrivate");
  const watchedTitle = watch("title");

  // Set title to record type name on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setValue("title", recordType.name);
      reset({
        title: recordType.name,
        content: "",
        tags: "",
        isPrivate: false,
        datetime: new Date().toISOString().slice(0, 16),
        ...Object.fromEntries(
          normalizedFields.map(field => [
            `field_${field.id}`,
            field.type === "checkbox"
              ? false
              : field.type === "number"
                ? undefined
                : "",
          ])
        ),
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [recordType.name, setValue, reset, normalizedFields]);

  const onSubmit = async (data: FormData) => {
    if (customOnSubmit) {
      // Custom submit handler for edit mode
      const fieldValues: Record<string, any> = {};
      normalizedFields.forEach(field => {
        const fieldKey = `field_${field.id}` as keyof FormData;
        const value = data[fieldKey];
        if (value !== undefined && value !== null && value !== "") {
          fieldValues[fieldKey] = value;
        }
      });

      const content = {
        description: data.content || "No description provided",
        fields: fieldValues,
      };

      const recordData = {
        title: data.title,
        content: JSON.stringify(content),
        tags: data.tags || "",
        isPrivate: data.isPrivate,
        datetime: data.datetime ? new Date(data.datetime).toISOString() : undefined,
      };

      await customOnSubmit(recordData);
      return;
    }

    // Default submit handler for create mode
    const formData = new FormData();
    formData.append("_action", "create");
    formData.append("title", data.title);
    formData.append("content", data.content || "");
    formData.append("tags", data.tags || "");
    formData.append("recordTypeId", recordType.id.toString());
    formData.append("familyId", familyId);
    formData.append("isPrivate", data.isPrivate.toString());

    // Handle datetime field - convert to ISO string if provided
    if (data.datetime) {
      const dateTime = new Date(data.datetime);
      if (!isNaN(dateTime.getTime())) {
        formData.append("datetime", dateTime.toISOString());
      }
    }

    // Add dynamic field values
    normalizedFields.forEach(field => {
      const fieldKey = `field_${field.id}` as keyof FormData;
      const value = data[fieldKey];

      if (value !== undefined && value !== null && value !== "") {
        if (field.type === "checkbox") {
          formData.append(`field_${field.id}`, value ? "true" : "false");
        } else {
          formData.append(`field_${field.id}`, String(value));
        }
      }
    });

    fetcher.submit(formData, {
      method: "post",
    });
  };

  // Handle successful submission
  React.useEffect(() => {
    if (fetcher.data?.success) {
      // Navigate back to the member's category view
      if (onBack) {
        onBack();
      }
    }
  }, [fetcher.data, onBack]);

  return (
    <div>
      <PageHeader
        title={mode === "edit" ? `Edit ${recordType.name}` : `New ${recordType.name}`}
        subtitle={mode === "edit" ? "Update record details" : `for ${member?.name || "Family Member"}`}
      />

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-slate-100">
            <span className="text-xl sm:text-2xl bg-slate-700/50 p-1.5 sm:p-2 rounded-lg">
              {recordType.icon || "📝"}
            </span>
            <span className="text-lg sm:text-xl">{recordType.name}</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            {recordType.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0">
          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Title <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <input
                  {...register("title")}
                  type="text"
                  id="title"
                  defaultValue={recordType.name}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter record title"
                />
                {watchedTitle && (
                  <button
                    type="button"
                    onClick={() => {
                      if (watchedTitle === recordType.name) {
                        setValue("title", "");
                      } else if (watchedTitle === "") {
                        setValue("title", recordType.name);
                      } else {
                        setValue("title", recordType.name);
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 hover:bg-slate-600 rounded-full p-1.5 transition-all duration-200 hover:scale-110"
                    title={watchedTitle === recordType.name ? "Clear title" : "Restore default title"}
                    aria-label={watchedTitle === recordType.name ? "Clear title" : "Restore default title"}
                  >
                    <span className="text-lg font-bold leading-none">
                      {watchedTitle === recordType.name ? "×" : "↺"}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {watchedTitle === recordType.name 
                  ? `Using default title "${recordType.name}". Click the × to clear and enter a custom title.`
                  : watchedTitle === ""
                    ? `Title cleared. Click the ↺ to restore default title "${recordType.name}".`
                    : "Custom title entered. Click the ↺ to restore default title."
                }
              </p>
              {errors.title && (
                <p className="text-red-400 text-sm">
                  {String(errors.title.message) || "Title is required"}
                </p>
              )}
              
              {/* Debug button - remove this after testing */}
              <button
                type="button"
                onClick={() => {
                  console.log("Manual set title clicked");
                  setValue("title", recordType.name);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Debug: Set title to "{recordType.name}"
              </button>
            </div>

            {/* Datetime Field */}
            <div className="space-y-2">
              <Label
                htmlFor="datetime"
                className="text-sm font-medium leading-none text-slate-200"
              >
                When did this happen?
              </Label>
              <input
                {...register("datetime")}
                type="datetime-local"
                id="datetime"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400">
                Leave empty to use current date and time
              </p>
              {errors.datetime && (
                <p className="text-red-400 text-sm">
                  {String(errors.datetime.message) || "Invalid datetime"}
                </p>
              )}
            </div>

            {/* Content Field */}
            <div className="space-y-2">
              <Label
                htmlFor="content"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Description
              </Label>
              <textarea
                {...register("content")}
                id="content"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter record description"
                rows={4}
              />
              {errors.content && (
                <p className="text-red-400 text-sm">
                  {String(errors.content.message) || "Invalid content"}
                </p>
              )}
            </div>

            {/* Dynamic Fields */}
            {normalizedFields.map(field => (
              <div key={field.id} className="space-y-2">
                <Label
                  htmlFor={`field_${field.id}`}
                  className="text-sm font-medium leading-none text-slate-200"
                >
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                </Label>

                <DynamicField
                  field={{
                    ...field,
                    id: `field_${field.id}`,
                    register: register(`field_${field.id}` as any),
                    error: errors[`field_${field.id}` as keyof typeof errors],
                  }}
                />

                {errors[`field_${field.id}` as keyof typeof errors] && (
                  <p className="text-red-400 text-sm">
                    {String(
                      errors[`field_${field.id}` as keyof typeof errors]
                        ?.message
                    ) || `${field.label} is invalid`}
                  </p>
                )}
              </div>
            ))}

            {/* Tags Field */}
            <div className="space-y-2">
              <Label
                htmlFor="tags"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Tags
              </Label>
              <input
                {...register("tags")}
                type="text"
                id="tags"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas"
              />
              {errors.tags && (
                <p className="text-red-400 text-sm">
                  {String(errors.tags.message) || "Invalid tags"}
                </p>
              )}
            </div>

            {/* Privacy Toggle */}
            {recordType.allowPrivate === 1 && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPrivate"
                  checked={watchedIsPrivate}
                  onCheckedChange={checked => setValue("isPrivate", checked)}
                />
                <Label htmlFor="isPrivate" className="text-sm text-slate-200">
                  Make this record private (only visible to you)
                </Label>
              </div>
            )}

            {/* Error Display */}
            {fetcher.data?.error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-red-400 text-sm">{fetcher.data.error}</p>
              </div>
            )}

            {/* Success Message */}
            {fetcher.data?.success && (
              <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
                <p className="text-green-400 text-sm">{fetcher.data.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={mode === "edit" && onCancel ? onCancel : onBack}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {mode === "edit" ? "Cancel" : "Back"}
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    {mode === "edit" ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  mode === "edit" ? "Update Record" : "Save Record"
                )}
              </Button>
            </div>
          </fetcher.Form>
        </CardContent>
      </Card>
    </div>
  );
};
