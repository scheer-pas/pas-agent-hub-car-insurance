import { Component } from '@angular/core';
import { AgentCardComponent } from '../cards/agent-card/agent-card.component';
import { HeaderComponent } from '../header/header.component';
import { HeroComponent } from '../hero/hero.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastComponent } from '../toast/toast.component';

/**
 * The page of the app. Owns only the page layout and composes the
 * self-contained domain parts (brand bar, hero, Agent card, sidebar, and
 * toast).
 */
@Component({
  selector: 'app-home',
  imports: [
    HeaderComponent,
    HeroComponent,
    AgentCardComponent,
    SidebarComponent,
    ToastComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
