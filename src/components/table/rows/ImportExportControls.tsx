/** @format */

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useApp } from "@/contexts/AppContext";
import { Column, Row, Table } from "@/types/database";
import { Info } from "lucide-react";
import { useState } from "react";

interface Props {
	columns: Column[];
	rows: Row[];
	table: Table;
}

function ImportExportControls({ columns, rows, table }: Props) {
	const { tenant, token, showAlert, user } = useApp();
	const tenantId = tenant?.id;

	const handleExport = () => {
		const headers = columns.map((col) => col.name);
		const csvRows = [
			headers.join(";"),
			...rows.map((row) => {
				const rowData = columns.map((col) => {
					const cell = row.cells.find((c) => c.columnId === col.id);
					return JSON.stringify(cell?.value ?? "");
				});
				return rowData.join(";");
			}),
		];

		const blob = new Blob([csvRows.join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${table.name}_rows.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const lines = text.split("\n").filter(Boolean);

			const delimiter = ";";
			const header = lines[0].split(delimiter).map((h) => h.trim());

			// Verificăm ca toate coloanele din header să existe
			const isHeaderValid = header.every((h) =>
				columns.some((c) => c.name === h),
			);
			if (!isHeaderValid) {
				showAlert("CSV-ul conține coloane necunoscute sau lipsă.", "error");
				return;
			}

			const parsedRows = lines.slice(1).map((line) => {
				const values = line.split(delimiter).map((v) => safeParse(v));

				// Verificăm dacă numărul de valori corespunde
				if (values.length !== header.length) return null;

				const cells = values.map((value, i) => {
					const col = columns.find((c) => c.name === header[i]);
					if (!col) return null;

					// Validare tip
					const isValidType =
						(col.type === "number" && typeof value === "number") ||
						(col.type === "string" && typeof value === "string") ||
						(col.type === "boolean" && typeof value === "boolean") ||
						(col.type === "date" && !isNaN(Date.parse(value)));

					if (!isValidType) return null;

					return {
						columnId: col.id,
						value,
					};
				});

				// Dacă vreo celulă este invalidă, omitem întregul rând
				if (cells.includes(null)) return null;

				return { cells: cells as { columnId: number; value: any }[] };
			});

			// Filtrăm rândurile invalide
			const validRows = parsedRows.filter((r) => r !== null);

			if (validRows.length === 0) {
				showAlert("Niciun rând valid pentru import.", "error");
				return;
			}

			const res = await fetch(
				`/api/tenants/${tenantId}/database/tables/${table.id}/rows`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ rows: validRows }),
				},
			);

			if (!res.ok) {
				const { error } = await res.json();
				showAlert("Import eșuat: " + error, "error");
			} else {
				showAlert("Import reușit!", "success");
			}
		} catch (err) {
			showAlert("Eroare la import.", "error");
		}
	};

	const safeParse = (val: string): any => {
		try {
			return JSON.parse(val);
		} catch {
			return val;
		}
	};
	const [open, setOpen] = useState(false);
	return (
		<div className='absolute right-3 bottom-3 flex items-center gap-2'>
			<Button
				className='rounded-br-none rounded-tr-none rounded-l-2xl'
				onClick={handleExport}>
				Export
			</Button>

			{user.role !== "VIEWER" && (
				<label htmlFor='import-csv'>
					<Popover open={open}>
						<PopoverTrigger asChild>
							<div
								onMouseEnter={() => setOpen(true)}
								onMouseLeave={() => setOpen(false)}>
								<Button
									asChild
									className='rounded-bl-none rounded-tl-none rounded-r-2xl bg-white text-black hover:bg-black/5'>
									<span className='flex items-center gap-1'>
										Import
										<Info className='w-4 h-4 text-muted-foreground' />
									</span>
								</Button>
							</div>
						</PopoverTrigger>
						<PopoverContent className='text-sm w-[260px] pointer-events-none'>
							Pentru ca importul să funcționeze, fișierul trebuie să conțină
							<strong> aceleași coloane</strong> ca tabela curentă.
						</PopoverContent>
					</Popover>
					<input
						type='file'
						id='import-csv'
						accept='.csv'
						className='hidden'
						onChange={handleImport}
					/>
				</label>
			)}
		</div>
	);
}

export default ImportExportControls;
