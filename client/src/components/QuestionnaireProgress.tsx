import { Progress } from "@/components/ui/progress";

interface QuestionnaireProgressProps {
  currentQuestion: number;
  totalQuestions: number;
}

export default function QuestionnaireProgress({ 
  currentQuestion, 
  totalQuestions 
}: QuestionnaireProgressProps) {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="text-gray-500">Vraag <span>{currentQuestion}</span> van <span>{totalQuestions}</span></div>
      </div>
      <Progress value={progressPercentage} className="h-2.5 mb-8" />
    </div>
  );
}
