const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const pdfPath = path.join('C:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'LISTE DES ETABLISSEMENTS SANITAIRES PRIVES AUTORISES PAR REGIONS MARS 2025.pdf');
console.log('Reading:', pdfPath);

const buf = fs.readFileSync(pdfPath);
pdf(buf).then(d => {
  console.log('Total pages:', d.numpages);
  console.log('\n--- SAMPLE (first 8000 chars) ---\n');
  console.log(d.text.substring(0, 8000));
  fs.writeFileSync(path.join(__dirname, 'pdf_full.txt'), d.text, 'utf8');
  console.log('\n--- Saved to tmp/pdf_full.txt ---');
}).catch(e => {
  console.error('ERROR:', e.message);
});
