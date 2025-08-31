/** @format */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useLanguage } from "@/contexts/LanguageContext";
import { Table2, X, AlertTriangle } from "lucide-react";
import { SheetDescription } from "../ui/sheet";

interface TableBasicsFormProps {
	name: string;
	setName: (name: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
	loading: boolean;
	description: string;
	setDescription: (name: string) => void;
}

export function TableBasicsForm({
	name,
	setName,
	onSubmit,
	onCancel,
	loading,
	description,
	setDescription,
}: TableBasicsFormProps) {
	const { validateTableName } = useDatabase();
	const { showAlert } = useApp();
	const { checkLimit, currentPlan } = usePlanLimits();
	const { t } = useLanguage();

	return (
		<div className='space-y-6'>
			<div className='text-center'>
				<div className='flex items-center justify-center space-x-3 mb-3'>
					<div className='p-3 bg-primary/10 rounded-xl'>
						<Table2 className='h-6 w-6 text-primary' />
					</div>
				</div>
				<h3 className='text-lg font-semibold text-foreground mb-2'>
					{t("database.tableBasics.title")}
				</h3>
				<p className='text-sm text-muted-foreground'>
					{t("database.tableBasics.subtitle")}
				</p>
			</div>

			{/* Plan Limit Info */}
			{(() => {
				const tableLimit = checkLimit("tables");
				return (
					<div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
						<div className='flex items-center justify-between mb-2'>
							<div className='flex items-center gap-2'>
								<Table2 className='w-4 h-4 text-blue-600' />
								<span className='text-sm font-medium text-blue-900'>
									{t("database.tableBasics.tableLimit")}
								</span>
							</div>
							<Badge
								variant={tableLimit.allowed ? "default" : "destructive"}
								className='text-xs'>
								{tableLimit.current} / {tableLimit.limit}
							</Badge>
						</div>
						<p className='text-xs text-blue-700'>
							{tableLimit.allowed
								? t("database.tableBasics.canCreateMore", {
										count: tableLimit.limit - tableLimit.current,
								  })
								: t("database.tableBasics.reachedPlanLimit")}
						</p>
					</div>
				);
			})()}

			<form onSubmit={onSubmit} className='space-y-6'>
				<div className='space-y-3'>
					<Label
						htmlFor='tableName'
						className='text-sm font-medium text-foreground'>
						{t("database.tableBasics.tableName")}
					</Label>
					<Input
						id='tableName'
						type='text'
						value={name}
						onChange={(e) => {
							if (validateTableName(e.target.value)) setName(e.target.value);
							else {
								showAlert(t("database.tableBasics.tableNameTaken"), "error");
								return;
							}
						}}
						placeholder={t("database.tableBasics.tableNamePlaceholder")}
						required
						className='table-name h-11 px-4 rounded-lg border-border/20 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'
					/>
				</div>

				<div className='space-y-3'>
					<Label
						htmlFor='tableDescription'
						className='text-sm font-medium text-foreground'>
						{t("database.tableBasics.description")}
					</Label>
					<Input
						id='tableDescription'
						type='text'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder={t("database.tableBasics.descriptionPlaceholder")}
						required
						className='table-description h-11 px-4 rounded-lg border-border/20 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'
					/>
				</div>

				<div className='flex space-x-3 pt-6'>
					<Button
						type='submit'
						disabled={loading || !checkLimit("tables").allowed}
						className={`add-table flex-1 h-11 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
							!checkLimit("tables").allowed ? "opacity-50" : ""
						}`}>
						{loading
							? t("database.tableBasics.creating")
							: t("database.tableBasics.createTable")}
					</Button>
					<Button
						type='button'
						variant='outline'
						onClick={onCancel}
						className='h-11 px-6 rounded-lg border-border/20 hover:bg-muted/50 transition-colors'>
						{t("database.tableBasics.cancel")}
					</Button>
				</div>
			</form>
		</div>
	);
}
