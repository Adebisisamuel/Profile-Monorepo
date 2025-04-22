import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="bg-gradient-to-r from-teal-100 to-teal py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-10 md:mb-0">
            <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl text-navy mb-6">
              <span className="text-teal">Inzicht</span> in je 
              <br/>gemeenteleden & <span className="text-white">kerk</span>
            </h1>
            <p className="text-navy-light mb-6 max-w-lg">
              Zie welke rollen mensen in de gemeente innemen binnen de vijfvoudige bediening.
              Stel een winnend team samen.
              Begeleid je leiders en coach op het individu.
            </p>
            <p className="text-navy-light mb-8 max-w-lg">
              Verkrijg inzicht in de samenstelling van je kerk in een paar klikken.
            </p>
            
            {user ? (
              <Link to="/dashboard">
                <Button className="bg-white text-teal hover:bg-teal hover:text-white transition-colors duration-200 rounded-full px-8 py-6 shadow-sm font-semibold">
                  Ga naar dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/questionnaire">
                <Button className="bg-white text-teal hover:bg-teal hover:text-white transition-colors duration-200 rounded-full px-8 py-6 shadow-sm font-semibold">
                  Begin je profiel
                </Button>
              </Link>
            )}
          </div>
          <div className="w-full md:w-1/2">
            <div className="relative">
              <div className="relative bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-[500px] mx-auto">
                <div className="bg-white rounded-lg p-2">
                  <div className="mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-navy">Dashboard</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-navy">Apostel</span>
                        <span className="text-sm text-navy-light">35%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1A2033]" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-navy">Profeet</span>
                        <span className="text-sm text-navy-light">65%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-navy">Evangelist</span>
                        <span className="text-sm text-navy-light">42%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2C3654]" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-navy">Herder</span>
                        <span className="text-sm text-navy-light">55%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#8EECD8]" style={{ width: '55%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-navy">Leraar</span>
                        <span className="text-sm text-navy-light">30%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-400" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
