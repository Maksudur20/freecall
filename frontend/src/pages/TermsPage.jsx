// Terms & Conditions Page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@components/animations';

const TermsPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const lastUpdated = 'April 10, 2026';

  const sections = [
    {
      title: '1. Introduction',
      icon: '📜',
      content: `Welcome to FreeCall ("Service," "we," "us," or "our"). These Terms and Conditions ("Terms") govern your access to and use of the FreeCall application, website, and all related services. By accessing and using FreeCall, you accept and agree to be bound by these Terms.

If you do not agree to any part of these Terms, you may not use our Service. We reserve the right to modify these Terms at any time. Your continued use of the Service following the posting of revised Terms means that you accept and agree to the changes.

For questions about these Terms, please contact us at support@freecall.app.`,
    },
    {
      title: '2. User Responsibilities',
      icon: '👤',
      content: `You are responsible for maintaining the confidentiality of your account credentials and password. You agree not to share your login information with others. You are fully responsible for all activities that occur under your account.

You agree to:
• Provide accurate, truthful, and current information during registration
• Maintain and promptly update your account information
• Notify us immediately of any unauthorized use of your account
• Use the Service only for lawful purposes
• Comply with all applicable laws and regulations
• Respect the rights of other users

You are solely responsible for any content you create, upload, or transmit through the Service.`,
    },
    {
      title: '3. Data Usage and Privacy',
      icon: '🔐',
      content: `Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated by reference into these Terms.

We collect and process personal information to:
• Provide and improve our Service
• Authenticate your identity
• Communicate with you about our Service
• Send administrative information and updates
• Create analytics and improve user experience
• Comply with legal obligations

Your messages, profile information, and activity data may be stored on our servers. You retain ownership of your content. By using our Service, you consent to our collection and processing of personal information as described above and in our Privacy Policy.`,
    },
    {
      title: '4. Account Deletion Policy',
      icon: '🗑️',
      content: `FreeCall provides you with the ability to delete your account at any time through your account settings.

When you delete your account:
• Your profile will be permanently removed
• All personal information associated with your account will be deleted
• Your messages will be replaced with "[User deleted their account]"
• You will be removed from all conversations
• All friend connections will be severed
• You will be logged out from all sessions

Account deletion is PERMANENT and IRREVERSIBLE. We recommend downloading or archiving any important data before deletion. We do not retain deleted account data except where required by law.

To delete your account, navigate to Settings > Danger Zone > Delete Account Permanently and follow the confirmation steps.`,
    },
    {
      title: '5. Prohibited Activities',
      icon: '⛔',
      content: `You agree not to use FreeCall for any unlawful or prohibited purpose. Specifically, you may not:

• Engage in harassment, bullying, or threatening behavior
• Share sexually explicit, obscene, or offensive content
• Impersonate any person or entity
• Transmit malware, viruses, or harmful code
• Spam or send unsolicited messages
• Collect or track personal information about others without consent
• Attempt to gain unauthorized access to the Service
• Use automated tools to scrape or collect data
• Distribute copyrighted material without permission
• Engage in any activity that interferes with the Service

Violation of these prohibitions may result in account suspension or termination at our sole discretion.`,
    },
    {
      title: '6. Limitation of Liability',
      icon: '⚖️',
      content: `TO THE FULLEST EXTENT PERMITTED BY LAW, FREECALL AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, OR GOODWILL, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR ACCESS TO THE SERVICE IN THE PAST 12 MONTHS, OR $100, WHICHEVER IS LESS.

Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of the above limitations may not apply to you.

FREECALL PROVIDES THE SERVICE "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

Your use of the Service is at your own risk. You assume full responsibility and risk of loss resulting from your use of the Service.`,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-white">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50"
        style={{ width: `${scrollProgress}%` }}
        transition={{ duration: 0.3 }}
      />

      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, 50, 0], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
        <motion.div
          className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, 30, 0], x: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, delay: 4 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sticky top-0 backdrop-blur-md bg-slate-900/30 border-b border-white/10 z-40"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition border border-white/20"
            >
              <span>←</span> Back
            </motion.button>

            <div className="text-center">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Terms & Conditions
              </h1>
            </div>

            <div className="text-sm text-gray-400">
              Last updated: {lastUpdated}
            </div>
          </div>
        </motion.header>

        {/* Content Wrapper */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.aside
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-2">
              {sections.map((section, index) => (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveSection(index);
                    document.getElementById(`section-${index}`)?.scrollIntoView({
                      behavior: 'smooth',
                    });
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all backdrop-blur-md border ${
                    activeSection === index
                      ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400/50 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg mr-2">{section.icon}</span>
                  <span className="text-sm font-medium">{section.title}</span>
                </motion.button>
              ))}
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-3 space-y-8"
          >
            {sections.map((section, index) => (
              <motion.article
                key={index}
                id={`section-${index}`}
                variants={itemVariants}
                className="group backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:border-white/30 transition-all hover:shadow-2xl hover:shadow-blue-500/10"
              >
                {/* Section Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition">
                      <span className="text-2xl">{section.icon}</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-1">
                      {section.title}
                    </h2>
                    <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  </div>
                </div>

                {/* Section Content */}
                <div className="text-gray-300 space-y-4 leading-relaxed">
                  {section.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="group-hover:text-gray-200 transition">
                      {paragraph.split('\n').map((line, lidx) => (
                        <span key={lidx}>
                          {line}
                          {lidx < paragraph.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </motion.article>
            ))}

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              className="backdrop-blur-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-8 text-center"
            >
              <p className="text-gray-300 mb-4">
                By using FreeCall, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
              <p className="text-sm text-gray-400">
                Last updated: {lastUpdated} | Version 1.0
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              variants={itemVariants}
              className="flex gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition"
              >
                I Accept & Sign Up
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition backdrop-blur-sm"
              >
                Go Back
              </motion.button>
            </motion.div>
          </motion.main>
        </div>

        {/* Bottom Spacing */}
        <div className="h-20" />
      </div>
    </PageTransition>
  );
};

export default TermsPage;
