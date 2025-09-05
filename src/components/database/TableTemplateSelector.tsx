/** @format */

"use client";

import { Button } from "@/components/ui/button";
import { Table } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

export function TableTemplateSelector() {
	const { t } = useLanguage();
	const router = useRouter();

	return (
		<Button
			variant="outline"
			className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
			onClick={() => router.push("/home/database/templates")}>
			<Table className="w-4 h-4" />
			{t("database.templates.addFromTemplates") || "Add from Templates"}
		</Button>
	);
}