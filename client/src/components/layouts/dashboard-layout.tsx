import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, Settings, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Create initials from firstName and lastName
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Logo className="h-8 w-8" />
                <span className="ml-2 font-semibold text-navy">BEDIENINGEN PROFIEL</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="hidden md:flex items-center cursor-pointer">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profileImageUrl || ""} />
                      <AvatarFallback className="bg-teal text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-navy hidden md:inline-block">{fullName}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Mijn Profiel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile-settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profiel Instellingen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[280px]">
                  <div className="flex flex-col h-full">
                    <div className="py-4 border-b">
                      <div className="flex items-center">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profileImageUrl || ""} />
                          <AvatarFallback className="bg-teal text-white">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="font-medium">{fullName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <nav className="flex flex-col py-4 flex-1 space-y-1">
                      <Link 
                        to="/dashboard"
                        className="px-4 py-2 rounded hover:bg-gray-100 text-teal flex items-center"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Mijn Profiel
                      </Link>
                      
                      <Link 
                        to="/profile-settings"
                        className="px-4 py-2 rounded hover:bg-gray-100 text-gray-700 flex items-center"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Profiel Instellingen
                      </Link>
                      
                      {user.role === "teamleader" && (
                        <Link 
                          to="/team-dashboard"
                          className="px-4 py-2 rounded hover:bg-gray-100 text-gray-700 flex items-center"
                        >
                          Team Dashboard
                        </Link>
                      )}
                    </nav>
                    
                    <div className="py-4 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => logoutMutation.mutate()}
                      >
                        Uitloggen
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {title && (
          <div className="bg-gradient-to-r from-teal-100 to-teal py-8 px-4">
            <div className="container mx-auto">
              <h1 className="font-bold text-2xl md:text-3xl text-navy mb-2">{title}</h1>
              {subtitle && <p className="text-navy-light opacity-90 max-w-2xl">{subtitle}</p>}
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
