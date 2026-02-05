/**
 * Legal document text for waiver system
 * These are the complete legal documents that users must read and sign
 */

export const LEGAL_DOCUMENTS = {
  LIABILITY_WAIVER: {
    version: '1.0',
    lastUpdated: '2025-02-05',
    title: 'Waiver and Release of Liability',
    content: `WAIVER AND RELEASE OF LIABILITY

IN CONSIDERATION OF the risk of injury that exists while participating in SWIM LESSONS (hereinafter the "Activity"); and

IN CONSIDERATION OF my desire to participate in said Activity and being given the right to participate in same:

I HEREBY, for myself, my heirs, executors, administrators, assigns, or personal representatives (hereinafter collectively, "Releasor", "I", or "me", which terms shall also include Releasor's parents or guardian if Releasor is under 18 years of age), knowingly and voluntarily enter into this WAIVER AND RELEASE OF LIABILITY and hereby waive any and all rights, claims or causes of action of any kind arising out of my participation in the Activity: and

I HEREBY, release and forever discharge I CAN SWIM, LLC, located at 2705 Sebastian Drive, Turlock, California 95382, their affiliates, managers, members, agents, attorneys, staff, volunteers, heirs, representatives, predecessors, successors and assigns (collectively "Releasee's), from any physical or psychological injury that I may suffer as a direct result of my participation in the aforementioned Activity.

I AM VOLUNTARILY PARTICIPATING IN THE AFOREMENTIONED ACTIVITY AND I AM PARTICIPATING IN THE ACTIVITY ENTIRELY AT MY OWN RISK. I AM AWARE OF THE RISKS ASSOCIATED WITH PARTICIPATING IN THIS ACTIVITY, WHICH MAY INCLUDE, BUT ARE NOT LIMITED TO: PHYSICAL OR PSYCHOLOGICAL INJURY, PAIN, SUFFERING, ILLNESS, DISFIGUREMENT, TEMPORARY OR PERMANENT DISABILITY (INCLUDING PARALYSIS), ECONOMIC OR EMOTIONAL LOSS, AND DEATH. I UNDERSTAND THAT THESE INJURIES OR OUTCOMES MAY ARISE FROM MY OWN OR OTHERS' NEGLIGENCE, CONDITIONS RELATED TO TRAVEL TO AND FROM THE ACTIVITY, OR FROM CONDITIONS AT THE ACTIVITY LOCATION(S). NONETHELESS, I ASSUME ALL RELATED RISKS, BOTH KNOWN AND UNKNOWN TO ME, OF MY PARTICIPATION IN THIS ACTIVITY.

I FURTHER AGREE to indemnify, defend and hold harmless the Releasees against any and all claims, suits or actions of any kind whatsoever for liability, damages, compensation or otherwise brought by me or anyone on my behalf, including attorney's fees and any related costs.

I FURTHER ACKNOWLEDGE that Releasees are not responsible for errors, omissions, acts or failures to act of any party or entity conducting a specific event or activity on behalf of Releasees. In the event that I should require medical care or treatment, I authorize I CAN SWIM, LLC to provide all emergency medical care deemed necessary, including but not limited to, first aid, CPR, the use of AEDs, emergency medical transport, and sharing of medical information with medical personnel. I further agree to assume all costs involved and agree to be financially responsible for any costs incurred as a result of such treatment. I am aware and understand that I should carry my own health insurance.

I FURTHER ACKNOWLEDGE that this Activity may involve a test of a person's physical and mental limits and may carry with it the potential for death, serious injury, and property loss. I agree not to participate in the Activity unless I am medically able and properly trained, and I agree to abide by the decision of I CAN SWIM, LLC official or agent, regarding my approval to participate in the Activity.

I HEREBY ACKNOWLEDGE THAT I HAVE CAREFULLY READ THIS "WAIVER AND RELEASE" AND FULLY UNDERSTAND THAT IT IS A RELEASE OF LIABILITY. I EXPRESSLY AGREE TO RELEASE AND DISCHARGE SUTTON LUCAS DBA I CAN SWIM, AND ALL OF ITS AFFILIATES, MANAGERS, MEMBERS, AGENTS, ATTORNEYS, STAFF, VOLUNTEERS, HEIRS, REPRESENTATORS, PREDECESSORS, SUCCESSORS AND ASSIGNS, FROM ANY AND ALL CLAIMS OR CAUSES OF ACTIONS AND I AGREE TO VOLUNTARILY GIVE UP OR WAIVE ANY RIGHT THAT I OTHERWISE HAVE TO BRING LEGAL ACTION AGAINST I CAN SWIM, LLC FOR PERSONAL INJURY OR PROPERTY DAMAGE.

To the extent that statute or case law does not prohibit releases for ordinary negligence, this release is also for such negligence on the part of I CAN SWIM, LLC its agents and employees.

I agree that this Release shall be governed for all purposes by California law without regard to any conflict of law principles. This Release supersedes any and all previous oral or written promises or other agreements.

In the event that any damage to equipment or facilities occurs as a result of my or my family's or my agent's willful actions, neglect or recklessness, I acknowledge and agree to be held liable for any and all costs associated with any such actions of neglect or recklessness.

THIS WAIVER AND RELEASE OF LIABILITY SHALL REMAIN IN EFFECT FOR THE DURATION OF MY PARTICIPATION IN THE ACTIVITY, DURING THIS INITIAL AND ALL SUBSEQUENT EVENTS OF PARTICIPATION.

THIS AGREEMENT was entered into at arm's length, without duress or coercion and is to be interpreted as an agreement between two parties of equal bargaining strength. Both Participant, and I CAN SWIM, LLC agree that this agreement is clear and unambiguous as to its terms, and that no other evidence shall be used or admitted to alter or explain the terms of this agreement, but that it will be interpreted based upon the language in accordance with the purposes for which it is entered into.

In the event that any provision contained within this Release of Liability shall be deemed to be severable or invalid, or if any term, condition, phrase or portion of this agreement shall be determined to be unlawful or otherwise unenforceable, the remainder of this agreement shall remain in full force and effect. If a court should find that any provision of this agreement to be invalid or unenforceable, but that by limiting said provision it would become valid and enforceable, then said provision shall be deemed to be written, construed and enforced as so limited.

In the event of an emergency, please contact the following person(s) in the order presented:
[Emergency contact information provided during signing]`
  },

  PHOTO_RELEASE: {
    version: '1.0',
    lastUpdated: '2025-02-05',
    title: 'Photo/Video Release',
    content: `PHOTO/VIDEO RELEASE AUTHORIZATION

I grant permission for I Can Swim, LLC to use photos and videos of my child for promotional materials, social media, and educational purposes.

I understand that:
- Photos and videos may be used on social media platforms (Facebook, Instagram, etc.)
- Images may be used in marketing materials, brochures, and advertisements
- No compensation will be provided for use of these images
- I Can Swim, LLC retains ownership of all photos and videos
- I may revoke this permission at any time by contacting I Can Swim in writing

By signing below, I grant full permission for the use of photographs and videos as described above.`
  },

  CANCELLATION_POLICY: {
    version: '1.0',
    lastUpdated: '2025-02-05',
    title: 'Cancellation Policy',
    content: `CANCELLATION POLICY

If you need to cancel a session, please do so at least 24 hours in advance.
This gives us time to offer the spot to another swimmer.

Cancellations can be made through your parent portal on the app or online.

We understand that life happens—illness, emergencies, and unexpected changes are part of life. But when we don't receive notice in time, the session goes unused, and another swimmer misses the opportunity to take that spot.

If a session is canceled with less than 24 hours' notice, your swimmer will be moved to Flexible Swimmer status:
- No recurring weekly sessions
- Only eligible to book single open sessions as available

We appreciate your understanding and support as we work to keep the pool full and every swimmer progressing.

Have an emergency? Contact us:
Phone: (209) 778-7877
Email: sutton@icanswim209.com
Website: icanswim209.com`
  }
} as const;

/**
 * Generate SHA-256 hash of document for tamper detection
 * Used in signature_audit table to verify document hasn't been altered
 */
export async function generateDocumentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}