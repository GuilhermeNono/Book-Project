import { Book } from '../../domain/entities/Book';
import { IBookCatalogRepository } from '../../domain/repositories/IBookCatalogRepository';

const API_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

interface GoogleBooksVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[];
}

/** Google Books não expõe imagens em https em todas as respostas; Android
 * bloqueia tráfego http em texto puro por padrão, então normalizamos aqui. */
function toHttps(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  return url.replace(/^http:/, 'https:');
}

/**
 * Adaptador que implementa `IBookCatalogRepository` usando a Google Books API.
 * Sem `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` as buscas caem na cota anônima
 * compartilhada do Google (esgota rápido); com a key, usam a cota dedicada
 * do projeto no Google Cloud.
 */
export class GoogleBooksCatalogRepository implements IBookCatalogRepository {
  async search(query: string): Promise<Book[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const url = `${API_URL}?q=${encodeURIComponent(trimmed)}&maxResults=20${
      API_KEY ? `&key=${API_KEY}` : ''
    }`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao buscar livros. Tente novamente.');
    }

    const data: GoogleBooksResponse = await response.json();
    return (data.items ?? []).map((item) => ({
      id: item.id,
      title: item.volumeInfo?.title ?? 'Título desconhecido',
      authors: item.volumeInfo?.authors ?? [],
      coverUrl: toHttps(item.volumeInfo?.imageLinks?.thumbnail),
    }));
  }
}
