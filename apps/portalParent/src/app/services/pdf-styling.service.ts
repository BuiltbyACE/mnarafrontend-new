import { Injectable } from '@angular/core';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

/**
 * Professional PDF styling service for Mnara ERP
 * Provides reusable, modern design patterns for all parent portal PDFs
 */

export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  success: string;
  warning: string;
  danger: string;
  blue50: string;
  blue100: string;
  blue800: string;
  slate900: string;
  slate700: string;
  slate600: string;
  slate500: string;
  slate400: string;
  slate300: string;
  slate200: string;
  slate100: string;
  white: string;
}

export interface SchoolHeaderInfo {
  name: string;
  postal_address: string;
  email: string;
  phone: string;
  logo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PdfStylingService {
  /**
   * Modern color palette aligned with Tailwind CSS
   */
  readonly colors: ColorPalette = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    blue50: '#eff6ff',
    blue100: '#dbeafe',
    blue800: '#1e40af',
    slate900: '#0f172a',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate300: '#cbd5e1',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    white: '#ffffff',
  };

  /**
   * Build a professional header with logo, school info, and metadata
   */
  buildHeader(schoolInfo: SchoolHeaderInfo, metadata?: { title?: string; subtitle?: string }): any {
    // Logo section with WHITE background
    const logoSection = schoolInfo.logo
      ? {
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  alignment: 'center',
                  stack: [
                    {
                      image: schoolInfo.logo,
                      width: 120,
                      height: 120,
                      fit: [120, 120],
                      alignment: 'center',
                      margin: [0, 0, 0, 0],
                    },
                  ],
                  padding: [20, 20, 20, 20],
                  fillColor: this.colors.white,
                  border: [0.5, 0.5, 0.5, 0.5],
                  borderColor: this.colors.slate300,
                },
              ],
            ],
          },
          margin: [0, 0, 0, 0],
        }
      : null;

    // School info section with BLUE background
    const infoSection = {
      layout: 'noBorders',
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                {
                  text: schoolInfo.name.toUpperCase(),
                  fontSize: 20,
                  bold: true,
                  color: this.colors.white,
                  margin: [0, 0, 0, 4],
                },
                {
                  text: schoolInfo.postal_address,
                  fontSize: 9,
                  color: '#ffffffdd',
                  margin: [0, 0, 0, 2],
                },
                {
                  text: schoolInfo.email,
                  fontSize: 8,
                  color: '#ffffffcc',
                  margin: [0, 0, 0, 1],
                },
                {
                  text: schoolInfo.phone,
                  fontSize: 8,
                  color: '#ffffffcc',
                  margin: [0, 0, 0, 0],
                },
              ],
              alignment: 'center',
              padding: [16, 16, 16, 16],
              fillColor: this.colors.primary,
            },
          ],
        ],
      },
      margin: [0, 0, 0, 0],
    };

    // Combine logo and info sections
    const headerRows: any[] = logoSection ? [[logoSection, infoSection]] : [[infoSection]];

    const headerBar = {
      layout: 'noBorders',
      table: {
        widths: logoSection ? ['auto', '*'] : ['*'],
        body: headerRows,
      },
      margin: [0, 0, 0, 16],
    };

    // Add metadata below header if provided - with semi-transparent blue background and rounded corners effect
    const metadataSection = metadata
      ? {
          stack: [
            {
              columns: [
                {
                  text: metadata.title || 'Document',
                  fontSize: 11,
                  bold: true,
                  color: this.colors.primaryDark,
                  alignment: 'left',
                },
                {
                  text: metadata.subtitle || '',
                  fontSize: 10,
                  color: this.colors.slate600,
                  alignment: 'right',
                },
              ],
            },
          ],
          margin: [0, 0, 0, 12],
          padding: [10, 12, 10, 12],
          fillColor: '#dbeafe',
          border: [1, 1, 1, 1],
          borderColor: '#93c5fd',
          borderRadius: 6,
        }
      : null;

    // Combine header and metadata
    return {
      stack: [headerBar, metadataSection].filter(Boolean),
      margin: [0, 0, 0, 0],
    };
  }

  /**
   * Build a title section with consistent styling
   */
  buildTitle(title: string, subtitle?: string): any {
    const content: any[] = [
      {
        text: title,
        fontSize: 24,
        bold: true,
        color: this.colors.primaryDark,
        alignment: 'center',
        margin: [0, 0, 0, subtitle ? 4 : 0],
      },
    ];

    if (subtitle) {
      content.push({
        text: subtitle,
        fontSize: 11,
        color: this.colors.slate600,
        alignment: 'center',
        margin: [0, 0, 0, 0],
      });
    }

    return {
      stack: content,
      margin: [0, 0, 0, 16],
    };
  }

  /**
   * Build a metadata row with generated date and other info
   */
  buildMetadata(generatedAt: string, extraInfo?: Array<{ label: string; value: string }>): any {
    const formattedDate = new Date(generatedAt).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const cols: any[] = [
      {
        text: `📅 Generated: ${formattedDate}`,
        fontSize: 8,
        color: this.colors.slate600,
        alignment: 'left',
      },
    ];

    if (extraInfo?.length) {
      for (const info of extraInfo) {
        cols.push({
          text: `${info.label}: ${info.value}`,
          fontSize: 8,
          color: this.colors.slate600,
          alignment: 'right',
        });
      }
    }

    return {
      columns: cols,
      margin: [0, 0, 0, 16],
    };
  }

  /**
   * Build a summary card with label and value
   */
  buildSummaryCard(label: string, value: string, valueColor?: string, icon?: string): any {
    return {
      stack: [
        {
          text: icon ? `${icon} ${label}` : label,
          fontSize: 9,
          color: this.colors.slate600,
          margin: [0, 0, 0, 4],
        },
        {
          text: value,
          fontSize: 16,
          bold: true,
          color: valueColor || this.colors.slate900,
        },
      ],
      alignment: 'center',
      margin: [0, 0, 0, 0],
      padding: [12, 8, 12, 8],
      fillColor: this.colors.slate100,
      border: [0.5, 0.5, 0.5, 0.5],
      borderColor: this.colors.slate200,
    };
  }

  /**
   * Build a summary row with multiple cards
   */
  buildSummaryRow(cards: Array<{ label: string; value: string; color?: string; icon?: string }>): any {
    const cardColumns = cards.map((card) => this.buildSummaryCard(card.label, card.value, card.color, card.icon));

    return {
      layout: 'noBorders',
      table: {
        widths: cardColumns.map(() => '*'),
        body: [[...cardColumns]],
      },
      margin: [0, 0, 0, 24],
    };
  }

  /**
   * Build a section header with professional styling
   */
  buildSectionHeader(title: string, icon?: string): any {
    return {
      stack: [
        {
          text: icon ? `${icon} ${title}` : title,
          fontSize: 12,
          bold: true,
          color: this.colors.primaryDark,
          margin: [0, 0, 0, 8],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 2,
              lineColor: this.colors.primary,
            },
          ],
          margin: [0, 0, 0, 12],
        },
      ],
      margin: [0, 16, 0, 0],
    };
  }

  /**
   * Build a data table with professional styling and alternating row colors
   */
  buildTable(
    headers: string[],
    rows: any[][],
    options?: {
      columnWidths?: (string | number)[];
      highlightLastRow?: boolean;
      striped?: boolean;
    },
  ): any {
    const o = options || {};
    const striped = o.striped !== false;

    const tableBody: any[][] = [
      headers.map((h) => ({
        text: h,
        bold: true,
        fontSize: 8,
        color: this.colors.blue800,
        fillColor: this.colors.blue50,
        margin: [6, 6, 6, 6],
        alignment: 'left',
      } as any)),
      ...rows.map((row, idx) => {
        const fillColor = striped && idx % 2 === 1 ? this.colors.slate100 : null;
        return row.map((cell) => ({
          ...cell,
          margin: cell.margin || [6, 4, 6, 4],
          fillColor: cell.fillColor || fillColor,
          fontSize: cell.fontSize || 9,
          color: cell.color || this.colors.slate900,
        } as any));
      }),
    ];

    if (o.highlightLastRow) {
      const lastRow = tableBody[tableBody.length - 1];
      lastRow.forEach((cell) => {
        (cell as any).fillColor = this.colors.blue50;
        (cell as any).bold = true;
        (cell as any).borderTop = { size: 2, color: this.colors.primary };
      });
    }

    return {
      layout: {
        hLineWidth: (i: number) => (i === 0 || i === 1 ? 0.5 : 0.3),
        vLineWidth: () => 0.3,
        hLineColor: () => this.colors.slate200,
        vLineColor: () => this.colors.slate300,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
      table: {
        widths: o.columnWidths || Array(headers.length).fill('*'),
        body: tableBody,
        headerRows: 1,
      },
      margin: [0, 0, 0, 16],
    };
  }

  /**
   * Build a stats box (for KPIs, summary stats)
   */
  buildStatsBox(title: string, stats: Array<{ label: string; value: string; color?: string }>): any {
    return {
      stack: [
        {
          text: title,
          fontSize: 11,
          bold: true,
          color: this.colors.primaryDark,
          margin: [0, 0, 0, 8],
        },
        {
          layout: 'noBorders',
          table: {
            widths: stats.map(() => '*'),
            body: [
              stats.map((stat) => ({
                stack: [
                  {
                    text: stat.label,
                    fontSize: 8,
                    color: this.colors.slate600,
                    margin: [0, 0, 0, 2],
                  },
                  {
                    text: stat.value,
                    fontSize: 12,
                    bold: true,
                    color: stat.color || this.colors.slate900,
                  },
                ],
                alignment: 'center',
                margin: [4, 4, 4, 4],
                padding: [8, 4, 8, 4],
                fillColor: this.colors.slate100,
                border: [0.5, 0.5, 0.5, 0.5],
                borderColor: this.colors.slate200,
              })),
            ],
          },
        },
      ],
      margin: [0, 0, 0, 16],
      padding: [12, 12, 12, 12],
      fillColor: this.colors.white,
      border: [0.5, 0.5, 0.5, 0.5],
      borderColor: this.colors.slate300,
    };
  }

  /**
   * Build a footer with page numbers and copyright
   */
  buildFooter(schoolName: string): (currentPage: number, pageCount: number) => any {
    return (currentPage: number, pageCount: number) => ({
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 0.5,
              lineColor: this.colors.slate300,
            },
          ],
        },
        {
          columns: [
            {
              text: `© ${new Date().getFullYear()} ${schoolName}. All rights reserved.`,
              fontSize: 7,
              color: this.colors.slate500,
              alignment: 'left',
            },
            {
              text: `Page ${currentPage} of ${pageCount}`,
              fontSize: 7,
              color: this.colors.slate500,
              alignment: 'right',
            },
          ],
          margin: [0, 8, 0, 0],
        },
        {
          text: 'Generated by Mnara ERP Parent Portal',
          fontSize: 6,
          color: this.colors.slate400,
          alignment: 'center',
          margin: [0, 4, 0, 0],
        },
      ],
      margin: [40, 0, 40, 20],
    });
  }

  /**
   * Build a document definition with standard settings
   */
  buildDocumentDefinition(
    content: any[],
    options?: {
      title?: string;
      subject?: string;
      keywords?: string[];
      schoolName?: string;
      fileName?: string;
    },
  ): TDocumentDefinitions {
    const o = options || {};

    return {
      info: {
        title: o.title || 'Mnara Document',
        subject: o.subject || 'School Document',
        keywords: o.keywords?.join(', ') || 'school, mnara',
        author: o.schoolName || 'Mnara School',
        creator: 'Mnara ERP Parent Portal',
      },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: content,
      footer: o.schoolName ? this.buildFooter(o.schoolName) : undefined,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: this.colors.slate900,
        lineHeight: 1.4,
      },
      styles: {
        heading1: {
          fontSize: 24,
          bold: true,
          color: this.colors.primaryDark,
          margin: [0, 0, 0, 10],
        },
        heading2: {
          fontSize: 16,
          bold: true,
          color: this.colors.primary,
          margin: [0, 10, 0, 5],
        },
      },
    };
  }
}
