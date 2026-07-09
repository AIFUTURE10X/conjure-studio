/**
 * Fix Invalid CSS Custom Property Syntax in UI Components
 * 
 * Problem: Tailwind CSS v4 requires CSS custom properties to use square brackets and var()
 * Invalid:  origin-(--radix-popover-content-transform-origin)
 * Correct:  origin-[var(--radix-popover-content-transform-origin)]
 * 
 * This script automatically fixes all instances across UI components.
 * 
 * Usage: node scripts/fix-css-custom-properties.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Files that commonly have this issue
const FILES_TO_FIX = [
  'components/ui/calendar.tsx',
  'components/ui/chart.tsx',
  'components/ui/context-menu.tsx',
  'components/ui/dropdown-menu.tsx',
  'components/ui/hover-card.tsx',
  'components/ui/menubar.tsx',
  'components/ui/popover.tsx',
  'components/ui/select.tsx',
  'components/ui/sidebar.tsx',
  'components/ui/tooltip.tsx',
];

// Pattern to find: property-(--variable)
// Should be: property-[var(--variable)]
const INVALID_PATTERN = /(\w+)-$$(--[\w-]+)$$/g;

function fixFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let fixCount = 0;
    
    // Replace all invalid patterns
    const newContent = content.replace(INVALID_PATTERN, (match, property, variable) => {
      fixCount++;
      return `${property}-[var(${variable})]`;
    });
    
    if (fixCount > 0) {
      writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed ${fixCount} instance(s) in ${filePath}`);
      return fixCount;
    } else {
      console.log(`✓ No issues found in ${filePath}`);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

console.log('🔧 Starting CSS Custom Property Fix...\n');

let totalFixes = 0;
FILES_TO_FIX.forEach(file => {
  totalFixes += fixFile(file);
});

console.log(`\n✨ Complete! Fixed ${totalFixes} total instances.`);

if (totalFixes === 0) {
  console.log('All files already have correct syntax.');
}
