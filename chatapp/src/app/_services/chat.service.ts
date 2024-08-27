import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, deleteDoc, doc, query, where, getDocs, setDoc } from '@angular/fire/firestore';
import { Socket } from 'ngx-socket-io';
import { combineLatest, from, map, Observable, of, switchMap } from 'rxjs';
import { Chat } from '../_models/ChatModels';
import { AuthService } from './auth.service';
// import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  firestore = inject(Firestore);
  userId: string = '';

  constructor(private socket: Socket, private authService: AuthService) {
    // this.socket = io('http://localhost:3000')
    
  }

  // getMessage(): Observable<string> {
  //   return new Observable(observer => {
  //     this.socket.on('chat message', (message: string) => {
  //       observer.next(message);
  //     });
  //   });
  // }

  // getUserChats(): Observable<Chat[]> {
  //   this.authService.user$.subscribe((user) => {
  //     this.userId = user?.uid!;
  //     console.log(this.userId)
  //   })

  //   const chatsRef = collection(this.firestore, 'chats');
  //   console.log(chatsRef);
  //   console.log(this.userId);
  //   const q = query(chatsRef, where('userIds', 'array-contains', '6j6u4QszcDP1GwCn6yLQOh5tLZl2'));
  //   console.log(q);
  //   return from(getDocs(q)).pipe(
  //     map(snapshot => {
  //       console.log('Query Snapshot:', snapshot);
  //       console.log('Snapshot Docs:', snapshot.docs);
  
  //       // Check if docs array is not empty
  //       if (snapshot.empty) {
  //         console.log('No matching documents.');
  //         return []; // Return an empty array if no documents are found
  //       }
  
  //       return snapshot.docs.map(doc => ({
  //         id: doc.id,
  //         ...doc.data()
  //       } as Chat));
  //     })
  //   );
  // }

  // getUserChats(): Observable<Chat[]> {
  //   return this.authService.user$.pipe(
  //     switchMap((user) => {
  //       this.userId = user?.uid!;
  //       console.log(this.userId);
  
  //       const chatsRef = collection(this.firestore, 'chats');
  //       const q = query(chatsRef, where('userIds', 'array-contains', this.userId));
  
  //       return from(getDocs(q)).pipe(
  //         map(snapshot => {
  //           console.log('Query Snapshot:', snapshot);
  //           console.log('Snapshot Docs:', snapshot.docs);
  
  //           if (snapshot.empty) {
  //             console.log('No matching documents.');
  //             return []; // Return an empty array if no documents are found
  //           }
  
  //           return snapshot.docs.map(doc => ({
  //             id: doc.id,
  //             ...doc.data()
  //           } as Chat));
  //         })
  //       );
  //     })
  //   );
  // }

  // getUserChats(): Observable<Chat[]> {
  //   return this.authService.user$.pipe(
  //     switchMap((user) => {
  //       this.userId = user?.uid!;
  //       console.log(this.userId);
  
  //       const chatsRef = collection(this.firestore, 'chats2');
  
  //       const senderQuery = query(chatsRef, where('sender', '==', this.userId));
  //       const receiverQuery = query(chatsRef, where('receiver', '==', this.userId));
  //       console.log(senderQuery);
  //       console.log(receiverQuery);
  
  //       const senderChats$ = from(getDocs(senderQuery)).pipe(
  //         map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)))
  //       );
  
  //       const receiverChats$ = from(getDocs(receiverQuery)).pipe(
  //         map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)))
  //       );
  //       console.log(senderChats$);
  //       console.log(receiverChats$);
  
  //       return combineLatest([senderChats$, receiverChats$]).pipe(
  //         map(([senderChats, receiverChats]) => [...senderChats, ...receiverChats])
  //       );
  //     })
  //   );
  // }

  setUserId(userId: string) {
    // this.userId = userId;
    this.socket.emit('register', userId);
  }

  getMessages() {
    return this.socket.fromEvent('received').pipe(
      map((data) => {
        console.log(data);
        this.saveMessagesToFireStore(data);
        return data;
      })
    );
  }

  sendMessage(message: string, senderId: string, receiverId: string): void {
    console.log('sender: ', senderId, ' receiver: ', receiverId, ' message: ', message);
    const messageData = {
      message: message,
      senderId: senderId,
      receiverId: receiverId
    };
    this.socket.emit('message', messageData);
  }
  
  getUserChatsWithContent(): Observable<Chat[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        this.userId = user?.uid!;
        console.log(this.userId);
  
        const chatsRef = collection(this.firestore, 'chats2');
  
        const senderQuery = query(chatsRef, where('sender', '==', this.userId));
        const receiverQuery = query(chatsRef, where('receiver', '==', this.userId));
  
        const senderChats$ = from(getDocs(senderQuery)).pipe(
          map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)))
        );
  
        const receiverChats$ = from(getDocs(receiverQuery)).pipe(
          map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)))
        );
  
        return combineLatest([senderChats$, receiverChats$]).pipe(
          switchMap(([senderChats, receiverChats]) => {
            const allChats = [...senderChats, ...receiverChats];
  
            // Map over all chats and fetch chatContent for each
            const chatContentObservables = allChats.map(chat => {
              const chatContentRef = collection(this.firestore, `chats2/${chat.id}/chatContent`);
              return collectionData(chatContentRef).pipe(
                map(chatContent => ({
                  ...chat,
                  chatContent // Add the chatContent to each chat object
                }))
              );
            });
  
            // Combine all chat content observables
            return combineLatest(chatContentObservables);
          })
        );
      })
    );
  }

  
  saveMessagesToFireStore(data: any) {
    console.log(data);
    const chatsRef = collection(this.firestore, 'chats2');
    const q = query(chatsRef, where('sender', '==', data.data.senderId), where('receiver', '==', data.data.receiverId));

    from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) {
          // If no matching document is found, create a new chat document
          const newChatRef = doc(chatsRef, `${data.data.senderId}_${data.data.receiverId}`);
  
          return from(setDoc(newChatRef, {
            sender: data.data.senderId,
            receiver: data.data.receiverId
          })).pipe(map(() => newChatRef)); // Return the new chat document reference
        } 
        else {
          // If a matching document is found, use the first one (assuming one-to-one chat)
          return of(snapshot.docs[0].ref);
        }
      }),
      switchMap(chatDocRef => {
        // Now add the message to the 'chatContent' subcollection of the chat document
        const chatContentRef = collection(chatDocRef, 'chatContent');

        return from(addDoc(chatContentRef, {
          // senderId: data.data.senderId,
          // receiverId: data.data.receiverId,
          message: data.data.message,
          timestamp: new Date()
        }));
      })
    ).subscribe({
      next: () => {
        console.log('Message stored in Firestore');
      },
      error: (error) => {
        console.error('Error storing message in Firestore:', error);
      }
    });
  
  }
  

  createOrJoinChat(userId1: string, userId2: string) {
    const chatsRef = collection(this.firestore, 'chats');
    const q = query(chatsRef, 
      where('userIds', 'array-contains', userId1),
      where('userIds', 'array-contains', userId2)
    );
  
    return from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) {
          // No chat exists, create a new one
          const newChat = {
            userIds: [userId1, userId2],
            createdAt: new Date()
          };
          return from(addDoc(chatsRef, newChat));
        } else {
          // Chat exists, return its reference
          return from(Promise.resolve(snapshot.docs[0].ref));
        }
      })
    );
  }
}
