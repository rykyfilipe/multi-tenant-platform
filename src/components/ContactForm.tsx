/** @format */

"use client";

import React, { useState } from "react";
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
					message: "Message sent successfully! We'll get back to you soon.",
				});
				setFormData({ name: "", email: "", subject: "", message: "" });
			} else {
				setStatus({
					type: "error",
					message: data.error || "Failed to send message. Please try again.",
				});
			}
		} catch (error) {
			setStatus({
				type: "error",
				message: "Network error. Please check your connection and try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section
			id='contact'
			className='py-16 bg-gradient-to-br from-background to-muted/20'>
			<div className='container mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='text-center mb-12'>
					<h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4'>
						Get in Touch
					</h2>
					<p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
						Have questions about YDV? Want to learn more about our multi-tenant
						platform? We'd love to hear from you.
					</p>
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
					{/* Contact Information */}
					<div className='lg:col-span-1'>
						<Card className='h-full'>
							<CardHeader>
								<CardTitle className='text-xl'>Contact Information</CardTitle>
								<CardDescription>
									Reach out to us through any of these channels
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								<div className='flex items-start space-x-3'>
									<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0'>
										<Mail className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold text-foreground'>Email</h3>
										<p className='text-sm text-muted-foreground'>
											contact@ydv.com
										</p>
										<p className='text-xs text-muted-foreground mt-1'>
											We typically respond within 24 hours
										</p>
									</div>
								</div>

								<div className='flex items-start space-x-3'>
									<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0'>
										<Phone className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold text-foreground'>Phone</h3>
										<p className='text-sm text-muted-foreground'>
											+40750406066
										</p>
										<p className='text-xs text-muted-foreground mt-1'>
											Mon-Fri 9AM-6PM EST
										</p>
									</div>
								</div>

								<div className='flex items-start space-x-3'>
									<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0'>
										<MapPin className='w-5 h-5 text-primary' />
									</div>
									<div>
										<h3 className='font-semibold text-foreground'>Office</h3>
										<p className='text-sm text-muted-foreground'>
											Suceava, Romania
										</p>
									</div>
								</div>

								<div className='pt-6 border-t border-border'>
									<h3 className='font-semibold text-foreground mb-3'>
										Why choose YDV?
									</h3>
									<ul className='space-y-2 text-sm text-muted-foreground'>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>Customer Support</span>
										</li>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>99.96% Overall Uptime</span>
										</li>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>Enterprise Security</span>
										</li>
										<li className='flex items-center space-x-2'>
											<CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
											<span>Scalable Solutions</span>
										</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Contact Form */}
					<div className='lg:col-span-2'>
						<Card>
							<CardHeader>
								<CardTitle className='text-xl'>Send us a Message</CardTitle>
								<CardDescription>
									Fill out the form below and we'll get back to you as soon as
									possible
								</CardDescription>
							</CardHeader>
							<CardContent>
								{status.type && (
									<Alert
										className={`mb-6 ${
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

								<form onSubmit={handleSubmit} className='space-y-6'>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										<div className='space-y-2'>
											<Label htmlFor='name'>Full Name *</Label>
											<Input
												id='name'
												name='name'
												type='text'
												placeholder='John Doe'
												value={formData.name}
												onChange={handleInputChange}
												required
												disabled={isLoading}
												className='w-full'
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='email'>Email Address *</Label>
											<Input
												id='email'
												name='email'
												type='email'
												placeholder='john@example.com'
												value={formData.email}
												onChange={handleInputChange}
												required
												disabled={isLoading}
												className='w-full'
											/>
										</div>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='subject'>Subject *</Label>
										<Input
											id='subject'
											name='subject'
											type='text'
											placeholder='How can we help you?'
											value={formData.subject}
											onChange={handleInputChange}
											required
											disabled={isLoading}
											className='w-full'
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor='message'>Message *</Label>
										<Textarea
											id='message'
											name='message'
											placeholder='Tell us more about your inquiry...'
											value={formData.message}
											onChange={handleInputChange}
											required
											disabled={isLoading}
											className='w-full min-h-[120px] resize-none'
										/>
									</div>

									<Button
										type='submit'
										disabled={isLoading}
										className='w-full sm:w-auto'>
										{isLoading ? (
											<>
												<Loader2 className='w-4 h-4 mr-2 animate-spin' />
												Sending...
											</>
										) : (
											<>
												<Send className='w-4 h-4 mr-2' />
												Send Message
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
