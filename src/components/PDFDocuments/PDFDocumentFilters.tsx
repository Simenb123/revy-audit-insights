
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Star, Filter } from 'lucide-react';

interface PDFDocumentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (value: boolean) => void;
}

const PDFDocumentFilters = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  favoritesOnly,
  setFavoritesOnly,
}: PDFDocumentFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Søk i dokumenter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-48">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Alle kategorier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle kategorier</SelectItem>
          <SelectItem value="isa">ISA Standarder</SelectItem>
          <SelectItem value="regnskapsstandarder">Regnskapsstandarder</SelectItem>
          <SelectItem value="laws">Lover og forskrifter</SelectItem>
          <SelectItem value="internal">Interne retningslinjer</SelectItem>
          <SelectItem value="other">Andre dokumenter</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        variant={favoritesOnly ? "default" : "outline"}
        onClick={() => setFavoritesOnly(!favoritesOnly)}
        className="flex items-center gap-2"
      >
        <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
        Favoritter
      </Button>
    </div>
  );
};

export default PDFDocumentFilters;
