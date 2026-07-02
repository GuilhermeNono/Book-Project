/** Uma mensagem de texto trocada entre dois amigos. */
export interface Message {
  id: number;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}
