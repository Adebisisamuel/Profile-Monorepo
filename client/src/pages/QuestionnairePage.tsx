import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuestionnaireProgress from "@/components/QuestionnaireProgress";
import QuestionSlider from "@/components/QuestionSlider";
import CelebrationEffect from "@/components/CelebrationEffect";
import { QUESTIONS, ROLES } from "@shared/constants";
import { QuestionResponse } from "@shared/types";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Loader2 } from "lucide-react";
import { FeedbackService } from "@/services/feedback-service";

export default function QuestionnairePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [primaryRole, setPrimaryRole] = useState<string | null>(null);
  const totalQuestions = QUESTIONS.length;

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/questionnaire");
    }
  }, [user, navigate]);

  // Load existing responses if any
  const { data: existingProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/users", user?.id, "profile"],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await fetch(`/api/users/${user.id}/profile`);
        if (!res.ok) {
          if (res.status === 404) return null; // No profile yet, that's ok
          throw new Error("Failed to load profile");
        }
        return await res.json();
      } catch (error) {
        console.error("Error loading profile:", error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Initialize responses from existing profile if available
  useEffect(() => {
    if (existingProfile?.responses?.length > 0) {
      // Make sure we have all questions covered, even new ones that might have been added
      const existingResponses = existingProfile.responses;
      const initialResponses = QUESTIONS.map(question => {
        // Find existing response or create a new neutral one
        const existingResponse = existingResponses.find((r: QuestionResponse) => r.questionId === question.id);
        return existingResponse || {
          questionId: question.id,
          value: 3, // Default to neutral (middle) - position 3 represents 0 on the scale
          statement1Role: question.statement1.role,
          statement2Role: question.statement2.role,
        };
      });
      setResponses(initialResponses);
    } else {
      // Initialize with empty responses - all start at center (position 3)
      const initialResponses = QUESTIONS.map(question => ({
        questionId: question.id,
        value: 3, // Default to neutral (middle) - position 3 represents 0 on the scale
        statement1Role: question.statement1.role,
        statement2Role: question.statement2.role,
      }));
      setResponses(initialResponses);
    }
  }, [existingProfile]);

  // Submit profile mutation
  const submitMutation = useMutation({
    mutationFn: async (responses: QuestionResponse[]) => {
      if (!user) throw new Error("Je moet ingelogd zijn");
      
      const res = await apiRequest("POST", "/api/profile/submit", {
        responses,
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      FeedbackService.success("Profiel opgeslagen", "Je profiel is succesvol opgeslagen!");
      
      // Calculate which role has the highest score to determine primary role
      if (data && data.scores) {
        // Find the role with highest score
        const roleEntries = Object.entries(data.scores);
        if (roleEntries.length > 0) {
          roleEntries.sort((a, b) => (b[1] as number) - (a[1] as number));
          const [topRole] = roleEntries[0];
          setPrimaryRole(topRole);
        }
      }
      
      // Show celebration effect
      setShowCelebration(true);
      
      // Invalidate the profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "profile"] });
    },
    onError: (error) => {
      FeedbackService.error(error.message || "Fout bij opslaan van profiel");
    },
  });

  const currentQuestionData = QUESTIONS[currentQuestion - 1];

  const handleSliderChange = (value: number) => {
    setResponses(prev => {
      const newResponses = [...prev];
      const index = newResponses.findIndex(r => r.questionId === currentQuestionData.id);
      
      if (index !== -1) {
        newResponses[index] = {
          ...newResponses[index],
          value,
        };
      }
      
      return newResponses;
    });
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      console.log("Moving to previous question:", currentQuestion - 1);
      setCurrentQuestion(prev => prev - 1);
    } else {
      console.log("Already at first question");
    }
  };

  const handleNext = () => {
    // Check if currentQuestionData exists first
    if (!currentQuestionData) {
      console.error("Current question data is undefined");
      FeedbackService.error("Er is een fout opgetreden. Vernieuw de pagina en probeer het opnieuw.");
      return;
    }
    
    // Get current response
    const currentResponse = responses.find(r => r.questionId === currentQuestionData.id);
    
    // Accept ANY value including 0 and 3 (neutral)
    // Log the value for debugging
    console.log(`Going to next question with value: ${currentResponse?.value}`);
    
    try {
      if (currentQuestion < totalQuestions) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        // Submit questionnaire
        submitMutation.mutate(responses);
      }
    } catch (error) {
      console.error("Error navigating to next question:", error);
      FeedbackService.error("Er is een fout opgetreden bij het navigeren naar de volgende vraag.");
    }
  };

  const getCurrentResponseValue = () => {
    const response = responses.find(r => r.questionId === currentQuestionData?.id);
    return response?.value ?? 3; // Default to neutral if not found
  };

  if (isLoadingProfile || !responses.length) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleCelebrationComplete = () => {
    // After the celebration is done, navigate to the results page
    setShowCelebration(false);
    navigate("/dashboard");
  };

  return (
    <Layout>
      {/* Celebration effect overlay */}
      <CelebrationEffect
        show={showCelebration}
        onComplete={handleCelebrationComplete}
        primaryRole={primaryRole}
        message="Gefeliciteerd! Je hebt de vragenlijst voltooid!"
      />
      
      <Card className="bg-white rounded-xl shadow-md overflow-hidden">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bedieningen Profiel Vragenlijst</h2>
          </div>
          
          <QuestionnaireProgress 
            currentQuestion={currentQuestion} 
            totalQuestions={totalQuestions} 
          />
          
          <div id="question-container">
            <h3 className="text-xl font-medium text-gray-900 mb-6">
              [vraag {currentQuestionData.id}]
            </h3>
            
            <div className="flex flex-col md:flex-row justify-between mb-8 space-y-6 md:space-y-0 md:space-x-8">
              <div className="md:w-1/2 p-4 border rounded-lg h-32 flex items-center overflow-auto">
                <p className="text-gray-700 w-full">{currentQuestionData.statement1.text}</p>
              </div>
              <div className="md:w-1/2 p-4 border rounded-lg h-32 flex items-center overflow-auto">
                <p className="text-gray-700 w-full">{currentQuestionData.statement2.text}</p>
              </div>
            </div>
            
            <QuestionSlider 
              value={getCurrentResponseValue()} 
              onChange={handleSliderChange} 
            />
            
            <div className="flex justify-between mt-12">
              {currentQuestion > 1 && (
                <Button 
                  type="button"
                  onClick={() => handlePrevious()}
                  variant="secondary"
                  disabled={submitMutation.isPending}
                  className="transition-all hover:bg-slate-200"
                >
                  Vorige
                </Button>
              )}
              {currentQuestion === 1 && (
                <div className="w-20"></div> // Placeholder to maintain layout when button is not showing
              )}
              <Button 
                onClick={handleNext}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {currentQuestion === totalQuestions ? "Afronden" : "Volgende"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
