import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Socket } from 'ngx-socket-io';
import { AllChats, Chat, ChatsDetail } from 'src/app/_models/ChatModels';
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

  chats: Chat[] = [];
  openChat: AllChats = {} as AllChats;
  filteredMessages: Chat[] = [];
  allChats: AllChats[] = [];

  userNamesMap: Map<string, string> = new Map();
  usernames: string[] = [];
  totalUsernames: number = 0;
  otherUser: string = '';
  userStatus: boolean = false;

  constructor(private chatService: ChatService, private fb: FormBuilder, public authService: AuthService,
    private utilService: UtilService, private socket: Socket
  ) { }

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.userId = user?.uid!;
      this.chatService.setUserId(this.userId);
    });
    this.getUsers();
    this.getUserChats();
    this.initializeMessageInput();
    this.initializeUserSelection();
  }

  getUsers() {
    this.utilService.getUsers().subscribe((users) => {
      this.users = users;
      this.users = this.users.filter(user => user.uid !== this.userId);
    });
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

  getUserChats() {
    this.chatService.getMessagesFromFireStore().subscribe((chats: Chat[]) => {
      const allChatsMap = new Map<string, AllChats>();
  
      chats.forEach(chat => {
        // Create a sorted array of userIds to ensure consistent key regardless of sender/receiver order
        const userIds = [chat.sender, chat.receiver].sort(); 
        this.utilService.getUserById(userIds.filter(id => id !== this.userId)[0]).subscribe((user) => {
          this.usernames.push(user.userName);
        })
        const userIdsKey = userIds.join('-'); // Create a unique key for the user pair
  
        const chatDetails: ChatsDetail[] = chat.chatContent.map(message => ({
          id: message.id,
          sender: chat.sender,
          message: message.message,
          timestamp: message.timestamp
        }));
  
        // Check if this userIds pair already exists in the map
        if (allChatsMap.has(userIdsKey)) {
          // If it exists, append the new chat details to the existing chatContent
          allChatsMap.get(userIdsKey)!.chatContent.push(...chatDetails);
        } else {
          // If it doesn't exist, create a new AllChats object and add to the map
          allChatsMap.set(userIdsKey, {
            id: chat.id,
            userIds,
            chatContent: chatDetails
          });
        }
      });
  
      // Convert the map values to an array
      const allChats = Array.from(allChatsMap.values());
  
      console.log(allChats);
      this.allChats = allChats;
    });
  }

  isUserOnline(userId: string) {
    this.socket.emit('checkUserOnline', userId, (isOnline: boolean) => {
      this.userStatus = isOnline;
    });
  }

  openChatDetail(uid: string) {
    const chat: AllChats = this.allChats.find(chat => chat.userIds.includes(this.userId) && chat.userIds.includes(uid))!;
    this.utilService.getUserById(uid).subscribe((user) => {
      this.otherUser = user.userName;
    });
    if(chat) {
      chat.chatContent.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
    }
    this.openChat = chat;
    this.isUserOnline(uid);
    console.log(this.openChat);
  }
}
