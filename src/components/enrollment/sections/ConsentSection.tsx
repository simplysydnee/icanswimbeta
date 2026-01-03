'use client';

import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LiabilityWaiverModal, CancellationPolicyModal } from '@/components/enrollment';
import { EnrollmentFormData } from '../schemas/enrollmentSchema';

export function ConsentSection() {
  const { control, setValue, watch } = useFormContext<EnrollmentFormData>();
  const electronicConsent = watch('electronic_consent');
  const signedWaiver = watch('signed_waiver');
  const photoRelease = watch('photo_release');
  const cancellationPolicyAgreement = watch('cancellation_policy_agreement');

  // Capture signature metadata
  const captureSignatureMetadata = () => {
    setValue('signature_timestamp', new Date().toISOString());
    setValue('signature_user_agent', navigator.userAgent);
    // IP address will be captured server-side via API
  };

  return (
    <div className="space-y-8">
      {/* Electronic Consent */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Electronic Signature Consent *</Label>
          <HelpTooltip content="Under the ESIGN Act, you must consent to using electronic signatures for legal documents." />
        </div>

        <FormField
          control={control}
          name="electronic_consent"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="electronic-consent"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) {
                      captureSignatureMetadata();
                    }
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="electronic-consent" className="font-normal">
                    I consent to using electronic signatures for all documents in this enrollment process
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    By checking this box, you agree that your electronic signature has the same legal effect as a handwritten signature.
                  </p>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Liability Waiver */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Liability Waiver *</Label>
            <HelpTooltip content="Required for all participants. Please read the full waiver before agreeing." />
          </div>
          <LiabilityWaiverModal>
            <Button
              type="button"
              variant="outline"
              size="sm"
            >
              View Waiver
            </Button>
          </LiabilityWaiverModal>
        </div>

        <FormField
          control={control}
          name="signed_waiver"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="signed-waiver"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="signed-waiver" className="font-normal">
                    I have read and agree to the liability waiver
                  </Label>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {signedWaiver && (
          <FormField
            control={control}
            name="liability_waiver_signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signature *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Type your full name as signature"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      captureSignatureMetadata();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Photo Release */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Photo Release</Label>
          <HelpTooltip content="Optional. Allows us to use photos/videos for marketing, training, and social media." />
        </div>

        <FormField
          control={control}
          name="photo_release"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="photo-release"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="photo-release" className="font-normal">
                    I grant permission for photos/videos to be used for marketing and training purposes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    You may revoke this permission at any time by contacting us.
                  </p>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {photoRelease && (
          <FormField
            control={control}
            name="photo_release_signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signature</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Type your full name as signature"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      captureSignatureMetadata();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Cancellation Policy */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Cancellation Policy *</Label>
            <HelpTooltip content="Please review our cancellation policy before agreeing." />
          </div>
          <CancellationPolicyModal>
            <Button
              type="button"
              variant="outline"
              size="sm"
            >
              View Policy
            </Button>
          </CancellationPolicyModal>
        </div>

        <FormField
          control={control}
          name="cancellation_policy_agreement"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="cancellation-policy"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="cancellation-policy" className="font-normal">
                    I have read and agree to the cancellation policy
                  </Label>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {cancellationPolicyAgreement && (
          <FormField
            control={control}
            name="cancellation_policy_signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signature *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Type your full name as signature"
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      captureSignatureMetadata();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Emergency Contact */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Emergency Contact Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Full name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="emergency_contact_relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Parent, guardian, relative, etc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="emergency_contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Phone *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="(123) 456-7890" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}