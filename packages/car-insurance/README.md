# Car Insurance Agent

The Agent card of the page sends a text prompt to the Car Insurance agent, together with files from your computer: images, text files, audio files and video files. The answer is shown while the agent writes it.

## Using the Agent card

1. Enter a prompt in the input of the Agent card.
2. Select **Attach** to choose files. You can choose several files at once, and select Attach again to add more.
3. The attached files are listed below the input with their kind (Image, Text, Audio or Video) and their name. Select **×** on an entry to remove that file.
4. Select **Send** or press Enter. The prompt is sent with all attached files. Until the first words of the answer arrive, the arrow after the first step of the animation fills with color again and again, so you see that the request is still in progress. Large files can take a while.
5. The answer appears in the output area character by character while it arrives. The output area grows with the answer up to 10 lines, then scrolls and keeps the newest line in view.

A prompt is required; attachments are optional. While a prompt is being answered, **Attach**, **Send** and the remove buttons are disabled. After the answer, the files stay attached, so the next prompt uses them too until you remove them.

The answer is shown as plain text. Each prompt is answered on its own: earlier prompts and answers are not taken into account.

When an answer cannot be produced, the output area is cleared and an error notification is shown. The attached files stay.

### Files you can attach

| Kind  | File type                     | Examples                |
| ----- | ----------------------------- | ----------------------- |
| Image | a type starting with `image/` | `.jpg`, `.png`, `.webp` |
| Text  | a type starting with `text/`  | `.txt`, `.csv`          |
| Audio | a type starting with `audio/` | `.mp3`, `.wav`, `.m4a`  |
| Video | a type starting with `video/` | `.mp4`, `.mov`, `.webm` |

The file type is the one your browser reports for the file. A file whose type the browser does not report, for example some `.md` files, cannot be attached.

| Limit                      | Value |
| -------------------------- | ----- |
| Attached files at a time   | 10    |
| Size of all attached files | 10 MB |

A file that cannot be attached is named in a notification, together with the reason:

| Reason                                                 | When                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| This file type is not supported.                       | The file type is not in the table above, or it is unknown. |
| A file with this name is already attached.             | An attached file has the same file name.                   |
| At most 10 files can be attached.                      | 10 files are already attached.                             |
| The attachments together may not be larger than 10 MB. | The file would make the attached files exceed 10 MB.       |
| The file could not be read.                            | The browser cannot read the file.                          |

The other files of the same selection are still attached. While the files of a selection are being read, **Attach** and **Send** are disabled.

## On a PAS platform

The Control Hub shows two components: the service `car-insurance-service` and the app `car-insurance-app`. The service declares one agent, `car-insurance`.

## Configuration

The Car Insurance agent is configured in the service configuration under `agents.carInsurance`:

```json
{
  "agents": {
    "carInsurance": {
      "version": "26",
      "model": {
        "provider": "universal",
        "model": "google:gemini-3.8-flash",
        "streaming": true,
        "apiKey": "<your Gemini API key>"
      },
      "mcpServers": {}
    }
  }
}
```

| Key                                   | Meaning                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `agents.carInsurance.model.provider`  | `universal` lets the `model` value name the provider, for example `google:`.                 |
| `agents.carInsurance.model.model`     | The model that reads the prompt and the files. It must accept the kinds of files you attach. |
| `agents.carInsurance.model.streaming` | `true` sends the answer in parts while the model writes it.                                  |
| `agents.carInsurance.model.apiKey`    | The API key of the model provider.                                                           |

The default model, Google Gemini `gemini-3.8-flash`, reads images, text, audio and video. Choose a model that reads the kinds of files you attach: OpenAI models, for example, read images and text, but not video.

The service accepts request bodies of up to 15 MB.

## Service endpoints

### `POST /car-insurance/ask`

Answers a text prompt with attachments, part by part.

Request body:

| Field                | Type              | Required | Meaning                                                                |
| -------------------- | ----------------- | -------- | ---------------------------------------------------------------------- |
| `text`               | string, not empty | yes      | The text prompt.                                                       |
| `attachments`        | list of 0 to 10   | no       | The attached files. Missing means no attachments.                      |
| `attachments[].name` | string, not empty | yes      | The file name.                                                         |
| `attachments[].type` | string            | yes      | The file type. It starts with `image/`, `text/`, `audio/` or `video/`. |
| `attachments[].data` | string            | yes      | The content of the file, base64-encoded.                               |

Example:

```json
{
  "text": "Extract the customer info from attachments and summarize the issues list",
  "attachments": [
    { "name": "front.jpg", "type": "image/jpeg", "data": "/9j/4AAQSkZJRgABAQ..." },
    { "name": "damage-report.txt", "type": "text/plain", "data": "Q3VzdG9tZXI6IEpvaG4g..." }
  ]
}
```

Response: the answer as `text/plain`, sent in parts while the agent produces it.

| Status | Meaning                                                                                  |
| ------ | ---------------------------------------------------------------------------------------- |
| 200    | The answer follows. If the answer breaks off after it started, the connection is closed. |
| 400    | The request body does not match the table above.                                         |
| 413    | The request body is larger than 15 MB.                                                   |
| 500    | The answer could not be produced, for example because the model is not reachable.        |

The service ignores fields it does not know. Attachments are not stored. When the caller closes the connection before the answer is complete, the service stops producing it.

The endpoint has no sign-in and accepts requests from any origin. Each request uses the API key of the agent and costs tokens, so protect the service before you make it reachable for others.

For calling the endpoint from an app, see the [service client](service/client/README.md). The request types are described in the [service types](service/types/README.md).
