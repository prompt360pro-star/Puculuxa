import fs from 'fs';
import path from 'path';
import { COLORS, SPACING, RADIUS, SHADOWS } from '@puculuxa/shared';

const OUTPUT_PATH = path.join(__dirname, '../src/app/tokens.css');

function generateCSS() {
    let css = '/* Auto-generated from @puculuxa/shared. DO NOT EDIT. */\n\n:root {\n';

    // Helper to process object keys
    const processObj = (prefix: string, obj: any) => {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object') {
                // Skip nested objects like shadow definitions for now, unless we parse them specifically
                // SHADOWS.light is an object, we might want to skip or handle differently
                if (key === 'light' || key === 'medium') continue;

            } else if (typeof value === 'string' || typeof value === 'number') {
                const cssVarName = `--${prefix}-${key}`;
                // Convert camelCase to kebab-case if needed, but for now let's stick to simple mapping
                // actually, let's just use the key as is for simplicity unless it needs hyphenation
                css += `  ${cssVarName}: ${value}${typeof value === 'number' && prefix === 'spacing' ? 'px' : ''};\n`;
            }
        }
    };

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
