// Certificate generation and management service
import { localXPService } from './localXP';

export interface Certificate {
  id: string;
  userId: string;
  type: 'bhag_completion' | 'milestone' | 'streak' | 'achievement';
  title: string;
  description: string;
  goalTitle: string;
  completionDate: Date;
  xpAwarded: number;
  imageUrl?: string;
  nftMinted: boolean;
  createdAt: Date;
}

class CertificateService {
  private certificates: Certificate[] = [];

  /**
   * Generate a professional BHAG completion certificate
   */
  async generateBHAGCertificate(
    userId: string, 
    goalTitle: string, 
    completionDate: Date = new Date()
  ): Promise<Certificate> {
    try {
      const certificate: Certificate = {
        id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'bhag_completion',
        title: 'BHAG Completion Certificate',
        description: `Congratulations on completing your Big Hairy Audacious Goal: "${goalTitle}"`,
        goalTitle,
        completionDate,
        xpAwarded: 500, // Bonus XP for completion
        imageUrl: await this.generateCertificateImage(goalTitle, completionDate),
        nftMinted: false,
        createdAt: new Date()
      };

      // Store certificate locally
      this.certificates.push(certificate);
      this.saveCertificatesToStorage();

      // Award bonus XP for completion
      await localXPService.awardXP(userId, 500, 'BHAG Completion', 'achievement', undefined, certificate.id);

      console.log(`🎖️ BHAG Completion Certificate generated for: ${goalTitle}`);
      return certificate;

    } catch (error) {
      console.error('Error generating BHAG certificate:', error);
      throw error;
    }
  }

  /**
   * Generate professional certificate image using DALL-E 3
   */
  private async generateCertificateImage(goalTitle: string, completionDate: Date): Promise<string> {
    try {
      // Check if we have API key (you'll need to add this to your env)
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        return this.generatePlaceholderCertificate(goalTitle);
      }

      const formattedDate = completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const certificatePrompt = `
        Create a stunning, professional, high-quality certificate design for BHAG (Big Hairy Audacious Goal) completion:
        
        CERTIFICATE DETAILS:
        - Title: "BHAG Completion Certificate"
        - Achievement: "${goalTitle}"
        - Date: ${formattedDate}
        - Style: "Professional Achievement Certificate"
        
        DESIGN REQUIREMENTS:
        - Ultra-professional, corporate certificate style
        - Gold and navy blue color scheme
        - Elegant typography and layout
        - Formal certificate border with decorative elements
        - High-resolution, 4K quality
        - Clean, sophisticated design
        - Achievement and success theme
        - Corporate/professional setting
        - Premium, luxury certificate appearance
        
        The certificate should look like an official corporate achievement certificate that would be proudly displayed in an office or professional setting. Include elegant decorative elements, professional fonts, and a sophisticated color palette.
      `;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: certificatePrompt,
          n: 1,
          size: '1792x1024', // Wide format for certificate
          quality: 'hd',
          response_format: 'url',
          style: 'natural'
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('DALL-E 3 Certificate API Error:', data.error);
        return this.generatePlaceholderCertificate(goalTitle);
      }
      
      return data.data[0]?.url || this.generatePlaceholderCertificate(goalTitle);

    } catch (error) {
      console.error('Certificate image generation error:', error);
      return this.generatePlaceholderCertificate(goalTitle);
    }
  }

  /**
   * Generate placeholder certificate using CSS/SVG
   */
  private generatePlaceholderCertificate(goalTitle: string): string {
    // Create a data URL for a simple certificate placeholder
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="800" height="600" fill="#f8fafc" stroke="#1e3a8a" stroke-width="4"/>
        
        <!-- Border decoration -->
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#goldGradient)" stroke-width="3"/>
        <rect x="40" y="40" width="720" height="520" fill="none" stroke="url(#blueGradient)" stroke-width="2"/>
        
        <!-- Title -->
        <text x="400" y="120" text-anchor="middle" font-family="serif" font-size="36" font-weight="bold" fill="#1e3a8a">
          BHAG COMPLETION CERTIFICATE
        </text>
        
        <!-- Achievement -->
        <text x="400" y="200" text-anchor="middle" font-family="serif" font-size="24" fill="#1e3a8a">
          This certifies that
        </text>
        
        <text x="400" y="280" text-anchor="middle" font-family="serif" font-size="28" font-weight="bold" fill="url(#goldGradient)">
          ${goalTitle}
        </text>
        
        <text x="400" y="340" text-anchor="middle" font-family="serif" font-size="20" fill="#1e3a8a">
          has been successfully completed
        </text>
        
        <!-- Date -->
        <text x="400" y="420" text-anchor="middle" font-family="serif" font-size="18" fill="#1e3a8a">
          ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </text>
        
        <!-- Decorative elements -->
        <circle cx="150" cy="150" r="20" fill="url(#goldGradient)" opacity="0.3"/>
        <circle cx="650" cy="150" r="20" fill="url(#goldGradient)" opacity="0.3"/>
        <circle cx="150" cy="450" r="20" fill="url(#goldGradient)" opacity="0.3"/>
        <circle cx="650" cy="450" r="20" fill="url(#goldGradient)" opacity="0.3"/>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Get all certificates for a user
   */
  getUserCertificates(userId: string): Certificate[] {
    return this.certificates.filter(cert => cert.userId === userId);
  }

  /**
   * Get certificate by ID
   */
  getCertificateById(certificateId: string): Certificate | undefined {
    return this.certificates.find(cert => cert.id === certificateId);
  }

  /**
   * Save certificates to localStorage
   */
  private saveCertificatesToStorage(): void {
    try {
      localStorage.setItem('agilow_certificates', JSON.stringify(this.certificates));
    } catch (error) {
      console.error('Error saving certificates to localStorage:', error);
    }
  }

  /**
   * Load certificates from localStorage
   */
  private loadCertificatesFromStorage(): void {
    try {
      const stored = localStorage.getItem('agilow_certificates');
      if (stored) {
        this.certificates = JSON.parse(stored).map((cert: any) => ({
          ...cert,
          completionDate: new Date(cert.completionDate),
          createdAt: new Date(cert.createdAt)
        }));
      }
    } catch (error) {
      console.error('Error loading certificates from localStorage:', error);
      this.certificates = [];
    }
  }

  /**
   * Initialize the service
   */
  init(): void {
    this.loadCertificatesFromStorage();
    console.log(`Certificate service initialized with ${this.certificates.length} certificates`);
  }

  /**
   * Clear all certificates (for testing)
   */
  clearAllCertificates(): void {
    this.certificates = [];
    localStorage.removeItem('agilow_certificates');
    console.log('All certificates cleared');
  }
}

// Create singleton instance
export const certificateService = new CertificateService();

// Initialize on import
certificateService.init();
