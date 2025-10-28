import { useEffect, useRef } from "react";

interface ArticleContentProps {
  content: string;
}

export const ArticleContent = ({ content }: ArticleContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;
    
    // Add drop cap to first paragraph
    const firstParagraph = container.querySelector('p:first-of-type');
    if (firstParagraph && !firstParagraph.classList.contains('drop-cap-applied')) {
      firstParagraph.classList.add('drop-cap', 'drop-cap-applied');
    }

    // Style all blockquotes as pull quotes
    const blockquotes = container.querySelectorAll('blockquote');
    blockquotes.forEach((quote) => {
      quote.classList.add('pull-quote');
    });

    // Add decorative elements to h2 headings
    const h2s = container.querySelectorAll('h2');
    h2s.forEach((h2) => {
      if (!h2.querySelector('.heading-decorator')) {
        const decorator = document.createElement('span');
        decorator.className = 'heading-decorator';
        h2.insertBefore(decorator, h2.firstChild);
      }
    });
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className="article-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
