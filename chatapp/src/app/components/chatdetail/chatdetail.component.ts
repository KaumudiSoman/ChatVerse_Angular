import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Socket } from 'ngx-socket-io';
import { AllChats, Chat, ChatsDetail } from 'src/app/_models/ChatModels';
import { ChatService } from 'src/app/_services/chat.service';

@Component({
  selector: 'app-chatdetail',
  templateUrl: './chatdetail.component.html',
  styleUrls: ['./chatdetail.component.css']
})
export class ChatdetailComponent implements OnInit {
  @Input() chat: AllChats | undefined;
  @Input() userId: string | undefined;
  @Input() otherUser: string | undefined;
  @Input() userStatus: boolean | undefined;

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  messageInput: FormGroup = new FormGroup({});
  messages: any[] = [];
  messageContent: string = '';

  dropdown: boolean = false;

  // userStatus: boolean = false;

  constructor(private fb: FormBuilder, private chatService: ChatService, private socket: Socket) { }

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

  // isUserOnline(userId: string) {
  //   this.socket.emit('checkUserOnline', userId, (isOnline: boolean) => {
  //     this.userStatus = isOnline;
  //   });
  // }

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

  enableDropdown() {
    this.dropdown = true;
  }

  deleteMessage(chatContent: ChatsDetail) {
    this.chatService.deleteMessageFromFirestore(this.chat!, chatContent)
  }

  editMessage(chat: AllChats) {

  }
}
