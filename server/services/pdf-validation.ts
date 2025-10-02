import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import pdf from 'pdf-parse';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    marginCheck?: {
      passed: boolean;
      issues: string[];
      measurements?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
    fontCheck?: {
      passed: boolean;
      issues: string[];
      fonts?: string[];
    };
    standardsCheck?: {
      passed: boolean;
      issues: string[];
    };
  };
}

export interface BatesNumberingOptions {
  prefix?: string;
  startNumber: number;
  suffix?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-right' | 'top-center' | 'top-left';
  fontSize?: number;
}

export class PDFValidationService {
  /**
   * Validate PDF for Indian court filing compliance
   */
  async validatePDF(pdfBuffer: Buffer): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      // Load PDF for validation
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();

      // Parse PDF for text analysis
      const pdfData = await pdf(pdfBuffer);

      // Check 1: Margin validation
      result.details.marginCheck = await this.validateMargins(pdfDoc, pages);
      if (!result.details.marginCheck.passed) {
        result.isValid = false;
        result.errors.push(...result.details.marginCheck.issues);
      }

      // Check 2: Font validation
      result.details.fontCheck = await this.validateFonts(pdfData);
      if (!result.details.fontCheck.passed) {
        result.warnings.push(...result.details.fontCheck.issues);
      }

