import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/images/logo-header.svg"
                alt="I Can Swim"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              Building confidence, safety, and joy in the water through personalized, adaptive instruction
              tailored to each swimmer&apos;s unique needs. Serving Central Valley families since 2015.
            </p>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>(209) 778-7877</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@icanswim209.com</span>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <a href="https://facebook.com/icanswim209" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://instagram.com/icanswim209" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div>
            <h3 className="font-semibold mb-3">Our Location</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Modesto</strong><br />
                    1212 Kansas Ave<br />
                    Modesto, CA 95351
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/signup" className="hover:text-primary transition-colors">
                  Book Assessment
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Parent Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Our Program
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 I Can Swim, LLC. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2 sm:mt-0">
            Adaptive Swim Lessons for Every Child
          </p>
        </div>
      </div>
    </footer>
  );
}