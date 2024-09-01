import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs';
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

  messageInput: FormGroup = new FormGroup({});
  messages: any[] = [];
  messageContent: string = '';

  dropdown: boolean = false;
  isModalOpen: boolean = false;

  editMessageForm: FormGroup = new FormGroup({});

  theChatContent: ChatsDetail = {} as ChatsDetail;

  constructor(private fb: FormBuilder, private chatService: ChatService, private socket: Socket) { }

  ngOnInit(): void {
    this.initializeMessageInput();
    this.getMessages();
    this.initializeEditMessageForm();
  }

  initializeMessageInput() {
    this.messageInput = this.fb.group({
      message: ['']
    })
  }

  initializeEditMessageForm() {
    this.editMessageForm = this.fb.group({
      editedMessage: ['']
    })
  }

  getMessages() {
    this.chatService.getMessages().subscribe((data: any) => {
      console.log(data.data);
      this.messages.push(data.data);
    });
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
    const date: Date = timestamp.toDate();
    return date.toLocaleString();
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
    this.chatService.deleteMessageFromFirestore(this.chat!.id, chatContent.id).subscribe(() => {
      if(this.chat?.chatContent) {
        this.chat.chatContent = this.chat?.chatContent.filter(content => content.id !== chatContent.id)
      }
    });
  }

  openEditModal(chatContent: ChatsDetail) {
    this.editMessageForm.setValue({
      editedMessage: chatContent.message 
    })
    this.theChatContent = chatContent;
    this.isModalOpen = true;
  }

  editMessage() {
    const formvalue = this.editMessageForm.value.editedMessage;

    this.chatService.editMessageFromFirestore(this.chat!.id, this.theChatContent.id, String(formvalue)).subscribe(() => {

      if(this.chat?.chatContent) {
        const index = this.chat.chatContent.findIndex(content => content.id === this.theChatContent.id);
        if(index > -1) {
          this.chat.chatContent[index].message = String(formvalue);
        }
      }
    })

    this.resetEditMessageForm();
    this.isModalOpen = false;
  }

  closeModal() {
    this.resetEditMessageForm();
    this.isModalOpen = false;
  }

  resetEditMessageForm() {
    this.editMessageForm.reset({
      editedMessage: ''
    });
  }
}
