import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, Eye, EyeOff } from 'lucide-react'
import { getCompanyShareholders, exportShareholdersToCSV } from '@/services/shareholders'
import { getUniqueShareClasses } from '@/utils/normalizeClassName'
import type { ShareHolding, ShareEntity } from '@/types/shareholders'

interface ShareholdersPivotTableProps {
  companyOrgnr: string
  companyName: string
  year: number
  totalShares: number
  onClose: () => void
}

export const ShareholdersPivotTable: React.FC<ShareholdersPivotTableProps> = ({
  companyOrgnr,
  companyName,
  year,
  totalShares,
  onClose
}) => {
  const [showAll, setShowAll] = useState(false)
  const TOP_N = 50

  const { data: shareholders, isLoading } = useQuery({
    queryKey: ['company-shareholders', companyOrgnr, year],
    queryFn: () => getCompanyShareholders(companyOrgnr, year)
  })

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={100} className="text-center py-4">
          Laster aksjonærer...
        </TableCell>
      </TableRow>
    )
  }

  if (!shareholders || shareholders.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={100} className="text-center py-4 text-muted-foreground">
          Ingen aksjonærer funnet
        </TableCell>
      </TableRow>
    )
  }

  // Grupper aksjer per aksjonær og aksjeklasse
  const shareholderGroups = new Map<string, {
    entity: ShareEntity
    holdings: Record<string, number>
    totalShares: number
  }>()

  shareholders.forEach(holding => {
    const key = holding.share_entities.id
    if (!shareholderGroups.has(key)) {
      shareholderGroups.set(key, {
        entity: holding.share_entities,
        holdings: {},
        totalShares: 0
      })
    }
    
    const group = shareholderGroups.get(key)!
    group.holdings[holding.share_class] = (group.holdings[holding.share_class] || 0) + holding.shares
    group.totalShares += holding.shares
  })

  const groupedShareholders = Array.from(shareholderGroups.values())
    .sort((a, b) => b.totalShares - a.totalShares)

  const displayedShareholders = showAll 
    ? groupedShareholders 
    : groupedShareholders.slice(0, TOP_N)

  const uniqueClasses = getUniqueShareClasses(
    groupedShareholders.map(g => ({ share_classes: g.holdings }))
  )

  const handleExport = () => {
    // Konverter tilbake til det formatet som exportShareholdersToCSV forventer
    const exportData: Array<ShareHolding & { share_entities: ShareEntity }> = []
    
    groupedShareholders.forEach(group => {
      Object.entries(group.holdings).forEach(([shareClass, shares]) => {
        exportData.push({
          id: '', // Not used in export
          company_orgnr: companyOrgnr,
          holder_id: group.entity.id,
          share_class: shareClass,
          shares,
          year,
          user_id: '', // Not used in export
          created_at: '',
          share_entities: group.entity
        })
      })
    })

    exportShareholdersToCSV(exportData, companyName)
  }

  return (
    <>
      {/* Header rad med kontroller */}
      <TableRow className="bg-muted/50">
        <TableCell colSpan={100} className="py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                Aksjonærer i {companyName} ({groupedShareholders.length} totalt)
              </span>
              {groupedShareholders.length > TOP_N && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Vis færre ({TOP_N})
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Vis alle ({groupedShareholders.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Eksporter CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Lukk
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>

      {/* Header for pivot-tabell */}
      <TableRow className="bg-muted/30">
        <TableCell className="font-semibold">Navn</TableCell>
        <TableCell className="font-semibold">Org/Født</TableCell>
        <TableCell className="font-semibold">Type</TableCell>
        <TableCell className="font-semibold">Land</TableCell>
        <TableCell className="font-semibold">Sum</TableCell>
        {uniqueClasses.map(cls => (
          <TableCell key={cls} className="font-semibold">{cls}</TableCell>
        ))}
        <TableCell className="font-semibold">Andel %</TableCell>
      </TableRow>

      {/* Aksjonær-rader */}
      {displayedShareholders.map((group) => {
        const percentage = totalShares > 0 ? (group.totalShares / totalShares) * 100 : 0
        
        return (
          <TableRow key={group.entity.id} className="bg-background">
            <TableCell>{group.entity.name}</TableCell>
            <TableCell>
              {group.entity.orgnr || group.entity.birth_year?.toString() || '-'}
            </TableCell>
            <TableCell>
              {group.entity.entity_type === 'company' ? 'Selskap' : 'Person'}
            </TableCell>
            <TableCell>{group.entity.country_code || 'NO'}</TableCell>
            <TableCell className="font-medium">
              {group.totalShares.toLocaleString()}
            </TableCell>
            {uniqueClasses.map(cls => (
              <TableCell key={cls}>
                {group.holdings[cls]?.toLocaleString() || '-'}
              </TableCell>
            ))}
            <TableCell className="font-medium">
              {percentage.toFixed(2)}%
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}