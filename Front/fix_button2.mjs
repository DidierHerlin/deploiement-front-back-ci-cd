import fs from 'fs';
let s = fs.readFileSync('components/atoms/button.tsx', 'utf8');
s = s.replace('import { Button as ButtonPrimitive } from "@base-ui/react/Button"', 'import { Button as ButtonPrimitive } from "@base-ui/react"');
fs.writeFileSync('components/atoms/button.tsx', s, 'utf8');
