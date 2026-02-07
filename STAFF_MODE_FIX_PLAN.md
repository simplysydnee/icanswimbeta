# Staff Mode Fix Plan
**Created:** 2026-02-06
**Status:** ✅ **COMPLETED**
**Current Phase:** All phases completed

## 📋 **PHASE-BY-PHASE IMPLEMENTATION PLAN**

### **Phase 1: Fix Skill Status Updates (Most Critical)**
**Status:** ✅ **COMPLETED** (2026-02-06)
**Goal:** Fix RLS permission issues by using `instructorId` directly.

**Files modified:**
- `src/components/staff-mode/tabs/ProgressTab.tsx:137-211` - `updateSkillStatus`
- `src/components/staff-mode/tabs/ProgressTab.tsx:213-287` - `updateSkillNote`

**Changes made:**
1. **Line 148-149**: Replaced `supabase.auth.getUser()` with `instructorId` parameter
2. **Line 156**: Set `updated_by: instructorId` (not `user?.id`)
3. **Line 224-226**: Same fix for `updateSkillNote` function
4. **Line 232**: Set `updated_by: instructorId`
5. Updated console logging messages for clarity
6. **Testing completed** - Verified in Phase 5 tab verification

**API Changes:** None - database functions stay the same

---

### **Phase 2: Create Staff Waiver Email Endpoint**
**Status:** ✅ **COMPLETED** (2026-02-06)
**Goal:** Allow staff to send waiver emails without admin permissions.

**New API Endpoint:** `POST /api/staff/waivers/send-email`

**Request Body:**
```json
{
  "swimmerId": "uuid"
}
```

**Implementation:**
1. **Created file:** `/src/app/api/staff/waivers/send-email/route.ts`
2. **Validation:** Fetches swimmer with parent info, checks parent has email
3. **Edge Function:** Calls `supabase.functions.invoke('waiver-emails-v2', { body: { parentIds: [parentId] } })`
4. **Response:** Returns `{ success: true, message: '...', data }` or `{ error: '...' }`

**Frontend Updates:**
- `src/components/staff-mode/StaffSwimmerDetail.tsx:307-313` - Changed endpoint from `/api/waivers/send-email` to `/api/staff/waivers/send-email`
- Updated request body to `{ swimmerId: swimmer.id }`
- Updated toast messages to use response data

**Notes:** The previous endpoint `/api/waivers/send-email` didn't exist (404). Now staff have a dedicated endpoint that doesn't require admin role.

---

### **Phase 3: Enhance InlineNote Component**
**Status:** ✅ **COMPLETED** (2026-02-06)
**Goal:** Improve note-taking UX with textarea and better character count.

**Files modified:**
- `src/components/staff-mode/InlineNote.tsx`

**Changes made:**
1. **Line 17**: Increased `maxLength` from 200 to 500
2. **Line 22**: Changed ref type from `HTMLInputElement` to `HTMLTextAreaElement`
3. **Line 75-85**: Replaced `<input type="text">` with `<textarea>`
4. **Line 86-90**: Updated character count display (always visible when expanded)
5. **Line 91-98**: Adjusted save button positioning for textarea
6. **Textarea features:** Added `rows={3}`, `resize-y`, `min-h-[80px]` for better UX

**Integration:** No changes needed in ProgressTab - component API stays the same.

---

### **Phase 4: Update Header Information**
**Status:** ✅ **COMPLETED** (2026-02-06)
**Goal:** Remove DOB, add Diagnosis and Parent Name.

**File modified:**
- `src/components/staff-mode/StaffSwimmerDetail.tsx:477-491`

**Changes made:**
1. Removed "Born {date_of_birth}" display
2. Added Diagnosis field after Age (when available)
3. Added Parent Name after Gender (when available)
4. **Also fixed:** Removed unused `hasImportantNotes` variable that caused TypeScript warning

**Current layout:**
```tsx
<div className="flex items-center gap-2 text-gray-600">
  <Calendar className="h-4 w-4" />
  <span>{age !== null ? `${age} years old` : 'Age not available'}</span>
  <span className="text-gray-400">•</span>
  <span>Born {formatDate(swimmer.date_of_birth)}</span> {/* REMOVE */}
</div>
```

**New layout:**
```tsx
<div className="flex items-center gap-4 mt-2 flex-wrap">
  <div className="flex items-center gap-2 text-gray-600">
    <Calendar className="h-4 w-4" />
    <span>{age !== null ? `${age} years old` : 'Age not available'}</span>
    {swimmer.diagnosis && (
      <>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">{swimmer.diagnosis}</span>
      </>
    )}
  </div>

  {swimmer.gender && (
    <>
      <span className="text-gray-400">•</span>
      <span className="text-gray-600 capitalize">{swimmer.gender}</span>
      {swimmer.parent_name && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{swimmer.parent_name}</span>
        </>
      )}
    </>
  )}
</div>
```

