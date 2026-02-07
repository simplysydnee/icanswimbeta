import { updateSwimmerWaivers, validateWaiverToken } from '@/lib/db/waivers';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(32, { message: 'Invalid token format' }),
  swimmerId: z.string().uuid({ message: 'Invalid swimmer ID' }),
  liabilitySignature: z.string().min(3, { message: 'Liability waiver signature must be at least 3 characters (your full name)' }),
  emergencyContactName: z.string().min(2, { message: 'Emergency contact name must be at least 2 characters' }),
  emergencyContactPhone: z.string().min(10, { message: 'Emergency contact phone must be at least 10 digits' }),
  emergencyContactRelationship: z.string().min(2, { message: 'Emergency contact relationship must be at least 2 characters (e.g., Parent, Guardian)' }),
  liabilityConsent: z.boolean().default(false),
  photoPermission: z.boolean(),
  photoSignature: z.string().optional(),
  photoSignatureConsent: z.boolean().optional().default(false),
  cancellationSignature: z.string().min(3, { message: 'Cancellation policy signature must be at least 3 characters (your full name)' }),
  cancellationAgreed: z.boolean().default(false)
}).refine(
  data => !data.photoPermission || data.photoSignature,
  { message: 'Photo signature required when permission is granted' }
).refine(
  data => !data.photoPermission || data.photoSignatureConsent === true,
  { message: 'You must consent to electronic signatures for the photo release', path: ['photoSignatureConsent'] }
).refine(
  data => data.liabilityConsent === true,
  { message: 'You must consent to electronic signatures and agree to the liability waiver terms', path: ['liabilityConsent'] }
).refine(
  data => data.cancellationAgreed === true,
  { message: 'You must agree to the cancellation policy', path: ['cancellationAgreed'] }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Waiver update request received:', { token: body.token, swimmerId: body.swimmerId });
    const data = schema.parse(body);

    // Validate token
    const validation = await validateWaiverToken(data.token);
    console.log('Token validation result:', { valid: validation.valid, parentEmail: validation.parentEmail, tokenId: validation.tokenId });
    if (!validation.valid) {
      return Response.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    if (!validation.parentEmail) {
      return Response.json(
        { error: 'Parent email not found' },
        { status: 400 }
      );
    }
    if (!validation.tokenId) {
      console.error('Token ID missing in validation:', validation);
      return Response.json(
        { error: 'Invalid token configuration' },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const tokenId = validation.tokenId!;

    // Update waivers
    const result = await updateSwimmerWaivers(
      data.swimmerId,
      {
        liabilitySignature: data.liabilitySignature,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
        liabilityConsent: data.liabilityConsent,
        photoPermission: data.photoPermission,
        photoSignature: data.photoSignature,
        photoSignatureConsent: data.photoSignatureConsent,
        cancellationSignature: data.cancellationSignature,
        cancellationAgreed: data.cancellationAgreed
      },
      {
        parentId: validation.parentId || null,
        parentEmail: validation.parentEmail,
        tokenId,
        ipAddress,
        userAgent
      }
    );

    console.log('Update result:', result);

    if (!result.success) {
      return Response.json(
        { error: result.error || 'Update failed' },
        { status: 400 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return Response.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update waivers error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}