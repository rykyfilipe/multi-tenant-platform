import { DraftOperation } from "@/widgets/domain/entities";

export const hasWidgetId = (
  operation: DraftOperation
): operation is DraftOperation & { widgetId: number } =>
  typeof (operation as DraftOperation & { widgetId: number }).widgetId === "number";
