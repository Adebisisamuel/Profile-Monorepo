import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Check } from "lucide-react";

enum AuthMode {
  LOGIN,
  REGISTER
}

// Login form schema with improved validation
const loginSchema = z.object({
  email: z.string()
    .min(1, "E-mailadres is verplicht")
    .email("Ongeldig e-mailadres. Controleer het formaat (bijv. naam@domein.nl)")
    .trim(),
  password: z.string()
    .min(1, "Wachtwoord is verplicht")
    .max(72, "Wachtwoord mag maximaal 72 karakters bevatten"), // bcrypt limit
  rememberMe: z.boolean().optional(),
});

// Registration form schema with improved validation
const registerSchema = z.object({
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
  email: z.string()
    .min(1, "E-mailadres is verplicht")
    .email("Ongeldig e-mailadres. Controleer het formaat (bijv. naam@domein.nl)")
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(6, "Wachtwoord moet minimaal 6 karakters bevatten")
    .max(72, "Wachtwoord mag maximaal 72 karakters bevatten") // bcrypt limit
    .refine(val => /[A-Z]/.test(val) || /[a-z]/.test(val), {
      message: "Wachtwoord moet tenminste één letter bevatten"
    })
    .refine(val => /[0-9]/.test(val), {
      message: "Wachtwoord moet tenminste één cijfer bevatten"
    }),
  role: z.enum(["user", "teamleader"]).default("user"),
  inviteCode: z.string().optional(),
  username: z.string().optional(), // Add username field for backend compatibility
  name: z.string().optional(),     // Add name field for backend compatibility
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "Je moet akkoord gaan met de voorwaarden",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>(AuthMode.LOGIN);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const { loginMutation, registerMutation, user } = useAuth();
  
  // Initialize forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "user" as const, // Always default to user
      inviteCode: "",
      agreeTerms: false,
    },
  });
  
  // Check for pending invite code in localStorage when component mounts
  useEffect(() => {
    const storedInviteCode = localStorage.getItem("pendingInviteCode");
    if (storedInviteCode) {
      setPendingInviteCode(storedInviteCode);
      
      // Update the form field value with the stored invite code
      if (mode === AuthMode.REGISTER) {
        registerForm.setValue("inviteCode", storedInviteCode);
      }
    }
  }, [mode, registerForm]);
  
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { agreeTerms, ...registerData } = data;
    
    // Make sure to add the pending inviteCode if available
    if (pendingInviteCode && !registerData.inviteCode) {
      registerData.inviteCode = pendingInviteCode;
    }
    
    // Set username from email to ensure we don't violate the not-null constraint
    registerData.username = registerData.email;
    
    // Create a display name from first and last name
    if (!registerData.name) {
      registerData.name = `${registerData.firstName} ${registerData.lastName}`.trim();
    }
    
    console.log("Registering with data:", JSON.stringify(registerData, null, 2));
    
    registerMutation.mutate(registerData, {
      onSuccess: () => {
        // Clear the invite code from localStorage after successful registration
        localStorage.removeItem("pendingInviteCode");
      }
    });
  };

  // Redirect if logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-100 to-teal flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex justify-center">
            <Logo className="h-12 w-12" />
          </div>
          <h2 className="mt-4 font-bold text-2xl text-navy">
            {mode === AuthMode.LOGIN ? "Inloggen" : "Registreren"}
          </h2>
          <p className="text-navy-light">
            {mode === AuthMode.LOGIN
              ? "Welkom terug bij Bedieningen Profiel"
              : "Creëer een nieuw account"}
          </p>
        </div>
        
        {mode === AuthMode.LOGIN ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6" aria-label="Inlogformulier">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-navy">
                      E-mailadres <span className="text-red-600 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="jouw@email.nl" 
                        {...field} 
                        className="h-11" 
                        autoComplete="email"
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
                    <FormLabel className="flex items-center text-navy">
                      Wachtwoord <span className="text-red-600 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field}
                        className="h-11" 
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <FormField
                  control={loginForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Onthoud mij</FormLabel>
                    </FormItem>
                  )}
                />
                <a href="#" className="text-sm text-teal hover:text-teal-dark">
                  Wachtwoord vergeten?
                </a>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-teal text-white hover:bg-teal-dark h-12 text-base font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bezig met inloggen...
                  </>
                ) : "Inloggen"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6" aria-label="Registratieformulier">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-navy">
                        Voornaam <span className="text-red-600 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Jouw voornaam" 
                          {...field}
                          className="h-11"
                          autoComplete="given-name"
                        />
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
                      <FormLabel className="flex items-center text-navy">
                        Achternaam <span className="text-red-600 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Jouw achternaam" 
                          {...field}
                          className="h-11"
                          autoComplete="family-name"
                        />
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
                    <FormLabel className="flex items-center text-navy">
                      E-mailadres <span className="text-red-600 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="jouw@email.nl" 
                        {...field} 
                        className="h-11" 
                        autoComplete="email"
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
                    <FormLabel className="flex items-center text-navy">
                      Wachtwoord <span className="text-red-600 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="h-11"
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    <p className="mt-1 text-xs text-navy-light">
                      Wachtwoord moet minimaal 6 karakters bevatten en tenminste één cijfer
                    </p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <div className="flex flex-row items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value === "teamleader"} 
                          onCheckedChange={(checked) => {
                            if (!pendingInviteCode) {
                              field.onChange(checked ? "teamleader" : "user");
                            }
                          }}
                          disabled={!!pendingInviteCode}
                        />
                      </FormControl>
                      <FormLabel className={`text-sm font-normal ${pendingInviteCode ? "text-gray-400" : ""}`}>
                        Ik ben een teamleider
                      </FormLabel>
                    </div>
                    {pendingInviteCode && (
                      <p className="text-xs text-amber-600 mt-1 ml-6">
                        Je bent uitgenodigd voor een team. Je kunt niet als teamleider registreren.
                      </p>
                    )}
                  </FormItem>
                )}
              />
              
              {pendingInviteCode ? (
                // Special UI for users with a pending invite
                <FormField
                  control={registerForm.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-navy">
                        Team Uitnodiging <span className="text-green-600 ml-1">✓</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          value={pendingInviteCode} 
                          readOnly 
                          className="bg-green-50 text-green-800 border-green-200 h-11"
                        />
                      </FormControl>
                      <div className="mt-1 text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Je bent uitgenodigd om lid te worden van een team
                      </div>
                    </FormItem>
                  )}
                />
              ) : (
                // Regular invite code input for users without a pending invite
                <FormField
                  control={registerForm.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-navy">
                        Team Code <span className="text-gray-400 ml-1">(optioneel)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Team code" 
                          {...field} 
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                      <p className="mt-1 text-xs text-navy-light">Vul hier de team code in als je bij een bestaand team wilt aansluiten</p>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={registerForm.control}
                name="agreeTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Ik ga akkoord met de <a href="#" className="text-teal hover:text-teal-dark">Algemene Voorwaarden</a> en het <a href="#" className="text-teal hover:text-teal-dark">Privacybeleid</a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-teal text-white hover:bg-teal-dark h-12 text-base font-medium"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bezig met registreren...
                  </>
                ) : "Registreren"}
              </Button>
            </form>
          </Form>
        )}
        
        <div className="mt-6 text-center">
          {mode === AuthMode.LOGIN ? (
            <p className="text-navy-light">
              Nog geen account? <button onClick={() => setMode(AuthMode.REGISTER)} className="text-teal hover:text-teal-dark">Registreer nu</button>
            </p>
          ) : (
            <p className="text-navy-light">
              Al een account? <button onClick={() => setMode(AuthMode.LOGIN)} className="text-teal hover:text-teal-dark">Log in</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}