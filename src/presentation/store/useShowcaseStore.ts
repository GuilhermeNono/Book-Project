import { create } from 'zustand';

import { Book } from '../../domain/entities/Book';
import { container } from '../../infrastructure/di/container';

interface ShowcaseState {
  books: Book[];
  searchResults: Book[];
  searching: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  init: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  addBook: (book: Book) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Store de apresentação para a vitrine de livros. Segue o mesmo formato de
 * `useReadingStore`: nenhum componente importa o `container` diretamente.
 */
export const useShowcaseStore = create<ShowcaseState>((set, get) => ({
  books: [],
  searchResults: [],
  searching: false,
  loading: false,
  initialized: false,
  error: null,

  init: async () => {
    set({ loading: true });
    try {
      const books = await container.getShowcase.execute();
      set({ books, loading: false, initialized: true, error: null });
    } catch (err) {
      set({
        loading: false,
        initialized: true,
        error: err instanceof Error ? err.message : 'Falha ao carregar a vitrine.',
      });
    }
  },

  search: async (query: string) => {
    set({ searching: true });
    try {
      const searchResults = await container.searchBooks.execute(query);
      set({ searchResults, searching: false, error: null });
    } catch (err) {
      set({
        searching: false,
        error: err instanceof Error ? err.message : 'Falha ao buscar livros.',
      });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  addBook: async (book: Book) => {
    const alreadyAdded = get().books.some((b) => b.id === book.id);
    if (alreadyAdded) {
      return;
    }
    await container.addToShowcase.execute(book);
    set({ books: [...get().books, book] });
  },

  removeBook: async (bookId: string) => {
    await container.removeFromShowcase.execute(bookId);
    set({ books: get().books.filter((b) => b.id !== bookId) });
  },

  reset: () => {
    set({
      books: [],
      searchResults: [],
      searching: false,
      loading: false,
      initialized: false,
      error: null,
    });
  },
}));
