declare module "hyphen/en-us" {
  interface HyphenOptions { hyphenChar?: string; minWordLength?: number }
  export function hyphenateSync(text: string, options?: HyphenOptions): string;
  export function hyphenate(text: string, options?: HyphenOptions): Promise<string>;
}
