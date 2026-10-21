export const SITE_URL = 'https://theoparashkevov.github.io';
export const SITE_TITLE = 'Teo Parashkevov';
export const SITE_TAGLINE = 'Machine Learning Engineer & Senior Python Developer';
export const SITE_DESCRIPTION =
  'Personal blog and portfolio of Teo Parashkevov, Machine Learning Engineer and Senior Python Developer, writing about scalable systems, AI, and software engineering.';
export const AUTHOR = {
  name: 'Teo Parashkevov',
  email: 'theo.parashkevov@gmail.com',
  avatar: '/assets/img/Teo-Parashkevov-Home.jpg',
};

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/blog/', label: 'Blog' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/theoparashkevov', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/teo-parashkevov/', icon: 'linkedin' },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCe0mtJP7Pl7JmLG8kDQma-g',
    icon: 'youtube',
  },
  { label: 'Email', href: 'mailto:theo.parashkevov@gmail.com', icon: 'mail' },
  { label: 'RSS', href: '/rss.xml', icon: 'rss' },
] as const;
