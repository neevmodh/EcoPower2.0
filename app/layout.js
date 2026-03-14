import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import SmartChatbot from '@/components/SmartChatbot';

export const metadata = {
  title: 'EcoPower | Energy-as-a-Service Platform',
  description: 'Subscribe to solar power, battery backup, and smart energy management without owning or maintaining any equipment.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <SmartChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
