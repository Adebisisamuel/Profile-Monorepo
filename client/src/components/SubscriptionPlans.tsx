import { SUBSCRIPTION_PLANS, PLAN_LIMITS } from "@shared/constants";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface SubscriptionPlansProps {
  onSelectPlan?: (plan: string) => void;
}

export default function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  const plans = [
    {
      name: "Gratis",
      price: "Gratis",
      color: "bg-green-100",
      textColor: "text-green-800",
      key: SUBSCRIPTION_PLANS.FREE,
      limits: PLAN_LIMITS[SUBSCRIPTION_PLANS.FREE],
    },
    {
      name: "Pro",
      price: `€${PLAN_LIMITS[SUBSCRIPTION_PLANS.PRO].price} p/m`,
      color: "bg-green-500",
      textColor: "text-white",
      key: SUBSCRIPTION_PLANS.PRO,
      limits: PLAN_LIMITS[SUBSCRIPTION_PLANS.PRO],
    },
    {
      name: "Pro+",
      price: `€${PLAN_LIMITS[SUBSCRIPTION_PLANS.PROPLUS].price} p/m`,
      color: "bg-green-700",
      textColor: "text-white",
      key: SUBSCRIPTION_PLANS.PROPLUS,
      limits: PLAN_LIMITS[SUBSCRIPTION_PLANS.PROPLUS],
    },
  ];

  const handleSelectPlan = (plan: string) => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg mb-16">
      <h2 className="text-2xl font-bold mb-6 text-center">Maak je keuze uit de abonnementsvormen</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.key} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`${plan.color} h-32 flex items-center justify-center`}>
              <h3 className={`text-3xl font-bold ${plan.textColor}`}>{plan.price}</h3>
            </div>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">{plan.name}</h4>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Tot {plan.limits.users} gebruikers</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span>Tot {plan.limits.teams} {plan.limits.teams === 1 ? 'team' : 'teams'}</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSelectPlan(plan.key)} 
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Kies {plan.name}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="text-center mt-4 text-gray-600">Je kunt altijd je abonnement later nog upgraden</p>
    </div>
  );
}
