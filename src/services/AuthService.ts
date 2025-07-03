// services/AuthService.ts
import { auth } from '../../lib/firebase'; // Adjust the path as necessary
import { onAuthStateChanged, User } from 'firebase/auth';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' ? 'https://dev.jlangdesigns.com' : 'https://www.jlangdesigns.com';

export interface IAuthService {
  signIn(email: string, password: string): Promise<any>;
  getUserInfoByEmail(email: string): Promise<any>;
  handleSignUp(email: string, password: string): Promise<boolean>;
  signOut(): Promise<any>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

export default class AuthService implements IAuthService {
  public async signIn(email: string, password: string) {
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to sign in');
    }
    
    return data;
  }

  public async getUserInfoByEmail(email: string) {
    const response = await fetch(`${BASE_URL}/api/auth/userinfo?email=${encodeURIComponent(email)}`);
    return response.json();
  }

  public async handleSignUp(email: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/createUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('User added successfully via API');
          return true;
        } else {
          console.error('Failed to add user via API:', data.message);
          return false;
        }
      } else {
        const errorMessage = await response.text();
        console.error('Failed to add user via API:', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error occurred while signing up:', error);
      return false;
    }
  }  
  

  public async signOut() {
    const response = await fetch(`${BASE_URL}/api/auth/signout`, { method: 'POST' });
    return response.json();
  }

  public onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}