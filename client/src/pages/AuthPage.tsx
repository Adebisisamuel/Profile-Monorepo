import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { FeedbackService } from "@/services/feedback-service";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  password: z.string().min(1, "Wachtwoord is verplicht"),
});

// Registration form schema
const registerSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  username: z.string().min(3, "Gebruikersnaam moet minimaal 3 tekens bevatten"),
  password: z.string().min(6, "Wachtwoord moet minimaal 6 tekens bevatten"),
  confirmPassword: z.string().min(1, "Bevestig je wachtwoord"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { loginMutation, registerMutation, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Get redirect URL from query params if it exists
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirect") || "/";
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    // Convert username to email for backward compatibility
    loginMutation.mutate({ 
      email: values.username, 
      password: values.password 
    }, {
      onSuccess: (userData) => {
        FeedbackService.success("Inloggen gelukt", `Welkom terug, ${userData.name || userData.username}!`);
        navigate(redirectTo);
      },
      onError: (error) => {
        FeedbackService.error("Inloggen mislukt", "Controleer je gegevens en probeer opnieuw.");
      },
    });
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    const { confirmPassword, name, ...registrationData } = values;
    
    // Extract team leader role if checked
    const isTeamLeader = (document.getElementById('teamLeaderCheckbox') as HTMLInputElement)?.checked || false;
    
    // Split name into firstName and lastName (required by RegisterData)
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    registerMutation.mutate({
      ...registrationData,
      firstName,
      lastName,
      role: isTeamLeader ? "teamleader" : "user",
    }, {
      onSuccess: (userData) => {
        FeedbackService.success("Registratie geslaagd", `Welkom, ${userData.name || userData.username}!`);
        navigate(redirectTo);
      },
      onError: (error) => {
        FeedbackService.error("Registratie mislukt", "Controleer je gegevens en probeer opnieuw.");
      },
    });
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Inloggen / Registreren</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Inloggen</TabsTrigger>
                <TabsTrigger value="register">Registreren</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gebruikersnaam</FormLabel>
                          <FormControl>
                            <Input placeholder="Vul je gebruikersnaam in" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Vul je wachtwoord in" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Inloggen..." : "Inloggen"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naam</FormLabel>
                          <FormControl>
                            <Input placeholder="Vul je naam in" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mailadres</FormLabel>
                          <FormControl>
                            <Input placeholder="Vul je e-mailadres in" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gebruikersnaam</FormLabel>
                          <FormControl>
                            <Input placeholder="Kies een gebruikersnaam" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Kies een wachtwoord" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bevestig wachtwoord</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Bevestig je wachtwoord" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="teamLeaderCheckbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="teamLeaderCheckbox" className="text-sm font-medium">
                        Registreer als teamleider
                      </label>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Als teamleider kunt u teams aanmaken en uitnodigingen verzenden naar teamleden.
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registreren..." : "Registreren"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
