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
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
        <div className="h-px w-16 bg-primary"></div>
      </header>
      
      <div className="prose prose-neutral max-w-none mb-8">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      
      {/* Skills - simplified */}
      <div className="border-t border-neutral-200 pt-8">
        <h2 className="text-xl font-semibold mb-4">Technical Skills</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Languages & Frameworks</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span>Python, Pandas, NumPy, Scikit-learn</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span>Django, HTML5, CSS3, JavaScript</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span>C/C++, Object-Oriented Programming</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Tools & Technologies</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span>Git, GitHub, CI/CD</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span>PostgreSQL, MySQL</span>
              </li>
              <li className="flex items-center">
                <span className="text-primary mr-2">•</span>
                <span>AWS, Docker, Linux</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}