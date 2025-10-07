# 🎨 Table Editor - Complete UX/UI Redesign Proposal

> **Designer:** Senior UX/UI Specialist  
> **Date:** October 7, 2025  
> **Target:** UnifiedTableEditor Component Redesign  
> **Inspiration:** Notion, Airtable, Retool, Supabase Studio, Linear

---

## 📊 Current State Analysis

### ✅ What Works Well
- **Solid functionality**: Column CRUD, data editing, filters, import/export
- **Permissions system**: Properly integrated role-based access
- **Mobile responsive**: Separate layouts for mobile/desktop
- **Modern tech stack**: shadcn/ui, Tailwind, Framer Motion

### ❌ Critical UX Issues Identified

#### 1. **Information Overload & Visual Clutter**
- Header has 5+ action buttons competing for attention
- No clear visual hierarchy between schema editing and data viewing
- Toolbar, filters, column selector, and grid all at same visual weight
- Missing "modes" - users can't focus on schema OR data

#### 2. **Poor Discoverability**
- Column properties sidebar hidden - users don't know it exists
- Advanced features (relationships, validations, constraints) buried
- No guided flow for table creation
- Missing empty states with helpful CTAs

#### 3. **Cognitive Load**
- Table name/description edit separate from column editing
- Schema changes mixed with data operations
- Un

clear save states - what's saved? what's pending?
- Filter UI appears inline, breaking visual flow

#### 4. **Interaction Pain Points**
- Column add/edit requires modal toggle
- No inline editing of column properties
- Difficult to reorder columns
- Duplicate/template column missing
- No undo/redo for schema changes

#### 5. **Mobile Experience**
- Cramped on small screens
- Too many action buttons in mobile toolbar
- Column editing difficult on mobile

---

## 🎯 Redesign Goals & Principles

### Core Principles
1. **Clarity over Complexity**: Guide users through schema design
2. **Context Switching**: Clear separation between Schema Mode & Data Mode
3. **Progressive Disclosure**: Hide advanced options until needed
4. **Spatial Consistency**: Each zone has a clear purpose
5. **Feedback First**: Always show what's happening and what changed

---

## 🏗️ New Architecture & Layout

