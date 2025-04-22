import React from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { PRICING_OPTIONS } from "@/lib/constants";
import { Link } from "react-router-dom";

export function PricingSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="font-bold text-2xl md:text-3xl text-navy text-center mb-12">Kies je abonnement</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_OPTIONS.map((option) => (
            <div 
              key={option.tier}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-32 bg-gradient-to-r from-teal-100 to-teal relative">
                <h3 className="absolute bottom-4 left-6 text-white font-bold text-2xl">{option.price}</h3>
                {option.title !== "Gratis" && (
                  <p className="absolute bottom-4 right-6 text-white font-medium">{option.title}</p>
                )}
              </div>
              <div className="p-6">
                <ul className="mb-6 space-y-3">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-teal mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button 
                    className={`w-full ${option.isPopular ? 'bg-teal text-white hover:bg-teal-dark' : 'bg-white text-teal border border-teal hover:bg-teal hover:text-white'} transition-colors duration-200 font-semibold rounded-full py-2 shadow-sm`}
                  >
                    {option.buttonText}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-navy-light mt-6">Je kunt altijd je abonnement later nog upgraden</p>
      </div>
    </section>
  );
}
