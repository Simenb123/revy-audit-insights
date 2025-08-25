import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronRight, Search } from 'lucide-react'
import { searchShareholders } from '@/services/shareholders'
import { getUniqueShareClasses } from '@/utils/normalizeClassName'

interface ShareholdersTableProps {
  onCompanySelect: (orgnr: string) => void
}

export const ShareholdersTable: React.FC<ShareholdersTableProps> = ({ onCompanySelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.companies.map((company) => (
                <TableRow key={`${company.orgnr}-${company.year}`}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCompanySelect(company.orgnr)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}