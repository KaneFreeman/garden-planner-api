import { isNullish } from '../../util/null.util';

export interface PictureDataDto {
  readonly date: string;
  readonly id: number;
  readonly pictureId: string;
  readonly thumbnail: string;
  readonly deleted: boolean;
}

export function sanitizePictureDataDto(raw: PictureDataDto[] | null | undefined): PictureDataDto[] | undefined;
export function sanitizePictureDataDto(raw: PictureDataDto | null | undefined): PictureDataDto | undefined;
export function sanitizePictureDataDto(
  raw: PictureDataDto | PictureDataDto[] | null | undefined
): PictureDataDto | PictureDataDto[] | undefined {
  if (isNullish(raw)) {
    return undefined;
  }

  if (!Array.isArray(raw)) {
    return sanitizePictureDataDto([raw])?.[0];
  }

  return raw.map((dto) => ({
    date: `${dto.date}`,
    id: Number(dto.id),
    pictureId: `${dto.pictureId}`,
    thumbnail: `${dto.thumbnail}`,
    deleted: Boolean(dto.deleted)
  }));
}
