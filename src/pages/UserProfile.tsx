
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';

const UserProfile = () => {
  const { data: userProfile, isLoading, refetch } = useUserProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    workplaceCompanyName: userProfile?.workplaceCompanyName || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  React.useEffect(() => {
    if (userProfile) {
      setProfileData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        workplaceCompanyName: userProfile.workplaceCompanyName || ''
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          workplace_company_name: profileData.workplaceCompanyName,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast({
        title: "Profil oppdatert",
        description: "Dine profildata er lagret.",
      });

      setIsEditing(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Feil ved lagring",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passord matcher ikke",
        description: "De nye passordene er ikke like.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Passord for kort",
        description: "Passordet må være minst 6 tegn.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Passord endret",
        description: "Ditt passord er oppdatert.",
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Feil ved passordendring",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ConstrainedWidth width="full">
        <StandardPageLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Laster profil...</p>
            </div>
          </div>
        </StandardPageLayout>
      </ConstrainedWidth>
    );
  }

  return (
    <ConstrainedWidth width="full">
      <StandardPageLayout
        header={
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Min profil</h1>
              <p className="text-muted-foreground">
                Administrer dine personlige opplysninger og kontoinnstillinger
              </p>
            </div>
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Tilbake til dashboard
              </Button>
            </Link>
          </div>
        }
      >
        <div className="grid gap-6 max-w-2xl">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personlige opplysninger
              </CardTitle>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  Rediger
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Fornavn</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Etternavn</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                value={userProfile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                E-post kan ikke endres her. Kontakt administrator for endring.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workplace">Arbeidssted</Label>
              <Input
                id="workplace"
                value={profileData.workplaceCompanyName}
                onChange={(e) => setProfileData({ ...profileData, workplaceCompanyName: e.target.value })}
                disabled={!isEditing}
                placeholder="Firmanavn eller organisasjon"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Input
                  value={userProfile?.userRole || ''}
                  disabled
                  className="bg-muted capitalize"
                />
              </div>
              <div className="space-y-2">
                <Label>Ansettelsesdato</Label>
                <Input
                  value={userProfile?.hireDate ? new Date(userProfile.hireDate).toLocaleDateString('nb-NO') : 'Ikke satt'}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Lagrer...' : 'Lagre endringer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setProfileData({
                      firstName: userProfile?.firstName || '',
                      lastName: userProfile?.lastName || '',
                      workplaceCompanyName: userProfile?.workplaceCompanyName || ''
                    });
                  }}
                >
                  Avbryt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Endre passord
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nytt passord</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Skriv inn nytt passord"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekreft nytt passord</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Skriv inn nytt passord igjen"
              />
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={passwordLoading || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full"
            >
              {passwordLoading ? 'Endrer passord...' : 'Endre passord'}
            </Button>
          </CardContent>
        </Card>
      </div>
      </StandardPageLayout>
    </ConstrainedWidth>
  );
};

export default UserProfile;
