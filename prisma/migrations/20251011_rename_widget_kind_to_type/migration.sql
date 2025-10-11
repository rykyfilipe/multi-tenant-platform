-- Rename enum from WidgetKind to WidgetType
ALTER TYPE "WidgetKind" RENAME TO "WidgetType";

-- Rename column in Widget table
ALTER TABLE "Widget" RENAME COLUMN "kind" TO "type";

-- Rename column in WidgetSnapshot table
ALTER TABLE "WidgetSnapshot" RENAME COLUMN "kind" TO "type";

-- Rename column in WidgetDraft table
ALTER TABLE "WidgetDraft" RENAME COLUMN "kind" TO "type";

