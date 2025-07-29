/** @format */

import { TableBasicsForm } from "./TableBasicForm";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TourProv from "@/contexts/TourProvider";
import { StepType, useTour } from "@reactour/tour";
import { useEffect } from "react";

interface AddTableModalProps {
	isOpen: boolean;
	onClose: () => void;
	name: string;
	setName: (name: string) => void;
	description: string;
	setDescription: (name: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	loading: boolean;
}

export default function AddTableModal({
	isOpen,
	onClose,
	name,
	setName,
	description,
	setDescription,
	onSubmit,
	loading,
}: AddTableModalProps) {
	if (!isOpen) return null;
	const steps: StepType[] = [
		{
			selector: ".table-name",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Database Header</h3>
					<p>
						This is your database management center. Here you can view database
						information and perform main actions.
					</p>
				</div>
			),
			position: "bottom",
			styles: {
				popover: (base) => ({
					...base,
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
				}),
			},
		},
		{
			selector: ".table-description",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Add New Table</h3>
					<p>
						Click this button to create a new table in your database. You can
						define columns, data types, and relationships.
					</p>
				</div>
			),
			position: "top",
			styles: {
				popover: (base) => ({
					...base,
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
				}),
			},
		},
		{
			selector: ".add-table",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Tables Overview</h3>
					<p>
						This grid displays all your database tables. You can view, edit, and
						manage each table from here.
					</p>
				</div>
			),
			position: "top",
			styles: {
				popover: (base) => ({
					...base,
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
				}),
			},
		},
	];
	return (
		<div className='fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in'>
			<div className='bg-white  shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
				<div className='flex items-center justify-between p-6 border-b border-gray-200'>
					<h2 className='text-2xl font-bold text-gray-900'>
						{name ? name : "Create new Table"}
					</h2>
					<Button
						variant='ghost'
						size='sm'
						onClick={onClose}
						className='text-gray-400 hover:text-gray-600'>
						<X className='h-6 w-6' />
					</Button>
				</div>

				<div className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
					<TableBasicsForm
						name={name}
						setName={setName}
						description={description}
						setDescription={setDescription}
						onSubmit={onSubmit}
						onCancel={onClose}
						loading={loading}
					/>
				</div>
			</div>
			<TourProv steps={steps}>
				<Tour />
			</TourProv>
		</div>
	);
}

function Tour() {
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		const seen = localStorage.getItem("add-table-module-tour-seen");
		if (!seen) {
			localStorage.setItem("add-table-module-tour-seen", "true");
			startTour();
		}
	}, []);
	return <div className='absolute'></div>;
}
