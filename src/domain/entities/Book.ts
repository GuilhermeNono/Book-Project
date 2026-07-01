/** Um livro, vindo de um catálogo externo ou salvo na vitrine do usuário. */
export interface Book {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
}
