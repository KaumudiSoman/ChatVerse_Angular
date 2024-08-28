import { Timestamp } from '@angular/fire/firestore';

export interface Message {
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
    sender: string
    message: string;
    timestamp: Timestamp;
}

export interface AllChats {
    userIds: string[],
    chatContent: ChatsDetail[]
}