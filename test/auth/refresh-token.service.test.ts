import assert from 'node:assert/strict';
import test from 'node:test';
import { Logger } from '@nestjs/common';
import { RefreshTokenService } from '../../src/auth/services/refresh-token.service';

const TWO_WEEKS_IN_MS = 14 * 24 * 60 * 60 * 1000;

test('createRefreshToken stores a refresh token with a two week expiry', async () => {
  let createdRecord: Record<string, unknown> | undefined;
  const refreshTokenModel = {
    create: async (record: Record<string, unknown>) => {
      createdRecord = record;
      return record;
    }
  };
  const jwtService = {
    sign: () => 'signed-refresh-token'
  };

  const service = new RefreshTokenService({} as Logger, refreshTokenModel as never, jwtService as never);

  const before = Date.now();
  const refreshToken = await service.createRefreshToken('user-1', 'device-1');
  const after = Date.now();

  assert.equal(refreshToken, 'signed-refresh-token');
  assert.equal(createdRecord?.userId, 'user-1');
  assert.equal(createdRecord?.deviceId, 'device-1');
  assert.equal(createdRecord?.refreshToken, 'signed-refresh-token');
  assert.ok(createdRecord?.expiresAt instanceof Date);

  const expiresAt = (createdRecord?.expiresAt as Date).getTime();
  assert.ok(expiresAt >= before + TWO_WEEKS_IN_MS);
  assert.ok(expiresAt <= after + TWO_WEEKS_IN_MS);
});

test('getByRefreshTokenAndDeviceId scopes lookup to unexpired tokens', async () => {
  let query: Record<string, unknown> | undefined;
  const refreshTokenModel = {
    findOne: (input: Record<string, unknown>) => {
      query = input;
      return {
        exec: async () => ({ _id: 'record-1' })
      };
    }
  };

  const service = new RefreshTokenService({} as Logger, refreshTokenModel as never, { sign: () => 'unused' } as never);

  const result = await service.getByRefreshTokenAndDeviceId('refresh-token', 'device-1');

  assert.deepEqual(result, { _id: 'record-1' });
  assert.equal(query?.refreshToken, 'refresh-token');
  assert.equal(query?.deviceId, 'device-1');
  assert.ok(query?.expiresAt && typeof query.expiresAt === 'object');
  assert.ok((query?.expiresAt as { $gt: unknown }).$gt instanceof Date);
});

test('getByRefreshTokenAndDeviceId returns null when token or device is missing', async () => {
  const refreshTokenModel = {
    findOne: () => {
      throw new Error('findOne should not be called');
    }
  };

  const service = new RefreshTokenService({} as Logger, refreshTokenModel as never, { sign: () => 'unused' } as never);

  assert.equal(await service.getByRefreshTokenAndDeviceId(undefined, 'device-1'), null);
  assert.equal(await service.getByRefreshTokenAndDeviceId('refresh-token', undefined), null);
});
