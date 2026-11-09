import { ValidateBy, ValidationOptions } from 'class-validator';

const NULL_CHARACTER = String.fromCharCode(0);

// O text do Postgres recusa o U+0000: sem esta regra, ele viraria erro inesperado na gravação.
export function NoNullCharacter(
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'noNullCharacter',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && !value.includes(NULL_CHARACTER),
        defaultMessage: () => '$property não pode ter o caractere nulo',
      },
    },
    options,
  );
}
