/**
 * Ensures that a value is defined (not null or undefined). Returns the value if defined,
 * otherwise throw an error.
 *
 * @example
 * ```typescript
 * const user = await fetchUser();
 * // user is of type User | null
 * const user2 = ensure(user, "User must be defined");
 * // user2 is now typed as User, not User | null
 * ```
 */
export function ensure<T>(value: T | null | undefined, message: string): T {
    if (value === null || value === undefined) {
        throw new Error(message);
    }
    return value;
}
