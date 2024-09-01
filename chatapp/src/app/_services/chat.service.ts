import { inject, Injectable } from '@angular/core';
import { Firestore, collection, addDoc, deleteDoc, doc, query, where, getDocs, setDoc, updateDoc } from '@angular/fire/firestore';
import { Socket } from 'ngx-socket-io';
import { combineLatest, from, map, Observable, of, switchMap } from 'rxjs';
import { Chat, Message } from '../_models/ChatModels';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  firestore = inject(Firestore);
  userId: string = '';

  constructor(private socket: Socket, private authService: AuthService) { }

  setUserId(userId: string) {
    this.socket.emit('register', userId);
  }

  getMessages() {
    return this.socket.fromEvent('received').pipe(
      map((data) => {
        console.log(data);
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
    if(senderId && receiverId && senderId !== '' && receiverId !== '') {
      this.saveMessagesToFireStore(messageData);
    }
  }

  getMessagesFromFireStore(): Observable<Chat[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
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
              
              // Fetch the chatContent documents
              return from(getDocs(chatContentRef)).pipe(
                map(snapshot => {
                  const chatContent = snapshot.docs.map(doc => ({
                    id: doc.id, // Correctly include the document ID
                    ...(doc.data() as Omit<Message, 'id'>) // Spread data but omit 'id' from the type
                  }));

                  return {
                    ...chat,
                    chatContent // Include the chatContent with IDs
                  };
                })
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
    const q = query(chatsRef, where('sender', '==', data.senderId), where('receiver', '==', data.receiverId));

    from(getDocs(q)).pipe(
      switchMap(snapshot => {
        if (snapshot.empty) {
          // If no matching document is found, create a new chat document
          const newChatRef = doc(chatsRef, `${data.senderId}_${data.receiverId}`);
  
          return from(setDoc(newChatRef, {
            sender: data.senderId,
            receiver: data.receiverId
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
          message: data.message,
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

  deleteMessageFromFirestore(chatId: string, chatContentId: string): Observable<void> {
    const chatContentRef = doc(this.firestore, 'chats2', chatId, 'chatContent', chatContentId);

    return from(deleteDoc(chatContentRef));
  }

  editMessageFromFirestore(chatId: string, chatContentId: string, newMessage: string): Observable<void> {
    const chatContentRef = doc(this.firestore, 'chats2', chatId, 'chatContent', chatContentId);

    return from(updateDoc(chatContentRef, {message: newMessage}));
  }
}
