import { isNullish } from '../../util/null.util';

export interface CommentDto {
  readonly date: string;
  readonly text: string;
}

export function sanitizeCommentDto(raw: CommentDto[] | null | undefined): CommentDto[] | undefined;
export function sanitizeCommentDto(raw: CommentDto | null | undefined): CommentDto | undefined;
export function sanitizeCommentDto(
  raw: CommentDto | CommentDto[] | null | undefined
): CommentDto | CommentDto[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizeCommentDto([raw])?.[0];
  }

  return raw.map((dto) => ({
    date: `${dto.date}`,
    text: `${dto.text}`
  }));
}
