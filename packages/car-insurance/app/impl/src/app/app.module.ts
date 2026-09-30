import { PasAppModule } from '@pas/ng-app-api';
import ServiceClient from '@pas-agent-hub-car-insurance/car-insurance-service-client';
import { AppComponent } from './app.component';

@PasAppModule({
  axiosBasedClients: [
    {
      provide: ServiceClient,
      configKey: 'clients.service',
    },
  ],
  rootComponents: [AppComponent],
})
export class AppModule {}
