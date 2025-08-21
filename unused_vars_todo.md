# Unused Variables Cleanup TODO

## Files to Process

### 1. app/components/create-tracker-form.tsx
- [x] Line 20:3 - 'UpdateTrackerInput' is defined but never used - Removed unused import

### 2. app/components/dynamic-record-form.tsx
- [x] Line 35:15 - 'data' is defined but never used - Removed unused onSubmit prop
- [x] Line 46:3 - 'memberId' is defined but never used - Kept as it might be needed for future functionality
- [x] Line 47:3 - 'createdBy' is defined but never used - Removed unused prop
- [x] Line 49:13 - 'customOnSubmit' is defined but never used - Removed unused onSubmit prop
- [x] Line 71:5 - 'control' is assigned a value but never used - Removed unused control variable

### 3. app/components/manage/household-member-edit.tsx
- [x] Line 7:3 - 'useNavigate' is defined but never used - Removed unused import
- [x] Line 8:3 - 'useLoaderData' is defined but never used - Removed unused import

### 4. app/components/manage/household-member-form.tsx
- [x] Line 2:16 - 'useActionData' is defined but never used - Removed unused import
- [x] Line 2:31 - 'useNavigation' is defined but never used - Removed unused import
- [x] Line 18:14 - 'formData' is defined but never used - This was a false positive, formData is used extensively
- [x] Line 34:3 - 'onSubmit' is defined but never used - Removed unused prop

### 5. app/components/manage/household-member-list.tsx
- [x] Line 3:16 - 'useNavigate' is defined but never used - Removed unused import
- [x] Line 37:3 - 'householdId' is defined but never used - Removed unused prop
- [x] Line 38:3 - 'onMemberUpdated' is defined but never used - Removed unused prop

### 6. app/components/manage/household-overview.tsx
- [x] Line 1:10 - 'useState' is defined but never used - Removed unused import
- [x] Line 1:20 - 'useEffect' is defined but never used - Removed unused import
- [x] Line 2:16 - 'useNavigate' is defined but never used - Removed unused import
- [x] Line 3:10 - 'PageLayout' is defined but never used - Removed unused import
- [x] Line 3:22 - 'PageHeader' is defined but never used - Removed unused import
- [x] Line 4:10 - 'RequireAuth' is defined but never used - Removed unused import
- [x] Line 4:23 - 'useAuth' is defined but never used - Removed unused import
- [x] Line 5:10 - 'Navigation' is defined but never used - Removed unused import
- [x] Line 7:3 - 'Card' is defined but never used - Removed unused import
- [x] Line 8:3 - 'CardContent' is defined but never used - Removed unused import

### 7. app/components/manage/invite-code-manager.tsx
- [x] Line 19:28 - 'newCode' is defined but never used - Prefixed with underscore to indicate intentionally unused

### 8. app/components/manage/member-card.tsx
- [x] Line 1:10 - 'useState' is defined but never used - Removed unused import
- [x] Line 2:10 - 'Link' is defined but never used - Removed unused import
- [x] Line 10:10 - 'Button' is defined but never used - Removed unused import
- [x] Line 11:10 - 'Badge' is defined but never used - Removed unused import
- [x] Line 12:10 - 'Edit' is defined but never used - Removed unused import
- [x] Line 12:16 - 'Trash2' is defined but never used - Removed unused import
- [x] Line 12:24 - 'Crown' is defined but never used - Removed unused import
- [x] Line 12:31 - 'User' is defined but never used - Removed unused import
- [x] Line 12:37 - 'Eye' is defined but never used - Removed unused import

### 9. app/components/manage/quick-actions.tsx
- [x] Line 5:15 - 'Householdmember' is defined but never used - Removed unused import
- [x] Line 14:3 - 'currentHouseholdId' is defined but never used - Removed unused prop

### 10. app/components/navigation.tsx
- [x] Line 1:16 - 'useLocation' is defined but never used - Removed unused import
- [x] Line 3:10 - 'Badge' is defined but never used - Removed unused import
- [x] Line 7:3 - 'Settings' is defined but never used - Removed unused import
- [x] Line 8:3 - 'Plus' is defined but never used - Removed unused import
- [x] Line 10:3 - 'Users' is defined but never used - Removed unused import
- [x] Line 12:3 - 'Calendar' is defined but never used - Removed unused import
- [x] Line 13:3 - 'BarChart3' is defined but never used - Removed unused import
- [x] Line 14:3 - 'Shield' is defined but never used - Removed unused import
- [x] Line 15:3 - 'LogOut' is defined but never used - Removed unused import
- [x] Line 18:10 - 'useAuth' is defined but never used - Removed unused import

### 11. app/components/quick-notes.tsx
- [x] Line 30:20 - 'note' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 31:20 - 'noteId' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 46:10 - 'isSubmitting' is assigned a value but never used - Removed unused state variable

