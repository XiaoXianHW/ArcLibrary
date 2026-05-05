import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // We rely on the SSR-safe pattern of reading from `localStorage` /
      // `document` inside an effect on first mount, then syncing the result
      // into state. The new strict rule from `eslint-plugin-react-hooks` v7
      // flags this, but the alternative (lazy initializer) does not work in
      // RSC because `localStorage` is not available on the server.
      "react-hooks/set-state-in-effect": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
];
