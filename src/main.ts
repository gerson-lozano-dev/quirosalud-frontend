import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// Importamos la clase con el nombre correcto: AppComponent
import { AppComponent } from './app/app'; 

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));