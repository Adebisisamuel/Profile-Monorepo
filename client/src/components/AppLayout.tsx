import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  BookOpen, 
  LogOut,
  UserCircle,
  Menu,
  X,
  Building,
  BarChart,
  CreditCard,
  UserPlus
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIsMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkIsMobile);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsMobileMenuOpen(false);
  };

  // Define navigation based on user role
  const teamLeaderNavigation = [
    {
      name: "Kerkdashboard",
      to: "/church-dashboard",
      icon: Building,
      current: location.pathname === "/church-dashboard",
    },
    {
      name: "Teams",
      to: "/teams",
      icon: Users,
      current: location.pathname === "/teams" || location.pathname === "/dashboard" || location.pathname.startsWith("/teams/"),
    },
    {
      name: "Leden",
      to: "/members",
      icon: UserPlus,
      current: location.pathname === "/members",
    },
    {
      name: "Vragenlijst Invullen",
      to: "/questionnaire",
      icon: BookOpen,
      current: location.pathname === "/questionnaire",
    },
    {
      name: "Mijn Profiel",
      to: "/results",
      icon: UserCircle,
      current: location.pathname === "/results",
    },
    {
      name: "Aanbevelingen",
      to: "/recommendations",
      icon: BookOpen,
      current: location.pathname === "/recommendations",
    },
    {
      name: "Abonnement",
      to: "/subscription",
      icon: CreditCard,
      current: location.pathname === "/subscription",
    },
    {
      name: "Kerkprofiel",
      to: "/church-profile",
      icon: BarChart,
      current: location.pathname === "/church-profile",
    },
  ];
  
  // Navigation for regular team members
  const teamMemberNavigation = [
    {
      name: "Vragenlijst",
      to: "/questionnaire",
      icon: BookOpen,
      current: location.pathname === "/questionnaire",
    },
    {
      name: "Mijn Resultaten",
      to: "/results",
      icon: UserCircle,
      current: location.pathname === "/results",
    },
    {
      name: "Aanbevelingen",
      to: "/recommendations",
      icon: BookOpen,
      current: location.pathname === "/recommendations",
    },
    {
      name: "Abonnement",
      to: "/subscription",
      icon: CreditCard,
      current: location.pathname === "/subscription",
    },
  ];
  
  // Choose the right navigation based on user role
  // Ensure we have a default if role isn't set yet
  const userRole = user?.role || 'user';
  const navigation = userRole === 'teamleader' ? teamLeaderNavigation : teamMemberNavigation;

  // User Info Component (reused in both mobile and desktop)
  const UserInfo = () => {
    // Get initials from firstName and lastName
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || user?.name || 'User';
    const initials = firstName && lastName 
      ? (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() 
      : user?.name?.charAt(0).toUpperCase() || 'U';
    
    return (
      <div className="flex items-center">
        <Avatar className="w-10 h-10">
          {user?.profileImageUrl ? (
            <AvatarImage src={user.profileImageUrl} alt={fullName} />
          ) : null}
          <AvatarFallback className="bg-primary text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <p className="font-medium">{fullName}</p>
          <p className="text-xs text-gray-500">{user?.email || ''}</p>
          {user?.role && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-1">
              {user.role === 'teamleader' ? 'Team Leader' : 'Teamlid'}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Navigation Component (reused in both mobile and desktop)
  const Navigation = ({ isMobile = false, onItemClick = () => {} }) => (
    <nav className="flex-1 p-4 space-y-2">
      {navigation.map((item) => (
        <Link key={item.name} to={item.to}>
          <div
            className={cn(
              "flex items-center px-3 py-2.5 rounded-md text-sm font-medium group cursor-pointer",
              item.current 
                ? "bg-primary/10 text-primary" 
                : "text-gray-600 hover:bg-gray-100"
            )}
            onClick={onItemClick}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5",
                item.current ? "text-primary" : "text-gray-500 group-hover:text-gray-900"
              )}
            />
            {item.name}
          </div>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-primary text-white px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center">
          <div className="text-lg font-semibold text-white">Bedieningen Profiel</div>
          {/* Show current section on mobile */}
          {navigation.find(item => item.current) && (
            <div className="ml-3 pl-3 border-l border-white/20 text-sm font-medium">
              {navigation.find(item => item.current)?.name}
            </div>
          )}
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-primary-dark hover:text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] sm:w-[350px] p-0">
            <div className="flex flex-col h-full">
              {/* App Logo */}
              <div className="px-4 py-3 flex items-center bg-primary/5 border-b">
                <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center text-lg font-bold mr-2">
                    BP
                  </div>
                  <span className="text-primary font-semibold">BEDIENINGEN PROFIEL</span>
                </Link>
              </div>
            
              {/* User info */}
              <div className="px-4 py-4 border-b">
                <UserInfo />
              </div>

              {/* Back to main dashboard - always visible */}
              <div className="px-4 py-3 border-b">
                <Link 
                  to={userRole === 'teamleader' ? "/teams" : "/results"}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {userRole === 'teamleader' ? 'Terug naar Teams' : 'Mijn Profiel'}
                  </Button>
                </Link>
              </div>

              {/* Navigation */}
              <Navigation 
                isMobile={true} 
                onItemClick={() => setIsMobileMenuOpen(false)} 
              />

              {/* Logout button */}
              <div className="p-4 border-t mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Uitloggen
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white shadow-md fixed h-full">
          <div className="flex flex-col h-full">
            {/* App Logo */}
            <div className="px-4 py-3 flex items-center bg-primary/5 border-b">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center text-lg font-bold mr-2">
                  BP
                </div>
                <span className="text-primary font-semibold">BEDIENINGEN PROFIEL</span>
              </Link>
            </div>
            
            {/* User info */}
            <div className="px-4 py-4 border-b">
              <UserInfo />
            </div>

            {/* Back to main dashboard - always visible */}
            <div className="px-4 py-3 border-b">
              <Link to={userRole === 'teamleader' ? "/teams" : "/results"}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <UserCircle className="mr-2 h-4 w-4" />
                  {userRole === 'teamleader' ? 'Terug naar Teams' : 'Mijn Profiel'}
                </Button>
              </Link>
            </div>
            
            {/* Navigation */}
            <Navigation />

            {/* Logout button */}
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Uitloggen
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={cn(
          "flex-1",
          isMobile ? "mt-[56px] p-4" : "ml-64 p-6"
        )}>
          <main>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}