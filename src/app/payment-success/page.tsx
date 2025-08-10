/** @format */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentVerification {
	success: boolean;
	paymentStatus: string;
	customerEmail: string;
	amountTotal: number;
	currency: string;
	planName: string;
	createdAt: number;
}

export default function PaymentSuccessPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [countdown, setCountdown] = useState(5);
	const [isVerifying, setIsVerifying] = useState(true);
	const [verificationError, setVerificationError] = useState<string | null>(
		null,
	);
	const [paymentDetails, setPaymentDetails] =
		useState<PaymentVerification | null>(null);

	useEffect(() => {
		const verifyPayment = async () => {
			const sessionId = searchParams.get("session_id");

			if (!sessionId) {
				setVerificationError("Session ID lipsă. Nu se poate verifica plata.");
				setIsVerifying(false);
				return;
			}

			try {
				const response = await fetch("/api/stripe/verify-payment", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ sessionId }),
				});

				const data = await response.json();

				if (!response.ok) {
					setVerificationError(data.error || "Eroare la verificarea plății");
					setIsVerifying(false);
					return;
				}

				if (data.success) {
					setPaymentDetails(data);
					setIsVerifying(false);
					// Start countdown only after successful verification
					const timer = setInterval(() => {
						setCountdown((prev) => {
							if (prev <= 1) {
								router.push("/home");
								return 0;
							}
							return prev - 1;
						});
					}, 1000);

					return () => clearInterval(timer);
				} else {
					setVerificationError("Verificarea plății a eșuat");
					setIsVerifying(false);
				}
			} catch (error) {
				console.error("Error verifying payment:", error);
				setVerificationError("Eroare de conexiune la verificarea plății");
				setIsVerifying(false);
			}
		};

		verifyPayment();
	}, [searchParams, router]);

	const handleGoHome = () => {
		router.push("/home/analytics");
	};

	const handleRetry = () => {
		window.location.reload();
	};

	// Loading state while verifying payment
	if (isVerifying) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm'>
					<CardHeader className='text-center pb-4'>
						<div className='mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
							<Loader2 className='w-8 h-8 text-blue-600 animate-spin' />
						</div>
						<CardTitle className='text-2xl font-bold text-gray-800'>
							Verificare Plată...
						</CardTitle>
					</CardHeader>
					<CardContent className='text-center space-y-4'>
						<p className='text-gray-600'>
							Se verifică statusul plății tale cu Stripe...
						</p>
						<p className='text-sm text-gray-500'>
							Te rugăm să aștepți câteva secunde.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Error state
	if (verificationError) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm'>
					<CardHeader className='text-center pb-4'>
						<div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4'>
							<AlertCircle className='w-8 h-8 text-red-600' />
						</div>
						<CardTitle className='text-2xl font-bold text-gray-800'>
							Eroare la Verificare
						</CardTitle>
					</CardHeader>
					<CardContent className='text-center space-y-6'>
						<Alert className='border-red-200 bg-red-50'>
							<AlertCircle className='h-4 w-4 text-red-600' />
							<AlertDescription className='text-red-700'>
								{verificationError}
							</AlertDescription>
						</Alert>

						<div className='space-y-3'>
							<Button
								onClick={handleRetry}
								className='w-full bg-red-600 hover:bg-red-700 text-white'>
								Încearcă din nou
							</Button>
							<Button
								onClick={handleGoHome}
								variant='outline'
								className='w-full'>
								Mergi la Dashboard
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Success state - only shown after successful verification
	if (paymentDetails) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4'>
				<Card className='w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm'>
					<CardHeader className='text-center pb-4'>
						<div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4'>
							<CheckCircle className='w-8 h-8 text-green-600' />
						</div>
						<CardTitle className='text-2xl font-bold text-gray-800'>
							Plată Reușită!
						</CardTitle>
					</CardHeader>
					<CardContent className='text-center space-y-6'>
						<div className='space-y-2'>
							<p className='text-gray-600 text-lg'>Mulțumim pentru plata ta!</p>
							<p className='text-gray-500 text-sm'>
								Abonamentul <strong>{paymentDetails.planName}</strong> a fost
								activat cu succes.
							</p>
						</div>

						{/* Payment Details */}
						<div className='bg-green-50 rounded-lg p-4 border border-green-200 text-left'>
							<div className='space-y-2 text-sm'>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Plan:</span>
									<span className='font-medium'>{paymentDetails.planName}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Suma:</span>
									<span className='font-medium'>
										{(paymentDetails.amountTotal / 100).toFixed(2)}{" "}
										{paymentDetails.currency.toUpperCase()}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-600'>Status:</span>
									<span className='font-medium text-green-600 capitalize'>
										{paymentDetails.paymentStatus}
									</span>
								</div>
							</div>
						</div>

						<div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
							<p className='text-blue-700 text-sm font-medium'>
								Vei fi redirecționat automat către dashboard în {countdown}{" "}
								secunde
							</p>
						</div>

						<div className='space-y-3'>
							<Button
								onClick={handleGoHome}
								className='w-full bg-green-600 hover:bg-green-700 text-white'>
								Mergi la Dashboard
								<ArrowRight className='w-4 h-4 ml-2' />
							</Button>

							<p className='text-xs text-gray-400'>
								Dacă nu ești redirecționat automat, apasă butonul de mai sus
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Fallback - should not reach here
	return null;
}
