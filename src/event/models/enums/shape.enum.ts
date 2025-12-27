import { registerEnumType } from '@nestjs/graphql';

export enum ShapeType {
  CIRCLE = 'circle',
  GALA = 'gala',
  GRID = 'grid',
  U = 'u',
  U_FORM = 'u-form',
  HORSESHOE = 'horseshoe',
  SCATTER = 'scatter',
  VIP = 'vip',
  SPIRAL = 'spiral',
}

registerEnumType(ShapeType, {
  name: 'ShapeType',
});
