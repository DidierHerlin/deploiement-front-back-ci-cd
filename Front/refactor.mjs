import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const project = new Project({
  tsConfigFilePath: "./tsconfig.json",
});

const componentsDir = path.resolve("./components");

const categorize = (fileName, filePath) => {
  const name = path.basename(fileName, path.extname(fileName));
  const lowerName = name.toLowerCase();
  
  if (filePath.includes("components/ui") || filePath.includes("components\\ui")) {
    if (["pagination", "sonner"].includes(name)) return "molecules";
    return "atoms";
  }
  
  if (lowerName.includes("badge") || lowerName.includes("button") || lowerName.includes("input") || lowerName.includes("icon")) return "atoms";
  
  if (lowerName.includes("card") || lowerName.includes("item")) {
    return "molecules";
  }
  
  return "organisms";
};

// Create dirs
["atoms", "molecules", "organisms", "templates"].forEach(dir => {
  const dirPath = path.join(componentsDir, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const filesToMove = project.getSourceFiles().filter(sf => {
  const fp = sf.getFilePath();
  // match both /components/ and \components\ but not node_modules
  return (fp.includes("/components/") || fp.includes("\\components\\")) && !fp.includes("node_modules");
});

console.log(`Found ${filesToMove.length} files to move.`);

for (const sf of filesToMove) {
  const fp = sf.getFilePath();
  
  if (fp.match(/components[\\/](atoms|molecules|organisms|templates)[\\/]/)) continue;
  
  const category = categorize(path.basename(fp), fp);
  const newFilePath = path.join(componentsDir, category, path.basename(fp));
  
  let finalPath = newFilePath;
  let counter = 1;
  while (fs.existsSync(finalPath) && sf.getFilePath() !== finalPath) {
    const ext = path.extname(newFilePath);
    const base = path.basename(newFilePath, ext);
    // Find parent directory before 'components'
    const match = fp.match(/([a-zA-Z0-9_.-]+)[\\/]components[\\/]/);
    const parentDir = match ? match[1] : `dup${counter}`;
    finalPath = path.join(componentsDir, category, `${parentDir}_${base}${ext}`);
    counter++;
  }
  
  console.log(`Moving ${fp} to ${finalPath}`);
  sf.move(finalPath);
}

// Fix imports in all files to make sure they use absolute paths correctly 
// if they were relative, ts-morph does this automatically when move() is called.
// BUT for Next.js, we might want them to be `@/components/...` instead of `../../../components/...`
// We'll leave the automatic relative paths for now, then do a second pass to convert to alias.

console.log("Saving project...");
project.saveSync();
console.log("Done.");
