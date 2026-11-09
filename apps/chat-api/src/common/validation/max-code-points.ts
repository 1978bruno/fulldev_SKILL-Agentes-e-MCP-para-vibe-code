import { ValidateBy, ValidationOptions } from 'class-validator';
import { codePointLength } from './code-points';

// Tamanho máximo em pontos de código, o mesmo que o char_length do Postgres conta.
export function MaxCodePoints(
  max: number,
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'maxCodePoints',
      constraints: [max],
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && codePointLength(value) <= max,
        defaultMessage: () => `$property pode ter no máximo ${max} caracteres`,
      },
    },
    options,
  );
}