### 12. app/components/recent-records-list.tsx
- [x] Line 26:11 - 'RecentRecordWithType' is defined but never used - Removed unused interface
- [x] Line 37:3 - 'householdMembers' is defined but never used - Removed unused prop

### 13. app/components/records-list.tsx
- [x] Line 6:3 - 'CardDescription' is defined but never used - Removed unused import
- [x] Line 13:3 - 'Accordion' is defined but never used - Removed unused import
- [x] Line 19:21 - 'Edit' is defined but never used - Removed unused import
- [x] Line 53:9 - 'handleRecordUpdate' is assigned a value but never used - Removed unused function
- [x] Line 54:5 - 'recordId' is defined but never used - This was a function parameter, removed with function
- [x] Line 55:5 - 'updates' is defined but never used - This was a function parameter, removed with function
- [x] Line 99:14 - 'error' is defined but never used - Prefixed with underscore to indicate intentionally unused
- [x] Line 194:14 - 'recordId' is defined but never used - This is a function signature parameter, needed for type definition

### 14. app/components/tracker-history.tsx
- [x] Line 18:3 - 'User' is defined but never used - Removed unused import
- [x] Line 19:3 - 'Tag' is defined but never used - This was a false positive, Tag is used in text and logic
- [x] Line 31:18 - 'entry' is defined but never used - This is a callback parameter, needed for parent components

### 15. app/components/ui/app-header.tsx
- [x] Line 12:3 - 'Settings' is defined but never used - Removed unused import
- [x] Line 13:3 - 'Bell' is defined but never used - Removed unused import

### 16. app/components/ui/category-typeahead.tsx
- [x] Line 8:14 - 'value' is defined but never used - This was a false positive, value is used in component logic
- [x] Line 31:11 - 'categories' is assigned a value but never used - Removed unused variable

### 17. app/components/ui/dynamic-field-editor.tsx
- [x] Line 6:10 - 'Textarea' is defined but never used - Removed unused import
- [x] Line 17:14 - 'fieldId' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 17:31 - 'updates' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 18:14 - 'fieldId' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 19:17 - 'fieldId' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 20:20 - 'fieldId' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 21:16 - 'fromIndex' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 21:35 - 'toIndex' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 21:16 - 'index' is defined but never used - Removed unused prop

### 18. app/components/ui/error-boundary.tsx
- [x] Line 20:14 - 'error' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 20:28 - 'errorInfo' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 77:3 - 'showDetails' is assigned a value but never used - Removed unused prop

### 19. app/components/ui/form-validation.tsx
- [x] Line 137:3 - 'isDirty' is defined but never used - Removed unused prop

### 20. app/components/ui/interactive-card.tsx
- [x] Line 5:3 - 'CardContent' is defined but never used - Removed unused import

### 21. app/components/ui/record-detail-view.tsx
- [x] Line 30:3 - 'Eye' is defined but never used - Removed unused import
- [x] Line 31:3 - 'EyeOff' is defined but never used - Removed unused import
- [x] Line 43:15 - 'recordId' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 52:3 - 'householdId' is defined but never used - Removed unused prop
- [x] Line 95:14 - 'error' is defined but never used - Prefixed with underscore to indicate intentionally unused

### 22. app/components/ui/record-drawer.tsx
- [x] Line 20:3 - 'Eye' is defined but never used - Removed unused import
- [x] Line 21:3 - 'Save' is defined but never used - Removed unused import
- [x] Line 22:3 - 'X' is defined but never used - Removed unused import
- [x] Line 24:23 - 'RecordType' is defined but never used - Removed unused import
- [x] Line 35:3 - 'category' is defined but never used - Removed unused prop
- [x] Line 89:14 - 'error' is defined but never used - Prefixed with underscore to indicate intentionally unused

### 23. app/components/ui/records-table.tsx
- [x] Line 14:14 - 'recordId' is defined but never used - This is a callback parameter, needed for parent components
- [x] Line 21:3 - 'memberId' is defined but never used - Removed unused prop
- [x] Line 22:3 - 'category' is defined but never used - Removed unused prop
- [x] Line 23:3 - 'householdId' is defined but never used - Removed unused prop

### 24. app/contexts/auth-context.tsx
- [x] Line 20:11 - 'email' is defined but never used - This is a function parameter, needed for function signature
- [x] Line 20:26 - 'password' is defined but never used - This is a function parameter, needed for function signature
- [x] Line 21:12 - 'navigate' is defined but never used - This is a function parameter, needed for function signature
- [x] Line 22:19 - 'session' is defined but never used - This is a function parameter, needed for function signature
- [x] Line 92:16 - 'error' is defined but never used - Prefixed with underscore to indicate intentionally unused

## Progress
- [x] app/components/create-record-type-form.tsx - Removed unused 'existingCategories' prop

## Notes
- Most warnings are duplicate (both no-unused-vars and @typescript-eslint/no-unused-vars)
- Focus on removing unused imports and variables
- Check if variables might be needed for future functionality before removing
