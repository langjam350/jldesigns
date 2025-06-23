import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase'
import bcrypt from 'bcryptjs';
import { IAuthService } from './AuthService';

export interface ILoginService {
    setEmail(email: string): void;
    setIsAuthenticated(isAuthenticated: boolean): void;
    handleSignIn(email: string, password: string): Promise<void>;
    isAdmin(email: string): Promise<boolean>;
    handleSignOut(): Promise<void>;
    handleSignUp(email: string, password: string): Promise<boolean>;
    isAuthenticated(): Promise<boolean>;
    getUserEmail(): Promise<string>;
  }

export default class LoginService implements ILoginService {
    private email: string;
    private isAuthenticatedValue: boolean;
    private authService: IAuthService;

    constructor(authService: IAuthService) {
        this.email = '';
        this.isAuthenticatedValue = false;
        this.authService = authService;
    }
    
    setEmail(email: string) {
        this.email = email;
    }

    setIsAuthenticated(isAuthenticated: boolean) {
        this.isAuthenticatedValue = isAuthenticated
    }

    public async handleSignIn(email: string, password: string): Promise<void> {
        try {
          const userData = await this.authService.getUserInfoByEmail(email);
      
          if (!userData) {
            throw new Error('User not found.');
          }
      
          const passwordMatch = await bcrypt.compare(password, userData.password);
      
          if (!passwordMatch) {
            throw new Error('Incorrect password.');
          }
      
          await this.authService.signIn(email, password);
          console.log(`User ${email} is logged in.`);
        } catch (error) {
          console.error('Sign-in error:', error);
          throw error;
        }
    }

    public async isAdmin(email: string): Promise<boolean> {
        try {
            const userData = await this.authService.getUserInfoByEmail(email);
    
            if (userData) {
                if(userData.admin) {
                    return true
                }
                console.log('Not Admin.');
                return false;
            }
        } catch (error) {
            console.error('Error Finding User: ', email);
            return false;
        }
        return false;
    }

    async handleSignOut() {
        try {
            await signOut(auth);
            this.isAuthenticatedValue = false;
            this.email = '';
            console.log('User signed out successfully.');
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }

    public async handleSignUp(email: string, password: string): Promise<boolean> {
        try{
          return this.authService.handleSignUp(email, password)
        } catch (error) {
          console.error('Error adding user:', error);
          return false;
        }
    }

    public async isAuthenticated() {
        return this.isAuthenticatedValue;
    }

    public async getUserEmail() {
        return this.email;
    }
}