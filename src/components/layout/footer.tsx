import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center md:text-left">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex justify-center md:justify-start">
              <Image
                src="/images/logo.svg"
                alt="I Can Swim - Adaptive Swim Lessons"
                width={180}
                height={60}
                className="brightness-0 invert"
              />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Adaptive swim lessons for individuals of all abilities.
              Building confidence, safety, and joy in the water.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <a
                href="https://facebook.com/icanswim209"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/icanswim209"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  Book Assessment
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Parent Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Our Program
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Us</h3>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-center gap-3 justify-center md:justify-start">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@icanswim209.com" className="hover:text-white transition-colors">
                  info@icanswim209.com
                </a>
              </li>
              <li className="flex items-center gap-3 justify-center md:justify-start">
                <Phone className="h-4 w-4 shrink-0" />
                <div>
                  <a href="tel:209-778-7877" className="hover:text-white transition-colors">(209) 778-7877</a>
                  <p className="text-xs text-slate-400">Text: 209-643-7969</p>
                </div>
              </li>
              <li className="flex items-center gap-3 justify-center md:justify-start">
                <MapPin className="h-4 w-4 shrink-0" />
                <div>
                  <p>Modesto, CA</p>
                  <p className="text-xs text-slate-400">Serving the Central Valley</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-sm text-slate-400">
              © {currentYear} I Can Swim, LLC. All rights reserved.
            </p>
            <p className="text-sm text-slate-400">
              Adaptive Swim Lessons for Every Swimmer
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}