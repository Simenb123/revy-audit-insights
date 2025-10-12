
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Package, Receipt, Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from 'react-router-dom';

const DataUploadHub = () => {
  const navigate = useNavigate();
  const { orgNumber } = useParams<{ orgNumber: string }>();

  const dataCategories = [
    {
      id: 'grunnlagsdata',
      title: 'Grunnlagsdata',
      description: 'Kontoplan, Saldobalanse og Hovedbok',
      icon: Database,
      items: [
        'Kontoplan (Chart of Accounts)',
        'Saldobalanse (Trial Balance)', 
        'Hovedbok (General Ledger)'
      ],
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'spesialdata',
      title: 'Spesialdata',
      description: 'Kunde/Leverandørreskontro og Varelager',
      icon: Package,
      items: [
        'Varelagerliste',
        'Kundereskontro (AR)',
        'Leverandørreskontro (AP)'
      ],
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'transaksjoner',
      title: 'Transaksjonsdata',
      description: 'Salgsordre og Fakturaer',
      icon: Receipt,
      items: [
        'Salgsordreliste',
        'Fakturaliste',
        'Betalingshistorikk'
      ],
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'saft',
      title: 'SAF-T Import',
      description: 'Komplett standardisert regnskapsformat',
      icon: Upload,
      items: [
        'SAF-T XML fil',
        'Automatisk parsing',
        'Alle datatyper inkludert'
      ],
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'saft') {
      navigate(`/klienter/${orgNumber}/saft`);
    } else {
      navigate(`/klienter/${orgNumber}/${categoryId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dataopplasting</h1>
        <p className="text-muted-foreground">
          Velg hvilken type regnskapsdata du vil laste opp
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dataCategories.map((category) => (
          <Card
            key={category.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${category.color}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <category.icon className="h-6 w-6" />
                {category.title}
              </CardTitle>
              <CardDescription>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => handleCategoryClick(category.id)}
              >
                Last opp {category.title.toLowerCase()}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-brand-surface/30 border-brand-surface-hover/50">
        <CardHeader>
          <CardTitle className="text-brand-text">Tips for dataopplasting</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-brand-text-muted">
            <li>• Start med grunnlagsdata (kontoplan og saldobalanse)</li>
            <li>• SAF-T filer inneholder alle datatyper automatisk</li>
            <li>• CSV og Excel filer støttes for alle kategorier</li>
            <li>• Data valideres automatisk under opplasting</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataUploadHub;
