'use client';

import { useEffect, useState } from 'react';
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
  const { control, setValue, watch, formState } = useFormContext<EnrollmentFormData>();
  const [quizQ1, setQuizQ1] = useState<string | null>(null);
  const [quizQ2, setQuizQ2] = useState<string | null>(null);

  useEffect(() => {
    // Don't trigger validation here — that would mark every required consent
    // field as invalid on mount. Validation happens on submit (or when the
    // user interacts with each field directly).
    const passed = quizQ1 === '24' && quizQ2 === 'drop';
    setValue('cancellation_quiz_passed', passed);
  }, [quizQ1, quizQ2, setValue]);
  const electronicConsent = watch('electronic_consent');
  const signedWaiver = watch('signed_waiver');
  const photoRelease = watch('photo_release');
  const cancellationPolicyAgreement = watch('cancellation_policy_agreement');
  const termsOfServiceAgreed = watch('terms_of_service_agreed');
  const privacyPolicyAgreed = watch('privacy_policy_agreed');
  const quizError = formState.errors.cancellation_quiz_passed?.message as string | undefined;

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

      {/* Terms of Service */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Terms of Service *</Label>
            <HelpTooltip content="Please review the Terms of Service before agreeing." />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement Terms of Service modal
              alert('Terms of Service modal would open here');
            }}
          >
            View Terms
          </Button>
        </div>

        <FormField
          control={control}
          name="terms_of_service_agreed"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms-of-service"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms-of-service" className="font-normal">
                    I have read and agree to the Terms of Service
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    I Can Swim LLC Terms of Service: 1. You must be 18+ and a parent/legal guardian of any enrolled child. 2. Enrollment requires completion of all forms including medical/behavioral info and execution of liability waiver, photo release, and cancellation policy. 3. Cancellations made at least 24 hours before a session will not incur penalty. Late cancellations may affect scheduling priority. 4. For VMRC/CVRC swimmers, all bookings require an active approved Purchase Order. 5. You agree to disclose all medical, behavioral, and safety information and update it promptly.
                  </p>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {termsOfServiceAgreed && (
          <FormField
            control={control}
            name="terms_of_service_signature"
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

      {/* Cancellation Policy Quiz */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Cancellation Policy Quiz *</Label>
          <HelpTooltip content="Please answer these questions to confirm you understand the cancellation policy." />
        </div>

        <div className="space-y-4 p-4 border rounded-md">
          <div>
            <p className="font-medium mb-2">Q1: How far in advance must you cancel a session?</p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancellation_quiz_q1"
                  value="12"
                  checked={quizQ1 === '12'}
                  className="mr-2"
                  onChange={() => setQuizQ1('12')}
                />
                <span>12 hours</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancellation_quiz_q1"
                  value="24"
                  checked={quizQ1 === '24'}
                  className="mr-2"
                  onChange={() => setQuizQ1('24')}
                />
                <span>24 hours ✓</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancellation_quiz_q1"
                  value="48"
                  checked={quizQ1 === '48'}
                  className="mr-2"
                  onChange={() => setQuizQ1('48')}
                />
                <span>48 hours</span>
              </label>
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Q2: What happens if you cancel with less than 24 hours notice?</p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancellation_quiz_q2"
                  value="nothing"
                  checked={quizQ2 === 'nothing'}
                  className="mr-2"
                  onChange={() => setQuizQ2('nothing')}
                />
                <span>Nothing, it is fine</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancellation_quiz_q2"
                  value="warning"
                  checked={quizQ2 === 'warning'}
                  className="mr-2"
                  onChange={() => setQuizQ2('warning')}
                />
                <span>I receive a warning only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="cancellation_quiz_q2"
                  value="drop"
                  checked={quizQ2 === 'drop'}
                  className="mr-2"
                  onChange={() => setQuizQ2('drop')}
                />
                <span>My swimmer may be subject to being dropped from the program ✓</span>
              </label>
            </div>
          </div>
        </div>

        {quizError && (
          <p
            data-field="cancellation_quiz_passed"
            className="text-sm font-medium text-destructive"
          >
            {quizError}
          </p>
        )}

        <div className="space-y-3">
          <FormField
            control={control}
            name="cancellation_acknowledged_24hr"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="cancellation-24hr"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="cancellation-24hr" className="font-normal">
                      I understand I must cancel at least 24 hours in advance
                    </Label>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="cancellation_acknowledged_consequences"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="cancellation-consequences"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="cancellation-consequences" className="font-normal">
                      I understand that late cancellations may result in my swimmer being subject to being dropped from the program
                    </Label>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">Privacy Policy *</Label>
            <HelpTooltip content="Please review the Privacy Policy before agreeing." />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement Privacy Policy modal
              alert('Privacy Policy modal would open here');
            }}
          >
            View Policy
          </Button>
        </div>

        <div className="p-4 border rounded-md max-h-60 overflow-y-auto text-sm">
          <p className="font-medium mb-2">I Can Swim LLC Privacy Policy</p>
          <p className="mb-2">What we collect: parent/guardian info, swimmer medical/behavioral info, signed documents, booking records, technical data</p>
          <p className="mb-2">How we use it: safe swim instruction, booking management, VMRC/CVRC PO processing, legal compliance. NOT for advertising.</p>
          <p className="mb-2">We share ONLY with: instructors (for instruction), VMRC/CVRC coordinators (funded clients), trusted service providers (Supabase, Vercel, Resend)</p>
          <p className="mb-2">We do NOT sell, rent, or trade your personal information.</p>
          <p className="mb-2">COPPA: All accounts managed by parents/guardians. Children do not create accounts.</p>
          <p className="mb-2">California rights (CCPA): right to know, delete, correct, non-discrimination.</p>
          <p>Contact: Sutton@icanswim209.com | (209) 778-7877</p>
        </div>

        <FormField
          control={control}
          name="privacy_policy_agreed"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy-policy"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="privacy-policy" className="font-normal">
                    I have read and agree to the Privacy Policy
                  </Label>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {privacyPolicyAgreed && (
          <FormField
            control={control}
            name="privacy_policy_signature"
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

      {/* SMS Consent */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">SMS/Text Message Consent (Optional)</Label>
          <HelpTooltip content="Optional consent to receive text messages for appointment reminders and lesson openings." />
        </div>

        <FormField
          control={control}
          name="sms_consent_given"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="sms-consent"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="sms-consent" className="font-normal">
                    I agree to receive text messages from I Can Swim, including appointment reminders and lesson opening notifications. Message and data rates may apply. Reply STOP at any time to unsubscribe.
                  </Label>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Guardian Relationship */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Guardian Relationship *</Label>
          <HelpTooltip content="Your relationship to the minor being enrolled." />
        </div>

        <FormField
          control={control}
          name="guardian_relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship to Minor *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Parent, Legal Guardian, Grandparent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Emergency Contact */}
      {/* <div className="space-y-6">
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
      </div> */}
    </div>
  );
}