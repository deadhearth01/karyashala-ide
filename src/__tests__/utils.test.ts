import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  test('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  test('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toBe('base included');
  });

  test('should merge tailwind classes correctly', () => {
    // Later classes should override earlier ones for the same property
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  test('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'valid');
    expect(result).toBe('base valid');
  });

  test('should handle empty strings', () => {
    const result = cn('base', '', 'valid');
    expect(result).toBe('base valid');
  });

  test('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  test('should handle object syntax', () => {
    const result = cn({
      'bg-blue-500': true,
      'text-white': true,
      'hidden': false,
    });
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('text-white');
    expect(result).not.toContain('hidden');
  });

  test('should handle mixed inputs', () => {
    const result = cn(
      'base-class',
      ['array-class'],
      { 'object-class': true },
      undefined,
      'final-class'
    );
    expect(result).toContain('base-class');
    expect(result).toContain('array-class');
    expect(result).toContain('object-class');
    expect(result).toContain('final-class');
  });

  test('should dedupe conflicting tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  test('should keep non-conflicting tailwind classes', () => {
    const result = cn('bg-red-500', 'text-blue-500');
    expect(result).toContain('bg-red-500');
    expect(result).toContain('text-blue-500');
  });
});
