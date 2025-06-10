
import { supabase } from '@/integrations/supabase/client';

// Generate a session ID for grouping related operations
const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create a session ID for the current browser session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('debug-session-id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('debug-session-id', sessionId);
  }
  return sessionId;
};

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  component: string;
  functionName?: string;
  message: string;
  metadata?: any;
}

class DebugLogger {
  private sessionId: string;

  constructor() {
    this.sessionId = getSessionId();
  }

  private async logToDatabase(entry: LogEntry): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Fallback to console if user not authenticated
        console.log(`[${entry.level}] [${entry.component}] ${entry.message}`, entry.metadata);
        return;
      }

      const { error } = await supabase
        .from('debug_logs')
        .insert({
          user_id: user.id,
          session_id: this.sessionId,
          level: entry.level,
          component: entry.component,
          function_name: entry.functionName,
          message: entry.message,
          metadata: entry.metadata
        });

      if (error) {
        console.error('Failed to log to database:', error);
        // Fallback to console
        console.log(`[${entry.level}] [${entry.component}] ${entry.message}`, entry.metadata);
      }
    } catch (error) {
      console.error('Debug logger error:', error);
      // Fallback to console
      console.log(`[${entry.level}] [${entry.component}] ${entry.message}`, entry.metadata);
    }
  }

  debug(component: string, message: string, functionName?: string, metadata?: any): void {
    this.logToDatabase({ level: 'DEBUG', component, functionName, message, metadata });
  }

  info(component: string, message: string, functionName?: string, metadata?: any): void {
    this.logToDatabase({ level: 'INFO', component, functionName, message, metadata });
  }

  warn(component: string, message: string, functionName?: string, metadata?: any): void {
    this.logToDatabase({ level: 'WARN', component, functionName, message, metadata });
  }

  error(component: string, message: string, functionName?: string, metadata?: any): void {
    this.logToDatabase({ level: 'ERROR', component, functionName, message, metadata });
  }

  getSessionId(): string {
    return this.sessionId;
  }

  newSession(): void {
    this.sessionId = generateSessionId();
    sessionStorage.setItem('debug-session-id', this.sessionId);
  }
}

export const debugLogger = new DebugLogger();
