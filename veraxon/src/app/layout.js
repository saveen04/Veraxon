import { AuthProvider } from '@/context/AuthContext';
import VirtualAssistant from '@/components/VirtualAssistant';
import { BRAND } from '@/lib/brand';
import './globals.css';

export const metadata = {
  title: `${BRAND.NAME} - AI-Driven Academic Integrity Platform`,
  description: BRAND.TAGLINE,
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
        {/* Brand Favicon — controlled via BRAND.LOGO_PATH in src/lib/brand.js */}
        <link rel="icon" type="image/png" href={BRAND.LOGO_PATH} />
      </head>
      <body className="bg-[#030303] text-[#c9d1d9] antialiased font-sans selection:bg-[#0052cc] selection:text-white relative min-h-screen">
        {/* Premium Floating Orb Background Layers */}
        <div className="floating-orbs-container">
          <div className="floating-orb floating-orb-1" />
          <div className="floating-orb floating-orb-2" />
          <div className="floating-orb floating-orb-3" />
        </div>

        <AuthProvider>
          {children}
          <VirtualAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
