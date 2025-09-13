// Cookie utility functions for XP persistence

const XP_COOKIE_NAME = 'agilow_user_xp';
const XP_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Set XP cookie
 */
export const setXPCookie = (xp: number): void => {
  try {
    document.cookie = `${XP_COOKIE_NAME}=${xp}; path=/; max-age=${XP_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch (error) {
    console.error('Error setting XP cookie:', error);
  }
};

/**
 * Get XP from cookie
 */
export const getXPCookie = (): number => {
  try {
    const cookies = document.cookie.split(';');
    const xpCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${XP_COOKIE_NAME}=`)
    );
    
    if (xpCookie) {
      const xpValue = xpCookie.split('=')[1];
      const xp = parseInt(xpValue, 10);
      return isNaN(xp) ? 0 : Math.max(0, xp); // Ensure non-negative
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting XP cookie:', error);
    return 0;
  }
};

/**
 * Remove XP cookie
 */
export const removeXPCookie = (): void => {
  try {
    document.cookie = `${XP_COOKIE_NAME}=; path=/; max-age=0`;
  } catch (error) {
    console.error('Error removing XP cookie:', error);
  }
};

/**
 * Update XP cookie with new value
 */
export const updateXPCookie = (newXP: number): void => {
  const sanitizedXP = Math.max(0, newXP); // Ensure non-negative
  setXPCookie(sanitizedXP);
};

/**
 * Increment XP cookie by amount
 */
export const incrementXPCookie = (amount: number): number => {
  const currentXP = getXPCookie();
  const newXP = Math.max(0, currentXP + amount);
  setXPCookie(newXP);
  return newXP;
};
