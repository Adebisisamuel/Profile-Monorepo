import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/landing/navbar";

interface LandingLayoutProps {
  children: React.ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-navy text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 bg-teal"></div>
              <span className="ml-2 font-semibold">BEDIENINGEN PROFIEL</span>
            </div>
            <div className="text-sm text-gray-300">
              © {new Date().getFullYear()} Bedieningen Profiel. Alle rechten voorbehouden.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
