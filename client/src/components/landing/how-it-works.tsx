import React from "react";

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Vul de enquête in",
      description: "Beantwoord 40 vragen over je rol binnen de kerk en gemeente"
    },
    {
      number: 2,
      title: "Bekijk je profiel",
      description: "Ontvang direct inzicht in je vijfvoudige bediening en wat dit betekent"
    },
    {
      number: 3,
      title: "Teamoverzicht",
      description: "Teamleiders krijgen een compleet beeld van de samenstelling van hun team"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-bold text-2xl md:text-3xl text-navy text-center mb-12">Hoe werkt het?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">{step.number}</span>
              </div>
              <h3 className="font-semibold text-xl text-navy mb-3">{step.title}</h3>
              <p className="text-navy-light">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
