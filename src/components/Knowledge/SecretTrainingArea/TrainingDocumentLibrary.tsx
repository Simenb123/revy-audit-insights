
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface TrainingDocument {
  id: string;
  fileName: string;
  documentType: string;
  systemSource: string;
  uploadDate: string;
  fileSize: number;
  successRate: number;
  analysisCount: number;
  description?: string;
  status: 'active' | 'archived' | 'processing';
}

const TrainingDocumentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSystem, setFilterSystem] = useState('');

  // Mock data - would come from database
  const trainingDocuments: TrainingDocument[] = [
    {
      id: '1',
      fileName: 'visma_hovedbok_eksempel.xlsx',
      documentType: 'hovedbok',
      systemSource: 'visma_business',
      uploadDate: '2024-01-15',
      fileSize: 2.5,
      successRate: 95,
      analysisCount: 23,
      description: 'Standard Visma Business hovedbokeksport',
      status: 'active'
    },
    {
      id: '2', 
      fileName: 'poweroffice_saldobalanse.csv',
      documentType: 'saldobalanse',
      systemSource: 'poweroffice',
      uploadDate: '2024-01-12',
      fileSize: 1.2,
      successRate: 87,
      analysisCount: 15,
      description: 'PowerOffice saldobalanse med tilleggsinformasjon',
      status: 'active'
    },
    {
      id: '3',
      fileName: 'tripletex_resultat_standard.pdf',
      documentType: 'resultat',
      systemSource: 'tripletex',
      uploadDate: '2024-01-10',
      fileSize: 0.8,
      successRate: 92,
      analysisCount: 31,
      description: 'Standard Tripletex resultatrapport',
      status: 'active'
    },
    {
      id: '4',
      fileName: 'fiken_kontoplan_mal.xlsx',
      documentType: 'kontoplaner',
      systemSource: 'fiken',
      uploadDate: '2024-01-08',
      fileSize: 0.3,
      successRate: 78,
      analysisCount: 8,
      description: 'Fiken standard kontoplan med mappinger',
      status: 'processing'
    }
  ];

  const filteredDocuments = trainingDocuments.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || doc.documentType === filterType;
    const matchesSystem = !filterSystem || doc.systemSource === filterSystem;
    
    return matchesSearch && matchesType && matchesSystem;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totalt dokumenter</p>
                <p className="text-2xl font-bold">{trainingDocuments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gjennomsnittlig suksess</p>
                <p className="text-2xl font-bold">
                  {Math.round(trainingDocuments.reduce((acc, doc) => acc + doc.successRate, 0) / trainingDocuments.length)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale analyser</p>
                <p className="text-2xl font-bold">
                  {trainingDocuments.reduce((acc, doc) => acc + doc.analysisCount, 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Treningsdokument-bibliotek</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Søk i dokumenter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType || "all"} onValueChange={(value) => setFilterType(value === "all" ? "" : value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Dokumenttype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle typer</SelectItem>
                <SelectItem value="hovedbok">Hovedbok</SelectItem>
                <SelectItem value="saldobalanse">Saldobalanse</SelectItem>
                <SelectItem value="resultat">Resultat</SelectItem>
                <SelectItem value="kontoplaner">Kontoplaner</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSystem || "all"} onValueChange={(value) => setFilterSystem(value === "all" ? "" : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="System" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle systemer</SelectItem>
                <SelectItem value="visma_business">Visma Business</SelectItem>
                <SelectItem value="poweroffice">PowerOffice</SelectItem>
                <SelectItem value="tripletex">Tripletex</SelectItem>
                <SelectItem value="fiken">Fiken</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <h4 className="font-medium">{doc.fileName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {doc.documentType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {doc.systemSource}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </Badge>
                    </div>
                    
                    {doc.description && (
                      <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.uploadDate).toLocaleDateString('nb-NO')}
                      </span>
                      <span>{doc.fileSize} MB</span>
                      <span className={`font-medium ${getSuccessRateColor(doc.successRate)}`}>
                        {doc.successRate}% suksess
                      </span>
                      <span>{doc.analysisCount} analyser</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" title="Forhåndsvis">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Last ned">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" title="Slett">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Ingen treningsdokumenter funnet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingDocumentLibrary;
