import React, { useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOCIETY_SECTORS, REFERRAL_SOURCES } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define validation schema for profile form
const profileSchema = z.object({
  firstName: z.string()
    .min(2, "Voornaam moet minimaal 2 karakters bevatten")
    .max(50, "Voornaam mag maximaal 50 karakters bevatten")
    .refine(val => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(val), {
      message: "Voornaam mag alleen letters, spaties, ' en - bevatten"
    }),
  lastName: z.string()
    .min(2, "Achternaam moet minimaal 2 karakters bevatten")
    .max(50, "Achternaam mag maximaal 50 karakters bevatten")
    .refine(val => /^[a-zA-ZÀ-ÿ\s'-]+$/.test(val), {
      message: "Achternaam mag alleen letters, spaties, ' en - bevatten"
    }),
  email: z.string().email("Ongeldig e-mailadres").optional(),
  country: z.string().max(50, "Land mag maximaal 50 karakters bevatten").optional(),
  city: z.string().max(50, "Stad mag maximaal 50 karakters bevatten").optional(),
  currentSector: z.string().optional(),
  preferredSector: z.string().optional(),
  referralSource: z.string().optional(),
});

interface ProfileFormData extends z.infer<typeof profileSchema> {}

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      country: "",
      city: "",
      currentSector: "",
      preferredSector: "",
      referralSource: "",
    },
  });
  
  useEffect(() => {
    if (user) {
      // Set form values from user data
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        country: user.country || "",
        city: user.city || "",
        currentSector: user.currentSector || "",
        preferredSector: user.preferredSector || "",
        referralSource: user.referralSource || "",
      });
    }
  }, [user, form]);
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profiel bijgewerkt",
        description: "Je profielgegevens zijn succesvol bijgewerkt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van je profiel.",
        variant: "destructive",
      });
    },
  });
  
  const handleImageUploaded = (imageUrl: string) => {
    // The image upload component will handle the upload process
    // This callback is fired when the upload is complete
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };
  
  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Profiel Instellingen" 
      subtitle="Beheer je persoonlijke gegevens en profielafbeelding."
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Card className="mb-8">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl break-words">Profielafbeelding</CardTitle>
            <CardDescription className="text-sm">
              Upload een profielfoto of avatar om jezelf te identificeren.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-4 sm:p-6">
            <div className="mb-6">
              <ImageUpload 
                name={`${user.firstName} ${user.lastName}`}
                size="lg"
                currentImageUrl={user.profileImageUrl}
                uploadUrl="/api/upload/profile"
                onImageUploaded={handleImageUploaded}
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              Klik op de avatar om een nieuwe afbeelding te uploaden. Maximum bestandsgrootte: 5MB.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl break-words">Persoonlijke Informatie</CardTitle>
            <CardDescription className="text-sm">
              Werk je persoonlijke gegevens bij. Deze informatie is zichtbaar voor je teamleider.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornaam</FormLabel>
                        <FormControl>
                          <Input placeholder="Jouw voornaam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achternaam</FormLabel>
                        <FormControl>
                          <Input placeholder="Jouw achternaam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mailadres</FormLabel>
                        <FormControl>
                          <Input type="email" disabled {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">E-mailadres kan niet worden gewijzigd.</p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land</FormLabel>
                        <FormControl>
                          <Input placeholder="Jouw land" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stad</FormLabel>
                        <FormControl>
                          <Input placeholder="Jouw stad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentSector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Huidige Sector</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een sector" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOCIETY_SECTORS.map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preferredSector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voorkeur Sector</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een sector" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SOCIETY_SECTORS.map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="referralSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hoe ken je ons?</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer een optie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REFERRAL_SOURCES.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Show form errors if any occur */}
                {form.formState.errors.root && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Fout</AlertTitle>
                    <AlertDescription>
                      {form.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-teal hover:bg-teal-dark"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opslaan...
                      </>
                    ) : (
                      "Opslaan"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}