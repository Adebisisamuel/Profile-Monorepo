import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronDown, Lightbulb, Users, BarChart, Settings, Building } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <div className="cursor-pointer"><Logo /></div>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Link to="/privacy-policy">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">Privacy</div>
              </Link>
              <Link to="/terms-and-conditions">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">Voorwaarden</div>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {!user ? (
              <Link to="/auth">
                <Button variant="outline">Inloggen</Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {user.role === 'teamleader' && (
                      <>
                        <Link to="/church-dashboard">
                          <DropdownMenuItem className="cursor-pointer">
                            <Building className="mr-2 h-4 w-4" />
                            <span>Kerkdashboard</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link to="/teams">
                          <DropdownMenuItem className="cursor-pointer">
                            <Users className="mr-2 h-4 w-4" />
                            <span>Teams</span>
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <Link to="/questionnaire">
                      <DropdownMenuItem className="cursor-pointer">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        <span>Vragenlijst</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/results">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Resultaten</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Uitloggen</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
