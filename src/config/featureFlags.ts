export interface FeatureFlags {
  readonly WIDGETS_V2: boolean;
}

export const featureFlags: FeatureFlags = {
  WIDGETS_V2: process.env.NEXT_PUBLIC_WIDGETS_V2 === "true",
};
