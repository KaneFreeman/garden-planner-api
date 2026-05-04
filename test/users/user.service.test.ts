import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, Logger } from '@nestjs/common';
import { UserService } from '../../src/users/user.service';

function createUserService() {
  const userModel = {
    create: async () => {
      throw new Error('create should not be called');
    },
    findByIdAndUpdate: async () => {
      throw new Error('findByIdAndUpdate should not be called');
    }
  };

  return new UserService({} as Logger, userModel as never, {} as never, {} as never, {} as never);
}

test('createUser rejects stale password fields', async () => {
  const service = createUserService();

  await assert.rejects(
    service.createUser({
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      summaryEmail: true,
      zipCode: '11111',
      password: 'legacy'
    } as never),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, 'Password authentication has been removed');
      return true;
    }
  );
});

test('updateUser rejects stale password fields', async () => {
  const service = createUserService();

  await assert.rejects(
    service.updateUser('user-1', {
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      summaryEmail: true,
      zipCode: '11111',
      password: 'legacy'
    } as never),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(error.message, 'Password authentication has been removed');
      return true;
    }
  );
});
