# Admin Guide: Email Mismatch Requests

## How to Help Parents

### Request: "I can't claim the invitation"

**Ask**:
1. What email was the invitation sent to?
2. What email are you signed in with?
3. Do you have access to the invited email?

**If they have access to invited email**:
→ Guide them to sign out, create account with invited email, return to link

**If they don't have access**:
→ Resend invitation to preferred email via Admin → Swimmer → Invite Parent

---

### Request: "Can you change the email on my invitation?"

**Answer**: "I'll resend to your preferred email right away."

**Steps**:
1. Verify identity (swimmer name, DOB)
2. Go to swimmer detail in admin
3. Click "Invite Parent"
4. Enter preferred email
5. Confirm parent received new email

**Time**: 2 minutes

---

## Preventing Issues

### Best Practices
- ✅ Double-check email spelling
- ✅ Ask for preferred email during intake
- ✅ Confirm: "Is it gmail or g-mail?"
- ❌ Don't assume email based on name

**Always ask**: "What email do you check most often?"

---

## Monitoring Logs

**Check recent mismatches** (Supabase SQL Editor):
```sql
SELECT created_at, invited_email, attempted_email, resolution_action
FROM email_mismatch_logs
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC;
```

**Look for**:
- Patterns (same domain mixups)
- High volume (admin typos?)
- Unresolved attempts (parents stuck?)

---

## Quick Reference

| Scenario | Solution | Time |
|----------|----------|------|
| Has access to invited email | Guide to sign out & use it | 2 min |
| No access | Resend to preferred email | 2 min |
| Invitation expired | Resend new invitation | 2 min |

---

**Contact**: sutton@icanswim209.com | 209-985-1538