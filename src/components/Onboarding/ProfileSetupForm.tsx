import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, UserCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from '@/hooks/use-toast';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Fornavn må være minst 2 tegn'),
  lastName: z.string().min(2, 'Etternavn må være minst 2 tegn'),
  workplaceCompanyName: z.string().min(2, 'Firmanavn må være minst 2 tegn'),
  userRole: z.enum(['employee', 'manager', 'partner', 'admin']),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSetupFormProps {
  onComplete: () => void;
}

const ProfileSetupForm: React.FC<ProfileSetupFormProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      workplaceCompanyName: '',
      userRole: 'employee',
    },
  });

  const steps = [
    {
      number: 1,
      title: "Personlig informasjon",
      description: "Fortell oss litt om deg selv",
      icon: User,
      fields: ['firstName', 'lastName']
    },
    {
      number: 2,
      title: "Arbeidssted",
      description: "Hvor jobber du?",
      icon: Building2,
      fields: ['workplaceCompanyName']
    },
    {
      number: 3,
      title: "Din rolle",
      description: "Hva er din rolle i organisasjonen?",
      icon: UserCheck,
      fields: ['userRole']
    }
  ];

  const roleOptions = [
    { value: 'employee', label: 'Medarbeider', description: 'Utfører revisjonsarbeid' },
    { value: 'manager', label: 'Leder', description: 'Leder revisjonsprosjekter' },
    { value: 'partner', label: 'Partner', description: 'Partner i revisjonsselskap' },
    { value: 'admin', label: 'Administrator', description: 'Systemadministrator' },
  ];

  const canProceedToNextStep = () => {
    const currentStepFields = steps[currentStep - 1].fields;
    const values = form.getValues();
    
    return currentStepFields.every(field => {
      const value = values[field as keyof ProfileFormData];
      return value && value.toString().length >= 2;
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length && canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!session?.user?.id) {
      toast({
        title: "Feil",
        description: "Ingen brukerøkt funnet. Prøv å logge inn på nytt.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          first_name: data.firstName,
          last_name: data.lastName,
          workplace_company_name: data.workplaceCompanyName,
          user_role: data.userRole,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Profil opprettet!",
        description: "Velkommen til AI Revy. Du kan nå begynne å bruke systemet.",
      });

      onComplete();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Feil ved opprettelse",
        description: "Kunne ikke opprette profil. Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepIcon = steps[currentStep - 1].icon;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step.number 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-1 mx-2
                  ${currentStep > step.number ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Badge variant="secondary" className="mb-2">
            Steg {currentStep} av {steps.length}
          </Badge>
        </div>
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <CurrentStepIcon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
          <CardDescription className="text-lg">
            {steps[currentStep - 1].description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornavn</FormLabel>
                        <FormControl>
                          <Input placeholder="Skriv inn ditt fornavn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etternavn</FormLabel>
                        <FormControl>
                          <Input placeholder="Skriv inn ditt etternavn" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Workplace */}
              {currentStep === 2 && (
                <FormField
                  control={form.control}
                  name="workplaceCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firmanavn</FormLabel>
                      <FormControl>
                        <Input placeholder="Navn på ditt revisjonsselskap" {...field} />
                      </FormControl>
                      <FormDescription>
                        Dette hjelper oss å tilpasse opplevelsen til din organisasjon
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Step 3: Role */}
              {currentStep === 3 && (
                <FormField
                  control={form.control}
                  name="userRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Din rolle</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg din rolle" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{role.label}</span>
                                  <span className="text-xs text-muted-foreground">{role.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Vi tilpasser grensesnittet basert på din rolle
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Tilbake
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedToNextStep()}
                  >
                    Neste
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isValid}
                  >
                    {isSubmitting ? 'Oppretter profil...' : 'Fullfør registrering'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetupForm;