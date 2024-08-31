'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { SignedOut, SignedIn, UserButton, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion'; // Ensure you have framer-motion installed if you're using it
import Head from 'next/head'; // Make sure to import Head from 'next/head'
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleGetStartedClick = () => {
    if (isSignedIn) {
      router.push('/chatbot');
    } else {
      router.push('/sign-in');
    }
  };

  const textVariant = (delay) => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delay,
        duration: 0.5,
      },
    },
  });

  const slideUp = (delay) => ({
    hidden: { y: 50, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        delay,
        duration: 0.5,
      },
    },
  });

  return (
    <div className="max-w-full mx-auto bg-[#0d1321]">
      <Head>
        <title>RAG Bot</title>
        <meta
          name="description"
          content="Your one stop restaraunt reviews centre."
        />
      </Head>

      {/* Navbar */}
      <nav className="bg-[#11192c] bg-opacity-90 p-5 flex justify-between items-center w-full sticky top-0 z-50">
        <a
          href="/"
          className="text-[#f0ebd8] text-xl font-bold hover:text-[#748cab]"
        >
          RAG Bot
        </a>
        <div>
          <SignedOut>
            <div className="flex justify-center items-center">
              <a
                href="/sign-in"
                className="text-[#f0ebd8] flex items-center font-semibold hover:text-[#748cab] mr-4"
              >
                <FaSignInAlt className="mr-2" /> Login
              </a>
              <a
                href="/sign-up"
                className="text-[#f0ebd8] flex items-center font-semibold hover:text-[#748cab]"
              >
                <FaUserPlus className="mr-2" /> Sign Up
              </a>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Welcome Section */}
      <section className="text-center">
        <motion.div variants={textVariant(0.1)} initial="hidden" animate="show">
          <h1 className="font-black bg-clip-text text-transparent bg-gradient-to-t from-[#748cab] to-[#f0ebd8] lg:text-[70px] sm:text-[60px] xs:text-[50px] text-[40px] lg:leading-[98px] mb-2 text-center hover:text-opacity-90">
            Welcome to RAG Bot
          </h1>
        </motion.div>
        <motion.div variants={slideUp(0.2)} initial="hidden" animate="show">
          <div className="flex justify-center items-center">
            <p className="text-[#f0ebd8] font-medium text-center font-sm lg:text-[22px] sm:text-[18px] xs:text-[16px] text-[16px] lg:leading-[40px] max-w-2xl">
              Get reviews on any restaraunt in seconds!
            </p>
          </div>
          <button
            className="hover:bg-[#f0ebd8] bg-[#1d2d44] text-[#f0ebd8] hover:text-[#1d2d44] font-bold py-3 px-8 mt-5 rounded"
            onClick={handleGetStartedClick}
          >
            Get Started
          </button>
        </motion.div>
      </section>
    </div>
  );
}
