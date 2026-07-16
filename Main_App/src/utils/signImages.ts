/**
 * Local image resolver for sign gestures.
 * Dynamically loads images from ImageData folder as they're added.
 * Used as a fallback when Supabase images are unavailable (offline mode).
 *
 * Note: Images are loaded on-demand, so missing images won't cause bundle errors.
 */

// Mapping of available local images (add entries as images are uploaded)
const LOCAL_SIGN_IMAGES: Record<string, any> = {
  // Letters A-Z (add as images are added to src/assets/ImageData/)
  A: require('../assets/ImageData/A.png'),
  B: require('../assets/ImageData/B.png'),
  C: require('../assets/ImageData/C.png'),
  F: require('../assets/ImageData/F.png'),
  G: require('../assets/ImageData/G.png'),

  // TODO: Add remaining letters as images become available
  // D: require('../assets/ImageData/D.png'),
  // E: require('../assets/ImageData/E.png'),
  // H: require('../assets/ImageData/H.png'),
  // ... (H through Z)

  // Free gestures (add as images are added)
  // hello: require('../assets/ImageData/hello.png'),
  // thankyou: require('../assets/ImageData/thankyou.png'),
  // ... (rest of gestures)
};

/**
 * Get local image source for a sign by ID.
 * @param id - Sign ID (e.g. 'A', 'hello', 'wait')
 * @returns Image source for use in React Native Image component, or null if not found
 */
export function getLocalSignImage(id: string) {
  return LOCAL_SIGN_IMAGES[id] ?? null;
}
