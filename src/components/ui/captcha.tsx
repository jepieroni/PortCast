
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CaptchaProps {
  onValidationChange: (isValid: boolean) => void;
  className?: string;
}

export const Captcha = ({
  onValidationChange,
  className
}: CaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [userAnswer, setUserAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);

  const operators = ['+', '-', '×'];

  const generateNewChallenge = () => {
    const newNum1 = Math.floor(Math.random() * 15) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    const newOperator = operators[Math.floor(Math.random() * operators.length)];
    
    // Ensure subtraction doesn't result in negative numbers
    if (newOperator === '-' && newNum2 > newNum1) {
      setNum1(newNum2);
      setNum2(newNum1);
    } else {
      setNum1(newNum1);
      setNum2(newNum2);
    }
    
    setOperator(newOperator);
    setUserAnswer('');
    setIsValid(false);
  };

  useEffect(() => {
    generateNewChallenge();
  }, []);

  useEffect(() => {
    let correctAnswer;
    switch (operator) {
      case '+':
        correctAnswer = num1 + num2;
        break;
      case '-':
        correctAnswer = num1 - num2;
        break;
      case '×':
        correctAnswer = num1 * num2;
        break;
      default:
        correctAnswer = 0;
    }
    
    const valid = parseInt(userAnswer) === correctAnswer && userAnswer.trim() !== '';
    setIsValid(valid);
    onValidationChange(valid);
  }, [userAnswer, num1, num2, operator, onValidationChange]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and negative sign
    const value = e.target.value.replace(/[^0-9-]/g, '');
    setUserAnswer(value);
  };

  return (
    <div className={className}>
      <Label htmlFor="captcha">Security Check</Label>
      <div className="flex items-center gap-2">
        <span className="text-lg font-mono bg-gray-100 px-3 py-2 rounded border select-none">
          {num1} {operator} {num2} = ?
        </span>
        <Input
          id="captcha"
          type="text"
          value={userAnswer}
          onChange={handleAnswerChange}
          placeholder="Answer"
          required
          className="w-20"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={generateNewChallenge}
          className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
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
