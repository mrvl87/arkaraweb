const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/cms/media/actions.ts');
let content = fs.readFileSync(filePath, 'utf8');

const searchRegex = /export async function uploadFile\(formData: FormData\) \{[\s\S]*?revalidatePath\('\/cms\/media'\)\r?\n\s*return \{ success: true \}\r?\n\}/;

const replacement = `export async function uploadFile(formData: FormData) {
  const authorId = process.env.CMS_SERVICE_AUTHOR_ID;
  if (!authorId) throw new Error('CMS_SERVICE_AUTHOR_ID not configured');

  const file = formData.get('file') as File;
  const contextName = formData.get('contextName') as string || '';
  
  if (!file) throw new Error('No file provided');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await processAndUploadImage({
    buffer,
    originalName: file.name,
    mimeType: file.type,
    contextName,
    authorId
  });

  revalidatePath('/cms/media');
  return { success: true };
}`;

if (searchRegex.test(content)) {
    content = content.replace(searchRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully refactored uploadFile");
} else {
    console.error("Could not find uploadFile function to replace.");
}
