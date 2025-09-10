import prisma from "./prisma";

/**
 * Verifică dacă o valoare este unică pentru o coloană specificată
 * @param columnId - ID-ul coloanei
 * @param value - Valoarea de verificat
 * @param excludeRowId - ID-ul rândului de exclus din verificare (pentru update)
 * @returns Promise<boolean> - true dacă valoarea este unică, false altfel
 */
export async function isValueUnique(
	columnId: number,
	value: any,
	excludeRowId?: number
): Promise<boolean> {
	if (value === null || value === undefined || value === "") {
		return true; // Valorile goale sunt considerate unice
	}

	const whereClause: any = {
		columnId: columnId,
		value: value,
	};

	// Exclude specific row for update operations
	if (excludeRowId) {
		whereClause.rowId = {
			not: excludeRowId,
		};
	}

	const existingCell = await prisma.cell.findFirst({
		where: whereClause,
	});

	return !existingCell;
}

/**
 * Verifică dacă o coloană are constraint de unique
 * @param columnId - ID-ul coloanei
 * @returns Promise<boolean> - true dacă coloana are constraint de unique
 */
export async function isColumnUnique(columnId: number): Promise<boolean> {
	const column = await prisma.column.findUnique({
		where: { id: columnId },
		select: { unique: true },
	});

	return column?.unique || false;
}

/**
 * Validează unique constraint pentru o valoare
 * @param columnId - ID-ul coloanei
 * @param value - Valoarea de validat
 * @param excludeRowId - ID-ul rândului de exclus (pentru update)
 * @returns Promise<{ isValid: boolean; error?: string }>
 */
export async function validateUniqueConstraint(
	columnId: number,
	value: any,
	excludeRowId?: number
): Promise<{ isValid: boolean; error?: string }> {
	const isUnique = await isColumnUnique(columnId);
	
	if (!isUnique) {
		return { isValid: true };
	}

	const isValueUniqueResult = await isValueUnique(columnId, value, excludeRowId);
	
	if (!isValueUniqueResult) {
		return {
			isValid: false,
			error: `Value "${value}" already exists. This column requires unique values.`,
		};
	}

	return { isValid: true };
}
