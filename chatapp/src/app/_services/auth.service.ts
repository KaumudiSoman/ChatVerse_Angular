import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, Auth, UserCredential,
  user, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, signOut, updateProfile} from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { User } from '../_models/UserModels';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  firebaseAuth = inject(Auth);
  user$ = user(this.firebaseAuth);
  currentUserSig = signal<User | null | undefined>(undefined);

  constructor(private router: Router) { }

  register(email: string, password: string, userName: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password).then(
      response => updateProfile(response.user, {displayName: userName}));
    return from(promise);
  }

  login(email: string, password: string): Observable<UserCredential> {
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password);
    return from(promise);
  }

  forgotPassword(email: string): Observable<void> {
    const promise = sendPasswordResetEmail(this.firebaseAuth, email);
    return from(promise);
  }

  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth);
    console.log('hello');
    return from(promise);
  }

  signInWithGoogle(): Observable<UserCredential> {
    const promise = signInWithPopup(this.firebaseAuth, new GoogleAuthProvider());
    return from(promise)
  }
}
