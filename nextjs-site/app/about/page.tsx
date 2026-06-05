import { getPageBySlug } from '@/lib/content/loader';
import { markdownToHtml } from '@/lib/markdown/processor';
import { sanitizeHTML } from '@/lib/utils/sanitize-html';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { generateSEO } from '@/lib/seo/metadata';

export const metadata: Metadata = generateSEO({
  title: 'About',
  description: 'Learn more about Teo Parashkevov, a Machine Learning Engineer and Senior Python Developer.',
  url: '/about/',
});

export default async function AboutPage() {
  const page = getPageBySlug('about');
  
  if (!page) {
    notFound();
  }
  
  // Convert markdown to HTML and sanitize for XSS prevention
  const htmlContent = sanitizeHTML(await markdownToHtml(page.content));
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">{page.title}</h1>
        <div className="h-px w-16 bg-primary"></div>
      </header>
      
      <div className="prose prose-neutral max-w-none mb-8">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      
      {/* Skills - simplified */}
      <div className="border-t border-neutral-200 pt-8">
        <h2 className="text-xl font-semibold mb-4 text-neutral-800">Technical Skills</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-neutral-200 rounded-lg p-5">
            <h3 className="font-medium mb-3 text-neutral-800">Languages & Frameworks</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span className="text-neutral-700">Python, Pandas, NumPy, Scikit-learn</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span className="text-neutral-700">Django, HTML5, CSS3, JavaScript</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span className="text-neutral-700">C/C++, Object-Oriented Programming</span>
              </li>
            </ul>
          </div>
          
          <div className="border border-neutral-200 rounded-lg p-5">
            <h3 className="font-medium mb-3 text-neutral-800">Tools & Technologies</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span className="text-neutral-700">Git, GitHub, CI/CD</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span className="text-neutral-700">PostgreSQL, MySQL</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span className="text-neutral-700">AWS, Docker, Linux</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}