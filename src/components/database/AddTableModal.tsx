/** @format */

import { TableBasicsForm } from "./TableBasicForm";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { useEffect } from "react";
import { addTableModalTourSteps, tourUtils } from "@/lib/tour-config";

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

	return (
		<div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in'>
			<div className='bg-background border border-border/20 shadow-2xl rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden'>
				<div className='flex items-center justify-between p-6 border-b border-border/20'>
					<div>
						<h2 className='text-xl font-semibold text-foreground'>
							{name ? name : "Create New Table"}
						</h2>
						<p className='text-sm text-muted-foreground mt-1'>
							Define your table structure and properties
						</p>
					</div>
					<Button
						variant='ghost'
						size='sm'
						onClick={onClose}
						className='text-muted-foreground hover:text-foreground hover:bg-muted/50'>
						<X className='h-5 w-5' />
					</Button>
				</div>

				<div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
					<TourProv
						steps={addTableModalTourSteps}
						onTourComplete={() => {
							tourUtils.markTourSeen("add-table-modal");
						}}
						onTourSkip={() => {
							tourUtils.markTourSeen("add-table-modal");
						}}>
						<TableBasicsForm
							name={name}
							setName={setName}
							description={description}
							setDescription={setDescription}
							onSubmit={onSubmit}
							onCancel={onClose}
							loading={loading}
						/>
						<Tour />
					</TourProv>
				</div>
			</div>
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
		const hasSeenTour = tourUtils.isTourSeen("add-table-modal");
		if (!hasSeenTour) {
			// Start tour after a short delay to ensure elements are rendered
			const timer = setTimeout(() => {
				startTour();
			}, 500);

			return () => clearTimeout(timer);
		}
	}, []);

	return <div className='absolute'></div>;
}
