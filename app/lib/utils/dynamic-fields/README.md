# Dynamic Fields Utilities

This directory contains a modular, organized set of utilities for handling dynamic fields in the Kimmy app. The functionality has been broken down into smaller, focused modules to avoid timeouts and improve maintainability.

## Structure

```
dynamic-fields/
├── index.ts                 # Main export file
├── field-creation.ts        # Field creation and default values
├── field-validation.ts      # Field validation logic
├── field-manipulation.ts    # Field ordering and manipulation
├── field-serialization.ts   # Serialization and data conversion
├── schema-generation.ts     # Dynamic schema generation
└── README.md               # This file
```

## Modules

### field-creation.ts
Handles the creation of new dynamic fields with appropriate defaults.

**Exports:**
- `createFieldId()` - Generate unique field IDs
- `createDefaultField(type, order)` - Create a new field with defaults
- `getFieldTypeConfig(type)` - Get configuration for field types
- `getDefaultValueForType(type)` - Get default value for field type
- `getDefaultValidationForType(type)` - Get default validation rules

### field-validation.ts
Provides validation logic for individual fields and field collections.

**Exports:**
- `validateFieldValue(field, value)` - Validate a single field value
- `validateMultipleFields(fields, values)` - Validate multiple fields at once

### field-manipulation.ts
Handles field ordering, filtering, and manipulation operations.

**Exports:**
- `reorderFields(fields, fromIndex, toIndex)` - Reorder fields
- `sortFieldsByOrder(fields)` - Sort fields by order property
- `getActiveFields(fields)` - Get only active fields
- `getFieldsByType(fields, type)` - Filter fields by type
- `duplicateField(field, newOrder)` - Duplicate a field
- `toggleFieldActive(fields, fieldId)` - Toggle field active state

### field-serialization.ts
Handles serialization, deserialization, and data format conversion.

**Exports:**
- `serializeFields(fields)` - Convert fields to JSON string
- `deserializeFields(fieldsJson)` - Parse JSON back to fields
- `parseSelectOptions(optionsString)` - Parse comma-separated options
- `formatSelectOptions(options)` - Format options for display
- `convertFieldsToFormData(fields, values)` - Convert to form data format
- `convertFormDataToFields(fields, formData)` - Convert from form data

### schema-generation.ts
Generates dynamic Zod schemas based on field configurations.

**Exports:**
- `createRecordSchema(fields)` - Create complete record schema
- `createFieldValidationSchema(field)` - Create field-specific schema
- `validateFieldAgainstSchema(field, value)` - Validate using schema

## Hooks

### useDynamicFields
A React hook for managing dynamic fields state and operations.

```typescript
const {
  fields,
  activeFields,
  addField,
  removeField,
  updateField,
  reorderField,
  validateField,
  serialize,
  deserialize
} = useDynamicFields({
  initialFields: [],
  onFieldsChange: (fields) => console.log('Fields changed:', fields)
});
```

### useDynamicForm
A React hook for handling forms with dynamic fields, including validation.

```typescript
const {
  form,
  errors,
  isValid,
  isSubmitting,
  handleSubmit,
  setFieldValue,
  getFieldValue,
  validateField
} = useDynamicForm({
  fields: dynamicFields,
  onSubmit: async (data) => {
    // Handle form submission
  }
});
```

## Components

### DynamicFieldEditor
A component for editing individual dynamic fields with a collapsible interface.

```typescript
<DynamicFieldEditor
  field={field}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  onDuplicate={handleDuplicate}
  onToggleActive={handleToggleActive}
  index={index}
  totalFields={totalFields}
/>
```

## Usage Examples

### Creating a new field
```typescript
import { createDefaultField } from '~/lib/utils/dynamic-fields';

const newField = createDefaultField('text', 0);
```

### Validating a field
```typescript
import { validateFieldValue } from '~/lib/utils/dynamic-fields';

const result = validateFieldValue(field, userInput);
if (!result.isValid) {
  console.error(result.error);
}
```

### Using the hook
```typescript
import { useDynamicFields } from '~/hooks/use-dynamic-fields';

function MyComponent() {
  const { fields, addField, removeField } = useDynamicFields();
  
  const handleAddText = () => addField('text');
  const handleRemove = (id) => removeField(id);
  
  return (
    <div>
      <button onClick={handleAddText}>Add Text Field</button>
      {fields.map(field => (
        <div key={field.id}>
          {field.label}
          <button onClick={() => handleRemove(field.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

## Benefits of This Structure

1. **Modularity**: Each module has a single responsibility
2. **Performance**: Smaller modules load faster and avoid timeouts
3. **Maintainability**: Easier to find and fix issues
4. **Testability**: Each module can be tested independently
5. **Reusability**: Functions can be imported individually as needed
6. **Type Safety**: Full TypeScript support throughout

## Migration

The original `dynamic-fields.ts` file now re-exports all functions from the new modular structure, so existing code will continue to work without changes. However, it's recommended to update imports to use the specific modules you need:

```typescript
// Old way (still works)
import { validateFieldValue } from '~/lib/utils/dynamic-fields';

// New way (recommended)
import { validateFieldValue } from '~/lib/utils/dynamic-fields/field-validation';
```

## Future Improvements

- Add unit tests for each module
- Implement field templates for common use cases
- Add field dependency management
- Implement field conditional logic
- Add field migration utilities for schema changes
