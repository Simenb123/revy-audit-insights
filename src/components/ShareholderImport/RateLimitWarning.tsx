import { AlertTriangle, Clock, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface RateLimitWarningProps {
  estimatedBatches: number
  estimatedTimeMinutes: number
  totalRows: number
  isVisible: boolean
}

export function RateLimitWarning({ 
  estimatedBatches, 
  estimatedTimeMinutes, 
  totalRows, 
  isVisible 
}: RateLimitWarningProps) {
  if (!isVisible) return null

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Stor opplastning detektert</AlertTitle>
      <AlertDescription className="text-orange-700 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {totalRows.toLocaleString()} rader
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {estimatedBatches} batch(es)
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{estimatedTimeMinutes} min
          </Badge>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm">
            Importen vil prosessere data i store batch(er) med pauser mellom for å unngå rate limiting.
          </p>
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <p><strong>Hva skjer:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 text-xs ml-2">
                <li>Data prosesseres i batch(er) på 8,000 rader</li>
                <li>2.5 sekund pause mellom hver batch (rate limiting)</li>
                <li>Automatisk retry ved feil</li>
                <li>Kontinuerlig fremgangsvisning</li>
              </ul>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}