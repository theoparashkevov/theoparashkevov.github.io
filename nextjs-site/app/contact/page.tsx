import { getPageBySlug } from '@/lib/content/loader';
import { markdownToHtml } from '@/lib/markdown/processor';
import { notFound } from 'next/navigation';
import { FaEnvelope, FaLinkedin, FaGithub, FaYoutube } from 'react-icons/fa';

export default async function ContactPage() {
  const page = getPageBySlug('contact');
  
  if (!page) {
    notFound();
  }
  
  // Convert markdown to HTML
  const htmlContent = await markdownToHtml(page.content);
  
  const contactMethods = [
    {
      icon: <FaEnvelope className="h-6 w-6" />,
      title: "Email",
      description: "For professional inquiries and collaboration",
      link: "mailto:theo.parashkevov@gmail.com",
      linkText: "theo.parashkevov@gmail.com",
    },
    {
      icon: <FaLinkedin className="h-6 w-6" />,
      title: "LinkedIn",
      description: "Connect professionally",
      link: "https://www.linkedin.com/in/teo-parashkevov/",
      linkText: "linkedin.com/in/teo-parashkevov",
    },
    {
      icon: <FaGithub className="h-6 w-6" />,
      title: "GitHub",
      description: "Explore my code repositories",
      link: "https://github.com/theoparashkevov",
      linkText: "github.com/theoparashkevov",
    },
    {
      icon: <FaYoutube className="h-6 w-6" />,
      title: "YouTube",
      description: "Technical presentations and tutorials",
      link: "https://www.youtube.com/channel/UCe0mtJP7Pl7JmLG8kDQma-g",
      linkText: "youtube.com/@TeoParashkevov",
    },
  ];
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">{page.title}</h1>
        <p className="text-neutral-600">
          Let&apos;s connect and collaborate on interesting projects.
        </p>
        <div className="h-px w-16 bg-primary mt-4"></div>
      </header>
      
      <div className="prose prose-neutral max-w-none mb-8">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      
      {/* Contact Methods - simplified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactMethods.map((method, index) => (
          <div
            key={index}
            className="border border-neutral-200 rounded-lg p-5 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center mb-3">
              <div className="text-primary mr-3">
                {method.icon}
              </div>
              <h3 className="font-semibold text-neutral-800">{method.title}</h3>
            </div>
            
            <p className="text-neutral-600 text-sm mb-3">
              {method.description}
            </p>
            
            <a
              href={method.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark hover:underline text-sm font-medium"
            >
              {method.linkText}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}