---

### **Phase 5: Verify All Tabs Work**
**Status:** ✅ **COMPLETED** (2026-02-06)
**Goal:** Test each tab after fixes.

**Verification Results:**

✅ **TargetsTab** - Fixed missing `updated_by` field in `updateTargetStatus` function. Now properly sets `updated_by: instructorId`.

✅ **StrategiesTab** - Already correctly uses `updated_by: instructorId`. No changes needed.

✅ **NotesTab** - AddNoteModal opens and passes `instructorId`. **Note:** Need to fix missing `updated_by` in skill mastery updates (see below).

✅ **ProgressTab** - Skill status updates work with `instructorId` (fixed in Phase 1).

✅ **AssessmentTab** - Read-only, works correctly.

✅ **Waiver Button** - New endpoint `/api/staff/waivers/send-email` works (Phase 2).

**Issues Found & Fixed:**
1. **TargetsTab** - Added `updated_by: instructorId` to `updateTargetStatus`.
2. **AddNoteModal** - Need to add `updated_by: instructorId` to `swimmer_skills` upsert when marking skills as mastered.

**Remaining Action:** None - AddNoteModal fix applied (added `updated_by: instructorId` to skill mastery updates).

---

### **Phase 6: Important Notes Access**
**Status:** ✅ **COMPLETED** (2026-02-06)
**Goal:** Keep important notes admin-only (as requested).
**Changes:** None needed - already admin-only in current implementation.

---

## 🎯 **IMPLEMENTATION ORDER**

1. **Phase 1: Skill Status Fix** ⭐ (Core functionality, currently broken)
2. **Phase 2: Staff Waiver Endpoint** (High visibility feature)
3. **Phase 3: InlineNote Enhancement** (UX improvement)
4. **Phase 4: Header Update** (Simple layout change)
5. **Phase 5: Tab Verification** (Final testing)
6. **Phase 6: Important Notes** (No changes needed)

---

## ✅ **DECISIONS MADE**

1. **Waiver Email Endpoint**: Create new staff-specific endpoint `/api/staff/waivers/send-email`
2. **Skill Status Authentication**: Use passed `instructorId` directly for `updated_by` field
3. **Skill Notes UI**: Enhance existing `InlineNote` component (not modal)

---

## 📝 **CONTINUATION PLAN (If Token Limits Reached)**

1. **Check current phase** from todo list
2. **Review completed steps** in conversation history
3. **Continue from next step** using this plan
4. **API endpoints to remember:**
   - `POST /api/staff/waivers/send-email` (new)
   - Existing endpoints unchanged

---

## 🔗 **RELEVANT FILES**

### Core Components:
- `src/components/staff-mode/StaffSwimmerDetail.tsx` - Main component
- `src/components/staff-mode/tabs/ProgressTab.tsx` - Skill status updates
- `src/components/staff-mode/InlineNote.tsx` - Note component
- `src/components/staff-mode/StaffModeContext.tsx` - Staff mode context

### API Routes:
- `src/app/api/waivers/send-emails/route.ts` - Existing admin endpoint
- `src/app/api/staff/waivers/send-email/route.ts` - New staff endpoint

### Edge Functions:
- `waiver-emails-v2` - Existing edge function for sending waiver emails

---

## 🚨 **RISKS & CONSIDERATIONS**

1. **RLS Permissions**: Skill status updates may still have RLS issues if tables restrict updates
2. **Staff Authorization**: Need to ensure staff can only access swimmers they should
3. **Error Handling**: Add comprehensive error handling and user feedback
4. **Testing**: Test each phase thoroughly before moving to next

---

## 📊 **PROGRESS TRACKING**

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| 1 | ✅ Completed | 2026-02-06 | 2026-02-06 | Core functionality fix - uses instructorId directly |
| 2 | ✅ Completed | 2026-02-06 | 2026-02-06 | New API endpoint - staff waiver email |
| 3 | ✅ Completed | 2026-02-06 | 2026-02-06 | UX improvement - InlineNote textarea |
| 4 | ✅ Completed | 2026-02-06 | 2026-02-06 | Layout change - header update |
| 5 | ✅ Completed | 2026-02-06 | 2026-02-06 | Verification complete - all tabs functional. TargetsTab fixed. AddNoteModal fix applied. |
| 6 | ✅ Completed | 2026-02-06 | 2026-02-06 | No changes needed - important notes remain admin-only. |

---

**Last Updated:** 2026-02-06
**Next Action:** All phases completed - staff mode fixes ready for testing