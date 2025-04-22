import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate?: string | null;
  country?: string | null;
  city?: string | null;
  currentSector?: string | null; 
  preferredSector?: string | null;
  referralSource?: string | null;
  isTeamLeader?: boolean;
  inviteCode?: string;
  role?: string;
  denomination?: string;
  churchName?: string;
  churchLocation?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Ingelogd",
        description: `Welkom terug, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login mislukt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Force a small delay before showing the toast to let the state update
      setTimeout(() => {
        toast({
          title: "Registratie geslaagd",
          description: `Welkom, ${user.name}!`,
        });
      }, 100);
      
      // Invalidate queries that depend on auth state
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registratie mislukt",
        description: error.message || "Er is een fout opgetreden bij het registreren.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Uitgelogd",
        description: "Je bent succesvol uitgelogd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Uitloggen mislukt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
