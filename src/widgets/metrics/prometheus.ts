import client from "prom-client";

const widgetSaveAttempts = new client.Counter({
  name: "widget_save_attempts",
  help: "Total widget save attempts",
});

const widgetSaveConflicts = new client.Counter({
  name: "widget_save_conflicts",
  help: "Total widget save conflicts",
});

const widgetSaveDuration = new client.Histogram({
  name: "widget_save_duration_ms",
  help: "Duration of widget save operations",
  buckets: [10, 25, 50, 75, 100, 250, 500, 1000, 2000],
});

export const recordSaveAttempt = () => widgetSaveAttempts.inc();
export const recordConflict = () => widgetSaveConflicts.inc();
export const recordDuration = (durationMs: number) => widgetSaveDuration.observe(durationMs);
