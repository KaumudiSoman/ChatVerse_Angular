export interface Chat {
    id: string;
    // userIds: string[];
    sender: string,
    receiver: string
}
  
export interface Message {
    content: string;
    timestamp: any;
}