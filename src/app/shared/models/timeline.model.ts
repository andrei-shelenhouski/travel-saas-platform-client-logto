export type AuthorDto = { id: string; fullName: string };
export type ActorDto = { id: string; fullName: string };

export type TimelineItemResponse = {
  type: string;
  id: string;
  action?: string;
  details?: Record<string, unknown>;
  actor?: ActorDto;
  body?: string;
  author?: AuthorDto;
  isEdited?: boolean;
  editedAt?: string;
  createdAt: string;
};
