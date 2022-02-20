type Json = string | number | boolean | null | JsonObject | readonly Json[];

export type JsonObject = { readonly [key: string]: Json };

export default Json;
