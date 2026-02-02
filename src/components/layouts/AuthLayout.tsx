import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Content */}
      <main className="min-h-screen flex items-center justify-center">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground z-10">
        <p>© 2026 Smart Savdo. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
};
