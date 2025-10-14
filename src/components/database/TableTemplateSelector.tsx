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
			size="sm"
			className="gap-1.5 sm:gap-2 shadow-sm hover:shadow-md transition-all duration-200"
			onClick={() => router.push("/home/database/templates")}>
			<Table className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
			<span className="hidden sm:inline text-xs sm:text-sm">
				{t("database.templates.addFromTemplates") || "Add from Templates"}
			</span>
			<span className="sm:hidden text-xs">Templates</span>
		</Button>
	);
}