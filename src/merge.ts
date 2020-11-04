/** @fileoverview Merge utils. */

/**
 * Merges target object with the base object recursively and returns newly
 * created object. The values of the target object have priority over the base
 * values.
 *
 * Functions, Map, Set, Arrays or any other 'non-plain' JSON objects are
 * copied by reference. Plain JSON objects not found in the 'partial' are also
 * copied by reference.
 */
export function getDeepMerge<T>(base: T, target: T): T {
  return unprotectedDeepMerge<T>(deepClone<T>(base), target);
}

/**
 * Returns a clone of the given source object with all its fields recursively
 * cloned.
 */
export function deepClone<T>(source: T): T {
  return unprotectedDeepMerge<T>({} as T, source);
}

/**
 * Merges target object with the base object recursively and returns newly
 * created object.
 * Unlike getDeepMerge This merge does not protected copies of the 'base',
 * and is only for internal usage by the getDeepMerge.
 */
function unprotectedDeepMerge<T>(base: T, target: T): T {
  if (!isPlainObject(base) || !isPlainObject(target)) {
    return target;
  }
  const result = {...base};
  for (const key of Object.keys(target) as Array<keyof T>) {
    const baseValue = base[key];
    const partialValue = target[key];
    result[key] = getDeepMerge(baseValue, partialValue);
  }
  return result;
}

/** Checks if the object is a plain JSON object. */
function isPlainObject(obj: unknown): obj is object {
  return !!obj && typeof obj === 'object' && obj!.constructor === Object;
}
