/** @format */

// Tipuri de coloane prietenoase cu utilizatorii non-programatori
export const USER_FRIENDLY_COLUMN_TYPES = {
	text: "text",           // Text liber
	number: "number",       // Număr
	yesNo: "boolean",       // Da/Nu
	date: "date",          // Dată
	link: "reference",     // Link către altă tabelă
} as const;

// Mapare pentru afișare în UI
export const COLUMN_TYPE_LABELS = {
	[USER_FRIENDLY_COLUMN_TYPES.text]: "Text",
	[USER_FRIENDLY_COLUMN_TYPES.number]: "Number",
	[USER_FRIENDLY_COLUMN_TYPES.yesNo]: "Yes/No",
	[USER_FRIENDLY_COLUMN_TYPES.date]: "Date",
	[USER_FRIENDLY_COLUMN_TYPES.link]: "Link to another table",
} as const;

// Mapare pentru proprietăți prietenoase
export const USER_FRIENDLY_PROPERTIES = {
	required: "required",           // Obligatoriu
	primary: "primary",             // Cheie principală
} as const;

// Mapare pentru afișare în UI
export const PROPERTY_LABELS = {
	[USER_FRIENDLY_PROPERTIES.required]: "Required",
	[USER_FRIENDLY_PROPERTIES.primary]: "Primary Key",
} as const;

// Descrieri pentru tooltip-uri
export const COLUMN_TYPE_DESCRIPTIONS = {
	[USER_FRIENDLY_COLUMN_TYPES.text]: "Free text input (names, descriptions, notes)",
	[USER_FRIENDLY_COLUMN_TYPES.number]: "Numbers only (prices, quantities, scores)",
	[USER_FRIENDLY_COLUMN_TYPES.yesNo]: "Simple Yes or No answers",
	[USER_FRIENDLY_COLUMN_TYPES.date]: "Calendar date selection",
	[USER_FRIENDLY_COLUMN_TYPES.link]: "Connect to data from another table",
} as const;

export const PROPERTY_DESCRIPTIONS = {
	[USER_FRIENDLY_PROPERTIES.required]: "This field must be filled in",
	[USER_FRIENDLY_PROPERTIES.primary]: "Unique identifier for this table (like an ID)",
} as const;

// Funcții helper
export function getColumnTypeLabel(type: string): string {
	return COLUMN_TYPE_LABELS[type as keyof typeof COLUMN_TYPE_LABELS] || type;
}

export function getPropertyLabel(property: string): string {
	return PROPERTY_LABELS[property as keyof typeof PROPERTY_LABELS] || property;
}

export function getColumnTypeDescription(type: string): string {
	return COLUMN_TYPE_DESCRIPTIONS[type as keyof typeof COLUMN_TYPE_DESCRIPTIONS] || "";
}

export function getPropertyDescription(property: string): string {
	return PROPERTY_DESCRIPTIONS[property as keyof typeof PROPERTY_DESCRIPTIONS] || "";
} 