import fs from 'fs';
import path from 'path';
import { COLORS, SPACING, RADIUS } from '@puculuxa/shared';

const OUTPUT_PATH = path.join(__dirname, '../src/app/tokens.css');

function generateCSS() {
    let css = '/* Auto-generated from @puculuxa/shared. DO NOT EDIT. */\n\n:root {\n';


    // Process Colors
    // Map specific structured colors we know we need
    css += `  /* Colors */\n`;
    for (const [key, value] of Object.entries(COLORS)) {
        // Handle flattened colors
        if (typeof value === 'string') {
            // Convert camelCase keys like 'textSecondary' to 'text-secondary'
            const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
            css += `  --color-${kebabKey}: ${value};\n`;
        }
    }

    // Process Spacing
    css += `\n  /* Spacing */\n`;
    for (const [key, value] of Object.entries(SPACING)) {
        css += `  --spacing-${key}: ${value}px;\n`;
    }

    // Process Radius
    css += `\n  /* Radius */\n`;
    for (const [key, value] of Object.entries(RADIUS)) {
        css += `  --radius-${key}: ${value}px;\n`;
    }

    css += '}\n';

    // Add semantic mapping to match globals.css expectations
    css += `\n:root {\n`;
    css += `  /* Semantic Aliases */\n`;
    css += `  --puculuxa-orange: var(--color-primary);\n`;
    css += `  --puculuxa-gold: var(--color-gradient-mid);\n`;
    css += `  --puculuxa-lime: var(--color-secondary);\n`;
    css += `  --puculuxa-olive: var(--color-accent);\n`;
    css += `  --puculuxa-cream: var(--color-background);\n`;

    // Map the base defaults that globals.css used
    css += `  --bg-main: var(--color-background);\n`;
    css += `  --bg-card: var(--color-white);\n`; // Default to white, can be overridden by dark mode elsewhere
    css += `  --text-primary: var(--color-black);\n`;
    css += `  --text-secondary: var(--color-text-secondary);\n`;
    css += `}\n`;

    fs.writeFileSync(OUTPUT_PATH, css);
    console.log(`✅ Tokens synchronized to ${OUTPUT_PATH}`);
}

generateCSS();
