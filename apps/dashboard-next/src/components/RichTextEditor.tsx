/**
 * Rich Text Editor Component
 * TipTap-based WYSIWYG editor for blog post content
 * Substack-inspired with bubble menu, markdown shortcuts, and comprehensive formatting
 */

import { useEffect, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Blockquote from '@tiptap/extension-blockquote';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { debug } from '@/utils/debug';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code as CodeIcon,
  FileCode,
  Minus,
  Link as LinkIcon,
  ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
}

/**
 * Validates and sanitizes URLs to prevent XSS attacks
 * @param url - The URL to validate
 * @returns Sanitized URL or null if invalid
 */
const validateUrl = (url: string | null): string | null => {
  if (!url || url.trim() === '') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Prevent javascript: protocol and other dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmedUrl.toLowerCase();

  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return null;
  }

  // Sanitize URL with DOMPurify
  const sanitized = DOMPurify.sanitize(trimmedUrl, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  // Basic URL format validation
  try {
    // Allow relative URLs and absolute URLs
    if (sanitized.startsWith('/') || sanitized.startsWith('./') || sanitized.startsWith('../')) {
      return sanitized;
    }

    // For absolute URLs, validate format
    new URL(sanitized);
    return sanitized;
  } catch {
    return null;
  }
};

export const RichTextEditor = ({
  content,
  onChange,
  onImageUpload,
  placeholder = 'Start writing...',
}: RichTextEditorProps) => {
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        strike: false, // We'll use the standalone Strike extension
        code: false, // We'll use the standalone Code extension
        codeBlock: false, // We'll use the standalone CodeBlock extension
        blockquote: false, // We'll use the standalone Blockquote extension
        horizontalRule: false, // We'll use the standalone HorizontalRule extension
      }),
      Underline,
      Strike,
      Code,
      CodeBlock,
      Blockquote,
      HorizontalRule,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-black underline hover:text-gray-700',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none px-3 py-4 [&_ul]:my-0 [&_ol]:my-0 [&_li]:my-0 [&_li_p]:my-0 w-full',
      },
    },
  });

  // Calculate word count (memoized for performance)
  // ✅ MUST be before early return to avoid conditional hook call
  const words = useMemo(() => {
    if (!editor) return 0;
    return editor.state.doc.textContent.split(/\s+/).filter(word => word.length > 0).length;
  }, [editor?.state.doc.textContent]);

  // Sync content prop to editor when it changes (e.g., when loading existing post)
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      if (import.meta.env.DEV) {
        debug.log('📝 RichTextEditor - Syncing content prop to editor:', {
          contentLength: content.length,
          contentPreview: content.substring(0, 100),
        });
      }
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addImage = async () => {
    if (!onImageUpload) {
      const url = window.prompt('Enter image URL:');

      // Validate URL
      const validatedUrl = validateUrl(url);
      if (!validatedUrl) {
        if (url && url.trim() !== '') {
          toast({
            title: 'Invalid URL',
            description: 'Please enter a valid image URL. Dangerous protocols are not allowed.',
            variant: 'destructive'
          });
        }
        return;
      }

      editor.chain().focus().setImage({ src: validatedUrl }).run();
      return;
    }

    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/jpg, image/webp, image/gif';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await onImageUpload(file);
          editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: 'Upload Failed',
            description: 'Failed to upload image. Please try again.',
            variant: 'destructive'
          });
        }
      }
    };
    input.click();
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    // Cancelled
    if (url === null) {
      return;
    }

    // Empty - remove link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Validate URL
    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL. Dangerous protocols like javascript: are not allowed.',
        variant: 'destructive'
      });
      return;
    }

    // Update link with sanitized URL
    editor.chain().focus().extendMarkRange('link').setLink({ href: validatedUrl }).run();
  };

  return (
    <div
      className="border border-gray-300 rounded-2xl overflow-hidden shadow-none flex flex-col h-full"
      role="region"
      aria-label="Rich text editor"
    >
      {/* Bubble Menu - appears on text selection */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex gap-1 p-1 bg-white border border-gray-300 rounded-lg shadow-lg"
          role="toolbar"
          aria-label="Text formatting toolbar"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            title="Bold (⌘B)"
            aria-label="Toggle bold formatting"
            aria-pressed={editor.isActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            title="Italic (⌘I)"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-gray-200' : ''}
            title="Strikethrough (⌘⇧X)"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-gray-200' : ''}
            title="Underline (⌘U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            className={editor.isActive('link') ? 'bg-gray-200' : ''}
            title="Add Link (⌘K)"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      {/* Main Toolbar */}
      <div
        className="flex flex-wrap gap-1 p-2 border-b border-gray-300 bg-transparent flex-shrink-0"
        role="toolbar"
        aria-label="Text formatting options"
      >
        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
          title="Bold (⌘B)"
          aria-label="Toggle bold formatting"
          aria-pressed={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
          title="Italic (⌘I)"
          aria-label="Toggle italic formatting"
          aria-pressed={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-gray-200' : ''}
          title="Underline (⌘U)"
          aria-label="Toggle underline formatting"
          aria-pressed={editor.isActive('underline')}
        >
          <UnderlineIcon className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-gray-200' : ''}
          title="Strikethrough (⌘⇧X)"
          aria-label="Toggle strikethrough formatting"
          aria-pressed={editor.isActive('strike')}
        >
          <Strikethrough className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-gray-200' : ''}
          title="Inline Code (⌘E)"
          aria-label="Toggle inline code formatting"
          aria-pressed={editor.isActive('code')}
        >
          <CodeIcon className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
          title="Heading 1 (Type: # + space)"
          aria-label="Toggle heading level 1"
          aria-pressed={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
          title="Heading 2 (Type: ## + space)"
          aria-label="Toggle heading level 2"
          aria-pressed={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
          title="Heading 3 (Type: ### + space)"
          aria-label="Toggle heading level 3"
          aria-pressed={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists and Quotes */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
          title="Bullet List (Type: * or - + space)"
          aria-label="Toggle bullet list"
          aria-pressed={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
          title="Numbered List (Type: 1. + space)"
          aria-label="Toggle numbered list"
          aria-pressed={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
          title="Quote (Type: > + space)"
          aria-label="Toggle blockquote"
          aria-pressed={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-gray-200' : ''}
          title="Code Block (Type: ``` + space)"
          aria-label="Toggle code block"
          aria-pressed={editor.isActive('codeBlock')}
        >
          <FileCode className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Insert */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule (Type: --- + enter)"
          aria-label="Insert horizontal rule"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addLink}
          className={editor.isActive('link') ? 'bg-gray-200' : ''}
          title="Add Link (⌘K)"
          aria-label="Insert or edit link"
          aria-pressed={editor.isActive('link')}
        >
          <LinkIcon className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          title="Add Image"
          aria-label="Insert image"
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" role="separator" aria-orientation="vertical" />

        {/* History */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (⌘Z)"
          aria-label="Undo last action"
        >
          <Undo className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (⌘⇧Z)"
          aria-label="Redo last action"
        >
          <Redo className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-white lg:h-auto h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {/* Footer with character and word count */}
      <div className="text-xs text-gray-500 px-6 py-2 border-t border-gray-300 bg-transparent flex justify-between items-center flex-shrink-0">
        <div>
          {words} {words === 1 ? 'word' : 'words'} · {editor.storage.characterCount?.characters() || 0} characters
        </div>
        <div className="text-gray-400 text-xs">
          Tip: Use markdown shortcuts like # for headings, * for lists
        </div>
      </div>
    </div>
  );
};
