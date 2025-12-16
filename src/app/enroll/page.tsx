'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Phone, Mail, CreditCard, Building } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FundingSource {
  id: string;
  name: string;
  short_name: string;
  description: string;
}

export default function EnrollmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    paymentType: '', // 'private_pay', 'funding_source'
    fundingSourceId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loadingFundingSources, setLoadingFundingSources] = useState(true);

  useEffect(() => {
    const fetchFundingSources = async () => {
      try {
        const { data, error } = await supabase
          .from('funding_sources')
          .select('id, name, short_name, description')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setFundingSources(data || []);
      } catch (error) {
        console.error('Error fetching funding sources:', error);
      } finally {
        setLoadingFundingSources(false);
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

    if (!formData.paymentType) {
      newErrors.paymentType = 'Please select how lessons will be paid for';
    } else if (formData.paymentType === 'funding_source' && !formData.fundingSourceId) {
      newErrors.fundingSourceId = 'Please select a funding source';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Build query string
    const queryParams = new URLSearchParams({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dob: formData.dob,
      paymentType: formData.paymentType,
    });

    // Add additional parameters based on payment type
    if (formData.paymentType === 'funding_source') {
      queryParams.append('fundingSourceId', formData.fundingSourceId);
      const selectedSource = fundingSources.find(s => s.id === formData.fundingSourceId);
      if (selectedSource) {
        queryParams.append('fundingSourceName', selectedSource.name);
      }
    }

    // Navigate based on payment type
    if (formData.paymentType === 'private_pay') {
      router.push(`/enroll/private?${queryParams.toString()}`);
    } else if (formData.paymentType === 'funding_source') {
      router.push(`/enroll/vmrc?${queryParams.toString()}`);
    }
  };

  const isFormValid = () => {
    const hasBasicInfo = formData.firstName.trim() && formData.lastName.trim() && formData.dob;

    if (!hasBasicInfo || !formData.paymentType) {
      return false;
    }

    if (formData.paymentType === 'funding_source' && !formData.fundingSourceId) {
      return false;
    }

    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="container max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2a5e84] mb-2">
            Start Your Swim Journey
          </h1>
          <p className="text-gray-600">
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
                    <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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

              {/* Payment/Funding Selection */}
              <div className="space-y-4">
                <Label className="text-gray-700 text-base font-semibold">
                  How will swim lessons be paid for? *
                </Label>

                <RadioGroup
                  value={formData.paymentType}
                  onValueChange={(value) => {
                    handleInputChange('paymentType', value);
                    // Clear dependent fields when payment type changes
                    if (value !== 'funding_source') {
                      handleInputChange('fundingSourceId', '');
                    }
                  }}
                  className="space-y-3"
                >
                  {/* Private Pay Option */}
                  <div className={`flex items-start space-x-3 p-4 rounded-lg border ${formData.paymentType === 'private_pay' ? 'border-[#2a5e84]/30 bg-[#f0f7ff]' : 'border-gray-200'}`}>
                    <RadioGroupItem value="private_pay" id="private_pay" />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <Label htmlFor="private_pay" className="font-medium text-gray-900 cursor-pointer">
                          Private Pay
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600">
                        I will pay for lessons out of pocket ($75 per lesson)
                      </p>
                    </div>
                  </div>

                  {/* Funding Source Options */}
                  {loadingFundingSources ? (
                    <div className="p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Loading funding sources...</p>
                    </div>
                  ) : fundingSources.length > 0 ? (
                    <div className="space-y-3">
                      {fundingSources.map((source) => (
                        <div
                          key={source.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border ${formData.paymentType === 'funding_source' && formData.fundingSourceId === source.id ? 'border-[#2a5e84]/30 bg-[#f0f7ff]' : 'border-gray-200'}`}
                          onClick={() => {
                            handleInputChange('paymentType', 'funding_source');
                            handleInputChange('fundingSourceId', source.id);
                          }}
                        >
                          <RadioGroupItem
                            value="funding_source"
                            id={`source_${source.id}`}
                            checked={formData.paymentType === 'funding_source' && formData.fundingSourceId === source.id}
                            onChange={() => {
                              handleInputChange('paymentType', 'funding_source');
                              handleInputChange('fundingSourceId', source.id);
                            }}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-600" />
                              <Label htmlFor={`source_${source.id}`} className="font-medium text-gray-900 cursor-pointer">
                                {source.name} ({source.short_name})
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600">
                              {source.description || 'State-funded swim lessons through regional center'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">No funding sources available</p>
                    </div>
                  )}

                </RadioGroup>

                {errors.paymentType && (
                  <p className="text-sm text-red-600">{errors.paymentType}</p>
                )}
                {errors.fundingSourceId && (
                  <p className="text-sm text-red-600">{errors.fundingSourceId}</p>
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
                <p className="text-gray-600 text-sm">
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

              <div className="text-center text-xs text-gray-500">
                <p>
                  I Can Swim provides adaptive swim lessons for swimmers with special needs
                </p>
                <p className="mt-1">
                  Turlock: 2705 Sebastian Drive • Modesto: 1212 Kansas Ave
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}