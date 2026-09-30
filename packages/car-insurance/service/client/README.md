# car-insurance-service-client

This library was generated with [Nx](https://nx.dev).

It is the client of the `car-insurance` service. Its default export is `CarInsuranceServiceClient`, which is created with a configured `Axios` instance.

## Sending a prompt with attachments

`streamAgent(request, onProgress?)` calls `POST /car-insurance/ask` and resolves with the complete answer. `onProgress` is called with the answer received so far each time a part of it arrives. It is called in the browser only, where the transport reports partial responses.

```typescript
const answer = await client.streamAgent(
  {
    text: 'Describe the damage',
    attachments: [{ name: 'front.jpg', type: 'image/jpeg', data: base64Content }],
  },
  (answerSoFar) => console.log(answerSoFar),
);
// "The front bumper is dented and the headlight is cracked."
```

The request types come from `@pas-agent-hub-car-insurance/car-insurance-service-types`. The endpoint is described in the [car-insurance README](../../README.md).

## Running unit tests

Run `nx test car-insurance-service-client` to execute the unit tests via [Jest](https://jestjs.io).
