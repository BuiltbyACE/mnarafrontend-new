import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ChatViewComponent } from '@sms/shared/communication';

@Component({
  selector: 'app-teacher-chat',
  standalone: true,
  imports: [ChatViewComponent],
  template: `<div class="chat-page"><app-chat-view /></div>`,
  styles: [`.chat-page { padding: 24px; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {}
