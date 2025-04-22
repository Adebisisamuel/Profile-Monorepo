import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_COLORS, ROLE_DESCRIPTIONS } from "@/lib/constants";
import { SWOT_DATA } from "@shared/swot-data";
import { ROLES } from "@shared/constants";
import { CheckCircle2, AlertCircle, TrendingUp, AlertTriangle } from "lucide-react";

interface SWOTAnalysisProps {
  primaryRole: string;
}

type SwotData = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

export default function SWOTAnalysis({ primaryRole }: SWOTAnalysisProps) {
  // Ensure primaryRole is in uppercase to match the role keys
  const normalizedRole = primaryRole.toUpperCase();
  
  // Get SWOT data for the primary role
  const swotData = SWOT_DATA[normalizedRole as keyof typeof SWOT_DATA] as SwotData | undefined;
  
  // Get role color
  const roleColor = ROLE_COLORS[normalizedRole as keyof typeof ROLE_COLORS] || "#6b7280";
  
  // Get role display title
  const roleTitle = ROLE_DESCRIPTIONS[normalizedRole as keyof typeof ROLE_DESCRIPTIONS]?.title || primaryRole;
  
  if (!swotData) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>SWOT Analyse</CardTitle>
          <CardDescription className="mt-2">
            Geen SWOT analyse beschikbaar voor de rol "{primaryRole}".
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pt-0">
          <div className="p-4 rounded-lg border bg-muted/50">
            <p>De SWOT analyse voor deze rol is momenteel niet beschikbaar. Neem contact op met de beheerder voor meer informatie.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>SWOT Analyse</span>
          <span className="text-sm font-normal bg-muted px-2 py-1 rounded">
            {roleTitle}
          </span>
        </CardTitle>
        <CardDescription className="mt-2">
          Deze SWOT analyse is specifiek voor jouw {roleTitle} rol en helpt je om je sterke en zwakke punten, 
          kansen en bedreigingen beter te begrijpen.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pt-0 sm:px-6">
        <Tabs defaultValue="strengths" className="w-full">
          {/* Use stacked layout on small screens and horizontal on larger screens */}
          <TabsList className="grid w-full grid-cols-4 gap-1">
            <TabsTrigger 
              value="strengths" 
              className="py-2 text-sm font-medium"
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-lg font-semibold text-green-600">S</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="weaknesses" 
              className="py-2 text-sm font-medium"
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-lg font-semibold text-red-600">W</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="opportunities" 
              className="py-2 text-sm font-medium"
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-lg font-semibold text-blue-600">O</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="threats" 
              className="py-2 text-sm font-medium"
            >
              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-lg font-semibold text-amber-600">T</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="strengths" className="mt-2 pt-2 relative z-10 clear-both">
            <div className="p-3 sm:p-5 rounded-lg border bg-green-50 border-green-100">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="text-base font-semibold text-green-800">Sterktes</h3>
              </div>
              <ul className="ml-3 sm:ml-5 space-y-2 list-disc marker:text-green-500">
                {swotData.strengths.map((strength: string, index: number) => (
                  <li key={index} className="text-green-700 pl-1 text-sm">{strength}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="weaknesses" className="mt-2 pt-2 relative z-10 clear-both">
            <div className="p-3 sm:p-5 rounded-lg border bg-red-50 border-red-100">
              <div className="flex items-center space-x-3 mb-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="text-base font-semibold text-red-800">Zwaktes</h3>
              </div>
              <ul className="ml-3 sm:ml-5 space-y-2 list-disc marker:text-red-500">
                {swotData.weaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="text-red-700 pl-1 text-sm">{weakness}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="opportunities" className="mt-2 pt-2 relative z-10 clear-both">
            <div className="p-3 sm:p-5 rounded-lg border bg-blue-50 border-blue-100">
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-semibold text-blue-800">Kansen</h3>
              </div>
              <ul className="ml-3 sm:ml-5 space-y-2 list-disc marker:text-blue-500">
                {swotData.opportunities.map((opportunity: string, index: number) => (
                  <li key={index} className="text-blue-700 pl-1 text-sm">{opportunity}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="threats" className="mt-2 pt-2 relative z-10 clear-both">
            <div className="p-3 sm:p-5 rounded-lg border bg-amber-50 border-amber-100">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-semibold text-amber-800">Bedreigingen</h3>
              </div>
              <ul className="ml-3 sm:ml-5 space-y-2 list-disc marker:text-amber-500">
                {swotData.threats.map((threat: string, index: number) => (
                  <li key={index} className="text-amber-700 pl-1 text-sm">{threat}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}