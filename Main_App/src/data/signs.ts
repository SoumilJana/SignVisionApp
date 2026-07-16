/**
 * Pre-bundled sign data — offline-first, no network required.
 * Free tier: all 26 letters + 10 gestures
 * Pro tier: all letters + all 20 gestures
 */

export type SignCategory = 'letter' | 'gesture';

export interface Sign {
  id: string;
  label: string;        // e.g. "A" or "Hello"
  subtitle: string;     // e.g. "Apple" or "Wave hand near forehead"
  category: SignCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  steps: string[];
  isPro: boolean;       // true = Pro-only content
  emoji: string;
  imageUrl?: string;    // Supabase public URL; falls back to local bundled image if undefined
}

// ── 26 ASL Alphabet Letters (all free) ─────────────────────────────────────
export const LETTERS: Sign[] = [
  { id: 'A', label: 'A', subtitle: 'Apple', category: 'letter', difficulty: 'Beginner', emoji: '🤜',
    steps: ['Form a fist with all four fingers.', 'Extend your thumb sideways against your index finger.', 'Hold the position with your palm facing outward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/A.png' },
  { id: 'B', label: 'B', subtitle: 'Ball', category: 'letter', difficulty: 'Beginner', emoji: '🖐',
    steps: ['Hold all four fingers straight up and together.', 'Fold your thumb across your palm.', 'Keep your palm facing outward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/B.png' },
  { id: 'C', label: 'C', subtitle: 'Cat', category: 'letter', difficulty: 'Beginner', emoji: '🤏',
    steps: ['Curve all fingers into a C shape.', 'Keep your thumb relaxed below.', 'Palm faces sideways.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/C.png' },
  { id: 'D', label: 'D', subtitle: 'Dog', category: 'letter', difficulty: 'Beginner', emoji: '👆',
    steps: ['Touch the tip of your index finger to the tip of your thumb.', 'Curve the other three fingers slightly.', 'Palm faces outward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/D.png' },
  { id: 'E', label: 'E', subtitle: 'Elephant', category: 'letter', difficulty: 'Beginner', emoji: '✊',
    steps: ['Bend all four fingers down at the middle knuckle.', 'Fold your thumb against your fingers.', 'Your fingertips should point downward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/E.png' },
  { id: 'F', label: 'F', subtitle: 'Fish', category: 'letter', difficulty: 'Beginner', emoji: '👌',
    steps: ['Touch your index finger to your thumb.', 'Hold the other three fingers extended and spread.', 'Palm faces outward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/F.png' },
  { id: 'G', label: 'G', subtitle: 'Grapes', category: 'letter', difficulty: 'Beginner', emoji: '👈',
    steps: ['Point your index finger sideways.', 'Hold your thumb parallel to your index finger.', 'Other fingers are curled in.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/G.png' },
  { id: 'H', label: 'H', subtitle: 'Hat', category: 'letter', difficulty: 'Beginner', emoji: '✌',
    steps: ['Extend your index and middle fingers sideways.', 'Keep them together, pointing to the side.', 'Fold the other fingers and thumb.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/H.png' },
  { id: 'I', label: 'I', subtitle: 'Ice cream', category: 'letter', difficulty: 'Beginner', emoji: '🤙',
    steps: ['Raise only your pinky finger.', 'Fold all other fingers down.', 'Thumb can rest folded or slightly extended.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/I.png' },
  { id: 'J', label: 'J', subtitle: 'Jump', category: 'letter', difficulty: 'Beginner', emoji: '🏃',
    steps: ['Start with the "I" handshape (pinky up).', 'Draw the letter J in the air — first pull down, then curve up and left.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/J.png' },
  { id: 'K', label: 'K', subtitle: 'Key', category: 'letter', difficulty: 'Intermediate', emoji: '🔑',
    steps: ['Extend your index and middle fingers in a V shape.', 'Place your thumb between them.', 'Other fingers fold down.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/K.png' },
  { id: 'L', label: 'L', subtitle: 'Lemon', category: 'letter', difficulty: 'Beginner', emoji: '🤙',
    steps: ['Extend your index finger upward.', 'Extend your thumb outward, forming an L.', 'Other fingers fold down.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/L.png' },
  { id: 'M', label: 'M', subtitle: 'Moon', category: 'letter', difficulty: 'Intermediate', emoji: '🌙',
    steps: ['Fold your index, middle, and ring finger over your thumb.', 'Pinky remains folded or slightly extended.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/M.png' },
  { id: 'N', label: 'N', subtitle: 'Night', category: 'letter', difficulty: 'Intermediate', emoji: '🌃',
    steps: ['Fold your index and middle fingers over your thumb.', 'Other fingers stay folded.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/N.png' },
  { id: 'O', label: 'O', subtitle: 'Orange', category: 'letter', difficulty: 'Beginner', emoji: '🍊',
    steps: ['Curve all fingers to touch your thumb.', 'Form a rounded "O" shape.', 'Palm faces outward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/O.png' },
  { id: 'P', label: 'P', subtitle: 'Pen', category: 'letter', difficulty: 'Intermediate', emoji: '✏',
    steps: ['Start with the K handshape.', 'Rotate your wrist so your fingers point downward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/P.png' },
  { id: 'Q', label: 'Q', subtitle: 'Queen', category: 'letter', difficulty: 'Intermediate', emoji: '👑',
    steps: ['Start with the G handshape (index and thumb extended).', 'Point downward instead of sideways.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/Q.png' },
  { id: 'R', label: 'R', subtitle: 'Rainbow', category: 'letter', difficulty: 'Beginner', emoji: '🌈',
    steps: ['Cross your index and middle fingers.', 'Hold other fingers folded.', 'Palm faces outward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/R.png' },
  { id: 'S', label: 'S', subtitle: 'Sun', category: 'letter', difficulty: 'Beginner', emoji: '☀',
    steps: ['Make a fist.', 'Wrap your thumb over your fingers.', 'Palm faces outward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/S.png' },
  { id: 'T', label: 'T', subtitle: 'Tree', category: 'letter', difficulty: 'Beginner', emoji: '🌳',
    steps: ['Make a fist.', 'Place your thumb between your index and middle fingers.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/T.png' },
  { id: 'U', label: 'U', subtitle: 'Umbrella', category: 'letter', difficulty: 'Beginner', emoji: '☂',
    steps: ['Extend your index and middle fingers together upward.', 'Hold other fingers and thumb folded.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/U.png' },
  { id: 'V', label: 'V', subtitle: 'Victory', category: 'letter', difficulty: 'Beginner', emoji: '✌',
    steps: ['Extend your index and middle fingers in a V or peace sign.', 'Spread them apart.', 'Hold the other fingers and thumb folded.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/V.png' },
  { id: 'W', label: 'W', subtitle: 'Water', category: 'letter', difficulty: 'Beginner', emoji: '💧',
    steps: ['Extend your index, middle, and ring fingers spread apart.', 'Thumb and pinky fold down.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/W.png' },
  { id: 'X', label: 'X', subtitle: 'X-ray', category: 'letter', difficulty: 'Intermediate', emoji: '☢',
    steps: ['Extend your index finger and hook it slightly.', 'All other fingers and thumb fold down.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/X.png' },
  { id: 'Y', label: 'Y', subtitle: 'Yellow', category: 'letter', difficulty: 'Beginner', emoji: '🤙',
    steps: ['Extend your pinky and thumb.', 'Fold the other three fingers down.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/Y.png' },
  { id: 'Z', label: 'Z', subtitle: 'Zebra', category: 'letter', difficulty: 'Beginner', emoji: '🦓',
    steps: ['Extend only your index finger.', 'Draw the letter Z in the air: go right, diagonally down-left, then right again.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/Z.png' },
];

// ── 10 Free Gestures ────────────────────────────────────────────────────────
export const FREE_GESTURES: Sign[] = [
  { id: 'hello', label: 'Hello', subtitle: 'Wave hand near forehead', category: 'gesture', difficulty: 'Beginner', emoji: '👋',
    steps: ['Open your hand flat.', 'Touch your fingertips to your forehead.', 'Move your hand outward in a wave.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/hello.png' },
  { id: 'thankyou', label: 'Thank You', subtitle: 'Hand from chin forward', category: 'gesture', difficulty: 'Beginner', emoji: '🙏',
    steps: ['Bring your flat hand to your chin.', 'Move it forward and slightly downward.', 'Keep your palm facing upward.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/thankyou.png' },
  { id: 'please', label: 'Please', subtitle: 'Circle on chest', category: 'gesture', difficulty: 'Beginner', emoji: '🤲',
    steps: ['Place your flat hand on your chest.', 'Move it in a circular motion.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/please.png' },
  { id: 'yes', label: 'Yes', subtitle: 'Nod your fist', category: 'gesture', difficulty: 'Beginner', emoji: '👍',
    steps: ['Make a fist.', 'Nod the fist up and down, like a head nodding.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/yes.png' },
  { id: 'no', label: 'No', subtitle: 'Snap index and middle together', category: 'gesture', difficulty: 'Beginner', emoji: '👎',
    steps: ['Extend your index and middle fingers.', 'Quickly snap them down to meet your thumb twice.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/no.png' },
  { id: 'iloveyou', label: 'I Love You', subtitle: 'Pinky, index & thumb extended', category: 'gesture', difficulty: 'Beginner', emoji: '🤟',
    steps: ['Extend your thumb, index finger, and pinky.', 'Fold your middle and ring fingers.', 'Hold the handshape up toward the other person.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/iloveyou.png' },
  { id: 'sorry', label: 'Sorry', subtitle: 'Circle A on chest', category: 'gesture', difficulty: 'Beginner', emoji: '😔',
    steps: ['Make an A handshape (fist with thumb up).', 'Rub it in a circle on your chest.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/sorry.png' },
  { id: 'help', label: 'Help', subtitle: 'Lift A on flat palm', category: 'gesture', difficulty: 'Beginner', emoji: '🆘',
    steps: ['Make an A handshape (fist with thumb up).', 'Place it on your flat other palm.', 'Lift both hands upward together.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/help.png' },
  { id: 'more', label: 'More', subtitle: 'Tap fingertips together', category: 'gesture', difficulty: 'Beginner', emoji: '➕',
    steps: ['Bring both hands together with fingers touching thumbs (O shape).', 'Tap the fingertips of both hands together twice.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/more.png' },
  { id: 'eat', label: 'Eat', subtitle: 'Bring hand to mouth', category: 'gesture', difficulty: 'Beginner', emoji: '🍽',
    steps: ['Bring the fingers of your dominant hand together.', 'Tap them to your mouth twice.'],
    isPro: false, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/eat.png' },
];

// ── 10 Pro-Only Extra Gestures ──────────────────────────────────────────────
export const PRO_GESTURES: Sign[] = [
  { id: 'name', label: 'Name', subtitle: 'Cross H handshapes', category: 'gesture', difficulty: 'Intermediate', emoji: '📛',
    steps: ['Make an H handshape (two fingers out) with each hand.', 'Cross one over the other and tap twice.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/name.png' },
  { id: 'understand', label: 'Understand', subtitle: 'Flick index from forehead', category: 'gesture', difficulty: 'Intermediate', emoji: '💡',
    steps: ['Place your index finger at your forehead.', 'Flick it upward to show comprehension.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/understand.png' },
  { id: 'where', label: 'Where', subtitle: 'Wag index finger side to side', category: 'gesture', difficulty: 'Intermediate', emoji: '❓',
    steps: ['Extend your index finger.', 'Wag it from side to side.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/where.png' },
  { id: 'what', label: 'What', subtitle: 'Brush index across palm', category: 'gesture', difficulty: 'Intermediate', emoji: '🤷',
    steps: ['Hold your non-dominant hand out flat.', 'Brush your dominant index finger down across it.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/what.png' },
  { id: 'good', label: 'Good', subtitle: 'Hand from chin to palm', category: 'gesture', difficulty: 'Beginner', emoji: '👍',
    steps: ['Touch your flat hand to your chin.', 'Move it forward and land it on your other flat palm.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/good.png' },
  { id: 'bad', label: 'Bad', subtitle: 'Hand from mouth downward', category: 'gesture', difficulty: 'Beginner', emoji: '👎',
    steps: ['Touch your flat hand to your mouth.', 'Flip it downward as if tossing something away.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/bad.png' },
  { id: 'want', label: 'Want', subtitle: 'Pull both hands toward you', category: 'gesture', difficulty: 'Intermediate', emoji: '🙋',
    steps: ['Extend both hands out, palms up, fingers spread.', 'Pull both hands toward your body while closing the fingers.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/want.png' },
  { id: 'know', label: 'Know', subtitle: 'Touch temple with flat hand', category: 'gesture', difficulty: 'Beginner', emoji: '🧠',
    steps: ['Bring your flat hand to your temple.', 'Tap gently.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/know.png' },
  { id: 'stop', label: 'Stop', subtitle: 'Chop down onto flat palm', category: 'gesture', difficulty: 'Beginner', emoji: '🛑',
    steps: ['Hold out your non-dominant hand flat.', 'Bring the side of your dominant hand down onto it sharply.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/stop.png' },
  { id: 'wait', label: 'Wait', subtitle: 'Wriggle both hands, palms up', category: 'gesture', difficulty: 'Beginner', emoji: '⏳',
    steps: ['Hold both hands out, palms up.', 'Wriggle or flutter the fingers gently.'],
    isPro: true, imageUrl: 'https://hscicvuydpygmtdwptqo.supabase.co/storage/v1/object/public/sign-videos/signs/wait.png' },
];

export const ALL_GESTURES = [...FREE_GESTURES, ...PRO_GESTURES];

export const ALL_SIGNS = [...LETTERS, ...ALL_GESTURES];
