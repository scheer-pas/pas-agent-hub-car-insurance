# Car Insurance Agent

## Background

The page shows the Agent card. The Agent card sends a text prompt to the Car Insurance agent and
shows its answer in the output area.

In the Agent card, a user can attach files from their computer to the prompt: images, text files,
audio files and video files. The Car Insurance agent reads the prompt together with the attachments, for
example photos of a damaged car, a written damage report and a recorded customer call. The answer is
streamed to the page while the agent produces it.

## Acceptance Criteria

### Attaching files

- The Agent card has an **Attach** button between the text input and the **Send** button.
- The Attach button has the same height as the text input and the **Send** button of the card, and
  the same corner radius, font and border colors as the page's secondary buttons, with a paperclip
  icon before the label.
- Selecting Attach opens the file picker of the operating system. The user can select several files
  at once.
- The user can select Attach again to add more files to the ones already selected.
- A selected file is accepted when its type is one of these:

  | Kind  | File type                     | Examples                |
  | ----- | ----------------------------- | ----------------------- |
  | Image | a type starting with `image/` | `.jpg`, `.png`, `.webp` |
  | Text  | a type starting with `text/`  | `.txt`, `.csv`, `.html` |
  | Audio | a type starting with `audio/` | `.mp3`, `.wav`, `.m4a`  |
  | Video | a type starting with `video/` | `.mp4`, `.mov`, `.webm` |

- At most 10 attachments can be selected.
- The attachments together may not be larger than 10 MB.
- A file that cannot be added is not added, and a notification names the file and the reason:

  | Reason                                                 | When                                                              |
  | ------------------------------------------------------ | ----------------------------------------------------------------- |
  | This file type is not supported.                       | The type of the file is not in the table above, or it is unknown. |
  | A file with this name is already attached.             | A selected attachment has the same file name.                     |
  | At most 10 files can be attached.                      | 10 attachments are already selected.                              |
  | The attachments together may not be larger than 10 MB. | The file would make the selected attachments exceed 10 MB.        |
  | The file could not be read.                            | The browser cannot read the file.                                 |

- The other files of the same selection are still added.
- While the selected files are being read, the Attach button and the Send button are disabled. The
  files of one selection are checked and added together, after all of them are read.

### Selected attachments

- The selected attachments are listed below the input row, before the output area, in the order they
  were added.
- Each entry shows the kind of the attachment (Image, Text, Audio or Video), the file name and a
  remove button.
- Selecting the remove button of an entry removes that attachment from the selection.
- Without selected attachments, the list is not shown.
- The selection stays after an answer is complete, so the next prompt uses the same attachments
  until the user removes them.

### Sending

- Selecting **Send** or pressing Enter in the input sends the text prompt together with all selected
  attachments to the Car Insurance agent.
- A text prompt is required. Sending with an empty prompt shows the input error of the card and
  sends nothing.
- Attachments are optional. A prompt without attachments is sent and answered as a prompt with
  attachments is.
- While a request is in progress, the Attach button, the Send button and the remove buttons of the
  attachments are disabled.

### Answer

- The answer is streamed from the service to the page while the Car Insurance agent produces it.
- The output area reveals the answer character by character with the typewriter effect of the card.
  Text that arrives while the typewriter is running is revealed after the text already received.
- The workflow animation of the card runs in this sequence: the first step is active from Send until
  the first part of the answer arrives, and for at least 0.8 seconds; then the middle and last steps
  follow, and the typewriter starts.
- While the first step is active, the arrow after it shows that the request is in progress: it fills
  with the accent color from its start to its tip, then returns to its normal color, and repeats.
  When the first part of the answer arrives, the arrow stays in the accent color.
- When the operating system asks for reduced motion, the arrow does not fill gradually. It changes
  between its normal color and the accent color slowly.
- The request is complete when the whole answer is revealed. The animation ends and the buttons are
  enabled again.
- The answer is shown as plain text.
- When the answer cannot be produced, the output area is cleared and the error notification of the
  page is shown. The buttons are enabled again, and the attachments stay selected.

### Output area

- The output area of the Agent card grows with the answer, up to 10 visible lines.
- When the answer is longer than 10 lines, the output area keeps the height of 10 lines and scrolls
  vertically.
- While the answer is revealed, the output area stays scrolled to the newest line.

### Page

- The page shows the header, the hero, the sidebar, and the Agent card. It shows no other cards.
- The title of the Agent card is "Car Insurance Agent".
- The subtitle of the Agent card tells the user to attach photos, reports, recordings or videos of
  a car insurance case and to ask the agent about them.
- The placeholder of the text input proposes a question about the damage in the attached files.

### Car Insurance agent

- The Car Insurance agent answers the text prompt and uses the content of the attachments that come
  with it.
- The Car Insurance agent produces its answer in parts, so the service can send each part as soon as
  it is produced.
- The default configuration uses the Google Gemini model `gemini-3.8-flash`, which reads images,
  text, audio and video.
- The model, its provider and its API key are set in the configuration under `agents.carInsurance`,
  so a deployment can use another model without a change of the code.

### Service endpoint

- `POST /car-insurance/ask` answers a text prompt with attachments. The request body is:

  | Field                | Type              | Required | Meaning                                           |
  | -------------------- | ----------------- | -------- | ------------------------------------------------- |
  | `text`               | string, not empty | yes      | The text prompt.                                  |
  | `attachments`        | list of 0 to 10   | no       | The attached files. Missing means no attachments. |
  | `attachments[].name` | string, not empty | yes      | The file name.                                    |
  | `attachments[].type` | string            | yes      | The file type, for example `image/jpeg`.          |
  | `attachments[].data` | string            | yes      | The content of the file, base64-encoded.          |

- The service accepts a request body of up to 15 MB. A larger request body fails with status 413.
- When the caller closes the connection before the answer is complete, the service stops producing
  the answer.
- An attachment whose type does not start with `image/`, `text/`, `audio/` or `video/` makes the
  request fail with status 400.
- A text attachment is passed to the agent with its decoded text and its file name.
- The response has the content type `text/plain` and carries the answer in parts, in the order the
  agent produces them. Only the text of the answer is sent; progress reports of the agent are not.
- A request body that does not match the table fails with status 400 before the agent is called.
- When the answer cannot be produced before its first part is sent, the request fails with status 500. When it breaks off after that, the connection is closed.
- Fields of the request that the service does not know are ignored.

### Names on the platform

- The service is the component `car-insurance-service`, and the app is the component
  `car-insurance-app`.
- The service declares one agent: `car-insurance`, configured under `agents.carInsurance`.
- `POST /car-insurance/ask` is the only operation of the service, besides the health check and the
  API documentation that every PAS service has.

## Out of Scope

- PDF files and other documents that are not text, audio, image or video.
- Drag and drop of files onto the card.
- Previews of attached images or players for audio and video.
- Formatting the answer, for example as Markdown.
- Remembering earlier prompts and answers: each prompt is answered on its own.
- Storing attachments: they are sent with the request and not kept by the service.
- The configuration of deployments on a PAS platform.
