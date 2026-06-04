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
      icon: <FaEnvelope className="h-8 w-8" />,
      title: "Email",
      description: "For professional inquiries and collaboration opportunities",
      link: "mailto:theo.parashkevov@gmail.com",
      linkText: "theo.parashkevov@gmail.com",
    },
    {
      icon: <FaLinkedin className="h-8 w-8" />,
      title: "LinkedIn",
      description: "Connect professionally and view my work experience",
      link: "https://www.linkedin.com/in/teo-parashkevov/",
      linkText: "linkedin.com/in/teo-parashkevov",
    },
    {
      icon: <FaGithub className="h-8 w-8" />,
      title: "GitHub",
      description: "Explore my code repositories and open source contributions",
      link: "https://github.com/theoparashkevov",
      linkText: "github.com/theoparashkevov",
    },
    {
      icon: <FaYoutube className="h-8 w-8" />,
      title: "YouTube",
      description: "Watch technical presentations and tutorials",
      link: "https://www.youtube.com/channel/UCe0mtJP7Pl7JmLG8kDQma-g",
      linkText: "youtube.com/@TeoParashkevov",
    },
  ];
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Let&apos;s connect and collaborate on interesting projects.
        </p>
        <div className="h-1 w-24 bg-blue-600 dark:bg-blue-400 mt-4"></div>
      </header>
      
      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      
      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {contactMethods.map((method, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="text-blue-600 dark:text-blue-400 mr-4">
                {method.icon}
              </div>
              <h3 className="text-xl font-semibold">{method.title}</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {method.description}
            </p>
            
            <a
              href={method.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {method.linkText}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ))}
      </div>
      
      {/* Contact Form */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Send me a message</h2>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="What is this regarding?"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="Your message here..."
            ></textarea>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="consent"
              name="consent"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="consent" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              I agree to the processing of my data for the purpose of responding to my inquiry.
            </label>
          </div>
          
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Send Message
          </button>
        </form>
        
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Note: This form is currently a demonstration. For now, please use the email link above 
            to contact me directly.
          </p>
        </div>
      </div>
      
      {/* Response Time */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">Typical Response Time</h3>
            <p className="text-gray-600 dark:text-gray-400">
              I aim to respond to all inquiries within 24-48 hours during business days.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Available for new opportunities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}