import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface NavbarProps {
  user: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const { logoutMutation } = useAuth();
  
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Logo className="h-10 w-10" />
            <span className="ml-2 text-navy font-semibold text-lg">BEDIENINGEN PROFIEL</span>
          </Link>
        </div>
        
        <div className="hidden md:flex space-x-8 items-center">
          <a href="#product" className="text-navy-light hover:text-navy transition-colors font-medium">Product</a>
          <a href="#tarief" className="text-navy-light hover:text-navy transition-colors font-medium">Tarief</a>
          <a href="#over" className="text-navy-light hover:text-navy transition-colors font-medium">Over</a>
          
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-navy-light hover:text-navy transition-colors font-medium">
                Dashboard
              </Link>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                className="text-teal border-teal hover:bg-teal hover:text-white rounded-full"
              >
                Uitloggen
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="bg-white text-teal border border-teal hover:bg-teal hover:text-white transition-colors duration-200 px-5 py-2 rounded-full font-medium">
              Inloggen
            </Link>
          )}
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[280px]">
            <div className="flex flex-col h-full py-4">
              <Link to="/" className="flex items-center mb-6">
                <Logo className="h-8 w-8" />
                <span className="ml-2 text-navy font-semibold">BEDIENINGEN PROFIEL</span>
              </Link>
              
              <nav className="flex flex-col space-y-4">
                <a href="#product" className="text-navy-light hover:text-navy transition-colors">
                  Product
                </a>
                <a href="#tarief" className="text-navy-light hover:text-navy transition-colors">
                  Tarief
                </a>
                <a href="#over" className="text-navy-light hover:text-navy transition-colors">
                  Over
                </a>
                
                {user ? (
                  <>
                    <Link to="/dashboard" className="text-navy-light hover:text-navy transition-colors">
                      Dashboard
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => logoutMutation.mutate()}
                      className="text-teal border-teal hover:bg-teal hover:text-white mt-4"
                    >
                      Uitloggen
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" className="inline-block bg-teal text-white px-4 py-2 rounded-md hover:bg-teal-dark transition-colors mt-4">
                    Inloggen
                  </Link>
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
