
import type { Metadata } from 'next';
import { Poppins, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import AppProviders from '@/components/layout/AppProviders';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '700'], // Adjust weights as needed
  variable: '--font-noto-sans-devanagari',
});

// To ensure page titles are primarily managed by Next.js and not dynamically changed by client-side JavaScript (within your app's code),
// rely on this 'metadata' object and the 'metadata' exports in individual page.tsx files.
// Avoid directly setting `document.title` in component lifecycle methods or effects within your application components.
export const metadata: Metadata = {
  title: {
    default: 'AtoZdpolify - Your Destination for Amazing Products',
    template: '%s | AtoZdpolify',
  },
  description: 'Discover a wide range of products at AtoZdpolify. Shop electronics, home decor, accessories, and more. Enjoy AI-powered recommendations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.variable, notoSansDevanagari.variable)}>
      <body className={cn(
        'antialiased flex flex-col min-h-screen',
        poppins.className // Apply Poppins as the default body font class
      )}>
        <AppProviders>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AppProviders>
        {/*Start of Tawk.to Script*/}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/683a7823646464190ff81eb1/1isi6ajhl';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
        {/*End of Tawk.to Script*/}
      </body>
    </html>
  );
}
