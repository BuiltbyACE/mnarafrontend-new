import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthStore, TokenStorageService } from '@sms/core/auth';
import { BroadcastListenerService } from '@sms/shared/communication';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'Mnara Shell';

  private readonly authStore = inject(AuthStore);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly broadcastListener = inject(BroadcastListenerService);

  constructor() {
    // Once the user is authenticated, open the realtime channel and listen for
    // admin broadcasts so every portal receives them live (toast + feed).
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        const token = this.tokenStorage.getAccessToken();
        if (token) {
          this.broadcastListener.start(token);
        }
      }
    });
  }
}
