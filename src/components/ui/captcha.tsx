
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CaptchaProps {
  onValidationChange: (isValid: boolean) => void;
  className?: string;
}

export const Captcha = ({ onValidationChange, className }: CaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);

  const generateNewChallenge = () => {
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
    setIsValid(false);
  };

  useEffect(() => {
    generateNewChallenge();
  }, []);

  useEffect(() => {
    const correctAnswer = num1 + num2;
    const valid = parseInt(userAnswer) === correctAnswer;
    setIsValid(valid);
    onValidationChange(valid);
  }, [userAnswer, num1, num2, onValidationChange]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };

  return (
    <div className={className}>
      <Label htmlFor="captcha">Security Check</Label>
      <div className="flex items-center gap-2">
        <span className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
          {num1} + {num2} = ?
        </span>
        <Input
          id="captcha"
          type="number"
          value={userAnswer}
          onChange={handleAnswerChange}
          placeholder="Answer"
          className="w-20"
          required
        />
        <button
          type="button"
          onClick={generateNewChallenge}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          New question
        </button>
      </div>
      {userAnswer && !isValid && (
        <p className="text-sm text-red-600 mt-1">Incorrect answer</p>
      )}
      {isValid && (
        <p className="text-sm text-green-600 mt-1">✓ Correct</p>
      )}
    </div>
  );
};
