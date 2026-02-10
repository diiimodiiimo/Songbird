-- Grant Founding Flock access to all existing users
-- This migration gives all users who signed up before the waitlist launch
-- full premium access as Founding Flock members

-- Update all existing users to have Founding Flock status
-- Only update users who don't already have premium access
UPDATE users
SET 
  "isPremium" = true,
  "isFoundingMember" = true,
  "subscriptionTier" = 'founding_flock_yearly',
  "premiumSince" = COALESCE("premiumSince", NOW())
WHERE 
  "isPremium" = false 
  OR "isFoundingMember" = false
  OR "premiumSince" IS NULL;

-- Also ensure any users who already have premium are marked as founding members
UPDATE users
SET 
  "isFoundingMember" = true,
  "subscriptionTier" = COALESCE("subscriptionTier", 'founding_flock_yearly')
WHERE 
  "isPremium" = true 
  AND "isFoundingMember" = false;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % users to Founding Flock status', updated_count;
END $$;


