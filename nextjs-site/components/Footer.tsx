import { FaGithub, FaLinkedin, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { 
      name: 'GitHub', 
      url: 'https://github.com/theoparashkevov', 
      icon: <FaGithub className="h-4 w-4" /> 
    },
    { 
      name: 'LinkedIn', 
      url: 'https://www.linkedin.com/in/teo-parashkevov/', 
      icon: <FaLinkedin className="h-4 w-4" /> 
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com/channel/UCe0mtJP7Pl7JmLG8kDQma-g', 
      icon: <FaYoutube className="h-4 w-4" /> 
    },
  ];

  return (
    <footer className="mt-12 pt-8 border-t border-neutral-200">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-neutral-600 text-sm">
            © {currentYear} Teo Parashkevov
          </p>
        </div>
        
        <div className="flex space-x-4">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-primary transition-colors"
              aria-label={link.name}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;