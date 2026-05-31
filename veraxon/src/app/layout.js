import { AuthProvider } from '@/context/AuthContext';
import VirtualAssistant from '@/components/VirtualAssistant';
import './globals.css';

export const metadata = {
  title: 'Veraxon - AI-Driven Academic Integrity Platform',
  description: 'Empower your institution with real-time AI surveillance, behavior analysis, and robust anti-cheating protocols designed for the modern era.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Modern Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        {/* Brand Favicon / Logo */}
        <link rel="icon" type="image/png" href="/logov-removebg-preview.png" />
      </head>
      <body className="bg-[#030303] text-[#c9d1d9] antialiased font-sans selection:bg-[#0052cc] selection:text-white">
        <AuthProvider>
          {children}
          <VirtualAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
