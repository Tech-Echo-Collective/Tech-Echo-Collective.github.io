import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    const external = href?.startsWith('http://') || href?.startsWith('https://');
    return (
      <a
        {...props}
        href={href}
        rel={external ? 'nofollow noopener noreferrer' : undefined}
        target={external ? '_blank' : undefined}
      >
        {children}
      </a>
    );
  },
};

export function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
