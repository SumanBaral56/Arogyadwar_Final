// Central password rules. Adjust as needed.
function validatePasswordRules(password) {
  // Slightly strict but still user-friendly.
  const minLen = 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  if (password.length < minLen) return "Password must be at least 8 characters.";
  if (!hasLetter || !hasNumber) return "Use a mix of letters and numbers for a stronger password.";

  // Optional strength nudges.
  if (!hasUpper || !hasLower) {
    return "For stronger passwords, include both uppercase and lowercase letters.";
  }

  return "";
}

module.exports = { validatePasswordRules };

