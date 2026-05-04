import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';
import { PictureService } from '../../src/picture/picture.service';

test('addPicture persists the authenticated user id', async () => {
  let createdRecord: Record<string, unknown> | undefined;
  const savedRecord = { _id: 'picture-1', dataUrl: 'data:image/png;base64,abc' };
  const pictureModel = {
    create: async (record: Record<string, unknown>) => {
      createdRecord = record;
      return {
        save: async () => savedRecord
      };
    }
  };

  const service = new PictureService(pictureModel as never, { publishUserSync: () => undefined } as never);
  const userId = new Types.ObjectId().toString();
  const result = await service.addPicture({ dataUrl: savedRecord.dataUrl }, userId);

  assert.equal(result, savedRecord);
  assert.equal((createdRecord?.userId as Types.ObjectId).toString(), userId);
  assert.equal(createdRecord?.dataUrl, savedRecord.dataUrl);
});

test('picture lookups and deletes are scoped to the authenticated user', async () => {
  const queries: Array<Record<string, unknown>> = [];
  const pictureModel = {
    findOne: (query: Record<string, unknown>) => {
      queries.push(query);
      return {
        exec: async () => ({ _id: 'picture-1' })
      };
    },
    findOneAndDelete: (query: Record<string, unknown>) => {
      queries.push(query);
      return { _id: 'picture-1' };
    }
  };

  const service = new PictureService(pictureModel as never, { publishUserSync: () => undefined } as never);
  const userId = new Types.ObjectId().toString();

  await service.getPicture('picture-1', userId);
  await service.deletePicture('picture-1', userId);

  assert.equal(queries.length, 2);
  for (const query of queries) {
    assert.equal(query._id, 'picture-1');
    assert.equal((query.userId as Types.ObjectId).toString(), userId);
  }
});
