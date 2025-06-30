import { useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'

export function useVoiceCommands() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    if (isRecording) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = async (): Promise<string | null> => {
    if (!mediaRecorderRef.current) return null

    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current!
      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          chunksRef.current = []

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
          }

          const arrayBuffer = await audioBlob.arrayBuffer()
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

          if (!supabase) throw new Error('Supabase not configured')
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          })

          setIsRecording(false)
          if (error) return reject(error)
          resolve(data.text as string)
        } catch (err) {
          setIsRecording(false)
          reject(err)
        }
      }

      recorder.stop()
    })
  }

  const speakText = async (text: string, voiceId?: string) => {
    if (!text || !supabase) return
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voiceId }
      })
      if (error) throw error

      let audioBuffer: ArrayBuffer
      if (data instanceof ArrayBuffer) {
        audioBuffer = data
      } else if (data && (data as any).audioContent) {
        const bytes = Uint8Array.from(atob((data as any).audioContent), (c) => c.charCodeAt(0))
        audioBuffer = bytes.buffer
      } else {
        return
      }

      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      await audio.play()
    } catch (err) {
      console.error('Error generating speech:', err)
    }
  }

  return { isRecording, startRecording, stopRecording, speakText }
}
