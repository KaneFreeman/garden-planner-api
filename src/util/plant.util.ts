import type { PlantProjection } from '../plant/interfaces/plant.projection';

export function getPlantTitle(plant: PlantProjection, name?: string) {
  const plantName = name ?? plant.name;

  return `${plant.type && plant.type !== plantName ? `${plant.type} - ` : ''}${plantName}`;
}
