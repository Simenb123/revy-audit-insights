import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronRight, Search, ChevronDown } from 'lucide-react'
import { searchShareholders } from '@/services/shareholders'
import { getUniqueShareClasses } from '@/utils/normalizeClassName'
import { ShareholdersPivotTable } from './ShareholdersPivotTable'

interface ShareholdersTableProps {
  onCompanySelect: (orgnr: string) => void
}

export const ShareholdersTable: React.FC<ShareholdersTableProps> = ({ onCompanySelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['shareholders-search', debouncedQuery],
    queryFn: () => searchShareholders(debouncedQuery),
    enabled: debouncedQuery.length >= 2
  })

  const uniqueClasses = useMemo(() => {
    return getUniqueShareClasses(searchResults?.companies || [])
  }, [searchResults])

  const handleRowClick = (company: any) => {
    const key = `${company.orgnr}-${company.year}`
    if (expandedCompany === key) {
      setExpandedCompany(null)
    } else {
      setExpandedCompany(key)
    }
  }

  const handleGraphClick = (orgnr: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onCompanySelect(orgnr)
  }

  if (!searchResults || debouncedQuery.length < 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter selskap eller organisasjonsnummer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-center text-muted-foreground py-8">
          Skriv minst 2 tegn for å søke
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter selskap eller organisasjonsnummer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Søker...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Navn</TableHead>
                <TableHead>Orgnr</TableHead>
                <TableHead>Tot. aksjer</TableHead>
                <TableHead>Sum</TableHead>
                {uniqueClasses.map(cls => (
                  <TableHead key={cls}>{cls}</TableHead>
                ))}
                <TableHead>År</TableHead>
                <TableHead className="w-[80px]">Graf</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.companies.map((company) => {
                const key = `${company.orgnr}-${company.year}`
                const isExpanded = expandedCompany === key
                
                return (
                  <React.Fragment key={key}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(company)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.orgnr}</TableCell>
                      <TableCell>{company.total_shares.toLocaleString()}</TableCell>
                      <TableCell>{company.calculated_total.toLocaleString()}</TableCell>
                      {uniqueClasses.map(cls => (
                        <TableCell key={cls}>
                          {company.share_classes[cls]?.toLocaleString() || '-'}
                        </TableCell>
                      ))}
                      <TableCell>{company.year}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleGraphClick(company.orgnr, e)}
                        >
                          Vis
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <ShareholdersPivotTable
                        companyOrgnr={company.orgnr}
                        companyName={company.name}
                        year={company.year}
                        totalShares={company.total_shares}
                        onClose={() => setExpandedCompany(null)}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}