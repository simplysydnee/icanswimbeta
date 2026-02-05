import { updateSwimmerWaivers, validateWaiverToken } from '@/lib/db/waivers';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(32),
  swimmerId: z.string().uuid(),
  liabilitySignature: z.string().min(10),
  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string().min(10),
  emergencyContactRelationship: z.string().min(2),
  liabilityConsent: z.boolean().default(false),
  photoPermission: z.boolean(),
  photoSignature: z.string().optional(),
  photoSignatureConsent: z.boolean().optional().default(false),
  cancellationSignature: z.string().min(10),
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
    const data = schema.parse(body);

    // Validate token
    const validation = await validateWaiverToken(data.token);
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

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

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
        tokenId: validation.tokenId,
        ipAddress,
        userAgent
      }
    );

    if (!result.success) {
      return Response.json(
        { error: result.error || 'Update failed' },
        { status: 400 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
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