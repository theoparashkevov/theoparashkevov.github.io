import { getPageBySlug } from '@/lib/content/loader';
import { markdownToHtml } from '@/lib/markdown/processor';
import { notFound } from 'next/navigation';

export default async function AboutPage() {
  const page = getPageBySlug('about');
  
  if (!page) {
    notFound();
  }
  
  // Convert markdown to HTML
  const htmlContent = await markdownToHtml(page.content);
  
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
        <div className="h-1 w-24 bg-blue-600 dark:bg-blue-400"></div>
      </header>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      
      {/* Additional about content from the original index page */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-3xl font-bold mb-6">Skills & Expertise</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Technical Stack</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                <span>Python, Pandas, NumPy, Scikit-learn</span>
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                <span>Django, HTML5, CSS3, Selenium</span>
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                <span>C/C++, Object-Oriented Programming</span>
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                <span>Git, GitHub, CI/CD</span>
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                <span>PostgreSQL, MySQL</span>
              </li>
              <li className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                <span>AWS, Docker, Virtualization</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Core Competencies</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">★</span>
                <span>Machine Learning & AI Development</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">★</span>
                <span>Software Architecture & System Design</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">★</span>
                <span>Data Analysis & Visualization</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">★</span>
                <span>Cloud Infrastructure & DevOps</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">★</span>
                <span>Team Leadership & Mentoring</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">★</span>
                <span>Project Management & Agile Methodologies</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}