import { Timestamp } from '@angular/fire/firestore';

export interface Message {
    id: string,
    message: string;
    timestamp: Timestamp;
}

export interface Chat {
    id: string;
    sender: string,
    receiver: string,
    chatContent: Message[]
}

export interface ChatsDetail {
    id: string
    sender: string
    message: string;
    timestamp: Timestamp;
}

export interface AllChats {
    id: string, 
    userIds: string[],
    chatContent: ChatsDetail[]
}