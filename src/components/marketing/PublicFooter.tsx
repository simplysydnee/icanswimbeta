import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';

const footerLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Programs', href: '/programs' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Regional Centers', href: '/regional-centers' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact', href: '/contact' },
  { name: 'Login', href: '/login' },
];

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main footer content - centered grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Column 1: Logo & Description */}
          <div className="text-center md:text-left">
            <div className="relative h-10 w-32 mx-auto md:mx-0 mb-4">
              <Image
                src="/images/logo.svg"
                alt="I Can Swim Logo"
                fill
                className="object-contain invert"
              />
            </div>
            <p className="text-slate-300 text-sm">
              Adaptive swim lessons for individuals of all abilities.
              Building confidence, safety, and joy in the water.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-white text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <a href="mailto:info@icanswim209.com" className="text-slate-300 hover:text-white text-sm">
                  info@icanswim209.com
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="text-slate-300 text-sm">
                  <p>(209) 778-7877</p>
                  <p className="text-slate-400">Text: 209-643-7969</p>
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="text-slate-300 text-sm">
                  <p>Modesto, CA</p>
                  <p className="text-slate-400">Serving the Central Valley</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar - centered */}
        <div className="border-t border-slate-700 mt-8 pt-6 max-w-6xl mx-auto">
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