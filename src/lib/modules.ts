/** @format */

import { SemanticColumnType } from "./semantic-types";

/**
 * Module definitions for the platform
 * Each module defines its tables, columns, and dependencies
 */
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tables: ModuleTableDefinition[];
  dependencies?: string[]; // other modules required
  isEnabled: boolean;
}

export interface ModuleTableDefinition {
  name: string;
  description: string;
  isProtected: boolean;
  protectedType: string;
  columns: ModuleColumnDefinition[];
}

export interface ModuleColumnDefinition {
  name: string;
  type: string;
  semanticType: SemanticColumnType;
  required: boolean;
  primary: boolean;
  order: number;
  isLocked: boolean;
  referenceTableId?: number; // for reference columns
}

/**
 * Available modules in the platform
 */
export const AVAILABLE_MODULES: Record<string, ModuleDefinition> = {
  billing: {
    id: "billing",
    name: "Billing & Invoicing",
    description: "Professional invoicing system with customer management",
    icon: "Receipt",
    isEnabled: false,
    tables: [
      {
        name: "customers",
        description: "Customer information",
        isProtected: true,
        protectedType: "customers",
        columns: [
          {
            name: "customer_name",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_NAME,
            required: true,
            primary: false,
            order: 1,
            isLocked: true,
          },
          {
            name: "customer_type",
            type: "customArray",
            semanticType: SemanticColumnType.CUSTOMER_TYPE,
            required: true,
            primary: false,
            order: 2,
            isLocked: true,
          },
          {
            name: "customer_email",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_EMAIL,
            required: true,
            primary: false,
            order: 3,
            isLocked: true,
          },
          {
            name: "customer_phone",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_PHONE,
            required: false,
            primary: false,
            order: 4,
            isLocked: true,
          },
          {
            name: "customer_cnp",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_CNP,
            required: true,
            primary: false,
            order: 5,
            isLocked: true,
          },
          {
            name: "customer_cui",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_CUI,
            required: true,
            primary: false,
            order: 6,
            isLocked: true,
          },
          {
            name: "customer_company_registration_number",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_COMPANY_REGISTRATION_NUMBER,
            required: true,
            primary: false,
            order: 7,
            isLocked: true,
          },
          {
            name: "customer_vat_number",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_VAT_NUMBER,
            required: false,
            primary: false,
            order: 8,
            isLocked: true,
          },
          {
            name: "customer_bank_account",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_BANK_ACCOUNT,
            required: false,
            primary: false,
            order: 9,
            isLocked: true,
          },
          {
            name: "customer_street",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_STREET,
            required: true,
            primary: false,
            order: 10,
            isLocked: true,
          },
          {
            name: "customer_street_number",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_STREET_NUMBER,
            required: true,
            primary: false,
            order: 11,
            isLocked: true,
          },
          {
            name: "customer_city",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_CITY,
            required: true,
            primary: false,
            order: 12,
            isLocked: true,
          },
          {
            name: "customer_country",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_COUNTRY,
            required: true,
            primary: false,
            order: 13,
            isLocked: true,
          },
          {
            name: "customer_postal_code",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_POSTAL_CODE,
            required: true,
            primary: false,
            order: 14,
            isLocked: true,
          },
          {
            name: "customer_address",
            type: "string",
            semanticType: SemanticColumnType.CUSTOMER_ADDRESS,
            required: false,
            primary: false,
            order: 15,
            isLocked: true,
          },
        ],
      },
      {
        name: "invoices",
        description: "Invoice headers",
        isProtected: true,
        protectedType: "invoices",
        columns: [
          {
            name: "invoice_number",
            type: "string",
            semanticType: SemanticColumnType.INVOICE_NUMBER,
            required: true,
            primary: false,
            order: 1,
            isLocked: true,
          },
          {
            name: "date",
            type: "date",
            semanticType: SemanticColumnType.INVOICE_DATE,
            required: true,
            primary: false,
            order: 2,
            isLocked: true,
          },
          {
            name: "due_date",
            type: "date",
            semanticType: SemanticColumnType.INVOICE_DUE_DATE,
            required: false,
            primary: false,
            order: 3,
            isLocked: true,
          },
          {
            name: "customer_id",
            type: "reference",
            semanticType: SemanticColumnType.INVOICE_CUSTOMER_ID,
            required: true,
            primary: false,
            order: 4,
            isLocked: true,
          },
          {
            name: "total_amount",
            type: "number",
            semanticType: SemanticColumnType.INVOICE_TOTAL_AMOUNT,
            required: true,
            primary: false,
            order: 5,
            isLocked: true,
          },
          {
            name: "status",
            type: "string",
            semanticType: SemanticColumnType.INVOICE_STATUS,
            required: true,
            primary: false,
            order: 6,
            isLocked: true,
          },
        ],
      },
      {
        name: "invoice_items",
        description: "Invoice line items",
        isProtected: true,
        protectedType: "invoice_items",
        columns: [
          {
            name: "invoice_id",
            type: "reference",
            semanticType: SemanticColumnType.INVOICE_ID,
            required: true,
            primary: false,
            order: 1,
            isLocked: true,
          },
          {
            name: "description",
            type: "string",
            semanticType: SemanticColumnType.DESCRIPTION,
            required: true,
            primary: false,
            order: 2,
            isLocked: true,
          },
          {
            name: "quantity",
            type: "number",
            semanticType: SemanticColumnType.QUANTITY,
            required: true,
            primary: false,
            order: 3,
            isLocked: true,
          },
          {
            name: "unit_price",
            type: "number",
            semanticType: SemanticColumnType.UNIT_PRICE,
            required: true,
            primary: false,
            order: 4,
            isLocked: true,
          },
          {
            name: "total_price",
            type: "number",
            semanticType: SemanticColumnType.TOTAL_PRICE,
            required: true,
            primary: false,
            order: 5,
            isLocked: true,
          },
        ],
      },
    ],
  },
  // Future modules can be added here
  // crm: { ... },
  // inventory: { ... },
  // projects: { ... },
};

/**
 * Get module definition by ID
 */
export function getModuleDefinition(moduleId: string): ModuleDefinition | null {
  return AVAILABLE_MODULES[moduleId] || null;
}

/**
 * Get all available modules
 */
export function getAllModules(): ModuleDefinition[] {
  return Object.values(AVAILABLE_MODULES);
}

/**
 * Check if a module is enabled for a tenant
 */
export function isModuleEnabled(tenantModules: string[], moduleId: string): boolean {
  return tenantModules.includes(moduleId);
}

/**
 * Get enabled modules for a tenant
 */
export function getEnabledModules(tenantModules: string[]): ModuleDefinition[] {
  return getAllModules().filter(module => 
    isModuleEnabled(tenantModules, module.id)
  );
}
