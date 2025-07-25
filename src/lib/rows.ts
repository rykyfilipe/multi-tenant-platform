/** @format */

import prisma from "@/lib/prisma";

type Column = {
	id: number;
	name: string;
	type: string;
	required: boolean;
};

type CellInput = {
	columnId: number;
	value?: any;
};

interface RowInput {
	cells: CellInput[];
}

export async function createRowWithCells(
	tableId: number,
	tableColumns: Column[],
	rowData: RowInput,
) {
	const columnsMap = new Map<number, Column>(
		tableColumns.map((c) => [c.id, c]),
	);

	// Eliminăm duplicate columnId
	const seenColumnIds = new Set<number>();
	const uniqueCells = rowData.cells.filter((cell) => {
		if (seenColumnIds.has(cell.columnId)) return false;
		seenColumnIds.add(cell.columnId);
		return true;
	});

	// Păstrăm doar coloanele valide
	const validCells = uniqueCells.filter((cell) =>
		columnsMap.has(cell.columnId),
	);

	// Validăm și convertim valorile trimise
	const cellsToCreateWithoutRowId = validCells.map((cell) => {
		const col = columnsMap.get(cell.columnId)!;

		let value: string;

		switch (col.type) {
			case "number":
				const num = Number(cell.value);
				if (isNaN(num)) {
					if (col.required) {
						throw new Error(`Column '${col.name}' requires a valid number`);
					}
					value = "";
				} else {
					value = num.toString();
				}
				break;

			case "boolean":
				if (
					cell.value === "true" ||
					cell.value === true ||
					cell.value === 1 ||
					cell.value === "1"
				) {
					value = "true";
				} else if (
					cell.value === "false" ||
					cell.value === false ||
					cell.value === 0 ||
					cell.value === "0"
				) {
					value = "false";
				} else {
					if (col.required) {
						throw new Error(`Column '${col.name}' requires a valid boolean`);
					}
					value = "";
				}
				break;

			case "date":
				const date = new Date(cell.value);
				if (isNaN(date.getTime())) {
					if (col.required) {
						throw new Error(`Column '${col.name}' requires a valid date`);
					}
					value = "";
				} else {
					value = date.toISOString();
				}
				break;

			case "string":
			default:
				value =
					cell.value !== undefined && cell.value !== null
						? String(cell.value)
						: "";
				break;
		}

		return {
			columnId: col.id,
			value,
		};
	});

	// Adăugăm coloanele care NU sunt în cells, dar NU sunt required (valori goale)
	for (const col of tableColumns) {
		if (
			!cellsToCreateWithoutRowId.some((c) => c.columnId === col.id) &&
			!col.required
		) {
			cellsToCreateWithoutRowId.push({
				columnId: col.id,
				value: "",
			});
		}
	}

	// Verificăm că toate coloanele required sunt prezente
	for (const col of tableColumns) {
		if (
			col.required &&
			!cellsToCreateWithoutRowId.some((c) => c.columnId === col.id)
		) {
			throw new Error(`Missing required column '${col.name}' in row data`);
		}
	}

	// Creăm rândul
	const createdRow = await prisma.row.create({
		data: {
			tableId,
		},
	});

	// Adăugăm rowId în celule acum
	const cellsToCreate = cellsToCreateWithoutRowId.map((cell) => ({
		rowId: createdRow.id,
		...cell,
	}));

	// Creăm celulele
	await Promise.all(
		cellsToCreate.map((cellData) =>
			prisma.cell.create({
				data: cellData,
			}),
		),
	);

	return createdRow;
}
