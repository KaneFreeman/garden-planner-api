import assert from 'node:assert/strict';
import test from 'node:test';
import { Logger, NotFoundException } from '@nestjs/common';
import { PlantInstanceService } from '../../src/plant-instance/plant-instance.service';

function createPlantInstanceService() {
  const plantInstanceModel = {
    create: async () => {
      throw new Error('create should not be called');
    }
  };

  return new PlantInstanceService(
    plantInstanceModel as never,
    {} as Logger,
    {} as never,
    {} as never,
    {
      getContainer: async () => null
    } as never,
    {} as never
  );
}

test('addPlantInstance rejects when the container lookup resolves to null', async () => {
  const service = createPlantInstanceService();

  await assert.rejects(
    service.addPlantInstance(
      {
        containerId: 'container-1',
        slotId: 0,
        plant: null,
        created: new Date().toISOString(),
        startedFrom: 'Seed',
        season: 'Spring'
      } as never,
      'user-1',
      'garden-1',
      { createTasks: false }
    ),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(error.message, 'Container does not exist!');
      return true;
    }
  );
});
