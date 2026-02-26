# RLS Prioritized Fix List

## Critical Security Issues (Immediate Action Required)

| Table | Policy Issue | Severity | Recommended Fix |
|-------|-------------|----------|-----------------|
| `swimmers` | Missing coordinator access | CRITICAL | Add policy: `(coordinator_id = auth.uid()) OR has_role(auth.uid(), 'admin') OR parent_id = auth.uid() OR instructor_has_swimmer_access(auth.uid(), id)` |
| `purchase_orders` | Only admin access, coordinators blocked | CRITICAL | Add coordinator policy: `(swimmer_id IN (SELECT id FROM swimmers WHERE coordinator_id = auth.uid())) OR has_role(auth.uid(), 'admin')` |
| 15 tables* | Missing DELETE policies | CRITICAL | Add restrictive DELETE policies or disable DELETE via RLS |
| `progress_notes` | Parents cannot view shared notes | HIGH | Update policy to include: `OR (shared_with_parent = true AND auth.uid() IN (SELECT parent_id FROM swimmers WHERE id = progress_notes.swimmer_id))` |
| 8 tables** | Missing UPDATE policies | HIGH | Add role-based UPDATE policies |
| 7 tables*** | Missing INSERT policies | HIGH | Add role-based INSERT policies |

*Tables missing DELETE: `assessments`, `billing_line_items`, `billing_periods`, `bookings`, `coordinator_escalations`, `funding_sources`, `parent_invitations`, `purchase_orders`, `referral_requests`, `sessions`, `skills`, `swim_levels`, `swimmer_instructor_assignments`, `swimmer_strategies`, `swimmer_targets`

**Tables missing UPDATE: `assessment_reports`, `parent_referral_requests`, `referral_requests`, `signature_audit`, `swimmer_strategies`, `swimmer_targets`, `waiver_update_log`, `waiver_update_tokens`

***Tables missing INSERT: `coordinator_escalations`, `purchase_orders`, `skills`, `swim_levels`, `swimmer_strategies`, `swimmer_targets`, `waiver_update_log`

## High Priority Issues (Fix within 1 week)

| Table | Policy Issue | Severity | Recommended Fix |
|-------|-------------|----------|-----------------|
| All tables | Inconsistent `has_role()` usage | MEDIUM | Standardize on `has_role(auth.uid(), 'role')` instead of direct `user_roles` queries |
| `progress_notes` | API vs RLS conflict | HIGH | Remove redundant `.or()` filter from API or update RLS policy |
| System | Missing coordinator access function | MEDIUM | Create `coordinator_has_swimmer_access()` function |
| System | SECURITY DEFINER function review | MEDIUM | Audit all SECURITY DEFINER functions for vulnerabilities |

## Medium Priority Issues (Fix within 2 weeks)

| Table | Policy Issue | Severity | Recommended Fix |
|-------|-------------|----------|-----------------|
| Backup tables | Missing RLS policies | LOW | Add restrictive policies or disable RLS |
| All APIs | RLS alignment verification | MEDIUM | Audit all API endpoints for RLS compliance |
| System | Test suite for RLS | MEDIUM | Create comprehensive RLS test cases |
| Documentation | Missing RLS patterns | LOW | Document standard RLS patterns for development |

## Immediate Action Plan

### Day 1-2: Critical Fixes
1. Implement coordinator access policies for `swimmers` and `purchase_orders`
2. Add DELETE policies for high-risk tables
3. Fix progress notes parent access

### Day 3-5: High Priority Fixes
4. Standardize `has_role()` usage across codebase
5. Resolve API vs RLS conflicts
6. Create coordinator access function

### Week 2: Medium Priority
7. Audit and fix remaining policy gaps
8. Create RLS test suite
9. Update security documentation

## Risk Assessment

### Critical Risks (Blocking Issues):
- Coordinator hub completely broken (no swimmer/PO access)
- Missing DELETE policies allow data destruction
- Parents cannot view shared progress notes

### High Risks (Security Vulnerabilities):
- Missing INSERT/UPDATE policies allow unauthorized modifications
- Inconsistent authorization logic
- API filters may bypass RLS

### Medium Risks (Technical Debt):
- Function security concerns
- Missing tests and documentation
- Backup data exposure

## Verification Checklist

After implementing fixes, verify:
- [ ] Coordinators can view assigned swimmers and POs
- [ ] Parents can view shared progress notes
- [ ] DELETE operations properly restricted
- [ ] All APIs work with RLS policies
- [ ] No regression in existing functionality
- [ ] Test suite covers all role-based scenarios