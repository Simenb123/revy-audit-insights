import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Hash, Package, MapPin, User, Calendar as CalendarIcon } from 'lucide-react';
import { useAssetManagement } from '@/hooks/useAssetManagement';

const assetSchema = z.object({
  asset_number: z.string().min(1, 'Anleggsnummer er påkrevd'),
  asset_name: z.string().min(1, 'Anleggsnavn er påkrevd'),
  description: z.string().optional(),
  purchase_date: z.string().min(1, 'Anskaffelsesdato er påkrevd'),
  purchase_price: z.number().positive('Anskaffelsespris må være positiv'),
  salvage_value: z.number().min(0).optional(),
  useful_life_years: z.number().positive('Levetid må være positiv'),
  depreciation_method: z.string().optional(),
  asset_category_id: z.string().optional(),
  location: z.string().optional(),
  serial_number: z.string().optional(),
  vendor: z.string().optional(),
  warranty_expiry_date: z.string().optional()
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
  clientId: string;
  asset?: any;
  onCancel: () => void;
  onSuccess: () => void;
}

export function AssetForm({ clientId, asset, onCancel, onSuccess }: AssetFormProps) {
  const { 
    assetCategories, 
    createAsset, 
    updateAsset, 
    isCreating, 
    isUpdating 
  } = useAssetManagement(clientId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: asset ? {
      asset_number: asset.asset_number,
      asset_name: asset.asset_name,
      description: asset.description || '',
      purchase_date: asset.purchase_date,
      purchase_price: asset.purchase_price,
      salvage_value: asset.salvage_value || 0,
      useful_life_years: asset.useful_life_years,
      depreciation_method: asset.depreciation_method || 'straight_line',
      asset_category_id: asset.asset_category_id || '',
      location: asset.location || '',
      serial_number: asset.serial_number || '',
      vendor: asset.vendor || '',
      warranty_expiry_date: asset.warranty_expiry_date || ''
    } : {
      depreciation_method: 'straight_line',
      salvage_value: 0
    }
  });

  const onSubmit = (data: AssetFormData) => {
    if (asset) {
      updateAsset({ 
        id: asset.id, 
        asset_number: data.asset_number,
        asset_name: data.asset_name,
        description: data.description,
        purchase_date: data.purchase_date,
        purchase_price: data.purchase_price,
        salvage_value: data.salvage_value,
        useful_life_years: data.useful_life_years,
        depreciation_method: data.depreciation_method,
        asset_category_id: data.asset_category_id,
        location: data.location,
        serial_number: data.serial_number,
        vendor: data.vendor,
        warranty_expiry_date: data.warranty_expiry_date
      });
    } else {
      createAsset({
        asset_number: data.asset_number,
        asset_name: data.asset_name,
        description: data.description,
        purchase_date: data.purchase_date,
        purchase_price: data.purchase_price,
        salvage_value: data.salvage_value,
        useful_life_years: data.useful_life_years,
        depreciation_method: data.depreciation_method,
        asset_category_id: data.asset_category_id,
        location: data.location,
        serial_number: data.serial_number,
        vendor: data.vendor,
        warranty_expiry_date: data.warranty_expiry_date
      });
    }
    onSuccess();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {asset ? 'Rediger anleggsmiddel' : 'Nytt anleggsmiddel'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_number" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Anleggsnummer
              </Label>
              <Input
                id="asset_number"
                {...register('asset_number')}
                placeholder="A001"
                className={errors.asset_number ? 'border-destructive' : ''}
              />
              {errors.asset_number && (
                <p className="text-sm text-destructive">{errors.asset_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_name">Anleggsnavn</Label>
              <Input
                id="asset_name"
                {...register('asset_name')}
                placeholder="Kontorstol"
                className={errors.asset_name ? 'border-destructive' : ''}
              />
              {errors.asset_name && (
                <p className="text-sm text-destructive">{errors.asset_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detaljert beskrivelse av anleggsmiddelet"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_category_id">Kategori</Label>
              <Select
                value={watch('asset_category_id')}
                onValueChange={(value) => setValue('asset_category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {assetCategories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Anskaffelsesdato
              </Label>
              <Input
                id="purchase_date"
                type="date"
                {...register('purchase_date')}
                className={errors.purchase_date ? 'border-destructive' : ''}
              />
              {errors.purchase_date && (
                <p className="text-sm text-destructive">{errors.purchase_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Anskaffelsespris (NOK)
              </Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                {...register('purchase_price', { valueAsNumber: true })}
                placeholder="50000.00"
                className={errors.purchase_price ? 'border-destructive' : ''}
              />
              {errors.purchase_price && (
                <p className="text-sm text-destructive">{errors.purchase_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salvage_value">Restverdi (NOK)</Label>
              <Input
                id="salvage_value"
                type="number"
                step="0.01"
                {...register('salvage_value', { valueAsNumber: true })}
                placeholder="5000.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="useful_life_years">Levetid (år)</Label>
              <Input
                id="useful_life_years"
                type="number"
                {...register('useful_life_years', { valueAsNumber: true })}
                placeholder="5"
                className={errors.useful_life_years ? 'border-destructive' : ''}
              />
              {errors.useful_life_years && (
                <p className="text-sm text-destructive">{errors.useful_life_years.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="depreciation_method">Avskrivningsmetode</Label>
              <Select
                value={watch('depreciation_method')}
                onValueChange={(value) => setValue('depreciation_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight_line">Lineær avskrivning</SelectItem>
                  <SelectItem value="declining_balance">Degressiv avskrivning</SelectItem>
                  <SelectItem value="sum_of_years">Årsummetall</SelectItem>
                  <SelectItem value="units_of_production">Produksjonsenhet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasjon
              </Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Kontor 2. etasje"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serienummer</Label>
              <Input
                id="serial_number"
                {...register('serial_number')}
                placeholder="SN123456789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Leverandør
              </Label>
              <Input
                id="vendor"
                {...register('vendor')}
                placeholder="IKEA AS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry_date">Garantiutløp</Label>
              <Input
                id="warranty_expiry_date"
                type="date"
                {...register('warranty_expiry_date')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isCreating || isUpdating}
            >
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Lagrer...' : asset ? 'Oppdater' : 'Opprett'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}