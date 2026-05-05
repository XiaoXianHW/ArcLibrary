declare module "@/lib/remark-arc-code.mjs" {
  const plugin: () => (tree: unknown) => void;
  export default plugin;
}
