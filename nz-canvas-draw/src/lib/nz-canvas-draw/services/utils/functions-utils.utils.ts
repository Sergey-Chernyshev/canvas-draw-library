export function generateUniqueId(): string {
    return '_' + Math.random().toString(36).slice(2, 11);
}
