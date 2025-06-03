
export interface AuthState {
  user: any;
  event?: string;
  loading: boolean;
}

export type AuthCallback = (authState: AuthState) => void;
