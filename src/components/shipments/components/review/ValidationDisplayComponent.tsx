
interface ValidationDisplayComponentProps {
  validationErrors: string[];
  validationWarnings: string[];
}

export const ValidationDisplayComponent = ({
  validationErrors,
  validationWarnings
}: ValidationDisplayComponentProps) => {
  // DEBUG: Log what we're receiving
  console.log('=== ValidationDisplayComponent DEBUG ===');
  console.log('validationErrors:', validationErrors);
  console.log('validationWarnings:', validationWarnings);
  console.log('=== END DEBUG ===');

  return (
    <>
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <div className="text-sm text-red-800">
            <strong>Errors:</strong>
            <ul className="list-disc list-inside mt-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {validationWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
          <div className="text-sm text-yellow-800">
            <strong>Warnings:</strong>
            <ul className="list-disc list-inside mt-1">
              {validationWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