### Layout Zones (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔝 STICKY HEADER BAR (60px)                                         │
│ ┌─────────────┬─────────────┬──────────────┬──────────────────────┐ │
│ │ ← Back      │ Table Name  │ Mode Toggle  │ Actions (Save/···)   │ │
│ └─────────────┴─────────────┴──────────────┴──────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ IF MODE = SCHEMA:                                                    │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📋 SCHEMA PANEL (Left 65%)     │ ⚙️ PROPERTIES PANEL (Right 35%)│ │
│ │                                 │                                 │ │
│ │ • Table Settings Card           │ • Selected Column Details       │ │
│ │   - Name, Description           │ • Type Picker                  │ │
│ │   - Primary Key Selection       │ • Constraints (Required, Unique│ │
│ │   - Icon Picker                 │ • Default Value                │ │
│ │                                 │ • Validation Rules             │ │
│ │ • Columns List (Sortable)       │ • Relationships                │ │
│ │   [+] Add Column                │ • Help & Examples              │ │
│ │   ├─ Column 1 [edit][delete]    │                                │ │
│ │   ├─ Column 2 [edit][delete]    │                                │ │
│ │   └─ Column 3 [edit][delete]    │                                │ │
│ │                                 │                                 │ │
│ │ • Live Preview (Mini Grid)      │                                │ │
│ └─────────────────────────────────┴─────────────────────────────────┘ │
│                                                                       │
│ IF MODE = DATA:                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📊 DATA GRID (Full Width with Filters Sidebar)                  │ │
│ │                                                                   │ │
│ │ [Toolbar: Search | Sort | Filter | Import | Export | + Add Row] │ │
│ │                                                                   │ │
│ │ ┌─────────────────────────┬─────────────────────────────────┐   │ │
│ │ │ Grid (70%)              │ 🔍 Filters Sidebar (30%)        │   │ │
│ │ │ • Editable cells        │ • Active filters                │   │ │
│ │ │ • Bulk selection        │ • Add filter button             │   │ │
│ │ │ • Row actions           │ • Saved views                   │   │ │
│ │ └─────────────────────────┴─────────────────────────────────┘   │ │
│ │                                                                   │ │
│ │ [Pagination Controls]                                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│ 🔽 STICKY FOOTER (if unsaved changes)                                │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ X unsaved changes  [Discard] [Review] [Save All]             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Structure & Hierarchy

### New Component Tree
```
TableEditorPage
├─ TableEditorHeader (Sticky Top)
│  ├─ BackButton
│  ├─ TableNameBreadcrumb
│  ├─ ModeToggle (Schema ⇄ Data)
│  └─ ActionsDropdown (Settings, Export Config, Delete Table)
│
├─ SchemaMode (Conditional)
│  ├─ TwoColumnLayout
│  │  ├─ SchemaPanel (Left 65%)
│  │  │  ├─ TableSettingsCard
│  │  │  │  ├─ TableNameInput
│  │  │  │  ├─ DescriptionTextarea
│  │  │  │  ├─ IconPicker
│  │  │  │  └─ PrimaryKeySelector
│  │  │  ├─ ColumnsListCard
│  │  │  │  ├─ AddColumnButton
│  │  │  │  └─ SortableColumnList
│  │  │  │     ├─ ColumnItem (Draggable)
│  │  │  │     │  ├─ DragHandle
│  │  │  │     │  ├─ ColumnIcon (by type)
│  │  │  │     │  ├─ ColumnName
│  │  │  │     │  ├─ ColumnType Badge
│  │  │  │     │  ├─ ConstraintsBadges (Required, Unique, FK)
│  │  │  │     │  └─ ActionsMenu (Edit, Duplicate, Delete)
│  │  │  └─ LivePreviewCard (Mini Grid, 3 sample rows)
│  │  │
│  │  └─ PropertiesPanel (Right 35%, Sticky)
│  │     ├─ PanelHeader ("Column Properties" or "No Selection")
│  │     ├─ EmptyState (if no column selected)
│  │     └─ ColumnPropertiesForm (if column selected)
│  │        ├─ BasicSettings (Name, Type, Description)
│  │        ├─ ConstraintsSection (Required, Unique, Index)
│  │        ├─ DefaultValueSection
│  │        ├─ ValidationSection (Collapsible)
│  │        ├─ RelationshipSection (Collapsible)
│  │        └─ AdvancedSection (Collapsible: Computed, Formula)
│  │
│  └─ UnsavedChangesFooter (if dirty state)
│
├─ DataMode (Conditional)
│  ├─ DataToolbar
│  │  ├─ SearchInput
│  │  ├─ QuickFilters (Status, Tags, etc.)
│  │  ├─ SortDropdown
│  │  ├─ ViewSelector (All, My Data, Recent)
│  │  ├─ ImportButton
│  │  ├─ ExportButton
│  │  └─ AddRowButton
│  │
│  ├─ TwoColumnLayout
│  │  ├─ DataGrid (70%)
│  │  │  ├─ GridHeader (Columns)
│  │  │  ├─ GridBody (Rows)
│  │  │  └─ GridFooter (Totals, Aggregations)
│  │  │
│  │  └─ FiltersSidebar (30%, Collapsible)
│  │     ├─ ActiveFilters
│  │     ├─ AddFilterButton
│  │     ├─ SavedViews
│  │     └─ ClearAll
│  │
│  └─ PaginationFooter
│
└─ GlobalModals
   ├─ ColumnEditorModal (Deep edit)
   ├─ ImportWizard
   ├─ ExportDialog
   └─ DeleteConfirmation
```

---

## 🎨 Visual Design System

### Color Palette & Semantic Colors

```typescript
const tableEditorDesignTokens = {
  // Zones
  header: {
    bg: 'bg-background',
    border: 'border-b border-border/50',
  },
  
  schemaPanel: {
    bg: 'bg-background',
    cardBg: 'bg-card',
    border: 'border-border',
  },
  
  propertiesPanel: {
    bg: 'bg-muted/30',
    cardBg: 'bg-card',
    border: 'border-l border-border',
  },
  
  // Column Type Colors (semantic)
  columnTypes: {
    text: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    number: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    boolean: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    date: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    reference: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    email: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  },
  
  // States
  states: {
    unsaved: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20',
    error: 'border-destructive bg-destructive/10',
    success: 'border-green-300 bg-green-50 dark:bg-green-900/20',
    selected: 'border-primary bg-primary/5 ring-2 ring-primary/20',
  },
  
  // Actions
  actions: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    ghost: 'hover:bg-muted',
  }
}
```

### Typography Scale
```typescript
const typography = {
  pageTitle: 'text-2xl font-bold tracking-tight',
  sectionTitle: 'text-lg font-semibold',
  cardTitle: 'text-base font-medium',
  label: 'text-sm font-medium text-muted-foreground uppercase tracking-wide',
  body: 'text-sm text-foreground',
  caption: 'text-xs text-muted-foreground',
  code: 'font-mono text-xs',
}
```

### Spacing System
```typescript
const spacing = {
  header: {
    height: '60px',
    padding: 'px-6 py-3',
  },
  content: {
    padding: 'p-6',
    gap: 'space-y-6',
  },
  card: {
    padding: 'p-4',
    gap: 'space-y-4',
  },
  section: {
    gap: 'space-y-3',
  }
}
```

---

## 📐 Detailed Component Specifications

### 1. TableEditorHeader Component

**Purpose:** Navigation, context, and primary actions

```tsx
<header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
  <div className="flex items-center justify-between h-[60px] px-6">
    {/* Left: Navigation */}
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="sm" onClick={goBack}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>
      
      <div className="h-8 w-px bg-border" />
      
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Database className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold">{table.name}</h1>
          <p className="text-xs text-muted-foreground">
            {columns?.length || 0} columns · {rowsCount} rows
          </p>
        </div>
      </div>
    </div>

    {/* Center: Mode Toggle */}
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
      <Button
        variant={mode === 'schema' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('schema')}
        className="gap-2"
      >
        <Settings className="w-4 h-4" />
        Schema
      </Button>
      <Button
        variant={mode === 'data' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('data')}
        className="gap-2"
      >
        <Database className="w-4 h-4" />
        Data
      </Button>
    </div>

    {/* Right: Actions */}
    <div className="flex items-center gap-2">
      {hasUnsavedChanges && (
        <Badge variant="secondary" className="gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          {unsavedChangesCount} unsaved
        </Badge>
      )}
      
      <Button
        onClick={handleSaveAll}
        disabled={!hasUnsavedChanges}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Save Changes
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Settings className="w-4 h-4 mr-2" />
            Table Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="w-4 h-4 mr-2" />
            Export Schema
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</header>
```

**Key UX Improvements:**
- Clear breadcrumb navigation
- Mode toggle in center for discoverability
- Unsaved changes badge always visible
- Dropdown for secondary actions

---

### 2. Schema Mode Layout

#### A. SchemaPanel (Left Side)

**Table Settings Card:**
```tsx
<Card className="mb-6">
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-primary" />
        <CardTitle>Table Settings</CardTitle>
      </div>
      <Badge variant="outline">Basic Info</Badge>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Table Name *</Label>
        <Input
          value={tableName}
          onChange={handleNameChange}
          placeholder="e.g., Customers"
          className={cn(hasNameError && "border-destructive")}
        />
        {hasNameError && (
          <p className="text-xs text-destructive mt-1">Name is required</p>
        )}
      </div>
      
      <div>
        <Label>Icon</Label>
        <IconPicker value={tableIcon} onChange={setTableIcon} />
      </div>
    </div>
    
    <div>
      <Label>Description</Label>
      <Textarea
        value={tableDescription}
        onChange={handleDescriptionChange}
        placeholder="Describe what this table stores..."
        rows={2}
      />
    </div>
    
    <div>
      <Label>Primary Key</Label>
      <Select value={primaryKey} onValueChange={setPrimaryKey}>
        <SelectTrigger>
          <SelectValue placeholder="Select primary key column" />
        </SelectTrigger>
        <SelectContent>
          {columns.map(col => (
            <SelectItem key={col.id} value={col.id.toString()}>
              {col.name} ({col.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        Unique identifier for each row
      </p>
    </div>
  </CardContent>
</Card>
```

**Columns List Card:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Table className="w-5 h-5 text-primary" />
        <CardTitle>Columns ({columns.length})</CardTitle>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddColumn}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </Button>
      </div>
    </div>
  </CardHeader>
  
  <CardContent>
    {columns.length === 0 ? (
      <EmptyState
        icon={<Table className="w-12 h-12" />}
        title="No columns yet"
        description="Add your first column to start building your table schema"
        action={
          <Button onClick={handleAddColumn} className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Column
          </Button>
        }
      />
    ) : (
      <SortableList
        items={columns}
        onReorder={handleColumnReorder}
        renderItem={(column, index) => (
          <ColumnListItem
            column={column}
            isSelected={selectedColumn?.id === column.id}
            onClick={() => selectColumn(column)}
            onEdit={() => editColumn(column)}
            onDuplicate={() => duplicateColumn(column)}
            onDelete={() => deleteColumn(column.id)}
            onToggleVisibility={() => toggleColumnVisibility(column.id)}
          />
        )}
      />
    )}
  </CardContent>
