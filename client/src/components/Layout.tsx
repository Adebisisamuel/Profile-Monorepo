import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #c5f1d5 0%, #00c389 100%)" }}>
      <Navbar />
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
      <footer className="bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <div className="h-8 w-auto flex items-center">
                <div className="text-primary mr-2">
                  <svg className="h-8 w-8" viewBox="0 0 100 100" fill="none">
                    <path d="M20 20 L20 80 L40 80 L40 60 L60 60 L60 40 L80 40 L80 20 L20 20" fill="currentColor"/>
                  </svg>
                </div>
                <span className="font-bold text-gray-900">BEDIENINGEN PROFIEL</span>
              </div>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-gray-500">&copy; {new Date().getFullYear()} Bedieningen Profiel. Alle rechten voorbehouden.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
