import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface TinyMCEEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function TinyMCEEditor({ content, onChange, placeholder = 'Введіть текст...', className }: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <Editor
        apiKey="no-api-key" // Для локального использования без ключа API
        onInit={(evt, editor) => {
          editorRef.current = editor;
        }}
        value={content}
        onEditorChange={(content) => {
          onChange(content);
        }}
        init={{
          height: 500,
          menubar: false,
          placeholder,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | bold italic | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | link image | ' +
            'removeformat | code | help',
          content_style: `
            body { 
              font-family: Nunito, sans-serif; 
              font-size: 18px; 
              line-height: 1.6;
              color: hsl(var(--foreground));
              background: hsl(var(--background));
            }
            h1 {
              font-family: Montserrat, sans-serif;
              font-size: 2.5rem;
              font-weight: bold;
              margin-top: 2rem;
              margin-bottom: 1.5rem;
            }
            h2 {
              font-family: Montserrat, sans-serif;
              font-size: 2rem;
              font-weight: bold;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            h3 {
              font-family: Montserrat, sans-serif;
              font-size: 1.5rem;
              font-weight: bold;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            h4 {
              font-family: Montserrat, sans-serif;
              font-size: 1.25rem;
              font-weight: bold;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
            }
            h5 {
              font-family: Montserrat, sans-serif;
              font-size: 1.125rem;
              font-weight: bold;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
            }
            h6 {
              font-family: Montserrat, sans-serif;
              font-size: 1rem;
              font-weight: bold;
              margin-top: 0.75rem;
              margin-bottom: 0.5rem;
            }
            p {
              margin-top: 0;
              margin-bottom: 1rem;
            }
            ul, ol {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            li {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
            }
            blockquote {
              margin-top: 1.5rem;
              margin-bottom: 1.5rem;
              padding: 1rem;
              border-left: 4px solid hsl(var(--primary));
              background: hsl(var(--muted) / 0.3);
              font-style: italic;
            }
            hr {
              margin-top: 2rem;
              margin-bottom: 2rem;
              border-top: 1px solid hsl(var(--border));
            }
            pre {
              margin-top: 1.5rem;
              margin-bottom: 1.5rem;
              padding: 1rem;
              background: hsl(var(--muted));
              border-radius: 0.5rem;
              overflow-x: auto;
            }
            a {
              color: hsl(var(--primary));
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          `,
          skin: 'oxide',
          content_css: false,
        }}
      />
    </div>
  );
}

