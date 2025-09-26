import { featureFlags } from "@/config/featureFlags";

export const isWidgetsV2Enabled = (): boolean => featureFlags.WIDGETS_V2;

export const assertWidgetsV2Enabled = () => {
  if (!isWidgetsV2Enabled()) {
    throw new Error("Widgets V2 feature flag disabled");
  }
};
