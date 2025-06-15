import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import { LineHeight } from './LineHeight';
import FontSize from '@tiptap/extension-font-size';
// import TaskList from '@tiptap/extension-task-list';
// import TaskItem from '@tiptap/extension-task-item';

// Extend Tiptap extensions to add keyboard shortcuts
const CustomSubscript = Subscript.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-,': () => this.editor.commands.toggleSubscript(),
    };
  },
});

const CustomSuperscript = Superscript.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-.': () => this.editor.commands.toggleSuperscript(),
    };
  },
});

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-primary pl-4 italic my-4 p-4 bg-primary/10 rounded-r-md',
      },
    },
  }),
  Underline,
  TextStyle,
  FontSize.configure({
    types: ['textStyle'],
  }),
  FontFamily.configure({
    types: ['textStyle'],
  }),
  Color,
  Image,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Highlight.configure({ multicolor: true }),
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  CustomSubscript,
  CustomSuperscript,
  // TaskList,
  // TaskItem.configure({
  //   nested: true,
  // }),
  CharacterCount,
  LineHeight,
];
