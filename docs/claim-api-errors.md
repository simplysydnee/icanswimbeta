# Claim API Error Responses

This document outlines the error responses returned by the claim invitation API route (`/api/invitations/claim/[token]`). These responses are standardized for frontend handling.

## Success Response (200)
```json
{
  "success": true,
  "swimmer": { ... }, // Full swimmer object (legacy)
  "message": "Swimmer linked successfully! Welcome email has been sent.",
  "swimmerId": "uuid-here", // Added for future use
  "redirectTo": "/parent/dashboard" // Added for future use
}
```

## Error Responses

### EMAIL_MISMATCH (403)
Returned when the authenticated user's email does not match the invitation's parent_email.

```json
{
  "error": "EMAIL_MISMATCH",
  "message": "This invitation was sent to parent@test.com, but you are currently signed in as different@test.com.",
  "invitedEmail": "parent@test.com",
  "currentEmail": "different@test.com",
  "resolutionOptions": [
    {
      "action": "SIGN_OUT_AND_USE_INVITED_EMAIL",
      "title": "Sign out and create account with invited email",
      "description": "Sign out and create a new account using parent@test.com"
    },
    {
      "action": "CONTACT_ADMIN",
      "title": "Contact I Can Swim to update invitation",
      "description": "Request that the invitation be resent to your current email address",
      "contactEmail": "sutton@icanswim209.com",
      "contactPhone": "209-985-1538"
    }
  ]
}
```

### EXPIRED (410)
Returned when the invitation has expired.

```json
{
  "error": "EXPIRED",
  "message": "This invitation has expired. Please contact I Can Swim to request a new invitation.",
  "contactEmail": "sutton@icanswim209.com",
  "contactPhone": "209-985-1538"
}
```

### DOB_MISMATCH (403)
Returned when the provided date of birth does not match the swimmer's date of birth.

```json
{
  "error": "DOB_MISMATCH",
  "message": "The date of birth you entered does not match our records."
}
```

### ALREADY_CLAIMED (409)
Returned when the invitation has already been claimed.

```json
{
  "error": "ALREADY_CLAIMED",
  "message": "This invitation has already been claimed."
}
```

### INVALID_TOKEN (404)
Returned when the invitation token is invalid or not found.

```json
{
  "error": "INVALID_TOKEN",
  "message": "This invitation link is invalid or has already been used."
}
```

### INVALID_EMAIL (400)
Returned when email information is missing from either the invitation or the user.

```json
{
  "error": "INVALID_EMAIL",
  "message": "Email information is missing."
}
```

### UNAUTHENTICATED (401)
Returned when no valid authentication token is provided.

```json
{
  "error": "UNAUTHENTICATED",
  "message": "You must be signed in to claim this invitation."
}
```

### CLAIM_FAILED (500)
Returned when the database function fails with an unexpected error.

```json
{
  "error": "CLAIM_FAILED",
  "message": "Failed to claim invitation. Please try again or contact support."
}
```

### INTERNAL_ERROR (500)
Returned when an unexpected exception occurs during claim processing.

```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred. Please try again."
}
```

## Testing

See [tests/api/claim-invitation.test.http](../tests/api/claim-invitation.test.http) for HTTP test cases.

## Notes

- Email validation is case-insensitive and trims whitespace.
- Email validation occurs BEFORE date of birth validation.
- All error responses include an `error` field for programmatic handling.
- User-friendly messages are provided in the `message` field.
- Additional context may be included in error-specific fields (e.g., `invitedEmail`, `currentEmail`).