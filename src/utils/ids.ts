import { v4 as uuidv4 } from "uuid";

/**
 * Builds a unique instance id of the form `<baseId>_<uuid>`, or
 * `<baseId>_<tag>_<uuid>` when a tag is given.
 *
 * Ids used to be built from `Date.now()`, so two instances created within the
 * same millisecond shared an id.
 */
export const createInstanceId = (baseId: string, tag?: string): string =>
  tag ? `${baseId}_${tag}_${uuidv4()}` : `${baseId}_${uuidv4()}`;
