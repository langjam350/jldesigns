// services/AuthService.ts
export default class AuthService {
  static signIn(email: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('isAuthenticated', 'true');
      window.localStorage.setItem('userEmail', email);
    }
  }

  static signOut() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('isAuthenticated');
      window.localStorage.removeItem('userEmail');
    }
  }

  static isAuthenticated() {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('isAuthenticated') === 'true';
    }
    return false;
  }

  static getUserEmail() {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('userEmail');
    }
    return null;
  }
}