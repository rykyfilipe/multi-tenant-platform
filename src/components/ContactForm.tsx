/** @format */

"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Loader2,
	Send,
	CheckCircle,
	AlertCircle,
	Mail,
	Phone,
	MapPin,
} from "lucide-react";

interface ContactFormData {
	name: string;
	email: string;
	subject: string;
	message: string;
}

export const ContactForm = () => {
	const { t } = useLanguage();
	const [formData, setFormData] = useState<ContactFormData>({
		name: "",
		email: "",
		subject: "",
		message: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<{
		type: "success" | "error" | null;
		message: string;
	}>({ type: null, message: "" });

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setStatus({ type: null, message: "" });

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (response.ok) {
				setStatus({
					type: "success",
					message: t("contact.form.success"),
				});
				setFormData({ name: "", email: "", subject: "", message: "" });
			} else {
				setStatus({
					type: "error",
					message: data.error || t("contact.form.error"),
				});
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: t("contact.form.networkError"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section id='contact' className='premium-section premium-gradient-section'>
			<div className='premium-container'>
				<div className='text-center premium-spacing-xl'>
					<h2 className='premium-heading mb-4'>{t("contact.title")}</h2>
					<p className='premium-subheading'>{t("contact.subtitle")}</p>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
					{/* Contact Information */}
					<div className='lg:col-span-1'>
						<Card className='h-full professional-card premium-hover'>
							<CardHeader className='premium-padding-md'>
								<CardTitle className='text-xl'>
									{t("contact.info.title")}
								</CardTitle>
								<CardDescription>{t("contact.info.subtitle")}</CardDescription>
							</CardHeader>
							<CardContent className='premium-padding-md pt-0 premium-spacing-lg'>
								<div className='flex items-start space-x-3'>
									<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 premium-hover-subtle'>
										<Mail className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold text-foreground'>
											{t("contact.info.email")}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{t("contact.info.emailAddress")}
										</p>
										<p className='text-xs text-muted-foreground mt-1'>
											{t("contact.info.emailResponse")}
										</p>
									</div>
								</div>

								<div className='flex items-start space-x-3'>
									<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 premium-hover-subtle'>
										<Phone className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold text-foreground'>
											{t("contact.info.phone")}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{t("contact.info.phoneNumber")}
										</p>
										<p className='text-xs text-muted-foreground mt-1'>
											{t("contact.info.businessHours")}
										</p>
									</div>
								</div>

								<div className='flex items-start space-x-3'>
									<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 premium-hover-subtle'>
										<MapPin className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold text-foreground'>
											{t("contact.info.office")}
										</h3>
										<p className='text-sm text-muted-foreground'>
											{t("contact.info.location")}
										</p>
									</div>
								</div>

								<div className='pt-6 border-t border-border'>
									<h3 className='font-semibold text-foreground mb-3'>
										{t("contact.info.whyChoose")}
									</h3>
									<ul className='premium-spacing-sm text-sm text-muted-foreground'>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>{t("contact.info.customerSupport")}</span>
										</li>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>{t("contact.info.uptime")}</span>
										</li>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>{t("contact.info.enterpriseSecurity")}</span>
										</li>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>{t("contact.info.scalableSolutions")}</span>
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Contact Form */}
					<div className='lg:col-span-2'>
						<Card className='professional-card premium-hover'>
							<CardHeader className='premium-padding-md'>
								<CardTitle className='text-xl'>
									{t("contact.form.title")}
								</CardTitle>
								<CardDescription>{t("contact.form.subtitle")}</CardDescription>
							</CardHeader>
							<CardContent className='premium-padding-md pt-0'>
								{status.type && (
									<Alert
										className={`mb-6 professional-card ${
											status.type === "success"
												? "border-green-200 bg-green-50"
												: "border-red-200 bg-red-50"
										}`}>
										{status.type === "success" ? (
											<CheckCircle className='h-4 w-4 text-green-600' />
										) : (
											<AlertCircle className='h-4 w-4 text-red-600' />
										)}
										<AlertDescription
											className={
												status.type === "success"
													? "text-green-800"
													: "text-red-800"
											}>
											{status.message}
										</AlertDescription>
									</Alert>
								)}

								<form onSubmit={handleSubmit} className='premium-spacing-lg'>
									<div className='premium-grid-2 gap-4'>
										<div className='premium-spacing-sm'>
											<Label htmlFor='name'>{t("contact.form.fullName")}</Label>
											<Input
												id='name'
												name='name'
												type='text'
												placeholder={t("contact.form.placeholders.name")}
												value={formData.name}
												onChange={handleInputChange}
												required
												disabled={isLoading}
												className='w-full premium-interaction'
											/>
										</div>
										<div className='premium-spacing-sm'>
											<Label htmlFor='email'>{t("contact.form.email")}</Label>
											<Input
												id='email'
												name='email'
												type='email'
												placeholder={t("contact.form.placeholders.email")}
												value={formData.email}
												onChange={handleInputChange}
												required
												disabled={isLoading}
												className='w-full premium-interaction'
											/>
										</div>
									</div>

									<div className='premium-spacing-sm'>
										<Label htmlFor='subject'>{t("contact.form.subject")}</Label>
										<Input
											id='subject'
											name='subject'
											type='text'
											placeholder={t("contact.form.placeholders.subject")}
											value={formData.subject}
											onChange={handleInputChange}
											required
											disabled={isLoading}
											className='w-full premium-interaction'
										/>
									</div>

									<div className='premium-spacing-sm'>
										<Label htmlFor='message'>{t("contact.form.message")}</Label>
										<Textarea
											id='message'
											name='message'
											placeholder={t("contact.form.placeholders.message")}
											value={formData.message}
											onChange={handleInputChange}
											required
											disabled={isLoading}
											className='w-full min-h-[120px] resize-none premium-interaction'
										/>
									</div>

									<Button
										type='submit'
										disabled={isLoading}
										className='w-full sm:w-auto premium-hover-subtle'>
										{isLoading ? (
											<>
												<Loader2 className='w-4 h-4 mr-2 animate-spin' />
												{t("contact.form.sending")}
											</>
										) : (
											<>
												<Send className='w-4 h-4 mr-2' />
												{t("contact.form.sendMessage")}
											</>
										)}
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</section>
	);
};
