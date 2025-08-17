import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, Edit, Trash2, TrendingDown } from 'lucide-react';
import { useAssetManagement } from '@/hooks/useAssetManagement';
import { AssetForm } from './AssetForm';
import { formatCurrency } from '@/lib/utils';

interface AssetsListProps {
  clientId: string;
}

export function AssetsList({ clientId }: AssetsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  
  const { 
    assets, 
    assetsLoading, 
    assetSummary, 
    deleteAsset, 
    generateDepreciation,
    isDeleting 
  } = useAssetManagement(clientId);

  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'disposed': return 'bg-gray-100 text-gray-800';
      case 'impaired': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (showForm) {
    return (
      <AssetForm
        clientId={clientId}
        asset={editingAsset}
        onCancel={handleCloseForm}
        onSuccess={handleCloseForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {assetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{assetSummary.total_assets}</div>
              <p className="text-muted-foreground">Totalt anleggsmidler</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(assetSummary.total_cost)}</div>
              <p className="text-muted-foreground">Total kostpris</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(assetSummary.total_book_value)}</div>
              <p className="text-muted-foreground">Bokført verdi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(assetSummary.total_accumulated_depreciation)}</div>
              <p className="text-muted-foreground">Akkumulerte avskrivninger</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Anleggsmidler
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nytt anleggsmiddel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anleggsnummer</TableHead>
                <TableHead>Navn</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Anskaffelsespris</TableHead>
                <TableHead>Bokført verdi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets?.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.asset_number}</TableCell>
                  <TableCell>{asset.asset_name}</TableCell>
                  <TableCell>{asset.asset_categories?.name || 'Ukategorisert'}</TableCell>
                  <TableCell>{formatCurrency(asset.purchase_price)}</TableCell>
                  <TableCell>{formatCurrency(asset.book_value)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status === 'active' ? 'Aktiv' : 
                       asset.status === 'disposed' ? 'Avhendet' : 'Verdifall'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(asset)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateDepreciation(asset.id)}
                      >
                        <TrendingDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAsset(asset.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}