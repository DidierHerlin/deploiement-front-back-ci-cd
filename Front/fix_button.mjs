import fs from 'fs';
let s = fs.readFileSync('components/atoms/button.tsx', 'utf8');
s = s.replace('import { Button as ButtonPrimitive } from "@/components/atoms/button"', 'import { Button as ButtonPrimitive } from "@base-ui/react/Button"');
fs.writeFileSync('components/atoms/button.tsx', s, 'utf8');
