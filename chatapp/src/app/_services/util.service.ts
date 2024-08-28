import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  firestore = inject(Firestore);

  constructor() { }

  getUserById(userId: string): Observable<any> {
    const userRef = doc(this.firestore, 'users', userId);
    return docData(userRef, { idField: 'uid' });
  }

  getUsers(): Observable<any> {
    const userRef = collection(this.firestore, 'users');
    return collectionData(userRef, {idField: 'uid'});
  }

  saveUsers(uid: string, email: string, userName: string) {
    const usersRef = collection(this.firestore, 'users');
    const newUserRef = doc(usersRef, `${uid}`);
    return from(setDoc(newUserRef, {
      email: email, 
      userName: userName
    }));
  }
}
