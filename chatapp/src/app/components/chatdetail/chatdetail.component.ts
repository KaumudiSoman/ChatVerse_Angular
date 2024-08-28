import { Component, Input, OnInit } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AllChats, Chat } from 'src/app/_models/ChatModels';
import { ChatService } from 'src/app/_services/chat.service';

@Component({
  selector: 'app-chatdetail',
  templateUrl: './chatdetail.component.html',
  styleUrls: ['./chatdetail.component.css']
})
export class ChatdetailComponent implements OnInit {
  @Input() chat: AllChats | undefined;
  @Input() userId: string | undefined;
  // @Input() messages: Chat[] | undefined;
  @Input() otherUser: string | undefined;
  @Input() socketMsg: string[] | undefined;

  messageInput: FormGroup = new FormGroup({});
  messages: any[] = [];
  messageContent: string = '';

  constructor(private fb: FormBuilder, private chatService: ChatService) { }

  ngOnInit(): void {
    this.initializeMessageInput();
    this.getMessages();
  }

  initializeMessageInput() {
    this.messageInput = this.fb.group({
      message: ['']
    })
  }

  getMessages() {
    this.chatService.getMessages().subscribe((data: any) => {
      console.log(data.data);
      this.messages.push(data.data);
      // const receivedMessages = Array.isArray(data.data) ? data.data : [data.data];
      // this.messages.push(...receivedMessages.map((msg: any) => ({
      //   message: msg.message,
      //   senderId: msg.senderId,
      //   receiverId: msg.receiverId
      // })));
    })
  }

  sendMessage(): void {
    this.messageContent = String(this.messageInput.value.message);
    const receiverId = this.chat?.userIds.filter(id => id !== this.userId!)[0]!
    if (this.messageContent.trim()) {
      this.chatService.sendMessage(this.messageContent, this.userId!, receiverId);
      const newMessage = {
        message: this.messageContent,
        senderId: this.userId!,
        receiverId: receiverId!
      };
      this.messages.push(newMessage);
      this.messageContent = '';
    }
    this.resetForm();
  }

  resetForm() {
    this.messageInput.reset({
      message: ''
    })
  }

  getReadableDate(timestamp: Timestamp): string {
    const date: Date = timestamp.toDate(); // Convert to JavaScript Date object
    return date.toLocaleString(); // Convert to a readable string format
  }

  getCurrentTimestamp() {
    const date: Date = new Date()
    return date.toLocaleDateString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, 
    });
  }
}
