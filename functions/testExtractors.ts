import fs from 'fs';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

async function test() {
  const docBuffer = fs.readFileSync('test.docx');
  const pdfBuffer = fs.readFileSync('test.pdf');

  const docText = await mammoth.extractRawText({ buffer: docBuffer });
  console.log('✅ DOCX:', docText.value);

  const pdfText = await pdf(pdfBuffer);
  console.log('✅ PDF:', pdfText.text.slice(0, 300));
}

test();