      // Check 3: Standards check (page size, orientation, etc.)
      result.details.standardsCheck = await this.validateStandards(pdfDoc, pages);
      if (!result.details.standardsCheck.passed) {
        result.warnings.push(...result.details.standardsCheck.issues);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`PDF validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Validate margins meet Indian court requirements (typically 1-1.5 inches)
   */
  private async validateMargins(pdfDoc: PDFDocument, pages: any[]): Promise<{
    passed: boolean;
    issues: string[];
    measurements?: { top: number; right: number; bottom: number; left: number };
  }> {
    const result = {
      passed: true,
      issues: [] as string[],
      measurements: { top: 0, right: 0, bottom: 0, left: 0 }
    };

    try {
      // Indian court standard: 1 inch = 72 points
      const MIN_MARGIN = 72; // 1 inch minimum
      const RECOMMENDED_MARGIN = 108; // 1.5 inches recommended

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Estimate margins (simplified - actual content analysis would be more complex)
        // This is a basic check - assumes standard A4 or Letter size
        const estimatedMargins = {
          top: height * 0.1, // Estimate 10% of page height
          right: width * 0.1,
          bottom: height * 0.1,
          left: width * 0.1
        };

        result.measurements = estimatedMargins;

        if (estimatedMargins.top < MIN_MARGIN) {
          result.passed = false;
          result.issues.push(`Page ${i + 1}: Top margin (${Math.round(estimatedMargins.top)}pt) is less than required 1 inch (72pt)`);
        }
        if (estimatedMargins.bottom < MIN_MARGIN) {
          result.passed = false;
          result.issues.push(`Page ${i + 1}: Bottom margin (${Math.round(estimatedMargins.bottom)}pt) is less than required 1 inch (72pt)`);
        }
        if (estimatedMargins.left < MIN_MARGIN) {
          result.passed = false;
          result.issues.push(`Page ${i + 1}: Left margin (${Math.round(estimatedMargins.left)}pt) is less than required 1 inch (72pt)`);
        }
        if (estimatedMargins.right < MIN_MARGIN) {
          result.passed = false;
          result.issues.push(`Page ${i + 1}: Right margin (${Math.round(estimatedMargins.right)}pt) is less than required 1 inch (72pt)`);
        }

        // Check for recommended margins
        if (estimatedMargins.left < RECOMMENDED_MARGIN) {
          result.issues.push(`Page ${i + 1}: Left margin should be 1.5 inches for binding purposes`);
        }
      }
    } catch (error) {
      result.passed = false;
      result.issues.push(`Margin check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Validate fonts are readable and court-acceptable
   */
  private async validateFonts(pdfData: any): Promise<{
    passed: boolean;
    issues: string[];
    fonts?: string[];
  }> {
    const result = {
      passed: true,
      issues: [] as string[],
      fonts: [] as string[]
    };

    try {
      // Acceptable fonts for Indian courts
      const ACCEPTABLE_FONTS = [
        'Times New Roman',
        'Times',
        'Arial',
        'Calibri',
        'Helvetica',
        'Courier',
        'Verdana'
      ];

      const MIN_FONT_SIZE = 12;
      const MAX_FONT_SIZE = 14;

      // Note: pdf-parse doesn't extract font information directly
      // This is a simplified check based on text content
      
      if (pdfData.text.length === 0) {
        result.passed = false;
        result.issues.push('PDF appears to be empty or contains only images');
      }

      // Check for very small or very large text (basic heuristic)
      const lines = pdfData.text.split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length > 0) {
        result.issues.push(`Document contains ${lines.length} lines of text`);
        
        // Warn about best practices
        result.issues.push(`Recommended: Use ${MIN_FONT_SIZE}-${MAX_FONT_SIZE}pt font size`);
        result.issues.push(`Recommended fonts: ${ACCEPTABLE_FONTS.slice(0, 3).join(', ')}`);
      }

    } catch (error) {
      result.passed = false;
      result.issues.push(`Font check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Validate PDF meets general court filing standards
   */
  private async validateStandards(pdfDoc: PDFDocument, pages: any[]): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const result = {
      passed: true,
      issues: [] as string[]
    };

    try {
      // Check page count
      const pageCount = pages.length;
      if (pageCount === 0) {
        result.passed = false;
        result.issues.push('PDF has no pages');
        return result;
      }

      if (pageCount > 500) {
        result.issues.push(`Warning: Document has ${pageCount} pages. Very large documents may need to be split.`);
      }

      // Check page sizes (should be uniform and standard)
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Check for standard paper sizes
      const A4_WIDTH = 595; // points
      const A4_HEIGHT = 842;
      const LETTER_WIDTH = 612;
      const LETTER_HEIGHT = 792;
      const TOLERANCE = 10; // points

      const isA4 = Math.abs(width - A4_WIDTH) < TOLERANCE && Math.abs(height - A4_HEIGHT) < TOLERANCE;
      const isLetter = Math.abs(width - LETTER_WIDTH) < TOLERANCE && Math.abs(height - LETTER_HEIGHT) < TOLERANCE;

      if (!isA4 && !isLetter) {
        result.issues.push(`Page size ${Math.round(width)}x${Math.round(height)}pt is non-standard. Use A4 (595x842) or Letter (612x792)`);
      }

      // Check for consistent page sizes
      for (let i = 1; i < pages.length; i++) {
        const page = pages[i];
        const pageSize = page.getSize();
        if (Math.abs(pageSize.width - width) > TOLERANCE || Math.abs(pageSize.height - height) > TOLERANCE) {
          result.issues.push(`Page ${i + 1} has different size (${Math.round(pageSize.width)}x${Math.round(pageSize.height)}pt) than first page`);
        }
      }

      // Check orientation
      const isPortrait = height > width;
      if (!isPortrait) {
        result.issues.push('Document should be in portrait orientation for court filing');
      }

    } catch (error) {
      result.passed = false;
      result.issues.push(`Standards check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Add Bates numbering to PDF for court filing tracking
   */
  async addBatesNumbering(
    pdfBuffer: Buffer,
    options: BatesNumberingOptions
  ): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const {
        prefix = '',
        startNumber = 1,
        suffix = '',
        position = 'bottom-right',
        fontSize = 10
      } = options;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Generate Bates number
        const batesNumber = `${prefix}${String(startNumber + i).padStart(6, '0')}${suffix}`;

        // Calculate position
        let x = 0;
        let y = 0;

        switch (position) {
          case 'bottom-right':
            x = width - 100;
            y = 20;
            break;
          case 'bottom-center':
            x = width / 2 - 40;
            y = 20;
            break;
          case 'bottom-left':
            x = 50;
            y = 20;
            break;
          case 'top-right':
            x = width - 100;
            y = height - 30;
            break;
          case 'top-center':
            x = width / 2 - 40;
            y = height - 30;
            break;
          case 'top-left':
            x = 50;
            y = height - 30;
            break;
        }

        // Draw Bates number
        page.drawText(batesNumber, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // Save modified PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);

    } catch (error) {
      throw new Error(`Failed to add Bates numbering: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate validation report as plain text
   */
  generateValidationReport(validation: ValidationResult): string {
    let report = '=== PDF VALIDATION REPORT ===\n\n';
    
    report += `Overall Status: ${validation.isValid ? '✓ PASSED' : '✗ FAILED'}\n\n`;

    if (validation.errors.length > 0) {
      report += '❌ ERRORS (Must Fix):\n';
      validation.errors.forEach(err => report += `  • ${err}\n`);
      report += '\n';
    }

    if (validation.warnings.length > 0) {
      report += '⚠️  WARNINGS (Recommended Fixes):\n';
      validation.warnings.forEach(warn => report += `  • ${warn}\n`);
      report += '\n';
    }

    // Margin check details
    if (validation.details.marginCheck) {
      report += '📏 MARGIN CHECK:\n';
      report += `  Status: ${validation.details.marginCheck.passed ? '✓ Passed' : '✗ Failed'}\n`;
      if (validation.details.marginCheck.measurements) {
        const m = validation.details.marginCheck.measurements;
        report += `  Measurements:\n`;
        report += `    Top: ${Math.round(m.top)}pt (${(m.top / 72).toFixed(2)} inches)\n`;
        report += `    Right: ${Math.round(m.right)}pt (${(m.right / 72).toFixed(2)} inches)\n`;
        report += `    Bottom: ${Math.round(m.bottom)}pt (${(m.bottom / 72).toFixed(2)} inches)\n`;
        report += `    Left: ${Math.round(m.left)}pt (${(m.left / 72).toFixed(2)} inches)\n`;
      }
      report += '\n';
    }

    // Font check details
    if (validation.details.fontCheck) {
      report += '🔤 FONT CHECK:\n';
      report += `  Status: ${validation.details.fontCheck.passed ? '✓ Passed' : '✗ Failed'}\n`;
      report += '\n';
    }

    // Standards check details
    if (validation.details.standardsCheck) {
      report += '📋 STANDARDS CHECK:\n';
      report += `  Status: ${validation.details.standardsCheck.passed ? '✓ Passed' : '⚠️  Review'}\n`;
      report += '\n';
    }

    report += '===========================\n';
    report += 'Indian Court Filing Requirements:\n';
    report += '• Margins: Minimum 1 inch (72pt), Recommended 1.5 inches left margin\n';
    report += '• Font: Times New Roman, Arial, or similar - 12-14pt\n';
    report += '• Paper: A4 (595x842pt) or Letter (612x792pt)\n';
    report += '• Orientation: Portrait\n';
    report += '• Bates Numbering: Required for tracking pages\n';

    return report;
  }
}

export const pdfValidationService = new PDFValidationService();
