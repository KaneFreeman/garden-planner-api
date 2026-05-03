import assert from 'node:assert/strict';
import test from 'node:test';
import { Logger, NotFoundException } from '@nestjs/common';
import { ContainerService } from '../../src/container/container.service';

function createContainerService(overrides?: {
  gardenService?: {
    getGarden?: (...args: unknown[]) => Promise<unknown>;
  };
  containerModel?: {
    create?: (...args: unknown[]) => Promise<unknown>;
    findByIdAndUpdate?: (...args: unknown[]) => Promise<unknown>;
  };
}) {
  const gardenService = overrides?.gardenService ?? { getGarden: async () => ({ _id: 'garden-1' }) };
  const containerModel = overrides?.containerModel ?? {
    create: async (record: Record<string, unknown>) => ({ save: async () => record }),
    findByIdAndUpdate: async () => null
  };

  return new ContainerService(
    containerModel as never,
    {} as Logger,
    {} as never,
    gardenService as never,
    {} as never,
    {} as never
  );
}

test('addContainer rejects when the garden lookup resolves to null', async () => {
  const service = createContainerService({
    gardenService: {
      getGarden: async () => null
    },
    containerModel: {
      create: async () => {
        throw new Error('create should not be called');
      }
    }
  });

  await assert.rejects(
    service.addContainer({ name: 'Test', type: 'Outside', rows: 1, columns: 1, year: 2026 }, 'user-1', 'garden-1'),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, 'Garden does not exist!');
      return true;
    }
  );
});

test('editContainer preserves plantInstanceHistory using the reducer accumulator', async () => {
  let updatedDto: Record<string, unknown> | undefined;
  const service = createContainerService({
    containerModel: {
      create: async () => ({ save: async () => ({}) }),
      findByIdAndUpdate: async (...args: unknown[]) => {
        const update = args[1] as { $set: Record<string, unknown> };
        updatedDto = update.$set;
        return update.$set;
      }
    }
  });

  Object.assign(service, {
    getContainer: async () => ({
      _id: 'container-1',
      name: 'Test',
      gardenId: 'garden-1',
      type: 'Outside',
      year: 2026,
      rows: 1,
      columns: 1,
      slots: {
        '0': {
          plantInstanceId: 'existing-instance'
        }
      },
      startedFrom: 'Seed',
      archived: false
    })
  });

  await service.editContainer(
    'container-1',
    'user-1',
    'garden-1',
    {
      name: 'Test',
      type: 'Outside',
      rows: 1,
      columns: 1,
      year: 2026,
      slots: {
        '0': {
          plantInstanceId: 'new-instance',
          plant: 'ignored'
        }
      }
    } as never,
    false
  );

  const slots = updatedDto?.slots as Record<string, { plantInstanceHistory?: string[]; plant?: string | null }>;
  assert.deepEqual(slots['0'].plantInstanceHistory, ['existing-instance']);
  assert.equal(slots['0'].plant, null);
});
