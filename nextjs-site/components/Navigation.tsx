import Link from 'next/link';

const Navigation = () => {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="border-b border-neutral-200 pb-4 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-lg font-semibold text-neutral-800">
            Teo Parashkevov
          </Link>
        </div>
        
        <div className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-neutral-600 hover:text-primary transition-colors text-sm font-medium"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;