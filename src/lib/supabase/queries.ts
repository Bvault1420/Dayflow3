/** Explicit relationship hints — avoids PostgREST "more than one relationship" errors. */
export const GAME_WITH_CREATOR =
  "*, creator:profiles!creator_id(*)" as const;

export const COMMENT_WITH_PROFILE =
  "*, profile:profiles!user_id(*)" as const;

export const LIKE_WITH_GAME =
  "game:games!game_id(*, creator:profiles!creator_id(*))" as const;

export const SAVE_WITH_GAME =
  "game:games!game_id(*, creator:profiles!creator_id(*))" as const;

export const VIEW_WITH_GAME =
  "game:games!game_id(*, creator:profiles!creator_id(*))" as const;
