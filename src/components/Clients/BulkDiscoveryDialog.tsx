import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Database, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useBulkDiscovery } from '@/hooks/usePotentialClients'
import { useUserProfile } from '@/hooks/useUserProfile'
import { toast } from 'sonner'

interface BulkDiscoveryDialogProps {
  children: React.ReactNode
}

export function BulkDiscoveryDialog({ children }: BulkDiscoveryDialogProps) {
  const [open, setOpen] = useState(false)
  const [auditorOrgNumber, setAuditorOrgNumber] = useState('')
  const [auditorName, setAuditorName] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  
  const { data: userProfile } = useUserProfile()
  const bulkDiscovery = useBulkDiscovery()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auditorOrgNumber.trim()) return

    try {
      const result = await bulkDiscovery.mutateAsync({
        auditorOrgNumber: auditorOrgNumber.trim(),
        auditorName: auditorName.trim() || undefined
      })
      
      // Show detailed result
      setLastResult(result)
      setShowResult(true)
      
      // Also show toast for immediate feedback
      if (result.new_potential_clients > 0) {
        toast.success('Bulk-søk fullført!', {
          description: `Fant ${result.total_found} selskaper, ${result.new_potential_clients} nye potensielle klienter ble lagt til.`
        })
      } else {
        toast.info('Bulk-søk fullført', {
          description: `Fant ${result.total_found} selskaper, men ingen nye potensielle klienter (alle eksisterte allerede).`
        })
      }
      
    } catch (error) {
      // Error handling is done in the hook
      console.error('Bulk discovery error:', error)
    }
  }

  // Pre-fill with user's workplace company name if available
  const handleOpen = (open: boolean) => {
    if (open && userProfile?.workplaceCompanyName && !auditorName) {
      setAuditorName(userProfile.workplaceCompanyName)
    }
    if (!open) {
      // Reset when closing
      setShowResult(false)
      setLastResult(null)
      setAuditorOrgNumber('')
      setAuditorName('')
    }
    setOpen(open)
  }

  const handleStartNewSearch = () => {
    setShowResult(false)
    setLastResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Bulk-søk i BRREG
          </DialogTitle>
          <DialogDescription>
            Søk etter alle selskaper som har registrert ditt revisjonsfirma som revisor i BRREG.
            Dette vil hjelpe deg å identifisere potensielle nye klienter.
          </DialogDescription>
        </DialogHeader>
        
        {showResult && lastResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <h3 className="font-medium text-green-900">Søk fullført!</h3>
                <p className="text-sm text-green-700">
                  {lastResult.message || `Fant ${lastResult.total_found} selskaper, ${lastResult.new_potential_clients} nye potensielle klienter.`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">Totalt funnet</div>
                <div className="text-2xl font-bold text-gray-900">{lastResult.total_found}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">Nye potensielle</div>
                <div className="text-2xl font-bold text-blue-900">{lastResult.new_potential_clients}</div>
              </div>
            </div>

            {lastResult.new_potential_clients === 0 && lastResult.total_found > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700">
                  Alle selskapene som ble funnet eksisterer allerede i systemet.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleStartNewSearch}
              >
                Nytt søk
              </Button>
              <Button 
                type="button" 
                onClick={() => setOpen(false)}
              >
                Lukk
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auditor-org-number">Organisasjonsnummer (revisor)</Label>
              <Input
                id="auditor-org-number"
                placeholder="123456789"
                value={auditorOrgNumber}
                onChange={(e) => setAuditorOrgNumber(e.target.value)}
                pattern="[0-9]{9}"
                maxLength={9}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auditor-name">Navn på revisjonsfirma (valgfritt)</Label>
              <Input
                id="auditor-name"
                placeholder="Revisjonsfirma AS"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={bulkDiscovery.isPending}
              >
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={bulkDiscovery.isPending || !auditorOrgNumber.trim()}
              >
                {bulkDiscovery.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Søker...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Start søk
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}