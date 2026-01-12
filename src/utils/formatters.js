export const formatAppName = (name, email = '') => {
    if (!name) return '';

    const parts = name.trim().split(/\s+/);

    // If name is a single word (likely just surname) and we have an email
    if (parts.length === 1 && email && email.includes('@')) {
        const userPart = email.split('@')[0];
        // Check for 'first.last' pattern often used in this org
        if (userPart.includes('.')) {
            const emailParts = userPart.split('.');
            if (emailParts.length >= 2) {
                const titleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                // Return 'First Last' derived from email
                return `${titleCase(emailParts[0])} ${titleCase(emailParts[1])}`;
            }
        }
    }

    if (parts.length <= 1) return name;

    // Returns First word + Second word (usually First Name + First Surname)
    // This addresses the request to see "First Name + First Surname" instead of just last name
    return `${parts[0]} ${parts[1]}`;
};
