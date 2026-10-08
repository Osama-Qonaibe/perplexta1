import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { toast } from '@/design-system';
import { Message } from '../types';

export const useChatExport = (messages: Message[], dir: 'rtl' | 'ltr', theme: string) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'md' | 'pdf' | 'docx') => {
    if (messages.length === 0) return;
    setIsExporting(true);

    try {
      if (format === 'md') {
        const mdContent = messages
          .map((msg) => `### ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${msg.content}\n\n---`)
          .join('\n\n');
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Perplexta_Chat_${new Date().toISOString().split('T')[0]}.md`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const exportEl = document.createElement('div');
        exportEl.style.position = 'fixed';
        exportEl.style.left = '-9999px';
        exportEl.style.top = '0';
        exportEl.style.width = '800px';
        exportEl.style.padding = '40px';
        exportEl.style.backgroundColor = theme === 'dark' ? '#0d1117' : '#ffffff';
        exportEl.style.color = theme === 'dark' ? '#ececec' : '#1a1a1a';
        exportEl.style.fontFamily = "'Tajawal', 'Geist', 'Inter', sans-serif";
        exportEl.dir = dir;

        const header = document.createElement('h1');
        header.innerText = 'Perplexta Intelligence Report';
        header.style.textAlign = 'center';
        header.style.marginBottom = '30px';
        header.style.borderBottom = '1px solid #334155';
        header.style.paddingBottom = '10px';
        exportEl.appendChild(header);

        messages.forEach((msg) => {
          const msgEl = document.createElement('div');
          msgEl.style.marginBottom = '25px';
          msgEl.style.padding = '15px';
          msgEl.style.borderRadius = '8px';
          msgEl.style.backgroundColor = msg.role === 'user' 
            ? (theme === 'dark' ? '#1e1e24' : '#f1f5f9')
            : 'transparent';

          const roleLabel = document.createElement('div');
          roleLabel.innerText = msg.role === 'user' ? (dir === 'rtl' ? 'المستخدم' : 'USER') : (dir === 'rtl' ? 'بيربليكستا' : 'PERPLEXTA');
          roleLabel.style.fontSize = '10px';
          roleLabel.style.fontWeight = '900';
          roleLabel.style.color = '#3b82f6';
          roleLabel.style.marginBottom = '8px';
          roleLabel.style.letterSpacing = '0.1em';

          const content = document.createElement('div');
          content.innerText = msg.content;
          content.style.fontSize = '14px';
          content.style.lineHeight = '1.6';

          msgEl.appendChild(roleLabel);
          msgEl.appendChild(content);
          exportEl.appendChild(msgEl);
        });

        const footer = document.createElement('div');
        footer.style.marginTop = '40px';
        footer.style.textAlign = 'center';
        footer.style.fontSize = '10px';
        footer.style.opacity = '0.3';
        footer.innerText = '© 2026 PERPLEXTA PLATFORM - CONFIDENTIAL AI REPORT';
        exportEl.appendChild(footer);

        document.body.appendChild(exportEl);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const imgData = await toPng(exportEl, {
          backgroundColor: theme === 'dark' ? '#0d1117' : '#ffffff',
          pixelRatio: 2,
        });

        document.body.removeChild(exportEl);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;

        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const imgHeight = (img.height * imgWidth) / img.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`Perplexta_Chat_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (format === 'docx') {
        let htmlContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'><title>Chat Export</title>
          <style>
            body { font-family: 'Tajawal', 'Geist', 'Inter', sans-serif; line-height: 1.6; }
            .user { background-color: #f0f0f0; padding: 10px; margin-bottom: 10px; }
            .assistant { padding: 10px; margin-bottom: 10px; border-left: 3px solid #334155; }
            .label { font-weight: bold; color: #334155; font-size: 0.8em; }
          </style>
          </head>
          <body dir="${dir}">
            <h1 style="text-align: center;">Perplexta Chat Export</h1>
            <p style="text-align: center; color: #666;">${new Date().toLocaleString()}</p>
        `;

        messages.forEach(msg => {
          const role = msg.role === 'user' ? (dir === 'rtl' ? 'المستخدم' : 'User') : (dir === 'rtl' ? 'المساعد' : 'Assistant');
          htmlContent += `
            <div class="${msg.role}">
              <div class="label">${role}</div>
              <p>${msg.content.replace(/\n/g, '<br>')}</p>
            </div>
          `;
        });

        htmlContent += `</body></html>`;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Perplexta_Chat_${new Date().toISOString().split('T')[0]}.doc`;
        link.click();
        URL.revokeObjectURL(url);
      }

      const formatLabels = { md: 'Markdown', pdf: 'PDF', docx: 'DOCX' };
      toast.success(dir === 'rtl' 
        ? `تم تصدير المحادثة بتنسيق ${formatLabels[format]} بنجاح` 
        : `Conversation exported as ${formatLabels[format]} successfully`
      );
    } catch (error) {
      toast.error(dir === 'rtl' ? 'فشل تصدير المحادثة' : 'Failed to export conversation');
    } finally {
      setIsExporting(false);
    }
  };

  return { handleExport, isExporting };
};
