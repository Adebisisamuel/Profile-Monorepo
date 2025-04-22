import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RoleResults } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import RoleChart from "@/components/RoleChart";
import { Upload, FileEdit, Download, Users, PieChart, ChevronRight, Building } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CHURCH_DENOMINATIONS } from "@shared/schema";
import { SimpleSelect } from "@/components/ui/simple-select";



type Church = {
  id: number;
  name: string;
  location: string;
  country?: string;
  city?: string;
  denomination: string;
  createdById: number;
  logoUrl?: string | null;
}

type ChurchStats = {
  totalMembers: number;
  totalTeams: number;
  aggregatedRoleScores: RoleResults;
}

export default function ChurchProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [churchData, setChurchData] = useState<{
    name: string;
    location: string;
    country?: string;
    city?: string;
    denomination: string;
  }>({
    name: "",
    location: "",
    country: "",
    city: "",
    denomination: "",
  });

  // Fetch church data
  const { 
    data: church, 
    isLoading: isLoadingChurch,
    error: churchError
  } = useQuery<Church>({
    queryKey: ["/api/churches/my"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && user.role === "teamleader",
  });

  // Fetch church statistics
  const { 
    data: churchStats, 
    isLoading: isLoadingStats 
  } = useQuery<ChurchStats>({
    queryKey: ["/api/churches/stats"],
    queryFn: async ({ queryKey }) => {
      const url = `${queryKey[0]}?churchId=${church?.id}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch church statistics");
      }
      return res.json();
    },
    enabled: !!church?.id,
  });

  useEffect(() => {
    if (church) {
      // If we have church data, populate the form
      setChurchData({
        name: church.name,
        location: church.location,
        country: church.country || "",
        city: church.city || "",
        denomination: church.denomination || "",
      });
    } else if (churchError || (!isLoadingChurch && !church)) {
      // No church found (404), automatically enter edit mode to create one
      console.log("No church found, entering edit mode automatically");
      setIsEditing(true);
      
      // Initialize with empty data
      setChurchData({
        name: "",
        location: "",
        country: "Nederland", // Default to Nederland for convenience
        city: "",
        denomination: "",
      });
    }
  }, [church, churchError, isLoadingChurch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Reset the file input if there are no files
      if (!e.target.files || e.target.files.length === 0) {
        console.log("No file selected or file selection cancelled");
        return;
      }

      // Get the selected file
      const file = e.target.files[0];
      console.log("File selected:", file.name, file.size, file.type);
      
      // Validate file type and size
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: "Ongeldig bestandstype",
          description: "Upload een afbeelding in JPG, PNG, GIF of SVG formaat.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if the file is too large (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Bestand te groot",
          description: "De afbeelding mag niet groter zijn dan 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Set the selected file if it passes validation
      setSelectedFile(file);
      
      // Show success message
      toast({
        title: "Bestand geselecteerd",
        description: `"${file.name}" is klaar om te uploaden. Klik op 'Logo uploaden' om door te gaan.`,
      });
    } catch (err) {
      console.error("Error in file selection:", err);
      toast({
        title: "Bestandsselectie mislukt",
        description: "Er is een probleem opgetreden bij het selecteren van het bestand.",
        variant: "destructive",
      });
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) {
      toast({
        title: "Geen bestand geselecteerd",
        description: "Selecteer eerst een afbeelding om te uploaden.",
        variant: "destructive",
      });
      return;
    }

    if (!church) {
      toast({
        title: "Maak eerst een kerk aan",
        description: "Maak eerst een kerkprofiel aan voordat je een logo uploadt. Vul de gegevens in en klik op 'Opslaan'.",
        variant: "destructive",
      });
      // Automatically switch to edit mode if not already there
      if (!isEditing) {
        setIsEditing(true);
      }
      return;
    }

    // Show loading state
    toast({
      title: "Bezig met uploaden...",
      description: "Even geduld terwijl het logo wordt geüpload.",
    });

    const formData = new FormData();
    formData.append('logo', selectedFile);

    try {
      console.log("Uploading logo for church:", church.id);
      const response = await apiRequest("POST", `/api/churches/${church.id}/logo`, formData);
      
      if (response.ok) {
        toast({
          title: "Logo geüpload",
          description: "Het kerkenlogo is succesvol geüpload.",
        });
        
        // Invalidate the church query to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/churches/my"] });
        setSelectedFile(null);
      } else {
        console.error("Upload response not OK:", await response.text());
        throw new Error("Er is iets misgegaan bij het uploaden van het logo.");
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({
        title: "Upload mislukt",
        description: error instanceof Error ? error.message : "Er is iets misgegaan.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateChurch = async () => {
    // Check if we're creating a new church or updating an existing one
    const isCreatingNew = !church;

    // Verify required fields regardless of mode
    if (!churchData.name || churchData.name.trim() === "") {
      toast({
        title: "Naam ontbreekt",
        description: "Vul de naam van de kerk in om door te gaan.",
        variant: "destructive",
      });
      return;
    }

    // Show saving state to prevent multiple clicks
    const savingToast = toast({
      title: isCreatingNew ? "Bezig met aanmaken..." : "Bezig met opslaan...",
      description: isCreatingNew 
        ? "Een nieuwe kerk wordt aangemaakt." 
        : "De kerkgegevens worden bijgewerkt.",
    });

    // Determine the location based on country and city
    const country = churchData.country || "";
    const city = churchData.city || "";
    let locationValue = "";
    
    // Only build location from country and city when both are present
    if (country && city) {
      // If one of them is "Anders", just use the other one
      if (country === "Anders" && city !== "Anders") {
        locationValue = city;
      } else if (city === "Anders" && country !== "Anders") {
        locationValue = country;
      } else if (country === "Anders" && city === "Anders") {
        // If both are "Anders", use a generic value or leave empty
        locationValue = "Overige";
      } else {
        // Normal case with valid country and city
        locationValue = `${city}, ${country}`;
      }
    } else if (country) {
      // Only country is provided
      locationValue = country;
    } else if (city) {
      // Only city is provided
      locationValue = city;
    }

    // Use the newly calculated location or fall back to existing location
    const safeChurchData = {
      name: churchData.name,
      location: locationValue || churchData.location || "",
      country: country,
      city: city,
      denomination: churchData.denomination || "",
    };

    console.log(isCreatingNew ? "Creating new church:" : "Updating church:", safeChurchData);

    try {
      let response;
      
      if (isCreatingNew) {
        // Create a new church
        response = await apiRequest("POST", "/api/churches", safeChurchData);
      } else if (church && church.id) {
        // Update existing church
        response = await apiRequest("PATCH", `/api/churches/${church.id}`, safeChurchData);
      } else {
        throw new Error("Geen kerk ID gevonden om bij te werken");
      }
      
      if (response.ok) {
        const responseData = await response.json();
        
        toast({
          title: isCreatingNew ? "Kerk aangemaakt" : "Kerk bijgewerkt",
          description: isCreatingNew 
            ? "De kerk is succesvol aangemaakt." 
            : "De kerkgegevens zijn succesvol bijgewerkt.",
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/churches/my"] });
        
        if (!isCreatingNew && church && church.id) {
          queryClient.invalidateQueries({ queryKey: ["/api/churches", church.id, "dashboard"] });
        }
        
        // If we created a new church, we want to stay in edit mode to allow the user
        // to continue setting up their church profile
        if (!isCreatingNew) {
          setIsEditing(false);
        }
      } else {
        const errorText = await response.text();
        console.error("Server response error:", errorText);
        throw new Error(isCreatingNew 
          ? `Fout bij aanmaken: ${errorText}` 
          : `Fout bij bijwerken: ${errorText}`);
      }
    } catch (error) {
      console.error(isCreatingNew ? "Error creating church:" : "Error updating church:", error);
      toast({
        title: isCreatingNew ? "Aanmaken mislukt" : "Update mislukt",
        description: error instanceof Error 
          ? error.message 
          : `Er is iets misgegaan bij het ${isCreatingNew ? 'aanmaken' : 'bijwerken'} van de kerkgegevens.`,
        variant: "destructive",
      });
      // Don't exit edit mode on error so user can try again
    }
  };

  if (!user || user.role !== "teamleader") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Niet toegankelijk</CardTitle>
            <CardDescription>
              Je hebt geen toegang tot deze pagina. Alleen teamleiders hebben toegang tot kerkprofielen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isLoading = isLoadingChurch || isLoadingStats;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center">
        <Building className="h-8 w-8 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Kerkprofiel</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profiel</TabsTrigger>
          <TabsTrigger value="analytics">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Church Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle>Kerkgegevens</CardTitle>
                <CardDescription>Beheer de informatie over jouw kerk</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="church-name">Naam</Label>
                          <Input
                            id="church-name"
                            value={churchData.name}
                            onChange={(e) => setChurchData({ ...churchData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="church-country">Land</Label>
                            <SimpleSelect
                              key="country-select"
                              value={churchData.country || ""}
                              onChange={(value) => {
                                try {
                                  console.log("Country changed to:", value);
                                  setChurchData({ ...churchData, country: value, city: "" });
                                } catch (err) {
                                  console.error("Error updating country:", err);
                                  // Silent error handling to prevent white screen
                                }
                              }}
                              placeholder="Selecteer land"
                              options={[
                                { value: "Nederland", label: "Nederland" },
                                { value: "België", label: "België" },
                                { value: "Duitsland", label: "Duitsland" },
                                { value: "Frankrijk", label: "Frankrijk" },
                                { value: "Verenigd Koninkrijk", label: "Verenigd Koninkrijk" },
                                { value: "Spanje", label: "Spanje" },
                                { value: "Italië", label: "Italië" },
                                { value: "Zwitserland", label: "Zwitserland" },
                                { value: "Anders", label: "Anders" }
                              ]}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="church-city">Stad</Label>
                            <SimpleSelect
                              key="city-select"
                              options={(() => {
                                let cityOptions = [
                                  { label: "Amsterdam", value: "amsterdam" },
                                  { label: "Rotterdam", value: "rotterdam" },
                                  { label: "Den Haag", value: "den-haag" },
                                  { label: "Utrecht", value: "utrecht" },
                                  { label: "Eindhoven", value: "eindhoven" },
                                  { label: "Groningen", value: "groningen" },
                                  { label: "Almere", value: "almere" },
                                  { label: "Breda", value: "breda" },
                                  { label: "Nijmegen", value: "nijmegen" },
                                  { label: "Enschede", value: "enschede" },
                                  { label: "Maastricht", value: "maastricht" },
                                  { label: "Purmerend", value: "purmerend" },
                                  { label: "Anders", value: "Anders" },
                                ];
                                return cityOptions;
                              })()}
                              value={churchData.city || ""}
                              onChange={(value) => {
                                try {
                                  console.log("City changed to:", value);
                                  setChurchData({ ...churchData, city: value });
                                } catch (err) {
                                  console.error("Error updating city:", err);
                                  // Silent error handling to prevent white screen
                                }
                              }}
                              disabled={!churchData.country}
                              placeholder={churchData.country ? "Selecteer stad" : "Selecteer eerst een land"}
                            />
                            {!churchData.country && (
                              <p className="text-sm text-muted-foreground">Selecteer eerst een land hierboven</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="church-denomination">Denominatie</Label>
                          <SimpleSelect
                            key="denomination-select"
                            value={churchData.denomination || ""}
                            onChange={(value) => {
                              try {
                                console.log("Denomination changed to:", value);
                                setChurchData({ ...churchData, denomination: value });
                              } catch (err) {
                                console.error("Error updating denomination:", err);
                                // Silent error handling to prevent white screen
                              }
                            }}
                            placeholder="Selecteer denominatie"
                            options={CHURCH_DENOMINATIONS.map(denom => ({ value: denom, label: denom }))}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-medium">{church?.name || "Nog niet ingesteld"}</h3>
                            <p className="text-muted-foreground">
                              {church?.country ? 
                                `${church.city ? church.city + ", " : ""}${church.country}` : 
                                (church?.location || "Locatie niet ingesteld")
                              }
                            </p>
                          </div>
                          <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <FileEdit className="h-4 w-4 mr-2" />
                            Bewerken
                          </Button>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          {church?.country && (
                            <div>
                              <h4 className="font-medium mb-1">Land</h4>
                              <p>{church.country}</p>
                            </div>
                          )}
                          {church?.city && (
                            <div>
                              <h4 className="font-medium mb-1">Stad</h4>
                              <p>{church.city}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium mb-1">Denominatie</h4>
                            <p>{church?.denomination || "Niet ingesteld"}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {isEditing && (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="mr-2">
                      Annuleren
                    </Button>
                    <Button 
                      onClick={handleUpdateChurch}
                      className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Opslaan
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>

            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Kerklogo</CardTitle>
                <CardDescription>Upload het logo van jouw kerk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-40 w-40 border rounded-md flex items-center justify-center overflow-hidden">
                    {church?.logoUrl ? (
                      <img 
                        src={church.logoUrl} 
                        alt="Kerklogo" 
                        className="max-h-full max-w-full object-contain" 
                      />
                    ) : (
                      <Building className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-4 w-full">
                    {/* Primary upload method - visible button */}
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
                        if (fileInput) {
                          // Reset file input value to ensure onChange triggers even if same file is selected
                          fileInput.value = '';
                          fileInput.click();
                        }
                      }}
                      className="w-full md:w-auto"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Kies een bestand
                    </Button>
                    
                    {/* Alternative method - draggable area */}
                    <div 
                      className="w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
                        if (fileInput) {
                          // Reset file input value to ensure onChange triggers even if same file is selected
                          fileInput.value = '';
                          fileInput.click();
                        }
                      }}
                    >
                      <p className="text-sm text-muted-foreground">
                        {selectedFile ? 
                          `Geselecteerd: ${selectedFile.name}` : 
                          "Klik of sleep een afbeelding hier"
                        }
                      </p>
                    </div>
                    
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    {selectedFile && (
                      <div className="mt-2 p-2 bg-muted rounded w-full flex justify-between items-center">
                        <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          X
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button 
                  onClick={handleUploadLogo} 
                  disabled={!selectedFile}
                  className="w-full relative bg-primary hover:bg-primary/90 text-white font-medium py-2"
                  variant={selectedFile ? "default" : "outline"}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? "Logo uploaden" : "Selecteer eerst een bestand"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Stats */}
            <div className="lg:col-span-1">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Teams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-2xl font-bold">
                        {isLoading ? "..." : churchStats?.totalTeams || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Leden</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      <span className="text-2xl font-bold">
                        {isLoading ? "..." : churchStats?.totalMembers || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Kerkstatistieken</CardTitle>
                  <CardDescription>Download en deel kerkgegevens</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exporteer naar CSV
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Role Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rol Distributie</CardTitle>
                <CardDescription>Verdeling van bedieningen binnen de kerk</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : churchStats?.aggregatedRoleScores ? (
                  <div className="w-full max-w-lg">
                    <RoleChart 
                      results={churchStats.aggregatedRoleScores}
                      type="pie"
                      height={300}
                      showLegend={true}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Geen rolgegevens beschikbaar</p>
                    <p className="text-sm mt-2">Laat teamleden de vragenlijst invullen om statistieken te zien</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}