</Card>
```

**ColumnListItem Component:**
```tsx
<div
  className={cn(
    "group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
    isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20",
    !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
    column.isRequired && "border-l-4 border-l-amber-500"
  )}
  onClick={onClick}
>
  {/* Drag Handle */}
  <div className="cursor-grab active:cursor-grabbing">
    <GripVertical className="w-4 h-4 text-muted-foreground" />
  </div>
  
  {/* Column Icon (by type) */}
  <div className={cn(
    "w-8 h-8 rounded-lg flex items-center justify-center",
    getColumnTypeColor(column.type)
  )}>
    {getColumnTypeIcon(column.type)}
  </div>
  
  {/* Column Info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <h4 className="font-medium text-sm truncate">{column.name}</h4>
      
      {/* Constraints Badges */}
      {column.isRequired && (
        <Badge variant="secondary" className="text-xs">Required</Badge>
      )}
      {column.isUnique && (
        <Badge variant="secondary" className="text-xs">Unique</Badge>
      )}
      {column.referenceTableId && (
        <Badge variant="secondary" className="text-xs gap-1">
          <ArrowRight className="w-3 h-3" />
          FK
        </Badge>
      )}
    </div>
    
    <div className="flex items-center gap-2 mt-1">
      <Badge variant="outline" className={cn("text-xs", getColumnTypeColor(column.type))}>
        {column.type}
      </Badge>
      
      {column.defaultValue && (
        <span className="text-xs text-muted-foreground">
          Default: {column.defaultValue}
        </span>
      )}
    </div>
  </div>
  
  {/* Actions */}
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="sm" onClick={onEdit}>
      <Edit className="w-3 h-3" />
    </Button>
    <Button variant="ghost" size="sm" onClick={onDuplicate}>
      <Copy className="w-3 h-3" />
    </Button>
    <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
      {column.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
    </Button>
    <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
      <Trash2 className="w-3 h-3" />
    </Button>
  </div>
</div>
```

#### B. PropertiesPanel (Right Side)

**When Column Selected:**
```tsx
<div className="sticky top-[76px] space-y-6">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold">Column Properties</h3>
    <Button variant="ghost" size="sm" onClick={deselectColumn}>
      <X className="w-4 h-4" />
    </Button>
  </div>
  
  {/* Basic Settings */}
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">Basic Settings</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label>Column Name *</Label>
        <Input
          value={columnName}
          onChange={handleColumnNameChange}
          placeholder="e.g., customer_email"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Used in formulas and API
        </p>
      </div>
      
      <div>
        <Label>Display Name</Label>
        <Input
          value={displayName}
          onChange={handleDisplayNameChange}
          placeholder="e.g., Customer Email"
        />
      </div>
      
      <div>
        <Label>Data Type *</Label>
        <DataTypeSelector
          value={dataType}
          onChange={handleDataTypeChange}
          showExamples={true}
        />
      </div>
      
      <div>
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="What does this column store?"
          rows={2}
        />
      </div>
    </CardContent>
  </Card>
  
  {/* Constraints */}
  <Card>
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Constraints
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-normal">Required</Label>
          <p className="text-xs text-muted-foreground">Cannot be empty</p>
        </div>
        <Switch
          checked={isRequired}
          onCheckedChange={setIsRequired}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-normal">Unique</Label>
          <p className="text-xs text-muted-foreground">No duplicates allowed</p>
        </div>
        <Switch
          checked={isUnique}
          onCheckedChange={setIsUnique}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-normal">Indexed</Label>
          <p className="text-xs text-muted-foreground">Faster lookups</p>
        </div>
        <Switch
          checked={isIndexed}
          onCheckedChange={setIsIndexed}
        />
      </div>
    </CardContent>
  </Card>
  
  {/* Default Value */}
  <Card>
    <CardHeader>
      <CardTitle className="text-sm">Default Value</CardTitle>
    </CardHeader>
    <CardContent>
      <DefaultValueInput
        type={dataType}
        value={defaultValue}
        onChange={setDefaultValue}
      />
      <p className="text-xs text-muted-foreground mt-2">
        Applied when creating new rows
      </p>
    </CardContent>
  </Card>
  
  {/* Validation Rules (Collapsible) */}
  <Collapsible>
    <CollapsibleTrigger asChild>
      <Card className="cursor-pointer hover:bg-muted/50">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Validation Rules
            </CardTitle>
            <ChevronDown className="w-4 h-4 transition-transform" />
          </div>
        </CardHeader>
      </Card>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <ValidationRulesEditor
            type={dataType}
            rules={validationRules}
            onChange={setValidationRules}
          />
        </CardContent>
      </Card>
    </CollapsibleContent>
  </Collapsible>
  
  {/* Relationships (Collapsible, only for reference types) */}
  {dataType === 'reference' && (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link className="w-4 h-4" />
                Relationship
              </CardTitle>
              <ChevronDown className="w-4 h-4" />
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div>
              <Label>Reference Table *</Label>
              <Select value={referenceTableId} onValueChange={setReferenceTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Display Column</Label>
              <Select value={displayColumnId} onValueChange={setDisplayColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column to display" />
                </SelectTrigger>
                <SelectContent>
                  {referenceTableColumns.map(col => (
                    <SelectItem key={col.id} value={col.id.toString()}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Which column to show when selecting a reference
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-normal">Cascade Delete</Label>
                <p className="text-xs text-muted-foreground">
                  Delete this row when referenced row is deleted
                </p>
              </div>
              <Switch
                checked={cascadeDelete}
                onCheckedChange={setCascadeDelete}
              />
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )}
  
  {/* Advanced Options (Collapsible) */}
  <Collapsible>
    <CollapsibleTrigger asChild>
      <Card className="cursor-pointer hover:bg-muted/50">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4" />
              Advanced
            </CardTitle>
            <Badge variant="outline" className="text-xs">Beta</Badge>
          </div>
        </CardHeader>
      </Card>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-normal">Computed Field</Label>
              <p className="text-xs text-muted-foreground">
                Calculate value from other columns
              </p>
            </div>
            <Switch
              checked={isComputed}
              onCheckedChange={setIsComputed}
            />
          </div>
          
          {isComputed && (
            <div>
              <Label>Formula</Label>
              <Textarea
                value={formula}
                onChange={setFormula}
                placeholder="e.g., {quantity} * {unit_price}"
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </CollapsibleContent>
  </Collapsible>
</div>
```

**Live Preview Card (Bottom of SchemaPanel):**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm flex items-center gap-2">
        <Eye className="w-4 h-4" />
        Live Preview
      </CardTitle>
      <Badge variant="outline" className="text-xs">
        Sample Data
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="border rounded-lg overflow-hidden">
      {/* Mini grid with 3 sample rows showing column structure */}
      <MiniGrid columns={columns} sampleRows={3} />
    </div>
  </CardContent>
</Card>
```

---

### 3. Data Mode Layout

**Toolbar:**
```tsx
<div className="sticky top-[60px] z-40 bg-background border-b border-border">
  <div className="flex items-center justify-between px-6 py-3">
    {/* Left: Search & Filters */}
    <div className="flex items-center gap-3 flex-1">
      <div className="relative w-80">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search in all columns..."
          value={searchQuery}
          onChange={handleSearch}
          className="pl-9"
        />
      </div>
      
      <Button
        variant={showFilters ? "default" : "outline"}
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
      
      <Select value={savedView} onValueChange={setSavedView}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Rows" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Rows</SelectItem>
          <SelectItem value="recent">Recently Added</SelectItem>
          <SelectItem value="mine">My Rows</SelectItem>
          <SelectSeparator />
          <SelectItem value="create">+ Create View</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    {/* Right: Actions */}
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleImport}>
        <Upload className="w-4 h-4 mr-2" />
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button onClick={handleAddRow} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Row
      </Button>
    </div>
  </div>
</div>
```

**Grid + Filters Sidebar:**
```tsx
<div className="flex gap-6 px-6 py-4">
  {/* Main Grid (70%) */}
  <div className="flex-1">
    <EnhancedDataGrid
      columns={columns}
      rows={rows}
      onCellEdit={handleCellEdit}
      onRowDelete={handleRowDelete}
      onSort={handleSort}
      selection={selectedRows}
      onSelectionChange={setSelectedRows}
    />
  </div>
  
  {/* Filters Sidebar (30%, Collapsible) */}
  {showFilters && (
    <div className="w-80 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Active Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeFilters.map(filter => (
            <FilterChip
              key={filter.id}
              filter={filter}
              onEdit={() => editFilter(filter)}
              onRemove={() => removeFilter(filter.id)}
            />
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={addFilter}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Filter
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Saved Views</CardTitle>
        </CardHeader>
        <CardContent>
          <SavedViewsList
            views={savedViews}
            activeView={currentView}
            onSelectView={applyView}
            onSaveCurrentView={saveCurrentView}
          />
        </CardContent>
      </Card>
    </div>
  )}
</div>
```

---

## 🎯 Key UX Enhancements

### 1. Mode Switching (Schema ⇄ Data)
- **Schema Mode**: Focus on table structure, columns, relationships
- **Data Mode**: Focus on viewing/editing actual data
- **Benefit**: Reduces cognitive load, clearer task context

### 2. Inline Column Editing
- Click column in list → properties panel updates
- No modal required for basic edits
- Side-by-side: list + properties

### 3. Drag & Drop Reordering
- Visual feedback during drag
- Auto-scroll when dragging near edges
- Instant visual update

### 4. Smart Empty States
```tsx
// When no columns exist
<EmptyState
  illustration={<TableIllustration />}
  title="Start Building Your Table"
  description="Add columns to define what data this table will store"
  primaryAction={{
    label: "Add First Column",
    icon: <Plus />,
    onClick: handleAddColumn
  }}
  secondaryAction={{
    label: "Use Template",
    onClick: showTemplates
  }}
/>
```

### 5. Contextual Help & Tooltips
```tsx
<Tooltip>
  <TooltipTrigger>
    <Info className="w-3 h-3 text-muted-foreground" />
  </TooltipTrigger>
  <TooltipContent side="right" className="max-w-xs">
    <p className="font-medium mb-1">Foreign Key</p>
    <p className="text-xs">
      Creates a relationship to another table. When selected, 
      users can pick from existing rows in the referenced table.
    </p>
    <div className="mt-2 p-2 bg-muted rounded text-xs">
      <strong>Example:</strong> customer_id → Customers table
    </div>
  </TooltipContent>
</Tooltip>
```

### 6. Data Type Picker (Enhanced)
```tsx
<div className="grid grid-cols-2 gap-2">
  {DATA_TYPES.map(type => (
    <button
      key={type.value}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
        selectedType === type.value 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
      onClick={() => selectType(type.value)}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        getTypeColor(type.value)
      )}>
        {type.icon}
      </div>
      <div className="text-left flex-1">
        <div className="font-medium text-sm">{type.label}</div>
        <div className="text-xs text-muted-foreground">{type.example}</div>
      </div>
    </button>
  ))}
</div>

// Example types:
const DATA_TYPES = [
  { 
    value: 'text', 
    label: 'Text', 
    icon: <Type className="w-4 h-4" />, 
    example: 'John Doe',
    color: 'bg-blue-100 text-blue-700'
  },
  { 
    value: 'number', 
    label: 'Number', 
    icon: <Hash className="w-4 h-4" />, 
    example: '42',
    color: 'bg-green-100 text-green-700'
  },
  { 
    value: 'email', 
    label: 'Email', 
    icon: <Mail className="w-4 h-4" />, 
    example: 'user@example.com',
    color: 'bg-cyan-100 text-cyan-700'
  },
  // ... more types
]
```

### 7. Unsaved Changes Footer
```tsx
<AnimatePresence>
  {hasUnsavedChanges && (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-amber-50 dark:bg-amber-900/20 border-t-2 border-amber-300"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-sm">
                You have {unsavedChangesCount} unsaved change{unsavedChangesCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {changesDescription}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDiscardChanges}
            >
              Discard
            </Button>
            <Button
              variant="outline"
              onClick={handleReviewChanges}
            >
              Review Changes
            </Button>
            <Button
              onClick={handleSaveAll}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save All Changes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## 🎨 Visual Design Enhancements

### Iconography for Column Types
```typescript
const COLUMN_TYPE_ICONS = {
  text: <Type className="w-4 h-4" />,
  number: <Hash className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  url: <Link className="w-4 h-4" />,
  boolean: <ToggleLeft className="w-4 h-4" />,
  date: <Calendar className="w-4 h-4" />,
  datetime: <Clock className="w-4 h-4" />,
  reference: <ArrowRight className="w-4 h-4" />,
  file: <File className="w-4 h-4" />,
  json: <Braces className="w-4 h-4" />,
}
```

### Column Type Color Coding
```typescript
const getColumnTypeColor = (type: string) => {
  const colors = {
    text: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200',
    number: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200',
    boolean: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200',
    date: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200',
    reference: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200',
    email: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200',
  };
  return colors[type] || colors.text;
}
```

### Constraint Badges Design
```tsx
// In column list item
{column.isRequired && (
  <Badge 
    variant="secondary" 
    className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30"
  >
    <Asterisk className="w-3 h-3 mr-1" />
    Required
  </Badge>
)}

{column.isUnique && (
  <Badge 
    variant="secondary" 
    className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30"
  >
    <Fingerprint className="w-3 h-3 mr-1" />
    Unique
  </Badge>
)}

{column.referenceTableId && (
  <Badge 
    variant="secondary" 
    className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/30"
  >
    <Link className="w-3 h-3 mr-1" />
    FK → {referenceTableName}
  </Badge>
)}
```

---

## ⌨️ Keyboard Shortcuts & Accessibility

### Keyboard Navigation
```
Schema Mode:
- Cmd/Ctrl + N: Add new column
- Cmd/Ctrl + S: Save changes
- Cmd/Ctrl + Z: Undo
- Cmd/Ctrl + Shift + Z: Redo
- Tab: Navigate between fields
- Escape: Close sidebar/modal
- Arrow Up/Down: Navigate columns list
- Enter: Edit selected column

Data Mode:
- Cmd/Ctrl + F: Focus search
- Cmd/Ctrl + K: Open command palette
- Cmd/Ctrl + N: Add new row
- Delete: Delete selected rows
- Cmd/Ctrl + A: Select all rows
```

### ARIA Labels & Focus Management
```tsx
<div
  role="grid"
  aria-label="Table data grid"
  aria-rowcount={totalRows}
  aria-colcount={columns.length}
>
  {/* Grid content */}
</div>

<button
  aria-label="Edit column name"
  aria-describedby="column-name-hint"
  onClick={handleEdit}
>
  <Edit className="w-4 h-4" />
</button>

<span id="column-name-hint" className="sr-only">
  Click to edit column name and properties
</span>
```

---

## 📱 Mobile Responsive Strategy

### Mobile Layout (< 768px)

```
┌─────────────────────────────┐
│ Header (Compact)            │
│ [←] Table Name    [•••]     │
├─────────────────────────────┤
│ Mode Tabs                   │
│ [Schema] [Data]             │
├─────────────────────────────┤
│ IF SCHEMA:                  │
│ • Accordion Style           │
│ • Table Settings (expanded) │
│ • Columns (expanded)        │
│   └─ Each column = Card     │
│ • Properties (modal on tap) │
│                             │
│ IF DATA:                    │
│ • Card-based rows           │
│ • Swipe actions (edit/del)  │
│ • Bottom sheet for filters  │
└─────────────────────────────┘
```

---

## 🔄 Interaction Flows

### Flow 1: Adding a New Column
```
1. User clicks "+ Add Column" button
2. Properties panel focuses (if in Schema mode) or modal opens (Data mode)
3. Form appears with:
   - Column name input (autofocused)
   - Type picker (visual grid)
   - Description (optional, collapsed)
4. User fills name, picks type
5. Advanced options collapsed by default
6. "Create Column" button at bottom
7. On create:
   - Column appears in list (highlighted)
   - Auto-selected in properties panel
   - Success toast
   - List scrolls to new column
```

### Flow 2: Editing Column Properties
```
1. User clicks column in list
2. Properties panel updates (smooth transition)
3. All edits are live (debounced auto-save)
4. Visual indicator: column has unsaved changes
5. User can:
   - Edit inline in properties panel
   - Or click "Advanced Edit" for modal
6. Changes saved on blur or explicit Save
```

### Flow 3: Switching Modes
```
1. User clicks "Data" tab in header
2. Smooth transition animation
3. If unsaved schema changes:
   - Warning dialog: "Save schema changes first?"
   - Options: [Save & Continue] [Discard] [Cancel]
4. Data mode loads
5. Previous scroll position remembered
```

---

## 🎯 Empty States Design

### No Columns Yet
```tsx
<div className="flex items-center justify-center py-16">
  <div className="text-center max-w-md">
    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
      <Table className="w-10 h-10 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2">
      Define Your Table Structure
    </h3>
    <p className="text-muted-foreground mb-6">
      Add columns to specify what data this table will store. 
      You can always modify the schema later.
    </p>
    <div className="flex items-center justify-center gap-3">
      <Button onClick={handleAddColumn} size="lg" className="gap-2">
        <Plus className="w-5 h-5" />
        Add First Column
      </Button>
      <Button variant="outline" size="lg" onClick={showTemplates}>
        Use Template
      </Button>
    </div>
    <div className="mt-8 grid grid-cols-3 gap-4 text-left">
      <FeatureCard
        icon={<Type />}
        title="Multiple Types"
        description="Text, numbers, dates, references, and more"
      />
      <FeatureCard
        icon={<Link />}
        title="Relationships"
        description="Connect tables with foreign keys"
      />
      <FeatureCard
        icon={<Shield />}
        title="Validation"
        description="Add constraints and rules"
      />
    </div>
  </div>
</div>
```

### No Data Yet
```tsx
<div className="flex items-center justify-center py-16">
  <div className="text-center max-w-md">
    <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
    <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
    <p className="text-sm text-muted-foreground mb-6">
      This table is empty. Start adding rows or import data from a CSV file.
    </p>
    <div className="flex items-center justify-center gap-3">
      <Button onClick={handleAddRow} className="gap-2">
        <Plus className="w-4 h-4" />
        Add First Row
      </Button>
      <Button variant="outline" onClick={handleImport}>
        <Upload className="w-4 h-4 mr-2" />
        Import CSV
      </Button>
    </div>
  </div>
</div>
```

---

## 🎭 Animation & Micro-interactions

### Smooth Transitions
```typescript
const transitions = {
  modeSwitch: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  
  columnSelect: {
    propertiesPanel: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.15 }
    }
  },
  
  saveSuccess: {
    badge: {
      initial: { scale: 0 },
      animate: { scale: 1 },
      exit: { scale: 0, opacity: 0 }
    }
  }
}
```

### Hover Effects
```css
/* Column list item */
.column-item {
  @apply transition-all duration-200;
  @apply hover:shadow-md hover:-translate-y-0.5;
}

/* Action buttons */
.action-button {
  @apply opacity-0 group-hover:opacity-100;
  @apply transition-opacity duration-200;
}

/* Type badge */
.type-badge {
  @apply transition-transform duration-200;
  @apply hover:scale-105;
}
```

---

## 🚀 Quick Wins for Immediate Impact

### Phase 1: Visual Clarity (Low effort, high impact)
1. ✅ Add Mode Toggle (Schema/Data) in header
2. ✅ Separate column list from properties panel
3. ✅ Add color coding for column types
4. ✅ Implement unsaved changes footer
5. ✅ Add empty states with CTAs

### Phase 2: Interaction Polish
1. ✅ Inline column editing in properties panel
2. ✅ Drag-and-drop column reordering
3. ✅ Duplicate column action
4. ✅ Keyboard shortcuts
5. ✅ Improved tooltips and help text

### Phase 3: Advanced Features
1. ✅ Validation rules builder
2. ✅ Computed fields
3. ✅ Saved views for data mode
4. ✅ Column templates
5. ✅ Schema versioning/history

---

## 📏 Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: '< 768px',   // Single column, stacked, modals
  tablet: '768-1024px', // Compact two-column
  desktop: '> 1024px',  // Full layout with sidebar
}

// Mobile: Stack everything, use bottom sheets
// Tablet: Collapsible sidebar, reduced spacing
// Desktop: Full split-view layout
```

---

## 🎯 Success Metrics

### Usability Metrics
- Time to add first column: < 30 seconds
- Schema comprehension: Users understand table structure in < 2 minutes
- Error rate: < 5% invalid column configurations
- Task completion: > 90% complete table creation without help

### Technical Metrics
- Render time: < 200ms for mode switch
- Input responsiveness: < 16ms (60fps)
- Bundle size: Keep under 100KB for editor components

---

## 🔧 Implementation Recommendations

### File Structure
```
src/components/table/editor-v2/
├── TableEditorPage.tsx (Main container)
├── header/
│   ├── EditorHeader.tsx
│   ├── ModeToggle.tsx
│   └── ActionsMenu.tsx
├── schema-mode/
│   ├── SchemaLayout.tsx
│   ├── SchemaPanel.tsx
│   │   ├── TableSettingsCard.tsx
│   │   ├── ColumnsListCard.tsx
│   │   │   ├── ColumnListItem.tsx
│   │   │   └── AddColumnButton.tsx
│   │   └── LivePreviewCard.tsx
│   └── PropertiesPanel.tsx
│       ├── BasicSettingsSection.tsx
│       ├── ConstraintsSection.tsx
│       ├── DefaultValueSection.tsx
│       ├── ValidationSection.tsx
│       ├── RelationshipSection.tsx
│       └── AdvancedSection.tsx
├── data-mode/
│   ├── DataLayout.tsx
│   ├── DataToolbar.tsx
│   ├── DataGrid.tsx
│   └── FiltersSidebar.tsx
├── shared/
│   ├── UnsavedChangesFooter.tsx
│   ├── EmptyStates.tsx
│   ├── DataTypePicker.tsx
│   └── ValidationRulesEditor.tsx
└── hooks/
    ├── useTableEditor.ts
    ├── useSchemaMode.ts
    └── useDataMode.ts
```

### State Management Strategy
```typescript
// Use zustand for editor state
const useTableEditorStore = create<TableEditorState>((set) => ({
  // Mode
  mode: 'schema' | 'data',
  setMode: (mode) => set({ mode }),
  
  // Schema state
  selectedColumn: null,
  columns: [],
  unsavedSchemaChanges: [],
  
  // Data state
  filters: [],
  sortBy: null,
  selectedRows: [],
  
  // Actions
  selectColumn: (column) => set({ selectedColumn: column }),
  updateColumn: (columnId, updates) => { /* ... */ },
  addColumn: (column) => { /* ... */ },
  deleteColumn: (columnId) => { /* ... */ },
  reorderColumns: (from, to) => { /* ... */ },
}))
```

---

## 🎨 Color Palette Recommendations

```typescript
const editorPalette = {
  // Backgrounds
  page: 'bg-neutral-50 dark:bg-neutral-950',
  panel: 'bg-white dark:bg-neutral-900',
  card: 'bg-white dark:bg-neutral-900',
  muted: 'bg-neutral-100 dark:bg-neutral-800',
  
  // Borders
  border: 'border-neutral-200 dark:border-neutral-800',
  borderHover: 'border-neutral-300 dark:border-neutral-700',
  borderFocus: 'border-primary',
  
  // Text
  foreground: 'text-neutral-900 dark:text-neutral-100',
  muted: 'text-neutral-600 dark:text-neutral-400',
  
  // States
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200',
}
```

---

## ✨ Final Recommendations

### Immediate Actions (Week 1)
1. **Implement Mode Toggle**: Separate schema and data views
2. **Refactor Layout**: Split into SchemaPanel + PropertiesPanel
3. **Add Visual Feedback**: Unsaved changes footer
4. **Color Code Types**: Make column types visually distinct

### Short-term (Weeks 2-3)
1. **Inline Editing**: Properties panel instead of modals
2. **Drag-and-Drop**: Column reordering
3. **Empty States**: Helpful CTAs when no columns/data
4. **Keyboard Shortcuts**: Power user features

### Long-term (Month 2+)
1. **Validation Builder**: Visual rule creator
2. **Computed Fields**: Formula editor
3. **Schema Versioning**: Track changes over time
4. **Templates Library**: Quick-start schemas

---

## 📊 Before & After Comparison

### Current Issues → Solutions

| Issue | Current State | Redesigned Solution |
|-------|--------------|---------------------|
| **Mode Confusion** | Schema + Data mixed | Clear Schema/Data mode toggle |
| **Column Editing** | Modal for everything | Inline properties panel |
| **Visual Hierarchy** | Flat, cluttered | Zoned layout with clear sections |
| **Discoverability** | Hidden features | Progressive disclosure |
| **Unsaved Changes** | Unclear state | Persistent footer with count |
| **Mobile UX** | Cramped | Bottom sheets, card-based |
| **Empty States** | Blank screen | Helpful CTAs and examples |
| **Type Clarity** | Text only | Icons + colors + badges |

---

## 🎬 Conclusion

This redesign transforms the Table Editor from a **functional but overwhelming** interface into a **guided, professional, and delightful** experience that:

✅ **Reduces cognitive load** through mode separation  
✅ **Improves discoverability** with clear visual hierarchy  
✅ **Enhances productivity** with inline editing and shortcuts  
✅ **Guides users** with empty states and contextual help  
✅ **Scales beautifully** from mobile to desktop  
✅ **Feels premium** with polished micro-interactions  

**Next Steps:** 
1. Review this proposal with the team
2. Create interactive prototype in Figma
3. Implement Phase 1 (Mode Toggle + Visual Clarity)
4. User testing with 5-10 target users
5. Iterate based on feedback

---

*This redesign follows industry best practices from Notion, Airtable, Retool, and Supabase Studio while maintaining your existing design system and component library.*

