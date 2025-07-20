import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Database, Loader2 } from 'lucide-react'
import { useBulkDiscovery } from '@/hooks/usePotentialClients'
import { useUserProfile } from '@/hooks/useUserProfile'

interface BulkDiscoveryDialogProps {
  children: React.ReactNode
}

export function BulkDiscoveryDialog({ children }: BulkDiscoveryDialogProps) {
  const [open, setOpen] = useState(false)
  const [auditorOrgNumber, setAuditorOrgNumber] = useState('')
  const [auditorName, setAuditorName] = useState('')
  
  const { data: userProfile } = useUserProfile()
  const bulkDiscovery = useBulkDiscovery()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auditorOrgNumber.trim()) return

    try {
      await bulkDiscovery.mutateAsync({
        auditorOrgNumber: auditorOrgNumber.trim(),
        auditorName: auditorName.trim() || undefined
      })
      setOpen(false)
      setAuditorOrgNumber('')
      setAuditorName('')
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  // Pre-fill with user's workplace company name if available
  const handleOpen = (open: boolean) => {
    if (open && userProfile?.workplaceCompanyName && !auditorName) {
      setAuditorName(userProfile.workplaceCompanyName)
    }
    setOpen(open)
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
      </DialogContent>
    </Dialog>
  )
}