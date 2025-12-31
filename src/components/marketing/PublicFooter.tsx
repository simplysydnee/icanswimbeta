import Image from 'next/image';
import { Phone, Mail, MapPin, Instagram } from 'lucide-react';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main footer content - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Left: Logo & Description */}
          <div className="text-center md:text-left">
            <div className="mb-4">
              <Image
                src="/images/logo.svg"
                alt="I Can Swim - Adaptive Swim Lessons"
                width={180}
                height={60}
                className="mx-auto md:mx-0 brightness-0 invert"
              />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Adaptive swim lessons for individuals of all abilities.
              Building confidence, safety, and joy in the water.
            </p>

            {/* Social Media */}
            <div className="mt-4 flex justify-center md:justify-start">
              <a
                href="https://instagram.com/icanswim209"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Right: Contact Info */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3">
              <a
                href="mailto:info@icanswim209.com"
                className="flex items-center justify-center md:justify-start gap-3 text-slate-300 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <span>info@icanswim209.com</span>
              </a>

              <a
                href="tel:209-778-7877"
                className="flex items-center justify-center md:justify-start gap-3 text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <span>(209) 778-7877</span>
                  <p className="text-sm text-slate-400">Text: 209-643-7969</p>
                </div>
              </a>

              <div className="flex items-center justify-center md:justify-start gap-3 text-slate-300">
                <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <div>
                  <p>Modesto, CA</p>
                  <p className="text-sm text-slate-400">Serving the Central Valley</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-700 mt-8 pt-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-center">
            <p className="text-slate-400 text-sm">
              © {currentYear} I Can Swim, LLC. All rights reserved.
            </p>
            <p className="text-slate-400 text-sm">
              Simply Better Swim Software
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}