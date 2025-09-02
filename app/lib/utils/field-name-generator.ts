/**
 * Converts a human-readable label to a snake_case field name
 * @param label - The human-readable field label
 * @returns snake_case field name
 */
export function generateFieldName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
}

/**
 * Ensures field name uniqueness by appending numbers if needed
 * @param desiredName - The desired field name
 * @param existingNames - Array of existing field names to check against
 * @returns unique field name
 */
export function ensureUniqueFieldName(
  desiredName: string,
  existingNames: string[]
): string {
  let uniqueName = desiredName;
  let counter = 1;

  while (existingNames.includes(uniqueName)) {
    uniqueName = `${desiredName}_${counter}`;
    counter++;
  }

  return uniqueName;
}

/**
 * Generates a unique field name from a label, checking against existing field names
 * @param label - The human-readable field label
 * @param existingFieldNames - Array of existing field names
 * @returns unique snake_case field name
 */
export function createUniqueFieldName(
  label: string,
  existingFieldNames: string[]
): string {
  const baseName = generateFieldName(label);
  return ensureUniqueFieldName(baseName, existingFieldNames);
}
