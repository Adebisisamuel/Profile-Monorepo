import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QuestionnaireSlider } from "@/components/ui/questionnaire-slider";
import { ProgressBar } from "@/components/questionnaire/progress-bar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router-dom";

// Define question and answer types since they're not exported from schema
interface Question {
  id: number;
  statementA: string;
  statementB: string;
}

interface Answer {
  questionId: number;
  value: number;
}

export function QuestionForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userAnswerId, setUserAnswerId] = useState<number | null>(null);
  const [redirectToDashboard, setRedirectToDashboard] = useState(false);
  
  // Fetch questionnaire data
  const { data: questionnaire, isLoading: isLoadingQuestionnaire } = useQuery({
    queryKey: ["/api/questionnaire"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0]);
      if (!res.ok) throw new Error("Failed to fetch questionnaire");
      return res.json();
    },
  });
  
  // Start questionnaire
  const startQuestionnaireMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/questionnaire/start");
      return res.json();
    },
    onSuccess: (data) => {
      setUserAnswerId(data.id);
      // Initialize with existing answers if any
      if (data.answers && data.answers.length > 0) {
        setAnswers(data.answers);
        
        // Find the first unanswered question
        const allQuestionIds = questionnaire.questions.map((q: Question) => q.id);
        const answeredIds = data.answers.map((a: Answer) => a.questionId);
        const unansweredIds = allQuestionIds.filter((id: number) => !answeredIds.includes(id));
        
        if (unansweredIds.length > 0) {
          const firstUnansweredIndex = questionnaire.questions.findIndex(
            (q: Question) => q.id === unansweredIds[0]
          );
          if (firstUnansweredIndex !== -1) {
            setCurrentQuestionIndex(firstUnansweredIndex);
          }
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Er is een fout opgetreden bij het starten van de vragenlijst.",
        variant: "destructive",
      });
    },
  });
  
  // Save answers
  const saveAnswersMutation = useMutation({
    mutationFn: async ({ answers, completed }: { answers: Answer[], completed: boolean }) => {
      if (!userAnswerId) throw new Error("No user answer ID");
      
      const res = await apiRequest("POST", `/api/questionnaire/${userAnswerId}/answers`, {
        answers,
        completed,
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // If completed, redirect to dashboard
      if (variables.completed) {
        queryClient.invalidateQueries({ queryKey: ["/api/user/results"] });
        toast({
          title: "Vragenlijst voltooid",
          description: "Je resultaten zijn opgeslagen. Je wordt doorgestuurd naar je dashboard.",
        });
        setRedirectToDashboard(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Er is een fout opgetreden bij het opslaan van je antwoorden.",
        variant: "destructive",
      });
    },
  });
  
  // Start questionnaire when component mounts
  useEffect(() => {
    if (user && !isLoadingQuestionnaire && questionnaire) {
      startQuestionnaireMutation.mutate();
    }
  }, [user, isLoadingQuestionnaire, questionnaire]);
  
  if (!user || isLoadingQuestionnaire || !questionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-teal-100 to-teal py-8 px-4 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">Laden...</p>
        </div>
      </div>
    );
  }
  
  if (redirectToDashboard) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const questions = questionnaire.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex] as Question;
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-teal-100 to-teal py-8 px-4 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">Geen vragen gevonden</p>
        </div>
      </div>
    );
  }
  
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
  // Find current answer if it exists
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
  // We explicitly don't set a default value to force the user to make a selection
  // This ensures that 0 is recognized as a valid choice
  // We explicitly check if an answer exists to distinguish between 'no answer' and 'answer with value 0'
  const hasExistingAnswer = currentAnswer !== undefined;
  const currentValue = hasExistingAnswer ? currentAnswer.value : null;
  
  const handleAnswerChange = (value: number) => {
    // Ensure the value is in the valid range (0-5)
    const validValue = Math.max(0, Math.min(5, value));
    
    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.questionId === currentQuestion.id);
    
    if (existingIndex !== -1) {
      newAnswers[existingIndex].value = validValue;
    } else {
      newAnswers.push({ questionId: currentQuestion.id, value: validValue });
    }
    
    // Add console logging to verify the answer was recorded with the proper value
    console.log(`Question ${currentQuestion.id} answered with value: ${validValue}`);
    
    // Provide user feedback through toast for extreme values
    if (validValue === 0 || validValue === 5) {
      const message = validValue === 0 
        ? `Je hebt aangegeven het volledig eens te zijn met stelling #2` 
        : `Je hebt aangegeven het volledig eens te zijn met stelling #1`;
      
      toast({
        title: "Antwoord geregistreerd",
        description: message,
        duration: 2000,
      });
    }
    
    setAnswers(newAnswers);
  };
  
  const handleNext = () => {
    // Get the current position of the slider
    // If no explicit selection was made, use the current position (slider defaults to 3)
    const currentAnswerObj = answers.find(a => a.questionId === currentQuestion.id);
    
    // If no answer exists yet, create one with the default position
    if (!currentAnswerObj) {
      console.log("No explicit selection made, using default position (3)");
      // Add the current position as the answer
      handleAnswerChange(3);
    } else {
      console.log(`Question ${currentQuestion.id} answered with value: ${currentAnswerObj.value}`);
      
      // Explicitly log if 0 was selected
      if (currentAnswerObj.value === 0) {
        console.log("Value 0 detected and accepted!");
      }
    }
    
    // Save current progress first
    saveAnswersMutation.mutate({ 
      answers,
      completed: false
    });
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Complete the questionnaire
      saveAnswersMutation.mutate({ 
        answers,
        completed: true
      });
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSaveAndExit = () => {
    saveAnswersMutation.mutate({ 
      answers,
      completed: false
    });
    
    toast({
      title: "Voortgang opgeslagen",
      description: "Je kunt later terugkomen om de vragenlijst af te maken.",
    });
    
    // Redirect to home
    navigate("/");
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-100 to-teal py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-xl md:text-2xl text-navy">
                Vraag <span>{currentQuestionIndex + 1}</span> van <span>{totalQuestions}</span>
              </h2>
              <div className="flex items-center">
                <div className="text-navy-light mr-3 text-sm">Voortgang:</div>
                <ProgressBar progress={progress} />
              </div>
            </div>
            
            <div className="mb-12 relative">
              <div className="flex flex-col md:flex-row md:gap-10 relative">
                <div className="mb-6 md:mb-0 md:w-1/2 border rounded-lg p-4 min-h-[8rem] flex items-center overflow-auto bg-white shadow-sm">
                  <p className="text-navy font-medium w-full">{currentQuestion.statementA}</p>
                </div>
                <div className="md:w-1/2 border rounded-lg p-4 min-h-[8rem] flex items-center overflow-auto bg-white shadow-sm">
                  <p className="text-navy font-medium w-full">{currentQuestion.statementB}</p>
                </div>
              </div>
              
              <div className="mt-8 px-2">
                <div className="flex justify-between text-sm text-navy-light font-medium mb-2">
                  <span className="text-left max-w-[45%]">Stelling #1</span>
                  <span className="text-right max-w-[45%]">Stelling #2</span>
                </div>
                
                <QuestionnaireSlider
                  value={currentValue}
                  onChange={handleAnswerChange}
                  aria-label="Kies tussen stelling 1 en stelling 2"
                />
                
                <div className="flex justify-between text-xs text-navy-light mt-2 font-medium">
                  <span className="text-left max-w-[45%]">Helemaal mee eens</span>
                  <span className="text-right max-w-[45%]">Helemaal mee eens</span>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="bg-teal-50 border border-teal-200 py-3 px-4 rounded-md">
                  <p className="text-xs md:text-sm text-teal-800 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>Tip:</strong> Sleep de schuif naar links als je het eens bent met stelling #1, of naar rechts als je het eens bent met stelling #2. Hoe verder naar de kant, hoe sterker je voorkeur.
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-2 h-auto w-full sm:w-auto flex items-center justify-center"
                aria-label="Ga naar vorige vraag"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Vorige
              </Button>
              
              <div className="hidden sm:flex items-center text-navy-light text-sm">
                <span>
                  {currentQuestionIndex + 1} van {totalQuestions}
                </span>
              </div>
              
              <Button
                onClick={handleNext}
                className="px-5 py-2 h-auto w-full sm:w-auto bg-teal text-white hover:bg-teal-dark flex items-center justify-center"
                disabled={saveAnswersMutation.isPending}
                aria-label={currentQuestionIndex < totalQuestions - 1 ? "Ga naar volgende vraag" : "Voltooi de vragenlijst"}
              >
                {saveAnswersMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bezig...
                  </>
                ) : (
                  <>
                    {currentQuestionIndex < totalQuestions - 1 ? "Volgende" : "Voltooien"}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-center text-white">
          <p className="text-sm">Je kunt de test op elk moment pauzeren en later hervatten.</p>
          <button 
            onClick={handleSaveAndExit}
            className="mt-2 underline text-sm hover:text-gray-200"
          >
            Opslaan en afsluiten
          </button>
        </div>
      </div>
    </div>
  );
}
