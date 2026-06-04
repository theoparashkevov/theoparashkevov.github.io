import { FaGithub, FaLinkedin, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { 
      name: 'GitHub', 
      url: 'https://github.com/theoparashkevov', 
      icon: <FaGithub className="h-5 w-5" /> 
    },
    { 
      name: 'LinkedIn', 
      url: 'https://www.linkedin.com/in/teo-parashkevov/', 
      icon: <FaLinkedin className="h-5 w-5" /> 
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com/channel/UCe0mtJP7Pl7JmLG8kDQma-g', 
      icon: <FaYoutube className="h-5 w-5" /> 
    },
  ];

  return (
    <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-gray-600 dark:text-gray-400">
              © {currentYear} Teo Parashkevov. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Built with Next.js & Tailwind CSS
            </p>
          </div>
          
          <div className="flex space-x-6">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            This site is deployed on GitHub Pages.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;