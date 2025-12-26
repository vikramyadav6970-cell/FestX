"use client";

import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle, CircleDollarSign, Bell, Users, QrCode, PenTool, Search, Ticket, UserCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/landing/header';
import { LandingFooter } from '@/components/landing/footer';
import { motion } from 'framer-motion';
import { Logo } from '@/components/common/Logo';

const features = [
  {
    icon: <Calendar className="h-8 w-8" />,
    title: 'Event Management',
    description: 'Create, manage, and track college events seamlessly.',
    emoji: '🎪'
  },
  {
    icon: <Search className="h-8 w-8" />,
    title: 'Smart Scheduling',
    description: 'Calendar view with advanced conflict detection.',
    emoji: '📅'
  },
  {
    icon: <Ticket className="h-8 w-8" />,
    title: 'QR Ticketing',
    description: 'Unique QR codes for secure event registration.',
    emoji: '🎫'
  },
  {
    icon: <CircleDollarSign className="h-8 w-8" />,
    title: 'Budget Tracking',
    description: 'Transparent and efficient fund management.',
    emoji: '💰'
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Role-Based Access',
    description: 'Dashboards for Students, Organizers, and Admins.',
    emoji: '👥'
  },
  {
    icon: <Bell className="h-8 w-8" />,
    title: 'Instant Notifications',
    description: 'Receive real-time updates and important alerts.',
    emoji: '🔔'
  }
];

const steps = [
  {
    icon: <UserCheck className="h-8 w-8" />,
    title: 'Register',
    description: 'Sign up as a Student or an Organizer to get started.'
  },
  {
    icon: <PenTool className="h-8 w-8" />,
    title: 'Browse or Create',
    description: 'Explore a wide range of events or create your own.'
  },
  {
    icon: <QrCode className="h-8 w-8" />,
    title: 'Get Your Ticket',
    description: 'Register for events and receive a unique QR code ticket.'
  },
  {
    icon: <CheckCircle className="h-8 w-8" />,
    title: 'Attend & Track',
    description: 'Enjoy the event and keep track of everything in your dashboard.'
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground dark:bg-gray-900 scroll-smooth">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <motion.section 
          id="hero" 
          className="relative overflow-hidden py-24 sm:py-32"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="absolute inset-0 -z-10">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-white dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-gray-900"></div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(199,210,254,0.5),_transparent_40%)] dark:bg-[radial-gradient(circle_at_50%_50%,_rgba(67,56,202,0.3),_transparent_40%)]"
            ></motion.div>
          </div>
          <div className="container mx-auto px-4 text-center">
            <motion.div variants={fadeInUp}>
              <h1 className="font-headline text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-white sm:text-7xl md:text-8xl lg:text-9xl">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  FestX
                </span>
              </h1>
            </motion.div>
            <motion.p variants={fadeInUp} className="mt-4 font-headline text-lg font-semibold text-gray-700 dark:text-gray-300 sm:text-xl md:text-2xl">
              Unified College Event & Resource Management System
            </motion.p>
            <motion.p variants={fadeInUp} className="mx-auto mt-6 max-w-2xl text-base text-gray-600 dark:text-gray-400 sm:text-lg">
              One platform for events, registrations, and seamless coordination.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="font-semibold">
                <Link href="/register">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link href="/login">Login</Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          id="features" 
          className="py-20 md:py-24 bg-card dark:bg-gray-800/50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-4">
            <motion.div variants={fadeInUp} className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Everything You Need
              </h2>
              <p className="mt-4 text-muted-foreground">A comprehensive toolkit for the modern college experience.</p>
            </motion.div>
            <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={scaleIn}
                  className="group relative overflow-hidden rounded-lg border bg-background p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:bg-gray-900 dark:border-gray-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-headline text-xl font-semibold">{feature.title}</h3>
                      <p className="mt-2 text-muted-foreground">{feature.description}</p>
                    </div>
                    <div className="absolute -right-4 -top-2 text-4xl opacity-10 transition-all duration-300 group-hover:opacity-20 group-hover:scale-125 group-hover:rotate-12 dark:opacity-5">
                      {feature.emoji}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section 
          id="how-it-works" 
          className="py-20 md:py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-4">
            <motion.div variants={fadeInUp} className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Get Started in Minutes
              </h2>
              <p className="mt-4 text-muted-foreground">A simple, intuitive process to get you going.</p>
            </motion.div>
            <div className="relative">
              <div className="absolute left-1/2 top-12 hidden h-[calc(100%-6rem)] w-0.5 -translate-x-1/2 bg-border md:block"></div>
              <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    variants={fadeInUp}
                    className="relative flex flex-col items-center text-center"
                  >
                    <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {step.icon}
                      <div className="absolute -bottom-2 right-0 hidden h-8 w-0.5 bg-border md:block lg:hidden"></div>
                    </div>
                    <h3 className="font-headline text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>
      <LandingFooter />
    </div>
  );
}
