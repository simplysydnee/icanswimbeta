/**
 * Format a name to proper title case
 * - Converts to lowercase first
 * - Capitalizes first letter of each word
 * - Handles special cases like "Mc", "Mac", "O'", etc.
 * - Preserves hyphens and apostrophes
 */
export function formatNameToTitleCase(name: string): string {
  if (!name || typeof name !== 'string') return name;

  // Convert to lowercase first but preserve leading/trailing spaces
  const lowerName = name.toLowerCase();

  // Split by spaces, hyphens, and apostrophes to preserve them
  const words = lowerName.split(/(\s+|-+|'+)/);

  // Process each word
  const formattedWords = words.map((word, index) => {
    // Skip empty strings and preserve separators
    if (!word || /^\s+$/.test(word) || word === '-' || word === "'") {
      return word;
    }

    // Handle special prefixes
    const specialPrefixes = ['mc', 'mac', "o'"];
    for (const prefix of specialPrefixes) {
      if (word.startsWith(prefix) && word.length > prefix.length) {
        // For "mac", only capitalize the first letter, not the third
        if (prefix === 'mac') {
          return 'Mac' + word.slice(3);
        }
        return prefix.charAt(0).toUpperCase() +
               prefix.slice(1) +
               word.charAt(prefix.length).toUpperCase() +
               word.slice(prefix.length + 1);
      }
    }

    // Handle "van der", "de la", etc. (keep lowercase for articles/prepositions)
    const lowercaseArticles = ['van', 'der', 'de', 'la', 'le', 'du', 'des', 'd', 'l'];
    if (index > 0 && lowercaseArticles.includes(word)) {
      return word;
    }

    // Capitalize first letter of the word
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  return formattedWords.join('');
}

/**
 * Format a full name (first and last) to title case
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${formatNameToTitleCase(firstName)} ${formatNameToTitleCase(lastName)}`;
}

/**
 * Format a single name field (for inputs that might contain full names)
 */
export function formatNameField(value: string): string {
  if (!value || typeof value !== 'string') return value;

  // If it looks like a full name (contains space), split and format each part
  if (value.includes(' ')) {
    const parts = value.split(/\s+/);
    return parts.map(part => formatNameToTitleCase(part)).join(' ');
  }

  return formatNameToTitleCase(value);
}