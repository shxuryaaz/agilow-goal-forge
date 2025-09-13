// Certificate PDF generation service
import jsPDF from 'jspdf';
import { Certificate } from './certificates';

class CertificatePDFService {
  /**
   * Generate PDF from certificate data
   */
  async generateCertificatePDF(certificate: Certificate): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create new PDF document
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Set up colors and fonts
        const primaryColor = '#1e3a8a'; // Navy blue
        const secondaryColor = '#FFD700'; // Gold
        const textColor = '#1f2937'; // Dark gray

        // Add background
        pdf.setFillColor(248, 250, 252); // Light gray background
        pdf.rect(0, 0, 297, 210, 'F'); // A4 landscape dimensions

        // Add border
        pdf.setDrawColor(primaryColor);
        pdf.setLineWidth(2);
        pdf.rect(15, 15, 267, 180);

        // Add decorative border
        pdf.setDrawColor(secondaryColor);
        pdf.setLineWidth(1);
        pdf.rect(20, 20, 257, 170);

        // Add title
        pdf.setFontSize(24);
        pdf.setTextColor(primaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('BHAG COMPLETION CERTIFICATE', 148.5, 45, { align: 'center' });

        // Add decorative line under title
        pdf.setDrawColor(secondaryColor);
        pdf.setLineWidth(2);
        pdf.line(50, 50, 247, 50);

        // Add "This certifies that" text
        pdf.setFontSize(16);
        pdf.setTextColor(textColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text('This certifies that', 148.5, 70, { align: 'center' });

        // Add goal title
        pdf.setFontSize(20);
        pdf.setTextColor(primaryColor);
        pdf.setFont('helvetica', 'bold');
        const goalTitle = certificate.goalTitle;
        pdf.text(goalTitle, 148.5, 90, { align: 'center' });

        // Add "has been successfully completed" text
        pdf.setFontSize(16);
        pdf.setTextColor(textColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text('has been successfully completed', 148.5, 110, { align: 'center' });

        // Add completion date
        pdf.setFontSize(14);
        pdf.setTextColor(primaryColor);
        pdf.setFont('helvetica', 'bold');
        const completionDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        pdf.text(`Completed on ${completionDate}`, 148.5, 130, { align: 'center' });

        // Add XP reward
        pdf.setFontSize(14);
        pdf.setTextColor(secondaryColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`+${certificate.xpAwarded} XP Awarded`, 148.5, 150, { align: 'center' });

        // Add decorative elements
        this.addDecorativeElements(pdf, primaryColor, secondaryColor);

        // Add signature line
        pdf.setDrawColor(primaryColor);
        pdf.setLineWidth(1);
        pdf.line(200, 170, 270, 170);
        pdf.setFontSize(10);
        pdf.setTextColor(textColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Certificate ID: ' + certificate.id, 20, 190);
        pdf.text('Agilow Goal Forge', 200, 175);

        // Convert to blob
        const pdfBlob = pdf.output('blob');
        resolve(pdfBlob);

      } catch (error) {
        console.error('Error generating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Add decorative elements to the PDF
   */
  private addDecorativeElements(pdf: jsPDF, primaryColor: string, secondaryColor: string): void {
    // Corner decorations
    const cornerSize = 15;
    
    // Top-left corner
    pdf.setFillColor(primaryColor);
    pdf.circle(30, 30, cornerSize, 'F');
    pdf.setFillColor(secondaryColor);
    pdf.circle(30, 30, cornerSize - 3, 'F');

    // Top-right corner
    pdf.setFillColor(primaryColor);
    pdf.circle(267, 30, cornerSize, 'F');
    pdf.setFillColor(secondaryColor);
    pdf.circle(267, 30, cornerSize - 3, 'F');

    // Bottom-left corner
    pdf.setFillColor(primaryColor);
    pdf.circle(30, 180, cornerSize, 'F');
    pdf.setFillColor(secondaryColor);
    pdf.circle(30, 180, cornerSize - 3, 'F');

    // Bottom-right corner
    pdf.setFillColor(primaryColor);
    pdf.circle(267, 180, cornerSize, 'F');
    pdf.setFillColor(secondaryColor);
    pdf.circle(267, 180, cornerSize - 3, 'F');

    // Add stars
    pdf.setFillColor(secondaryColor);
    this.drawStar(pdf, 80, 40, 5);
    this.drawStar(pdf, 217, 40, 5);
    this.drawStar(pdf, 80, 160, 5);
    this.drawStar(pdf, 217, 160, 5);
  }

  /**
   * Draw a star shape
   */
  private drawStar(pdf: jsPDF, x: number, y: number, size: number): void {
    const points = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    pdf.setFillColor(255, 215, 0); // Gold
    
    const angleStep = Math.PI / points;
    let path = '';
    
    for (let i = 0; i < points * 2; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        path = `M ${px} ${py}`;
      } else {
        path += ` L ${px} ${py}`;
      }
    }
    path += ' Z';
    
    // Simple star approximation with circles for now
    pdf.circle(x, y, outerRadius, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x, y, innerRadius, 'F');
  }

  /**
   * Download PDF certificate
   */
  async downloadCertificatePDF(certificate: Certificate): Promise<void> {
    try {
      const pdfBlob = await this.generateCertificatePDF(certificate);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BHAG_Certificate_${certificate.goalTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${certificate.id}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('Certificate PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading certificate PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from certificate image
   */
  async generateCertificatePDFFromImage(certificate: Certificate): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        if (!certificate.imageUrl) {
          reject(new Error('No certificate image available'));
          return;
        }

        // Create new PDF document
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Load the certificate image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // Calculate dimensions to fit image in A4 landscape
            const pageWidth = 297; // A4 landscape width
            const pageHeight = 210; // A4 landscape height
            
            // Calculate scaling to fit image
            const imgAspectRatio = img.width / img.height;
            const pageAspectRatio = pageWidth / pageHeight;
            
            let imgWidth, imgHeight, x, y;
            
            if (imgAspectRatio > pageAspectRatio) {
              // Image is wider than page
              imgWidth = pageWidth - 20; // 10mm margin on each side
              imgHeight = imgWidth / imgAspectRatio;
              x = 10;
              y = (pageHeight - imgHeight) / 2;
            } else {
              // Image is taller than page
              imgHeight = pageHeight - 20; // 10mm margin on top/bottom
              imgWidth = imgHeight * imgAspectRatio;
              x = (pageWidth - imgWidth) / 2;
              y = 10;
            }

            // Add image to PDF
            pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
            
            // Convert to blob
            const pdfBlob = pdf.output('blob');
            resolve(pdfBlob);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load certificate image'));
        };

        img.src = certificate.imageUrl;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Download PDF certificate from image
   */
  async downloadCertificatePDFFromImage(certificate: Certificate): Promise<void> {
    try {
      const pdfBlob = await this.generateCertificatePDFFromImage(certificate);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BHAG_Certificate_${certificate.goalTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${certificate.id}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('Certificate PDF downloaded successfully from image');
    } catch (error) {
      console.error('Error downloading certificate PDF from image:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const certificatePDFService = new CertificatePDFService();
