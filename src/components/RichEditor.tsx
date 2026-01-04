import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichEditor({ content, onChange, placeholder = 'Введіть текст...', className }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/90',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      HorizontalRule,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4 prose-headings:font-heading prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight prose-h1:text-4xl prose-h1:sm:text-5xl prose-h1:lg:text-6xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:font-heading prose-h1:font-bold prose-h2:text-3xl prose-h2:sm:text-4xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:font-heading prose-h2:font-bold prose-h3:text-2xl prose-h3:sm:text-3xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:font-heading prose-h3:font-bold prose-h4:text-xl prose-h4:sm:text-2xl prose-h4:mb-2 prose-h4:mt-4 prose-h4:font-heading prose-h4:font-bold prose-p:text-lg prose-p:text-foreground prose-p:mb-4 prose-p:font-body prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-bold prose-em:text-foreground prose-em:italic prose-ul:text-lg prose-ul:text-foreground prose-ul:mb-4 prose-ul:font-body prose-ol:text-lg prose-ol:text-foreground prose-ol:mb-4 prose-ol:font-body prose-li:text-foreground prose-li:mb-2 prose-li:font-body prose-img:rounded-lg prose-img:my-6 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:font-body dark:prose-invert',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Введіть URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Введіть URL зображення:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border" />
        
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={addLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('horizontalRule') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border" />
        
        <select
          className="h-8 px-2 text-sm border rounded-md bg-background"
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) {
              editor.chain().focus().setParagraph().run();
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
            }
          }}
        >
          <option value="0">Параграф</option>
          <option value="1">Заголовок 1</option>
          <option value="2">Заголовок 2</option>
          <option value="3">Заголовок 3</option>
          <option value="4">Заголовок 4</option>
          <option value="5">Заголовок 5</option>
          <option value="6">Заголовок 6</option>
        </select>
      </div>

      {/* Editor */}
      <div className="min-h-[300px] max-h-[600px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

