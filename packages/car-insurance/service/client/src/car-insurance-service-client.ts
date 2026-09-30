import { Axios } from 'axios';

/**
 * Calls the car insurance service. The address of the service comes from the
 * configuration of the app.
 */
export class CarInsuranceServiceClient {
  /**
   * @param axios The HTTP client, configured with the address of the service.
   */
  public constructor(protected readonly axios: Axios) {}
}
