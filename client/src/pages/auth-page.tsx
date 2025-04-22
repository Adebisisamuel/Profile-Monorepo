import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SOCIETY_SECTORS, REFERRAL_SOURCES, CHURCH_DENOMINATIONS } from "@shared/schema";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Select components replaced with SimpleSelect
import { SimpleSelect, type SimpleSelectOption } from "@/components/ui/simple-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const loginSchema = z.object({
  email: z.string().email("Vul een geldig e-mailadres in"),
  password: z.string().min(6, "Wachtwoord moet ten minste 6 tekens bevatten"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "Voornaam moet ten minste 2 tekens bevatten"),
  lastName: z.string().min(2, "Achternaam moet ten minste 2 tekens bevatten"),
  email: z.string().email("Ongeldig e-mailadres"),
  password: z.string().min(6, "Wachtwoord moet ten minste 6 tekens bevatten"),
  birthDate: z.union([z.date(), z.string(), z.null()]).optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  currentSector: z.string().optional().nullable(),
  preferredSector: z.string().optional().nullable(),
  referralSource: z.string().optional().nullable(),
  isTeamLeader: z.boolean().default(false),
  denomination: z.string().optional(),
  churchName: z.string().optional(),
  churchLocation: z.string().optional(),
  inviteCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Je moet akkoord gaan met de algemene voorwaarden en het privacybeleid",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  
  // Form for login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form for register
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      birthDate: null,
      country: null,
      city: null,
      currentSector: null,
      preferredSector: null,
      referralSource: null,
      isTeamLeader: false,
      denomination: "",
      churchName: "",
      churchLocation: "",
      inviteCode: "",
      acceptTerms: false,
    },
  });

  // Parse any redirection query parameters and check for invite codes
  useEffect(() => {
    // Check if we need to pre-fill an invite code from query params
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');
    
    // Check for invite code in URL redirect parameter
    if (redirect && redirect.includes('/join/')) {
      const inviteCodeMatch = redirect.match(/\/join\/([^/]+)/);
      if (inviteCodeMatch && inviteCodeMatch[1]) {
        const inviteCode = inviteCodeMatch[1];
        registerForm.setValue('inviteCode', inviteCode);
        setHasInviteCode(true);
        // Auto-select the registration tab if we have an invite code
        setActiveTab('register');
      }
    }
    
    // Also check localStorage for a pending invite code
    const pendingInviteCode = localStorage.getItem("pendingInviteCode");
    if (pendingInviteCode) {
      registerForm.setValue('inviteCode', pendingInviteCode);
      setHasInviteCode(true);
      setActiveTab('register');
    }
    
  }, [registerForm, setActiveTab, setHasInviteCode]);

  // If already logged in, redirect to home or the specified redirect URL
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Only perform the redirect if user is authenticated
    if (user) {
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect');
      
      // Navigate to the redirect destination or home
      navigate(redirect || '/', { replace: true });
    }
  }, [user, navigate, location]);

  // Handle login form submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    try {
      // Process the data and submit
      const formattedBirthDate = data.birthDate ? 
        (typeof data.birthDate === 'string' ? data.birthDate : format(data.birthDate, 'yyyy-MM-dd')) 
        : null;
      
      // If user is joining with an invite code, ensure they can't be a team leader
      const actualIsTeamLeader = hasInviteCode ? false : data.isTeamLeader;
      
      // Prepare registration data
      const registrationData = {
        ...data,
        birthDate: formattedBirthDate,
        isTeamLeader: actualIsTeamLeader, // Make sure this is correctly set
        role: actualIsTeamLeader ? "teamleader" : "user",
      };
      
      // If not a team leader, remove church-related fields
      if (!actualIsTeamLeader) {
        delete registrationData.denomination;
        delete registrationData.churchName;
        delete registrationData.churchLocation;
      }
      
      // Log that we're registering with invite code, for debugging purposes
      if (hasInviteCode && data.inviteCode) {
        console.log(`Registering with invite code: ${data.inviteCode}, as a team member (not leader)`);
      }
      
      registerMutation.mutate(registrationData);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Registratie fout",
        description: "Er is een fout opgetreden bij het registreren. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  // Handle team leader toggle
  const handleTeamLeaderChange = (checked: boolean) => {
    setIsTeamLeader(!!checked); // Ensure boolean value
    registerForm.setValue("isTeamLeader", !!checked);
    
    // Clear church fields if not a team leader
    if (!checked) {
      registerForm.setValue("denomination", "");
      registerForm.setValue("churchName", "");
      registerForm.setValue("churchLocation", "");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Auth forms */}
      <div className="md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center break-words">Bedieningen Profiel</CardTitle>
            <CardDescription className="text-center text-sm">
              {activeTab === "login" ? "Log in op je account" : "Maak een nieuw account aan"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                <TabsTrigger value="login" className="text-sm">Inloggen</TabsTrigger>
                <TabsTrigger value="register" className="text-sm">Registreren</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">E-mailadres</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Vul je e-mailadres in" 
                              {...field} 
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Wachtwoord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Vul je wachtwoord in" 
                              {...field} 
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-10" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Bezig met inloggen..." : "Inloggen"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Voornaam</FormLabel>
                            <FormControl>
                              <Input placeholder="Voornaam" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Achternaam</FormLabel>
                            <FormControl>
                              <Input placeholder="Achternaam" {...field} className="h-10" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">E-mailadres</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="E-mailadres" 
                              {...field} 
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Wachtwoord</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Wachtwoord" 
                              {...field} 
                              className="h-10" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Birthday */}
                    <FormField
                      control={registerForm.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm">Geboortedatum</FormLabel>
                          <div className="grid grid-cols-3 gap-1 sm:gap-2">
                            <FormControl>
                              <SimpleSelect
                                onChange={(value) => {
                                  const date = field.value ? new Date(field.value) : new Date();
                                  date.setDate(15); // Set to middle of month to avoid date validation issues
                                  date.setFullYear(parseInt(value));
                                  field.onChange(date.toISOString());
                                }}
                                value={field.value ? new Date(field.value).getFullYear().toString() : ""}
                                placeholder="Jaar"
                                options={Array.from({ length: 100 }, (_, i) => ({
                                  value: (new Date().getFullYear() - i).toString(),
                                  label: (new Date().getFullYear() - i).toString()
                                }))}
                              />
                            </FormControl>
                            
                            <FormControl>
                              <SimpleSelect
                                onChange={(value) => {
                                  const date = field.value ? new Date(field.value) : new Date();
                                  date.setDate(15); // Set to middle of month to avoid date validation issues
                                  date.setMonth(parseInt(value));
                                  field.onChange(date.toISOString());
                                }}
                                value={field.value ? new Date(field.value).getMonth().toString() : ""}
                                placeholder="Maand"
                                options={[
                                  { value: "0", label: "Januari" },
                                  { value: "1", label: "Februari" },
                                  { value: "2", label: "Maart" },
                                  { value: "3", label: "April" },
                                  { value: "4", label: "Mei" },
                                  { value: "5", label: "Juni" },
                                  { value: "6", label: "Juli" },
                                  { value: "7", label: "Augustus" },
                                  { value: "8", label: "September" },
                                  { value: "9", label: "Oktober" },
                                  { value: "10", label: "November" },
                                  { value: "11", label: "December" }
                                ]}
                              />
                            </FormControl>
                            
                            <FormControl>
                              <SimpleSelect
                                onChange={(value) => {
                                  const date = field.value ? new Date(field.value) : new Date();
                                  date.setDate(parseInt(value));
                                  field.onChange(date.toISOString());
                                }}
                                value={field.value ? new Date(field.value).getDate().toString() : ""}
                                placeholder="Dag"
                                options={Array.from({ length: 31 }, (_, i) => ({
                                  value: (i + 1).toString(),
                                  label: (i + 1).toString()
                                }))}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        control={registerForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Land</FormLabel>
                            <FormControl>
                              <SimpleSelect
                                value={field.value || ""}
                                onChange={(value) => {
                                  field.onChange(value);
                                  // When country changes, reset city
                                  registerForm.setValue("city", null);
                                }}
                                placeholder="Selecteer land"
                                options={[
                                  { value: "Nederland", label: "Nederland" },
                                  { value: "België", label: "België" },
                                  { value: "Duitsland", label: "Duitsland" },
                                  { value: "Frankrijk", label: "Frankrijk" },
                                  { value: "Verenigd Koninkrijk", label: "Verenigd Koninkrijk" },
                                  { value: "Anders", label: "Anders" }
                                ]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="city"
                        render={({ field }) => {
                          // Define city options based on country
                          let cityOptions: SimpleSelectOption[] = [];
                          const country = registerForm.watch("country");
                          
                          if (country === "Nederland") {
                            cityOptions = [
                              { value: "Amsterdam", label: "Amsterdam" },
                              { value: "Rotterdam", label: "Rotterdam" },
                              { value: "Den Haag", label: "Den Haag" },
                              { value: "Utrecht", label: "Utrecht" },
                              { value: "Eindhoven", label: "Eindhoven" },
                              { value: "Groningen", label: "Groningen" },
                              { value: "Anders", label: "Anders" }
                            ];
                          } else if (country === "België") {
                            cityOptions = [
                              { value: "Brussel", label: "Brussel" },
                              { value: "Antwerpen", label: "Antwerpen" },
                              { value: "Gent", label: "Gent" },
                              { value: "Brugge", label: "Brugge" },
                              { value: "Leuven", label: "Leuven" },
                              { value: "Anders", label: "Anders" }
                            ];
                          } else if (country) {
                            cityOptions = [
                              { value: "Anders", label: "Anders" }
                            ];
                          }
                          
                          return (
                            <FormItem>
                              <FormLabel className="text-sm">Stad</FormLabel>
                              <FormControl>
                                <SimpleSelect
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder="Selecteer stad"
                                  options={cityOptions}
                                  disabled={!country}
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    {/* Sector Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        control={registerForm.control}
                        name="currentSector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Huidige sector</FormLabel>
                            <FormControl>
                              <SimpleSelect
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Selecteer sector"
                                options={[
                                  { value: "Business", label: "Business" },
                                  { value: "Politiek", label: "Politiek" },
                                  { value: "Kunst", label: "Kunst" },
                                  { value: "Onderwijs", label: "Onderwijs" },
                                  { value: "Familie", label: "Familie" },
                                  { value: "Religie", label: "Religie" },
                                  { value: "Media", label: "Media" }
                                ]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="preferredSector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voorkeur sector</FormLabel>
                            <FormControl>
                              <SimpleSelect
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Selecteer sector"
                                options={[
                                  { value: "Business", label: "Business" },
                                  { value: "Politiek", label: "Politiek" },
                                  { value: "Kunst", label: "Kunst" },
                                  { value: "Onderwijs", label: "Onderwijs" },
                                  { value: "Familie", label: "Familie" },
                                  { value: "Religie", label: "Religie" },
                                  { value: "Media", label: "Media" }
                                ]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Referral Source */}
                    <FormField
                      control={registerForm.control}
                      name="referralSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hoe ken je ons?</FormLabel>
                          <FormControl>
                            <SimpleSelect
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Hoe heeft u ons gevonden?"
                              options={[
                                { value: "Vrienden", label: "Vrienden" },
                                { value: "Familie", label: "Familie" },
                                { value: "Sociale Media", label: "Sociale Media" },
                                { value: "Zoekmachine", label: "Zoekmachine" },
                                { value: "Kerk", label: "Kerk" },
                                { value: "Evenement", label: "Evenement" },
                                { value: "Anders", label: "Anders" }
                              ]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Team Leader Checkbox - only shown when NOT joining through invite code */}
                    {!hasInviteCode ? (
                      <FormField
                        control={registerForm.control}
                        name="isTeamLeader"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={(checked) => {
                                  // Ensure we always pass a boolean value
                                  const isChecked = checked === true;
                                  field.onChange(isChecked);
                                  handleTeamLeaderChange(isChecked);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Ik ben een teamleider</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ) : (
                      // For users joining with an invite code, display a message explaining why they can't be a team leader
                      <div className="rounded-md border p-4 bg-gray-50">
                        <p className="text-sm text-muted-foreground">
                          Je registreert met een teamuitnodiging. Je wordt automatisch toegevoegd als teamlid.
                        </p>
                      </div>
                    )}

                    {/* Church Information (only visible if isTeamLeader is true) */}
                    {isTeamLeader && (
                      <div className="space-y-4 border p-4 rounded-md">
                        <h3 className="font-medium">Kerk Informatie</h3>
                        <FormField
                          control={registerForm.control}
                          name="denomination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Denominatie</FormLabel>
                              <FormControl>
                                <SimpleSelect
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  placeholder="Selecteer denominatie"
                                  options={[
                                    { value: "Katholiek", label: "Katholiek" },
                                    { value: "Protestant", label: "Protestant" },
                                    { value: "Evangelisch", label: "Evangelisch" },
                                    { value: "Pinkster", label: "Pinkster" },
                                    { value: "Orthodox", label: "Orthodox" },
                                    { value: "Baptisten", label: "Baptisten" },
                                    { value: "Gereformeerd", label: "Gereformeerd" },
                                    { value: "Anders", label: "Anders" }
                                  ]}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="churchName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Naam van de kerk</FormLabel>
                              <FormControl>
                                <Input placeholder="Naam van de kerk" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="churchLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Locatie van de kerk</FormLabel>
                              <FormControl>
                                <Input placeholder="Stad/plaats van de kerk" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Invite Code */}
                    <FormField
                      control={registerForm.control}
                      name="inviteCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {hasInviteCode 
                              ? "Team Uitnodigingscode" 
                              : "Uitnodigingscode (optioneel)"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={hasInviteCode 
                                ? "Je registreert met een teamuitnodiging" 
                                : "Vul een uitnodigingscode in"} 
                              value={field.value || ""} 
                              onChange={field.onChange}
                              className={hasInviteCode ? "bg-gray-50" : ""}
                              readOnly={hasInviteCode} // Make it readonly if invite code is detected
                            />
                          </FormControl>
                          {hasInviteCode && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Je wordt automatisch lid van het team na registratie
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Ik ga akkoord met de <Link to="/terms-and-conditions" className="text-primary hover:underline" target="_blank">Algemene Voorwaarden</Link> en het <Link to="/privacy-policy" className="text-primary hover:underline" target="_blank">Privacybeleid</Link>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full h-10" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Bezig met registreren..." : "Registreren"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {activeTab === "login" ? (
                <>
                  Nog geen account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab("register")}
                  >
                    Registreer hier
                  </button>
                </>
              ) : (
                <>
                  Heb je al een account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab("login")}
                  >
                    Log hier in
                  </button>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero section */}
      <div className="md:w-1/2 bg-primary p-6 sm:p-8 flex items-center justify-center text-white">
        <div className="max-w-lg">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Bedieningen Profiel</h1>
          <p className="text-base sm:text-lg md:text-xl mb-6">
            Ontdek uw gaven en hoe u effectief kunt bijdragen aan het Koninkrijk van God door het profiel van uw bediening te begrijpen.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3 sm:mr-4 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">Volg Persoonlijkheidsanalyse</h3>
                <p className="text-xs sm:text-sm">Ontdek uw unieke roeping en geestesgaven.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3 sm:mr-4 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">Bekijk Teamanalyse</h3>
                <p className="text-xs sm:text-sm">Krijg inzicht in de sterke punten en lacunes van uw team.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded-full mr-3 sm:mr-4 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">Ontvang Aanbevelingen</h3>
                <p className="text-xs sm:text-sm">Krijg gepersonaliseerde aanbevelingen om uw bediening te verbeteren.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
