
interface ContainerFillProgressProps {
  fillPercentage: number;
}

const ContainerFillProgress = ({ fillPercentage }: ContainerFillProgressProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Container Fill</span>
        <span>{fillPercentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            fillPercentage >= 90 ? 'bg-green-500' : 
            fillPercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${fillPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ContainerFillProgress;
