"use client";

import React from "react";
import { ZodObject, ZodRawShape, ZodTypeAny } from "zod";

type InferSchemaValues<TSchema extends ZodObject<ZodRawShape>> = {
  [Key in keyof TSchema["shape"]]: TSchema["shape"][Key] extends ZodTypeAny
    ? ReturnType<TSchema["shape"][Key]["parse"]>
    : unknown;
};

interface SchemaDrivenEditorProps<TSchema extends ZodObject<ZodRawShape>> {
  schema: TSchema;
  value: InferSchemaValues<TSchema>;
  onChange: (value: InferSchemaValues<TSchema>) => void;
}

export const SchemaDrivenEditor = <TSchema extends ZodObject<ZodRawShape>>({
  schema,
  value,
  onChange,
}: SchemaDrivenEditorProps<TSchema>) => {
  const handleChange = (key: keyof InferSchemaValues<TSchema>, newValue: string) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  return (
    <div className="space-y-4">
      {Object.keys(schema.shape).map((key) => (
        <div key={key} className="space-y-1 text-sm text-muted-foreground">
          <label className="block text-xs uppercase tracking-wide text-muted-foreground/70">
            {key}
          </label>
          <input
            className="mt-1 w-full rounded border border-muted-foreground/20 bg-background px-2 py-1"
            value={String((value as Record<string, unknown>)[key] ?? "")}
            onChange={(event) => handleChange(key as keyof InferSchemaValues<TSchema>, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
};
