# car-insurance-service-types

This library was generated with [Nx](https://nx.dev).

It holds the types of the `car-insurance` service. Each type comes with a schema that validates it.

## Agent types

| Type                 | Schema                     | Describes                                                                    |
| -------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| `AgentStreamRequest` | `agentStreamRequestSchema` | A text prompt with attachments: `text` and `attachments` (0 to 10).          |
| `AgentAttachment`    | `agentAttachmentSchema`    | An attached file: its `name`, its file `type` and its base64-encoded `data`. |
| `AgentResponse`      | `agentResponseSchema`      | The answer as plain text.                                                    |

`MAX_AGENT_ATTACHMENTS` is the largest number of attachments a request carries (10).

`AttachmentKinds.of(type)` returns the `AttachmentKind` of a file type — `Image`, `Text`, `Audio` or `Video` — or `undefined` for a type of no kind. `AttachmentKinds.isSupported(type)` tells whether a file type can be attached.

```typescript
import { AttachmentKinds, AgentStreamRequest } from '@pas-agent-hub-car-insurance/car-insurance-service-types';

AttachmentKinds.of('audio/mpeg'); // AttachmentKind.Audio
AttachmentKinds.isSupported('application/pdf'); // false

const request: AgentStreamRequest = {
  text: 'Summarize the call',
  attachments: [{ name: 'call.mp3', type: 'audio/mpeg', data: base64Content }],
};
```

## Running unit tests

Run `nx test car-insurance-service-types` to execute the unit tests via [Jest](https://jestjs.io).
