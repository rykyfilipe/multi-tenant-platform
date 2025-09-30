/** @format */

"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useLanguage } from "@/contexts/LanguageContext";
import { Database, AlertTriangle } from "lucide-react";

interface Props {
	setShowForm: (x: boolean) => void;
}

function AddDatabaseForm({ setShowForm }: Props) {
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const { showAlert, token, tenant, user } = useApp();
	const { selectedDatabase, setSelectedDatabase } = useDatabase();
	const { handleApiError } = usePlanLimitError();
	const { checkLimit, currentPlan, planLimits } = usePlanLimits();
	const { t } = useLanguage();

	const tenantId = tenant?.id;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name) return;

		// Verifică limita de baze de date
		const databaseLimit = checkLimit("databases");
		if (!databaseLimit.allowed) {
			showAlert(
				t("database.addDatabase.planLimitReached", {
					limit: databaseLimit.limit,
					plan: currentPlan,
				}),
				"warning",
			);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`/api/tenants/${tenantId}/databases`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name }),
			});

			if (!response.ok) {
				handleApiError(response);
			} else {
				const data = await response.json();
				setSelectedDatabase(data);
				showAlert(t("database.addDatabase.databaseCreatedSuccess"), "success");
			}
		} catch (error) {
			showAlert(t("database.addDatabase.failedToCreate"), "error");
		} finally {
			setLoading(false);
			setShowForm(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4'>
			<div className='w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300'>
				<Card className='rounded-xl shadow-lg'>
					<CardHeader>
						<h2 className='text-lg font-semibold text-center'>
							{t("database.addDatabase.createDatabase")}
						</h2>
					</CardHeader>

					<CardContent>
						{/* Plan Limit Info */}
						{(() => {
							const databaseLimit = checkLimit("databases");
							return (
								<div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
									<div className='flex items-center justify-between mb-2'>
										<div className='flex items-center gap-2'>
											<Database className='w-4 h-4 text-blue-600' />
											<span className='text-sm font-medium text-blue-900'>
												{t("database.addDatabase.databaseLimit")}
											</span>
										</div>
										<Badge
											variant={
												databaseLimit.allowed ? "default" : "destructive"
											}
											className='text-xs'>
											{databaseLimit.current} / {databaseLimit.limit}
										</Badge>
									</div>
									<p className='text-xs text-blue-700'>
										{databaseLimit.allowed
											? t("database.addDatabase.canCreateMore", {
													count: databaseLimit.limit - databaseLimit.current,
											  })
											: t("database.addDatabase.reachedPlanLimit")}
									</p>
								</div>
							);
						})()}

						<form onSubmit={handleSubmit} className='space-y-4'>
							<Input
								placeholder={t("database.addDatabase.databaseNamePlaceholder")}
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={loading}
								required
							/>

							<div className='flex flex-col space-y-2'>
								<Button
									type='submit'
									disabled={loading || !checkLimit("databases").allowed}
									className={
										!checkLimit("databases").allowed ? "opacity-50" : ""
									}>
									{loading
										? t("database.addDatabase.creating")
										: t("database.addDatabase.createButton")}
								</Button>
								<Button
									variant='outline'
									onClick={() => setShowForm(false)}
									type='button'>
									{t("database.addDatabase.cancelButton")}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default AddDatabaseForm;
