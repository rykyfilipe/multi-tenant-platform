<!-- @format -->

# Multiple Reference Selection

## Overview

This feature allows users to create columns of type "reference" that can store
multiple values from the referenced table, instead of just one value.

## How It Works

### 1. Column Creation

When creating a new column of type "reference", users can now specify:

- **Reference Table**: The table to link to
- **Multiple Selection**: Whether to allow selecting multiple rows (checkbox)

### 2. Data Storage

- **Single Selection**: Stores a single value (string/number) as before
- **Multiple Selection**: Stores an array of values (string[]/number[])

### 3. User Interface

#### Column Editor

- New checkbox "Allow Multiple Selection" appears for reference type columns
- Only visible when column type is "reference"

#### Row Editor

- **Single Selection**: Uses existing `SearchableReferenceSelect` component
- **Multiple Selection**: Uses new `MultipleReferenceSelect` component
- Shows selected items as badges with remove buttons
- Displays count of selected items

### 4. Database Schema

The `Column` model now includes:

```prisma
model Column {
  // ... existing fields
  isMultiple Boolean @default(false)
}
```

## Implementation Details

### Components

#### MultipleReferenceSelect

- New component for handling multiple reference selection
- Supports search, keyboard navigation, and multiple selection
- Shows selected items as badges with remove functionality
- Handles both single and multiple selection modes

#### EditableCell (Rows)

- Updated to use appropriate selection component based on `isMultiple`
- Handles display of multiple values
- Shows validation errors for invalid references

### API Endpoints

#### Column Creation

- `POST /api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/columns`
- Now accepts `isMultiple` field in request body

#### Column Update

- `PATCH /api/tenants/[tenantId]/databases/[databaseId]/tables/[tableId]/columns/[columnId]`
- Now accepts `isMultiple` field in request body

### Data Validation

- `isMultiple` field is only applicable to columns of type "reference"
- For multiple selection columns, values are stored as arrays
- For single selection columns, values are stored as single values

## Usage Examples

### Creating a Multiple Reference Column

1. Go to table columns page
2. Click "Add Column"
3. Set type to "Link to another table"
4. Select reference table
5. Check "Allow Multiple Selection"
6. Save column

### Editing Multiple Reference Values

1. Double-click on a cell in a multiple reference column
2. Use the dropdown to select/deselect multiple rows
3. Selected items appear as badges
4. Click X on badges to remove individual selections
5. Use search to find specific rows
6. Save changes

## Benefits

1. **Flexibility**: Users can now store multiple related records in a single
   column
2. **Data Integrity**: Maintains referential integrity with the referenced table
3. **User Experience**: Intuitive interface for selecting multiple items
4. **Performance**: Efficient search and selection with keyboard navigation

## Technical Notes

- Values are stored as JSON arrays in the database
- The UI automatically handles conversion between single and multiple values
- Backward compatibility is maintained for existing single reference columns
- Validation ensures only valid reference table IDs are accepted

## Future Enhancements

1. **Bulk Operations**: Select multiple rows and apply operations to all
   referenced items
2. **Advanced Filtering**: Filter rows based on multiple reference values
3. **Export/Import**: Support for bulk import/export of multiple reference data
4. **Performance Optimization**: Caching and lazy loading for large reference
   tables
