// @types/present.d.ts
declare module 'present' {
    export function encrypt(message: string, key: Buffer): string;
    export function decrypt(encryptedMessage: string, key: Buffer): string;
}