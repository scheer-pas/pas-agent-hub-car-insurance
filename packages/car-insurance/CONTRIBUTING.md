# Working on the Car Insurance Agent

What the Agent card, the configuration and the endpoint do is described in the [README](README.md).

## Run it locally

1. Add your Google Gemini API key for the agent to `service/impl/src/config/local/config.json`. The file is git-ignored, so the key stays on your machine. Create a key in [Google AI Studio](https://aistudio.google.com/apikey):

   ```json
   {
     "agents": {
       "carInsurance": { "model": { "apiKey": "AIza..." } }
     }
   }
   ```

2. Point the app at the local service in `app/impl/public/config/local/config.json5`. The file is git-ignored too:

   ```json5
   {
     clients: {
       service: { baseUrl: 'http://localhost:8080' },
     },
   }
   ```

3. From the workspace root, start the app and the service:

   ```bash
   pas start
   ```

   `npm start` and `npx pas start` do the same.

4. Open [http://localhost:4200](http://localhost:4200), attach one or more files in the Agent card, and send a prompt.

The service runs on [http://localhost:8080](http://localhost:8080). Its OpenAPI document, including `POST /car-insurance/ask`, is at [http://localhost:8080/docs](http://localhost:8080/docs).

If an Nx command acts on another workspace than this one, the environment variable `NX_WORKSPACE_ROOT_PATH` points elsewhere. Run `unset NX_WORKSPACE_ROOT_PATH` in that terminal first.

## Try the endpoint without the app

```bash
DATA=$(base64 < photo.jpg | tr -d '\n')
curl -N -X POST http://localhost:8080/car-insurance/ask \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"Describe the damage\",\"attachments\":[{\"name\":\"photo.jpg\",\"type\":\"image/jpeg\",\"data\":\"$DATA\"}]}"
```

`-N` prints the answer while it streams in.

## Tests

```bash
npx nx test car-insurance-app
npx nx test car-insurance-service
npx nx test car-insurance-service-client
npx nx test car-insurance-service-types
```
