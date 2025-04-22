import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo className="h-10 w-10" />
            <span className="ml-2 text-navy font-semibold text-lg">BEDIENINGEN PROFIEL</span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-navy-light hover:text-navy transition-colors font-medium">Product</Link>
            <Link to="/" className="text-navy-light hover:text-navy transition-colors font-medium">Tarief</Link>
            <Link to="/" className="text-navy-light hover:text-navy transition-colors font-medium">Over</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-navy-light hover:text-navy transition-colors font-medium">
                  Dashboard
                </Link>
                <Button
                  variant="outline"
                  onClick={() => logoutMutation.mutate()}
                  className="text-teal border-teal hover:bg-teal hover:text-white"
                >
                  Uitloggen
                </Button>
              </div>
            ) : (
              <Link to="/auth" className="bg-white text-teal border border-teal hover:bg-teal hover:text-white transition-colors duration-200 px-5 py-2 rounded-full font-medium">
                Inloggen
              </Link>
            )}
          </nav>
          
          <button className="md:hidden text-navy">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-navy text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Logo className="h-8 w-8" />
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
