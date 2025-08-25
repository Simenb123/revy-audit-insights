import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Upload, FileText, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

import { importShareholders } from '@/services/shareholders'
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin'

const importSchema = z.object({
  file: z.instanceof(File).refine(file => file.size > 0, 'Fil er påkrevd'),
  year: z.number().min(2000).max(new Date().getFullYear()),
  delimiter: z.enum([';', ',']),
  encoding: z.enum(['AUTO', 'UTF-8', 'CP1252']),
  mode: z.enum(['full', 'clients-only']),
  isGlobal: z.boolean().optional()
})

type ImportFormData = z.infer<typeof importSchema>

export const ShareholdersImportForm: React.FC = () => {
  const { toast } = useToast()
  const { data: isSuperAdmin } = useIsSuperAdmin()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      year: new Date().getFullYear() - 1, // Forrige år som standard
      delimiter: ';',
      encoding: 'AUTO',
      mode: 'full',
      isGlobal: false
    }
  })

  const importMutation = useMutation({
    mutationFn: async (data: ImportFormData) => {
      if (!file) throw new Error('Ingen fil valgt')

      // Send fil direkte til Edge Function
      setUploadProgress(10)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('year', data.year.toString())
      formData.append('delimiter', data.delimiter)
      formData.append('encoding', data.encoding)
      formData.append('mode', data.mode)
      formData.append('isGlobal', data.isGlobal?.toString() || 'false')

      setUploadProgress(20)
      return await importShareholders(formData)
    },
    onSuccess: (result) => {
      setUploadProgress(100)
      toast({
        title: 'Import fullført',
        description: `${result.processedRows} rader importert, ${result.skippedRows} hoppet over, ${result.errorRows} feil`,
      })
      
      // Reset form
      form.reset()
      setFile(null)
      setUploadProgress(0)
    },
    onError: (error) => {
      setUploadProgress(0)
      toast({
        title: 'Import feilet',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      form.setValue('file', selectedFile)
    }
  }

  const onSubmit = (data: ImportFormData) => {
    importMutation.mutate(data)
  }

  const isProcessing = importMutation.isPending

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Filvalg */}
      <div className="space-y-2">
        <Label htmlFor="file">CSV-fil fra Skatteetaten</Label>
        <div className="flex items-center gap-4">
          <Input
            id="file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isProcessing}
          />
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </div>
          )}
        </div>
        {form.formState.errors.file && (
          <p className="text-sm text-destructive">{form.formState.errors.file.message}</p>
        )}
      </div>

      {/* Global import toggle (kun for superadmin) */}
      {isSuperAdmin && (
        <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
          <Switch
            id="isGlobal"
            checked={form.watch('isGlobal') || false}
            onCheckedChange={(checked) => form.setValue('isGlobal', checked)}
            disabled={isProcessing}
          />
          <div className="space-y-1">
            <Label htmlFor="isGlobal" className="text-sm font-medium">
              Global import
            </Label>
            <p className="text-xs text-muted-foreground">
              Import som globale data tilgjengelig for alle brukere (kun superadmin)
            </p>
          </div>
        </div>
      )}

      {/* Parametere */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Regnskapsår</Label>
          <Input
            id="year"
            type="number"
            min="2000"
            max={new Date().getFullYear()}
            {...form.register('year', { valueAsNumber: true })}
            disabled={isProcessing}
          />
        </div>

        <div className="space-y-2">
          <Label>Skilletegn</Label>
          <Select 
            value={form.watch('delimiter')} 
            onValueChange={(value) => form.setValue('delimiter', value as ';' | ',')}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=";">Semikolon (;)</SelectItem>
              <SelectItem value=",">Komma (,)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tegnkoding</Label>
          <Select 
            value={form.watch('encoding')} 
            onValueChange={(value) => form.setValue('encoding', value as 'AUTO' | 'UTF-8' | 'CP1252')}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTO">Automatisk</SelectItem>
              <SelectItem value="UTF-8">UTF-8</SelectItem>
              <SelectItem value="CP1252">CP1252</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Import-modus</Label>
          <Select 
            value={form.watch('mode')} 
            onValueChange={(value) => form.setValue('mode', value as 'full' | 'clients-only')}
            disabled={isProcessing}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Alle selskaper</SelectItem>
              <SelectItem value="clients-only">Kun mine klienter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info om clients-only modus */}
      {form.watch('mode') === 'clients-only' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kun selskaper som matcher organisjonsnummer på dine klienter vil bli importert.
          </AlertDescription>
        </Alert>
      )}

      {/* Progress bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Importerer...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Submit knapp */}
      <Button type="submit" disabled={!file || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            Importerer...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Start Import
          </>
        )}
      </Button>
    </form>
  )
}