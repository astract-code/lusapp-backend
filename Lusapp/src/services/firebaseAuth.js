import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  reload,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const firebaseAuthService = {
  async signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      await sendEmailVerification(user);
      
      return {
        success: true,
        user,
        message: 'Verification email sent! Please check your inbox.'
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  },

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      
      const idToken = await user.getIdToken();
      
      return {
        success: true,
        user,
        idToken
      };
    } catch (error) {
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
      throw this.handleFirebaseError(error);
    }
  },

  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  },

  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.'
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  },

  async resendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }
      
      if (user.emailVerified) {
        return {
          success: true,
          message: 'Email is already verified!'
        };
      }
      
      await sendEmailVerification(user);
      return {
        success: true,
        message: 'Verification email sent! Please check your inbox.'
      };
    } catch (error) {
      throw this.handleFirebaseError(error);
    }
  },

  async checkEmailVerified() {
    try {
      const user = auth.currentUser;
      if (!user) {
        return false;
      }
      
      await reload(user);
      return user.emailVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  },

  async getIdToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  },

  handleFirebaseError(error) {
    console.error('Firebase error:', error);
    
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Please login instead.',
      'auth/invalid-email': 'Invalid email address format.',
      'auth/weak-password': 'Password must be at least 6 characters long.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    
    const message = errorMessages[error.code] || error.message || 'An error occurred during authentication.';
    return new Error(message);
  }
};
