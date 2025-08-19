import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
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

  const assetColumns: StandardDataTableColumn<any>[] = [
    {
      key: 'asset_number',
      header: 'Anleggsnummer',
      accessor: 'asset_number',
      sortable: true,
      searchable: true,
      format: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'asset_name',
      header: 'Navn',
      accessor: 'asset_name',
      sortable: true,
      searchable: true
    },
    {
      key: 'category',
      header: 'Kategori',
      accessor: (asset) => asset.asset_categories?.name || 'Ukategorisert',
      sortable: true,
      searchable: true
    },
    {
      key: 'purchase_price',
      header: 'Anskaffelsespris',
      accessor: 'purchase_price',
      sortable: true,
      align: 'right',
      format: (value) => formatCurrency(value)
    },
    {
      key: 'book_value',
      header: 'Bokført verdi',
      accessor: 'book_value',
      sortable: true,
      align: 'right',
      format: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      format: (value) => (
        <Badge className={getStatusColor(value)}>
          {value === 'active' ? 'Aktiv' : value === 'disposed' ? 'Avhendet' : 'Verdifall'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: () => '',
      format: (_, asset) => (
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
      )
    }
  ];

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

      <StandardDataTable
        title="Anleggsmidler"
        description="Oversikt over alle anleggsmidler"
        data={assets || []}
        columns={assetColumns}
        isLoading={assetsLoading}
        tableName="assets-list"
        exportFileName="anleggsmidler"
        icon={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt anleggsmiddel
          </Button>
        }
        wrapInCard={false}
      />
    </div>
  );
}