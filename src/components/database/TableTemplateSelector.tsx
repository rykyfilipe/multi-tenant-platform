/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
	Table,
	Users,
	Package,
	ShoppingCart,
	FileText,
	CreditCard,
	Settings,
	CheckCircle,
	BarChart3
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TemplateSelectorModal } from "@/components/ui/TemplateSelectorModal";

interface TemplateTable {
	id: string;
	name: string;
	description: string;
	icon: any;
	category: string;
	dependencies: string[];
	columns: Array<{
		name: string;
		type: string;
		required?: boolean;
		primary?: boolean;
		semanticType?: string;
		customOptions?: string[];
		referenceTableName?: string;
	}>;
}

// Template-uri predefinite pentru tabele
export const TABLE_TEMPLATES: TemplateTable[] = [
	{
		id: "users",
		name: "Users",
		description: "User management and authentication",
		icon: Users,
		category: "User Management",
		dependencies: [],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "user_id",
			},
			{
				name: "email",
				type: "text",
				required: true,
				semanticType: "user_email",
			},
			{
				name: "name",
				type: "text",
				required: true,
				semanticType: "user_name",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "user_created_at",
			},
		],
	},
	{
		id: "products",
		name: "Products",
		description: "Product catalog and inventory management",
		icon: Package,
		category: "E-commerce",
		dependencies: [],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "product_id",
			},
			{
				name: "name",
				type: "text",
				required: true,
				semanticType: "product_name",
			},
			{
				name: "description",
				type: "text",
				required: false,
				semanticType: "product_description",
			},
			{
				name: "price",
				type: "decimal",
				required: true,
				semanticType: "product_price",
			},
			{
				name: "sku",
				type: "text",
				required: true,
				semanticType: "product_sku",
			},
			{
				name: "category",
				type: "text",
				required: false,
				semanticType: "product_category",
			},
			{
				name: "brand",
				type: "text",
				required: false,
				semanticType: "product_brand",
			},
			{
				name: "vat",
				type: "decimal",
				required: false,
				semanticType: "product_vat",
			},
			{
				name: "unit_of_measure",
				type: "text",
				required: false,
				semanticType: "unit_of_measure",
			},
			{
				name: "currency",
				type: "text",
				required: false,
				semanticType: "currency",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "product_created_at",
			},
		],
	},
	{
		id: "orders",
		name: "Orders",
		description: "Order management and tracking",
		icon: ShoppingCart,
		category: "E-commerce",
		dependencies: ["users", "products"],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "order_id",
			},
			{
				name: "user_id",
				type: "reference",
				required: true,
				referenceTableName: "users",
				semanticType: "user_id",
			},
			{
				name: "total_amount",
				type: "decimal",
				required: true,
				semanticType: "order_total",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "order_status",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "order_created_at",
			},
		],
	},
	{
		id: "customers",
		name: "Customers",
		description: "Customer information and contact details",
		icon: Users,
		category: "CRM",
		dependencies: [],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "customer_id",
			},
			{
				name: "customer_name",
				type: "text",
				required: true,
				semanticType: "customer_name",
			},
			{
				name: "customer_email",
				type: "text",
				required: true,
				semanticType: "customer_email",
			},
			{
				name: "customer_address",
				type: "text",
				required: false,
				semanticType: "customer_address",
			},
			{
				name: "phone",
				type: "text",
				required: false,
				semanticType: "customer_phone",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "customer_created_at",
			},
		],
	},
	{
		id: "invoices",
		name: "Invoices",
		description: "Invoice management and billing",
		icon: FileText,
		category: "Billing",
		dependencies: ["customers"],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "invoice_id",
			},
			{
				name: "customer_id",
				type: "reference",
				required: true,
				referenceTableName: "customers",
				semanticType: "customer_id",
			},
			{
				name: "invoice_number",
				type: "text",
				required: true,
				semanticType: "invoice_number",
			},
			{
				name: "total_amount",
				type: "decimal",
				required: true,
				semanticType: "invoice_total",
			},
			{
				name: "due_date",
				type: "date",
				required: true,
				semanticType: "invoice_due_date",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "invoice_status",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "invoice_created_at",
			},
		],
	},
	{
		id: "payments",
		name: "Payments",
		description: "Payment processing and transaction records",
		icon: CreditCard,
		category: "Billing",
		dependencies: ["invoices"],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "payment_id",
			},
			{
				name: "invoice_id",
				type: "reference",
				required: true,
				referenceTableName: "invoices",
				semanticType: "invoice_id",
			},
			{
				name: "amount",
				type: "decimal",
				required: true,
				semanticType: "payment_amount",
			},
			{
				name: "payment_method",
				type: "text",
				required: true,
				semanticType: "payment_method",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "payment_status",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "payment_created_at",
			},
		],
	},
	{
		id: "employees",
		name: "Employees",
		description: "Employee management and HR records",
		icon: Users,
		category: "HR",
		dependencies: [],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "employee_id",
			},
			{
				name: "employee_name",
				type: "text",
				required: true,
				semanticType: "employee_name",
			},
			{
				name: "email",
				type: "text",
				required: true,
				semanticType: "employee_email",
			},
			{
				name: "department",
				type: "text",
				required: true,
				semanticType: "employee_department",
			},
			{
				name: "position",
				type: "text",
				required: true,
				semanticType: "employee_position",
			},
			{
				name: "salary",
				type: "decimal",
				required: false,
				semanticType: "employee_salary",
			},
			{
				name: "hire_date",
				type: "date",
				required: true,
				semanticType: "employee_hire_date",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "employee_created_at",
			},
		],
	},
	{
		id: "projects",
		name: "Projects",
		description: "Project management and tracking",
		icon: Settings,
		category: "Project Management",
		dependencies: ["employees"],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "project_id",
			},
			{
				name: "project_name",
				type: "text",
				required: true,
				semanticType: "project_name",
			},
			{
				name: "description",
				type: "text",
				required: false,
				semanticType: "project_description",
			},
			{
				name: "manager_id",
				type: "reference",
				required: true,
				referenceTableName: "employees",
				semanticType: "employee_id",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "project_status",
			},
			{
				name: "start_date",
				type: "date",
				required: true,
				semanticType: "project_start_date",
			},
			{
				name: "end_date",
				type: "date",
				required: false,
				semanticType: "project_end_date",
			},
			{
				name: "budget",
				type: "decimal",
				required: false,
				semanticType: "project_budget",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "project_created_at",
			},
		],
	},
	{
		id: "tasks",
		name: "Tasks",
		description: "Task management and tracking",
		icon: CheckCircle,
		category: "Task Management",
		dependencies: ["projects", "employees"],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "task_id",
			},
			{
				name: "task_name",
				type: "text",
				required: true,
				semanticType: "task_name",
			},
			{
				name: "description",
				type: "text",
				required: false,
				semanticType: "task_description",
			},
			{
				name: "project_id",
				type: "reference",
				required: true,
				referenceTableName: "projects",
				semanticType: "project_id",
			},
			{
				name: "assigned_to",
				type: "reference",
				required: true,
				referenceTableName: "employees",
				semanticType: "employee_id",
			},
			{
				name: "status",
				type: "text",
				required: true,
				semanticType: "task_status",
			},
			{
				name: "priority",
				type: "text",
				required: true,
				semanticType: "task_priority",
			},
			{
				name: "due_date",
				type: "date",
				required: false,
				semanticType: "task_due_date",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "task_created_at",
			},
		],
	},
	{
		id: "analytics_events",
		name: "Analytics Events",
		description: "User behavior and application analytics",
		icon: BarChart3,
		category: "Analytics",
		dependencies: [],
		columns: [
			{
				name: "id",
				type: "integer",
				required: true,
				primary: true,
				semanticType: "analytics_event_id",
			},
			{
				name: "event_name",
				type: "text",
				required: true,
				semanticType: "analytics_event_name",
			},
			{
				name: "user_id",
				type: "integer",
				required: false,
				semanticType: "user_id",
			},
			{
				name: "session_id",
				type: "text",
				required: false,
				semanticType: "analytics_session_id",
			},
			{
				name: "properties",
				type: "json",
				required: false,
				semanticType: "analytics_properties",
			},
			{
				name: "created_at",
				type: "timestamp",
				required: true,
				semanticType: "analytics_created_at",
			},
		],
	},
];

export function TableTemplateSelector({
	onTemplatesSelected,
	selectedDatabaseId,
}: {
	onTemplatesSelected: (templates: TemplateTable[]) => void;
	selectedDatabaseId: number | null;
}) {
	const { t } = useLanguage();
	const [showModal, setShowModal] = useState(false);

	return (
		<>
			<Button
				variant="outline"
				className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
				onClick={() => setShowModal(true)}>
				<Table className="w-4 h-4" />
				{t("database.templates.addFromTemplates") || "Add from Templates"}
			</Button>

			<TemplateSelectorModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				onTemplatesSelected={onTemplatesSelected}
				templates={TABLE_TEMPLATES}
				selectedDatabaseId={selectedDatabaseId}
			/>
		</>
	);
}