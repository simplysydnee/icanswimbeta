import Image from 'next/image';

export default function WaiverUpdateLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <Image
            src="/images/logo.svg"
            alt="I Can Swim"
            width={160}
            height={40}
            priority
          />
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>Questions? Call us at (209) 778-7877</p>
          <p className="mt-1">© {new Date().getFullYear()} I Can Swim, LLC</p>
        </div>
      </footer>
    </div>
  );
}