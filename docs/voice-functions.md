# Voice and Audio Functions

Two edge functions provide voice capabilities. They are documented in [docs/openapi.yaml](openapi.yaml).

## `/functions/v1/text-to-speech`

Converts text to spoken audio. It first tries ElevenLabs if `ELEVENLABS_API_KEY` and a `voiceId` are provided, otherwise it falls back to OpenAI's TTS endpoint. The response is an MP3 stream.

Example request body:

```json
{
  "text": "Hei, dette er en test.",
  "voiceId": "21m00Tcm4TlvDq8ikWAM" 
}
```

## `/functions/v1/voice-to-text`

Accepts base64 encoded audio and returns the transcribed text using OpenAI Whisper.

Example request body:

```json
{
  "audio": "<base64 webm data>"
}
```

Both functions require a bearer token and follow the CORS headers defined in the source files.
