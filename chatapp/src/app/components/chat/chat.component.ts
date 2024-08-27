import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Chat } from 'src/app/_models/ChatModels';
import { AuthService } from 'src/app/_services/auth.service';
import { ChatService } from 'src/app/_services/chat.service';
import { UtilService } from 'src/app/_services/util.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  messages: string[] = [];
  messageContent: string = '';

  messageInput: FormGroup = new FormGroup({});
  userSelectionForm: FormGroup = new FormGroup({});

  userId: string = '';
  users: any[] = [];
  receiverId: string = '';

  chats: any;

  constructor(private chatService: ChatService, private fb: FormBuilder, private authService: AuthService,
    private utilService: UtilService
  ) { }

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.userId = user?.uid!;
      this.chatService.setUserId(this.userId);
    });
    this.utilService.getUsers().subscribe((users) => {
      this.users = users;
      console.log(this.users);
    })
    this.getUserChats();
    this.getMessages();
    this.initializeMessageInput();
    this.initializeUserSelection();
  }

  initializeMessageInput() {
    this.messageInput = this.fb.group({
      message: ['']
    })
  }

  initializeUserSelection() {
    this.userSelectionForm = this.fb.group({
      receiverId: ['', Validators.required]
    })
  }

  // getMessages() {
  //   this.chatService.getMessage().subscribe((message: string) => {
  //     this.messages.push(message);
  //   });
  // }

  getUserChats() {
    this.chatService.getUserChatsWithContent().subscribe((chats: Chat[]) => {
      console.log(chats);
      this.chats = chats;
      console.log(this.chats);
    })
  }

  getMessages() {
    this.chatService.getMessages().subscribe((data: any) => {
      console.log(data);
      this.messages.push(data.data.message);
    })
  }

  sendMessage(): void {
    this.messageContent = String(this.messageInput.value.message)
    if (this.messageContent.trim()) {
      this.chatService.sendMessage(this.messageContent, this.userId, this.receiverId);
      this.messages.push(this.messageContent);
      this.messageContent = '';
    }
  }

  selectReciever() {
    // console.log(this.userSelectionForm.value);
    let formValue = this.userSelectionForm.value.receiverId;
    console.log(formValue);
    this.receiverId = String(formValue);
  }

  // createOrJoinChat(userId1: string, userId2: string): void {
  //   this.chatService.createOrJoinChat(userId1, userId2).subscribe((chatRef: DocumentReference<any>) => {
  //     console.log('Chat document reference:', chatRef.id);
  //   });
  // }
}
