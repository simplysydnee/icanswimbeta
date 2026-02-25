'use client';

import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { EditableText } from '@/components/admin/EditableText';
import { usePageContent, getContent } from '@/hooks/usePageContent';
import { useEditMode } from '@/contexts/EditModeContext';

export default function ContactPage() {
  const { editMode } = useEditMode();
  const { data: content, isLoading } = usePageContent('contact', editMode);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading content...</div>
      </div>
    );
  }
  return (
    <div className="w-full px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <EditableText
            pageSlug="contact"
            sectionKey="hero-title"
            defaultContent="Contact Us"
            as="h1"
            className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#2a5e84] to-[#23a1c0] bg-clip-text text-transparent font-playfair-display tracking-tight mb-4"
          >
            {getContent(content, 'hero-title', 'Contact Us')}
          </EditableText>
          <EditableText
            pageSlug="contact"
            sectionKey="hero-subtitle"
            defaultContent="Get in touch with our team. We're here to answer your questions and help you get started."
            as="p"
            className="text-xl text-gray-600 font-inter max-w-3xl mx-auto"
          >
            {getContent(content, 'hero-subtitle', "Get in touch with our team. We're here to answer your questions and help you get started.")}
          </EditableText>
        </div>

        {/* Contact Info Cards */}
        <div className="max-w-6xl mx-auto mb-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mb-4">
                <Phone className="h-6 w-6 text-cyan-600" />
              </div>
              <EditableText
                pageSlug="contact"
                sectionKey="call-us-title"
                defaultContent="Call Us"
                as="h3"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                {getContent(content, 'call-us-title', 'Call Us')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="call-us-number"
                defaultContent="(209) 778-7877"
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'call-us-number', '(209) 778-7877')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="call-us-hours"
                defaultContent="Mon-Fri, 9am-5pm"
                as="p"
                className="text-sm text-gray-600 mt-2"
              >
                {getContent(content, 'call-us-hours', 'Mon-Fri, 9am-5pm')}
              </EditableText>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <EditableText
                pageSlug="contact"
                sectionKey="email-us-title"
                defaultContent="Email Us"
                as="h3"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                {getContent(content, 'email-us-title', 'Email Us')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="email-us-address"
                defaultContent="info@icanswim209.com"
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'email-us-address', 'info@icanswim209.com')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="email-us-response"
                defaultContent="Typically reply within 24 hours"
                as="p"
                className="text-sm text-gray-600 mt-2"
              >
                {getContent(content, 'email-us-response', 'Typically reply within 24 hours')}
              </EditableText>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mb-4">
                <MapPin className="h-6 w-6 text-cyan-600" />
              </div>
              <EditableText
                pageSlug="contact"
                sectionKey="visit-us-title"
                defaultContent="Visit Us"
                as="h3"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                {getContent(content, 'visit-us-title', 'Visit Us')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="visit-us-appointment"
                defaultContent="By Appointment Only"
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'visit-us-appointment', 'By Appointment Only')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="visit-us-locations"
                defaultContent="Lessons in Modesto & Merced"
                as="p"
                className="text-sm text-gray-600 mt-2"
              >
                {getContent(content, 'visit-us-locations', 'Lessons in Modesto & Merced')}
              </EditableText>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <EditableText
                pageSlug="contact"
                sectionKey="quick-response-title"
                defaultContent="Quick Response"
                as="h3"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                {getContent(content, 'quick-response-title', 'Quick Response')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="quick-response-number"
                defaultContent="Text: 209-643-7969"
                as="p"
                className="text-gray-700"
              >
                {getContent(content, 'quick-response-number', 'Text: 209-643-7969')}
              </EditableText>
              <EditableText
                pageSlug="contact"
                sectionKey="quick-response-description"
                defaultContent="For fastest response"
                as="p"
                className="text-sm text-gray-600 mt-2"
              >
                {getContent(content, 'quick-response-description', 'For fastest response')}
              </EditableText>
            </div>
          </div>
        </div>

        {/* Contact Form & Info */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <EditableText
                pageSlug="contact"
                sectionKey="form-title"
                defaultContent="Send Us a Message"
                as="h2"
                className="text-2xl font-bold text-gray-900 mb-6"
              >
                {getContent(content, 'form-title', 'Send Us a Message')}
              </EditableText>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="(209) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  >
                    <option value="">Select a topic</option>
                    <option value="assessment">Book an Assessment</option>
                    <option value="lessons">Regular Lessons Inquiry</option>
                    <option value="funding">Funding Questions</option>
                    <option value="general">General Information</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200"
                >
                  <EditableText
                    pageSlug="contact"
                    sectionKey="button-send-message"
                    defaultContent="Send Message"
                    as="span"
                  >
                    {getContent(content, 'button-send-message', 'Send Message')}
                  </EditableText>
                </button>
              </form>
            </div>

            {/* Location & Hours */}
            <div>
              <EditableText
                pageSlug="contact"
                sectionKey="locations-hours-title"
                defaultContent="Our Locations & Hours"
                as="h2"
                className="text-2xl font-bold text-gray-900 mb-6"
              >
                {getContent(content, 'locations-hours-title', 'Our Locations & Hours')}
              </EditableText>

              {/* Modesto Location */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                  <EditableText
                    pageSlug="contact"
                    sectionKey="modesto-location-title"
                    defaultContent="Modesto Location"
                    as="h3"
                    className="text-xl font-semibold text-gray-900"
                  >
                    {getContent(content, 'modesto-location-title', 'Modesto Location')}
                  </EditableText>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="modesto-address-line1"
                        defaultContent="1212 Kansas Ave"
                        as="p"
                        className="font-medium text-gray-900"
                      >
                        {getContent(content, 'modesto-address-line1', '1212 Kansas Ave')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="modesto-address-line2"
                        defaultContent="Modesto, CA 95351"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'modesto-address-line2', 'Modesto, CA 95351')}
                      </EditableText>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-label"
                        defaultContent="Hours"
                        as="p"
                        className="font-medium text-gray-900"
                      >
                        {getContent(content, 'hours-label', 'Hours')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-weekdays"
                        defaultContent="Monday - Friday: 9:00 AM - 7:00 PM"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'hours-weekdays', 'Monday - Friday: 9:00 AM - 7:00 PM')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-saturday"
                        defaultContent="Saturday: 9:00 AM - 3:00 PM"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'hours-saturday', 'Saturday: 9:00 AM - 3:00 PM')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-sunday"
                        defaultContent="Sunday: 12:00 PM - 6:00 PM"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'hours-sunday', 'Sunday: 12:00 PM - 6:00 PM')}
                      </EditableText>
                    </div>
                  </div>
                </div>
              </div>

              {/* Merced Location */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <EditableText
                    pageSlug="contact"
                    sectionKey="merced-location-title"
                    defaultContent="Merced Location"
                    as="h3"
                    className="text-xl font-semibold text-gray-900"
                  >
                    {getContent(content, 'merced-location-title', 'Merced Location')}
                  </EditableText>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="merced-address-line1"
                        defaultContent="750 Motel Dr"
                        as="p"
                        className="font-medium text-gray-900"
                      >
                        {getContent(content, 'merced-address-line1', '750 Motel Dr')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="merced-address-line2"
                        defaultContent="Merced, CA 95340"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'merced-address-line2', 'Merced, CA 95340')}
                      </EditableText>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-label"
                        defaultContent="Hours"
                        as="p"
                        className="font-medium text-gray-900"
                      >
                        {getContent(content, 'hours-label', 'Hours')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-weekdays"
                        defaultContent="Monday - Friday: 9:00 AM - 7:00 PM"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'hours-weekdays', 'Monday - Friday: 9:00 AM - 7:00 PM')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-saturday"
                        defaultContent="Saturday: 9:00 AM - 3:00 PM"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'hours-saturday', 'Saturday: 9:00 AM - 3:00 PM')}
                      </EditableText>
                      <EditableText
                        pageSlug="contact"
                        sectionKey="hours-sunday"
                        defaultContent="Sunday: 12:00 PM - 6:00 PM"
                        as="p"
                        className="text-gray-600"
                      >
                        {getContent(content, 'hours-sunday', 'Sunday: 12:00 PM - 6:00 PM')}
                      </EditableText>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6">
                <EditableText
                  pageSlug="contact"
                  sectionKey="common-questions-title"
                  defaultContent="Common Questions"
                  as="h3"
                  className="text-lg font-semibold text-gray-900 mb-4"
                >
                  {getContent(content, 'common-questions-title', 'Common Questions')}
                </EditableText>
                <div className="space-y-4">
                  <div>
                    <EditableText
                      pageSlug="contact"
                      sectionKey="faq-preview-1-question"
                      defaultContent="How do I get started?"
                      as="p"
                      className="font-medium text-gray-900 mb-1"
                    >
                      {getContent(content, 'faq-preview-1-question', 'How do I get started?')}
                    </EditableText>
                    <EditableText
                      pageSlug="contact"
                      sectionKey="faq-preview-1-answer"
                      defaultContent="Start by booking an assessment session. This helps us understand your swimmer's needs and create a personalized plan."
                      as="p"
                      className="text-sm text-gray-600"
                    >
                      {getContent(content, 'faq-preview-1-answer', "Start by booking an assessment session. This helps us understand your swimmer's needs and create a personalized plan.")}
                    </EditableText>
                  </div>
                  <div>
                    <EditableText
                      pageSlug="contact"
                      sectionKey="faq-preview-2-question"
                      defaultContent="Do you accept funding?"
                      as="p"
                      className="font-medium text-gray-900 mb-1"
                    >
                      {getContent(content, 'faq-preview-2-question', 'Do you accept funding?')}
                    </EditableText>
                    <EditableText
                      pageSlug="contact"
                      sectionKey="faq-preview-2-answer"
                      defaultContent="We accept regional center funding (including VMRC and CVRC) and private pay. We do not accept insurance."
                      as="p"
                      className="text-sm text-gray-600"
                    >
                      {getContent(content, 'faq-preview-2-answer', 'We accept regional center funding (VMRC, CVRC) and private pay. We do not accept insurance.')}
                    </EditableText>
                  </div>
                  <div>
                    <EditableText
                      pageSlug="contact"
                      sectionKey="faq-preview-3-question"
                      defaultContent="What should we bring to the first lesson?"
                      as="p"
                      className="font-medium text-gray-900 mb-1"
                    >
                      {getContent(content, 'faq-preview-3-question', 'What should we bring to the first lesson?')}
                    </EditableText>
                    <EditableText
                      pageSlug="contact"
                      sectionKey="faq-preview-3-answer"
                      defaultContent="Swimsuit, towel, and any necessary swim aids. We provide all equipment and have private changing areas."
                      as="p"
                      className="text-sm text-gray-600"
                    >
                      {getContent(content, 'faq-preview-3-answer', 'Swimsuit, towel, and any necessary swim aids. We provide all equipment and have private changing areas.')}
                    </EditableText>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}