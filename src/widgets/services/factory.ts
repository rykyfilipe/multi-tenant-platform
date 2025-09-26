import prisma from "@/lib/prisma";
import { WidgetService } from "./widget-service";

let widgetService: WidgetService | null = null;

export const getWidgetService = (): WidgetService => {
  if (!widgetService) {
    widgetService = new WidgetService(prisma);
  }

  return widgetService;
};
