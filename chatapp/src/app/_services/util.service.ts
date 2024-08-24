import { inject, Injectable } from '@angular/core';
import { collection, collectionData, doc, Firestore, setDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  firestore = inject(Firestore);

  constructor() { }

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
    }))
  }
}
