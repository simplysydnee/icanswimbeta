'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Phone, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface FundingSource {
  id: string;
  name: string;
  short_name: string;
  description: string;
  type: string;
}

export default function EnrollmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    paymentType: 'private_pay' as 'private_pay' | 'regional_center',
    selectedFundingSourceId: null as string | null,
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [fundingSourcesLoading, setFundingSourcesLoading] = useState(true);

  useEffect(() => {
    const fetchFundingSources = async () => {
      try {
        const { data, error } = await supabase
          .from('funding_sources')
          .select('id, name, short_name')
          .eq('is_active', true)
          .eq('type', 'regional_center')  // Only show regional centers
          .order('name');

        if (error) throw error;
        setFundingSources(data || []);
      } catch (error) {
        console.error('Error fetching funding sources:', error);
      } finally {
        setFundingSourcesLoading(false);
      }
    };

    fetchFundingSources();
  }, [supabase]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePaymentInfo = () => {
    if (formData.paymentType === 'regional_center') {
      if (!formData.selectedFundingSourceId) {
        toast({
          title: 'Regional Center Required',
          description: 'Please select your Regional Center from the dropdown.',
          variant: 'destructive'
        });
        return false;
      }
      if (!formData.coordinatorName?.trim()) {
        toast({
          title: 'Coordinator Name Required',
          description: 'Please enter your Regional Center coordinator\'s name.',
          variant: 'destructive'
        });
        return false;
      }
      if (!formData.coordinatorEmail?.trim()) {
        toast({
          title: 'Coordinator Email Required',
          description: 'Please enter your Regional Center coordinator\'s email.',
          variant: 'destructive'
        });
        return false;
      }
    }
    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate > today) {
        newErrors.dob = 'Date of birth cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!validatePaymentInfo()) {
      return;
    }

    setIsSubmitting(true);

    // Build query string with basic info
    const queryParams = new URLSearchParams({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dob: formData.dob,
    });

    // Add payment information based on payment method
    if (formData.paymentType === 'private_pay') {
      queryParams.append('paymentType', 'private_pay');
      const targetPath = `/enroll/private?${queryParams.toString()}`;

      if (!user) {
        // Redirect to login first, then back to enrollment
        router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
      } else {
        router.push(targetPath);
      }
    } else if (formData.paymentType === 'regional_center') {
      // For regional center, we need to pass all data
      queryParams.append('paymentType', 'funding_source');
      queryParams.append('selectedFundingSourceId', formData.selectedFundingSourceId || '');
      const selectedSource = fundingSources.find(s => s.id === formData.selectedFundingSourceId);
      if (selectedSource) {
        queryParams.append('fundingSourceName', selectedSource.name);
      }
      queryParams.append('coordinatorName', formData.coordinatorName);
      queryParams.append('coordinatorEmail', formData.coordinatorEmail);
      if (formData.coordinatorPhone) {
        queryParams.append('coordinatorPhone', formData.coordinatorPhone);
      }
      const targetPath = `/enroll/vmrc?${queryParams.toString()}`;

      if (!user) {
        // Redirect to login first, then back to enrollment
        router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
      } else {
        router.push(targetPath);
      }
    }
  };

  const isFormValid = () => {
    const hasBasicInfo = formData.firstName.trim() && formData.lastName.trim() && formData.dob;

    if (!hasBasicInfo) {
      return false;
    }

    if (formData.paymentType === 'regional_center') {
      if (!formData.selectedFundingSourceId || !formData.coordinatorName.trim() || !formData.coordinatorEmail.trim()) {
        return false;
      }
    }

    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="container max-w-md md:max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2a5e84] mb-2">
            Start Your Swim Journey
          </h1>
          <p className="text-gray-700">
            Tell us about your child to get started
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg border-blue-100">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-[#2a5e84]">
              Enrollment Information
            </CardTitle>
            <CardDescription>
              Complete this brief form to begin the enrollment process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Child Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">
                      Child&apos;s First Name *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-red-300' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">
                      Child&apos;s Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-red-300' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-gray-700">
                    Date of Birth *
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange('dob', e.target.value)}
                      className={`pl-10 ${errors.dob ? 'border-red-300' : ''}`}
                    />
                  </div>
                  {errors.dob && (
                    <p className="text-sm text-red-600">{errors.dob}</p>
                  )}
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  How will lessons be paid? <span className="text-red-500">*</span>
                </Label>

                <RadioGroup
                  value={formData.paymentType}
                  onValueChange={(value) => {
                    handleInputChange('paymentType', value as 'private_pay' | 'regional_center');
                    // Clear dependent fields when payment type changes
                    if (value !== 'regional_center') {
                      handleInputChange('selectedFundingSourceId', '');
                      handleInputChange('coordinatorName', '');
                      handleInputChange('coordinatorEmail', '');
                      handleInputChange('coordinatorPhone', '');
                    }
                  }}
                  className="space-y-3"
                >
                  {/* Option 1: Private Pay */}
                  <div
                    className={`flex items-center space-x-3 p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentType === 'private_pay' ? 'border-[#2a5e84] bg-[#f0f7ff]' : 'border-gray-200 hover:border-[#2a5e84]/50 hover:bg-[#f0f7ff]/50'}`}
                  >
                    <RadioGroupItem value="private_pay" id="private_pay" />
                    <Label htmlFor="private_pay" className="cursor-pointer flex-1">
                      <span className="font-medium text-base">Private Pay</span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        I will pay for lessons directly
                      </p>
                    </Label>
                  </div>

                  {/* Option 2: Regional Center */}
                  <div
                    className={`flex items-start space-x-3 p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.paymentType === 'regional_center' ? 'border-[#2a5e84] bg-[#f0f7ff]' : 'border-gray-200 hover:border-[#2a5e84]/50 hover:bg-[#f0f7ff]/50'}`}
                  >
                    <RadioGroupItem value="regional_center" id="regional_center" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="regional_center" className="cursor-pointer">
                        <span className="font-medium text-base">I am a client of a Regional Center</span>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Lessons will be funded through my Regional Center
                        </p>
                      </Label>

                      {/* Funding Source Dropdown - Only shown when Regional Center selected */}
                      {formData.paymentType === 'regional_center' && (
                        <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <Label htmlFor="funding_source_select" className="text-sm font-medium">
                              Select your Regional Center <span className="text-red-500">*</span>
                            </Label>
                            {fundingSourcesLoading ? (
                              <div className="mt-1.5 p-3 border rounded-md bg-gray-50">
                                <p className="text-sm text-gray-700">Loading Regional Centers...</p>
                              </div>
                            ) : fundingSources.length === 0 ? (
                              <div className="mt-1.5 p-3 border rounded-md bg-gray-50">
                                <p className="text-sm text-gray-700">No Regional Centers available</p>
                              </div>
                            ) : (
                              <Select
                                value={formData.selectedFundingSourceId || ''}
                                onValueChange={(value) => handleInputChange('selectedFundingSourceId', value)}
                              >
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue placeholder="Choose your Regional Center..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {fundingSources.map((source) => (
                                    <SelectItem key={source.id} value={source.id}>
                                      {source.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* Coordinator Information */}
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="coordinatorName" className="text-sm font-medium">
                                Coordinator Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="coordinatorName"
                                placeholder="Coordinator's full name"
                                value={formData.coordinatorName}
                                onChange={(e) => handleInputChange('coordinatorName', e.target.value)}
                                className="mt-1.5"
                              />
                            </div>

                            <div>
                              <Label htmlFor="coordinatorEmail" className="text-sm font-medium">
                                Coordinator Email <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="coordinatorEmail"
                                type="email"
                                placeholder="coordinator@regionalcenter.org"
                                value={formData.coordinatorEmail}
                                onChange={(e) => handleInputChange('coordinatorEmail', e.target.value)}
                                className="mt-1.5"
                              />
                            </div>

                            <div>
                              <Label htmlFor="coordinatorPhone" className="text-sm font-medium">
                                Coordinator Phone (Optional)
                              </Label>
                              <Input
                                id="coordinatorPhone"
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={formData.coordinatorPhone}
                                onChange={(e) => handleInputChange('coordinatorPhone', e.target.value)}
                                className="mt-1.5"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </RadioGroup>

                {errors.paymentType && (
                  <p className="text-sm text-red-600">{errors.paymentType}</p>
                )}
                {errors.selectedFundingSourceId && (
                  <p className="text-sm text-red-600">{errors.selectedFundingSourceId}</p>
                )}
              </div>

              {/* Continue Button */}
              <Button
                type="submit"
                className="w-full bg-[#2a5e84] hover:bg-[#1e4665] text-white py-3 text-base"
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? 'Continuing...' : 'Continue'}
              </Button>
            </form>

            {/* Bottom Links */}
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
              <div className="text-center">
                <p className="text-gray-700 text-sm">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    className="text-[#2a5e84] hover:text-[#1e4665] font-medium"
                  >
                    Sign in here
                  </a>
                </p>
              </div>

              <Alert className="bg-[#f0f7ff] border-[#2a5e84]/20">
                <AlertDescription className="text-[#2a5e84] text-sm">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Questions? Call (209) 778-7877</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email info@icanswim209.com</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="text-center text-xs text-gray-600">
                <p>
                  I Can Swim provides adaptive swim lessons for swimmers with special needs
                </p>
                <p className="mt-1">
                  Modesto: 1212 Kansas Ave
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}