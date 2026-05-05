/**
 * Optional analytics integration.
 *
 * Both the script URL and the site identifier come from environment
 * variables, so:
 *
 * - The repo never carries any specific deployment's site ID.
 * - Forks / clones that don't set the env vars get NO analytics script —
 *   no risk of accidentally pumping data into the upstream maintainer's
 *   account just by deploying a fork.
 * - The canonical operator only needs to set the two `NEXT_PUBLIC_*` vars
 *   in their hosting dashboard (e.g. Vercel project settings) for the
 *   script to start rendering.
 *
 * Currently wired up for Rybbit (https://rybbit.io), but the same
 * pattern works for any third-party tag — it is just one `<script>`.
 */
export function Analytics() {
  const siteId = process.env.NEXT_PUBLIC_RYBBIT_SITE_ID;
  if (!siteId) return null;

  const scriptUrl =
    process.env.NEXT_PUBLIC_RYBBIT_SCRIPT_URL ??
    "https://app.rybbit.io/api/script.js";

  // Validate the URL so a malformed value can't break the page render.
  try {
    new URL(scriptUrl);
  } catch {
    return null;
  }

  return <script src={scriptUrl} data-site-id={siteId} defer />;
}
