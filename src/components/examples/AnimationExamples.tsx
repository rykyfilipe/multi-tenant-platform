/** @format */

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
	fadeInUp,
	fadeInDown,
	fadeInLeft,
	fadeInRight,
	scaleIn,
	slideInFromBottom,
	staggerContainer,
	staggerItem,
	hoverScale,
	hoverRotate,
	hoverLift,
	spinAnimation,
	pulseAnimation,
	pageTransition,
	modalAnimation,
	dropdownAnimation,
	tooltipAnimation,
	tableRowAnimation,
	cardAnimation,
	buttonAnimation,
	iconAnimation,
} from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Database,
	Users,
	Settings,
	Zap,
	Shield,
	BarChart3,
} from "lucide-react";

/**
 * Componente de exemplu pentru demonstrarea animațiilor implementate
 * Acest fișier poate fi folosit ca referință pentru implementarea animațiilor
 */
export function AnimationExamples() {
	return (
		<div className='p-8 space-y-12'>
			{/* Basic Animations */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Basic Animations</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					<motion.div {...fadeInUp}>
						<Card>
							<CardHeader>
								<CardTitle>Fade In Up</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Animație fade in cu deplasare în sus</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...fadeInDown}>
						<Card>
							<CardHeader>
								<CardTitle>Fade In Down</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Animație fade in cu deplasare în jos</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...fadeInLeft}>
						<Card>
							<CardHeader>
								<CardTitle>Fade In Left</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Animație fade in cu deplasare la stânga</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...fadeInRight}>
						<Card>
							<CardHeader>
								<CardTitle>Fade In Right</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Animație fade in cu deplasare la dreapta</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...scaleIn}>
						<Card>
							<CardHeader>
								<CardTitle>Scale In</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Animație scale in cu fade</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...slideInFromBottom}>
						<Card>
							<CardHeader>
								<CardTitle>Slide In From Bottom</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Animație slide in din partea de jos</p>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* Stagger Animation */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Stagger Animation</h2>
				<motion.div
					className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
					variants={staggerContainer}
					initial='initial'
					animate='animate'>
					{[
						{
							icon: Database,
							title: "Database",
							description: "Manage your data",
						},
						{ icon: Users, title: "Users", description: "User management" },
						{ icon: Settings, title: "Settings", description: "Configuration" },
						{ icon: Zap, title: "Performance", description: "Optimized speed" },
						{
							icon: Shield,
							title: "Security",
							description: "Enterprise security",
						},
						{
							icon: BarChart3,
							title: "Analytics",
							description: "Data insights",
						},
					].map((item, index) => (
						<motion.div key={index} variants={staggerItem}>
							<Card>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<item.icon className='w-5 h-5' />
										{item.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p>{item.description}</p>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</motion.div>
			</section>

			{/* Hover Animations */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Hover Animations</h2>
				<div className='flex flex-wrap gap-6'>
					<motion.div {...hoverScale}>
						<Button>Hover Scale</Button>
					</motion.div>

					<motion.div {...hoverRotate}>
						<Card className='w-48'>
							<CardHeader>
								<CardTitle>Hover Rotate</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Hover pentru rotație</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...hoverLift}>
						<Card className='w-48'>
							<CardHeader>
								<CardTitle>Hover Lift</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Hover pentru ridicare</p>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* Loading Animations */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Loading Animations</h2>
				<div className='flex flex-wrap gap-6 items-center'>
					<motion.div
						className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full'
						{...spinAnimation}
					/>

					<motion.div
						className='w-8 h-8 bg-primary rounded-full'
						{...pulseAnimation}
					/>

					<div className='text-muted-foreground'>
						Loading animations pentru feedback vizual
					</div>
				</div>
			</section>

			{/* Icon Animations */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Icon Animations</h2>
				<div className='flex flex-wrap gap-6'>
					<motion.div {...iconAnimation}>
						<Database className='w-12 h-12 text-primary' />
					</motion.div>

					<motion.div {...iconAnimation}>
						<Users className='w-12 h-12 text-primary' />
					</motion.div>

					<motion.div {...iconAnimation}>
						<Settings className='w-12 h-12 text-primary' />
					</motion.div>

					<motion.div {...iconAnimation}>
						<Zap className='w-12 h-12 text-primary' />
					</motion.div>

					<motion.div {...iconAnimation}>
						<Shield className='w-12 h-12 text-primary' />
					</motion.div>

					<motion.div {...iconAnimation}>
						<BarChart3 className='w-12 h-12 text-primary' />
					</motion.div>
				</div>
			</section>

			{/* Button Animations */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Button Animations</h2>
				<div className='flex flex-wrap gap-4'>
					<motion.div {...buttonAnimation}>
						<Button>Default Button</Button>
					</motion.div>

					<motion.div {...buttonAnimation}>
						<Button variant='outline'>Outline Button</Button>
					</motion.div>

					<motion.div {...buttonAnimation}>
						<Button variant='secondary'>Secondary Button</Button>
					</motion.div>

					<motion.div {...buttonAnimation}>
						<Button variant='destructive'>Destructive Button</Button>
					</motion.div>
				</div>
			</section>

			{/* Card Animations */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Card Animations</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					<motion.div {...cardAnimation}>
						<Card>
							<CardHeader>
								<CardTitle>Animated Card 1</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Card cu animații hover și initial</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...cardAnimation}>
						<Card>
							<CardHeader>
								<CardTitle>Animated Card 2</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Card cu animații hover și initial</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div {...cardAnimation}>
						<Card>
							<CardHeader>
								<CardTitle>Animated Card 3</CardTitle>
							</CardHeader>
							<CardContent>
								<p>Card cu animații hover și initial</p>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* Usage Examples */}
			<section>
				<h2 className='text-2xl font-bold mb-6'>Usage Examples</h2>
				<div className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Basic Usage</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className='bg-muted p-4 rounded-lg text-sm overflow-x-auto'>
								{`import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

<motion.div {...fadeInUp}>
  Your content here
</motion.div>`}
							</pre>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Stagger Animation</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className='bg-muted p-4 rounded-lg text-sm overflow-x-auto'>
								{`import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

<motion.div 
  variants={staggerContainer}
  initial="initial"
  animate="animate"
>
  {items.map((item, index) => (
    <motion.div key={index} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>`}
							</pre>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Custom Animation</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className='bg-muted p-4 rounded-lg text-sm overflow-x-auto'>
								{`import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Custom animated content
</motion.div>`}
							</pre>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}

export default AnimationExamples;
