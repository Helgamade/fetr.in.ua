import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

// Для TinyMCE нужен API key (даже бесплатный) от https://www.tiny.cloud/
// Или использовать self-hosted версию (см. документацию)
// Временное решение - использовать бесплатный API key

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
        apiKey="5d1p6abbg6cfswxaikso0fiwwlpcvppyeqv09wld5lk9w4sx"
        onInit={(evt, editor) => {
          editorRef.current = editor;
        }}
        value={content}
        onEditorChange={(content) => {
          onChange(content);
        }}
        init={{
          height: 700,
          menubar: false,
          placeholder,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount',
            'emoticons', 'codesample', 'nonbreaking', 'pagebreak', 'save', 'visualchars', 'accordion'
          ],
          toolbar: [
            'undo redo | blocks | styles | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote',
            'link image media | charmap emoticons | insertdatetime | anchor | table | codesample | visualblocks visualchars | searchreplace | nonbreaking pagebreak | save accordion | removeformat | code | preview | fullscreen | help'
          ],
          style_formats: [
            {
              title: 'Текст без обгортки',
              inline: 'span',
              remove: 'p',
              styles: { display: 'inline' }
            },
            {
              title: 'Цитата',
              block: 'blockquote',
              wrapper: true,
              classes: 'quote-style'
            },
            {
              title: 'Блок з відступом',
              block: 'div',
              classes: 'indent-block',
              wrapper: true
            },
            {
              title: 'Блок з фоном',
              block: 'div',
              classes: 'highlight-block',
              wrapper: true
            },
            {
              title: 'Блок з рамкою',
              block: 'div',
              classes: 'bordered-block',
              wrapper: true
            }
          ],
          style_formats_merge: false,
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
              font-size: 36px;
              font-weight: 700;
              margin-top: 2rem;
              margin-bottom: 1.5rem;
            }
            h2 {
              font-family: Montserrat, sans-serif;
              font-size: 24px;
              font-weight: 600;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            h3 {
              font-family: Montserrat, sans-serif;
              font-size: 16px;
              font-weight: 700;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            h4 {
              font-family: Montserrat, sans-serif;
              font-size: 14px;
              font-weight: 700;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
            }
            h5 {
              font-family: Montserrat, sans-serif;
              font-size: 13px;
              font-weight: 700;
              margin-top: 1rem;
              margin-bottom: 0.5rem;
            }
            h6 {
              font-family: Montserrat, sans-serif;
              font-size: 12px;
              font-weight: 700;
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
            ul ul, ol ol, ul ol, ol ul {
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
              padding-left: 1.5rem;
            }
            ul ul {
              list-style-type: circle;
            }
            ul ul ul {
              list-style-type: square;
            }
            ol ol {
              list-style-type: lower-alpha;
            }
            ol ol ol {
              list-style-type: lower-roman;
            }
            blockquote {
              margin-top: 1.5rem;
              margin-bottom: 1.5rem;
              padding: 1rem;
              padding-left: 1.5rem;
              border-left: 4px solid #f97316;
              background: rgba(245, 245, 245, 0.5);
              font-style: italic;
            }
            .indent-block {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding-left: 2rem;
              padding-right: 1rem;
              border-left: 2px solid #e5e7eb;
              display: block;
            }
            .highlight-block {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding: 1rem;
              background: rgba(245, 245, 245, 0.8);
              border-radius: 0.5rem;
              display: block;
            }
            .bordered-block {
              margin-top: 1rem;
              margin-bottom: 1rem;
              padding: 1rem;
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              background: #ffffff;
              display: block;
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

