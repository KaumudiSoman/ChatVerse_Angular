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
  selectedUser: string = '';

  chats: Chat[] = [];
  openChat: AllChats = {} as AllChats;
  filteredMessages: Chat[] = [];
  allChats: AllChats[] = [];

  userNamesMap: Map<string, string> = new Map();
  usernames: string[] = [];
  totalUsernames: number = 0;
  otherUser: string = '';
  userStatus: boolean = false;

  constructor(private chatService: ChatService, private fb: FormBuilder, private authService: AuthService,
    private utilService: UtilService, private socket: Socket
  ) { }

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.userId = user?.uid!;
      this.chatService.setUserId(this.userId);
    });
    this.getUsers();
    
    this.getUserChats();
    // this.getMessages();
    this.initializeMessageInput();
    this.initializeUserSelection();
  }

  getUsers() {
    this.utilService.getUsers().subscribe((users) => {
      this.users = users;
      console.log(this.userId);
      this.users = this.users.filter(user => user.uid !== this.userId);
      console.log(this.users);
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

  // getUserChats() {
  //   this.chatService.getUserChatsWithContent().subscribe((chats: Chat[]) => {
  //     console.log(chats);
  //     this.chats = chats;
  //     console.log(this.chats);
  //     this.loadUserNamesForChats(this.chats);
  //   })
  // }

  getUserChats() {
    this.chatService.getUserChatsWithContent().subscribe((chats: Chat[]) => {
      const allChatsMap = new Map<string, AllChats>();
  
      chats.forEach(chat => {
        // Create a sorted array of userIds to ensure consistent key regardless of sender/receiver order
        const userIds = [chat.sender, chat.receiver].sort(); 
        this.utilService.getUserById(userIds.filter(id => id !== this.userId)[0]).subscribe((user) => {
          this.usernames.push(user.userName);
        })
        const userIdsKey = userIds.join('-'); // Create a unique key for the user pair
  
        const chatDetails: ChatsDetail[] = chat.chatContent.map(message => ({
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
  
  // getMessages() {
  //   this.chatService.getMessages().subscribe((data: any) => {
  //     console.log(data);
  //     this.messages.push(data.data.message);
  //   })
  // }

  // sendMessage(): void {
  //   this.messageContent = String(this.messageInput.value.message)
  //   if (this.messageContent.trim()) {
  //     this.chatService.sendMessage(this.messageContent, this.userId, this.receiverId);
  //     this.messages.push(this.messageContent);
  //     this.messageContent = '';
  //   }
  // }

  isUserOnline(userId: string) {
    this.socket.emit('checkUserOnline', userId, (isOnline: boolean) => {
      this.userStatus = isOnline;
    });
  }

  selectReciever() {
    let formValue = this.userSelectionForm.value.receiverId;
    console.log(formValue);
    this.receiverId = String(formValue);
  }

  loadUserNamesForChats(chats: Chat[]): void {
    console.log(this.userNamesMap);
    chats.forEach(chat => {
      if (chat.sender === this.userId && !this.userNamesMap.has(chat.receiver)) {
        this.utilService.getUserById(chat.receiver).subscribe(user => {
          this.userNamesMap.set(chat.receiver, user.userName);
          this.getUserName(chat);
        });
      } 
      else if (chat.receiver === this.userId && !this.userNamesMap.has(chat.sender)) {
        this.utilService.getUserById(chat.sender).subscribe(user => {
          this.userNamesMap.set(chat.sender, user.userName);
          this.getUserName(chat);
        });
      }
    });
  }
  
  getUserName(chat: Chat): string {
    console.log(this.usernames);
    console.log(this.userNamesMap);

    if (chat.sender === this.userId) {
      console.log(this.userNamesMap.get(chat.receiver))
      const flag: boolean = this.usernames.includes(this.userNamesMap.get(chat.receiver)!);
      if(!flag) {
        this.usernames.push(this.userNamesMap.get(chat.receiver)!);
        this.totalUsernames = this.usernames.length;
        return this.userNamesMap.get(chat.receiver) || 'Loading...';
      }
    } 
    else if (chat.receiver === this.userId) {
      const flag: boolean = this.usernames.includes(this.userNamesMap.get(chat.sender)!);
      if(!flag) {
        this.usernames.push(this.userNamesMap.get(chat.sender)!);
        this.totalUsernames = this.usernames.length;
        return this.userNamesMap.get(chat.sender) || 'Loading...';
      }
    }
    return '';
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
