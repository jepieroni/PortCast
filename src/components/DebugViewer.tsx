
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import { debugLogger } from '@/services/debugLogger';

interface DebugLog {
  id: string;
  timestamp: string;
  level: string;
  component: string;
  function_name?: string;
  message: string;
  metadata?: any;
}

const DebugViewer = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const sessionId = debugLogger.getSessionId();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['debug-logs', sessionId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('debug_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching debug logs:', error);
        return [];
      }

      return data as DebugLog[];
    },
    enabled: !!user?.id && isOpen,
    refetchInterval: isOpen ? 2000 : false // Auto-refresh every 2 seconds when open
  });

  const clearLogs = async () => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('debug_logs')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error clearing debug logs:', error);
    } else {
      refetch();
    }
  };

  const newSession = () => {
    debugLogger.newSession();
    window.location.reload(); // Refresh to use new session
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-500';
      case 'WARN': return 'bg-yellow-500';
      case 'INFO': return 'bg-blue-500';
      case 'DEBUG': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="mb-2">
            Debug Logs {isOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            {logs && logs.length > 0 && (
              <Badge variant="secondary" className="ml-2">{logs.length}</Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="w-full max-h-96 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Debug Session: {sessionId.slice(-8)}</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearLogs}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={newSession}>
                    New Session
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="max-h-80 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="text-center text-sm text-gray-500">Loading logs...</div>
                ) : logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="text-xs border rounded p-2 bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-white ${getLevelColor(log.level)} text-xs px-1 py-0`}>
                          {log.level}
                        </Badge>
                        <span className="font-medium text-gray-700">{log.component}</span>
                        {log.function_name && (
                          <span className="text-gray-500">→ {log.function_name}</span>
                        )}
                        <span className="text-gray-400 ml-auto">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-800 mb-1">{log.message}</div>
                      {log.metadata && (
                        <div className="text-gray-600 bg-gray-100 p-1 rounded text-xs">
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-gray-500">No logs for this session</div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DebugViewer;
