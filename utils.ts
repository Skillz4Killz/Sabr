export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

// deno-lint-ignore no-explicit-any
export function isObject(item: any) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function deepMerge(
  // deno-lint-ignore no-explicit-any
  baseObject: any,
  // deno-lint-ignore no-explicit-any
  ...mergeObjects: any
): // deno-lint-ignore no-explicit-any
Record<string, any> {
  if (!mergeObjects.length) return baseObject;
  const source = mergeObjects.shift();

  if (isObject(baseObject) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!baseObject[key]) Object.assign(baseObject, { [key]: {} });
        deepMerge(baseObject[key], source[key]);
      } else {
        Object.assign(baseObject, { [key]: source[key] });
      }
    }
  }

  return deepMerge(baseObject, ...mergeObjects);
}
