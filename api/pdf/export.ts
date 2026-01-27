import type { VercelRequest, VercelResponse } from '@vercel/node';

// Note: For full server-side PDF generation, you would typically use Puppeteer or a PDF library.
// However, Puppeteer has significant bundle size and cold start issues on Vercel.
// This endpoint provides a simpler approach using html-pdf-node or returns HTML for client-side generation.

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { html, resumeData, template = 'modern', format = 'a4' } = req.body;

        if (!html && !resumeData) {
            return res.status(400).json({ error: 'Either html or resumeData is required' });
        }

        // For now, we'll return a response that tells the client to use browser print
        // This is because server-side PDF generation with Puppeteer/Chrome on Vercel 
        // has cold start issues and requires special configuration

        // Option 1: Return instructions to use client-side print
        if (!html) {
            return res.status(200).json({
                success: true,
                method: 'client_print',
                message: 'Use window.print() for PDF generation',
                instructions: 'Navigate to the resume preview and use browser print (Ctrl+P) to save as PDF'
            });
        }

        // Option 2: If HTML is provided, we could integrate with a PDF service
        // For production, consider using:
        // - Browserless.io API
        // - PDFShift API  
        // - html-pdf-chrome with a headless Chrome service

        // Example integration placeholder:
        const pdfServiceUrl = process.env.PDF_SERVICE_URL;

        if (pdfServiceUrl) {
            // Call external PDF service
            const pdfResponse = await fetch(pdfServiceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.PDF_SERVICE_API_KEY || ''}`
                },
                body: JSON.stringify({
                    html,
                    format,
                    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
                })
            });

            if (pdfResponse.ok) {
                const pdfBuffer = await pdfResponse.arrayBuffer();

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');

                return res.send(Buffer.from(pdfBuffer));
            } else {
                throw new Error('PDF service failed');
            }
        }

        // Fallback: Return the HTML with print-optimized styles
        const printOptimizedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - Print</title>
  <style>
    @page {
      size: ${format === 'letter' ? 'letter' : 'A4'};
      margin: 0;
    }
    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  ${html}
  <script>
    // Auto-print when opened
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `.trim();

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(printOptimizedHtml);

    } catch (error: any) {
        console.error('PDF export error:', error);
        return res.status(500).json({
            error: 'Failed to generate PDF',
            details: error.message,
            fallback: 'Use browser print (Ctrl+P) as an alternative'
        });
    }
}
