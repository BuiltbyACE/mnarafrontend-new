import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ParentApiService } from '../../../services/parent-api.service';
import { PdfStylingService } from '../../../services/pdf-styling.service';
import { TermReportCard, SchoolInfo, PrintableReportCardResponse } from '../../../models/parent.models';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';

(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-report-cards',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  templateUrl: './report-cards.component.html',
  styleUrl: './report-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCardsComponent implements OnInit {
  private readonly api = inject(ParentApiService);
  private readonly pdfStyling = inject(PdfStylingService);

  readonly reports = signal<TermReportCard[]>([]);
  readonly schoolInfo = signal<SchoolInfo | null>(null);
  readonly loading = signal(true);
  readonly pdfLoading = signal<number | null>(null);
  readonly pdfError = signal<string | null>(null);

  ngOnInit() {
    this.api.getSchoolInfo().subscribe({
      next: (info) => this.schoolInfo.set(info),
      error: () => console.error('Failed to load school info')
    });

    this.api.getReportCards().subscribe({
      next: (r) => {
        this.reports.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  downloadPdf(report: TermReportCard) {
    this.pdfLoading.set(report.id);
    this.pdfError.set(null);

    this.api.getPrintableReportCard(report.id).subscribe({
      next: (data) => {
        try {
          const docDef = this.buildPdfDefinition(data);
          pdfMake.createPdf(docDef).download(`Report_Card_${data.report_card.student_name}_${data.report_card.term_name}.pdf`);
          this.pdfLoading.set(null);
        } catch (e) {
          console.error(e);
          this.pdfError.set('Failed to generate PDF. Please try again.');
          this.pdfLoading.set(null);
        }
      },
      error: () => {
        this.pdfError.set('Failed to fetch printable report card details.');
        this.pdfLoading.set(null);
      }
    });
  }

  private buildPdfDefinition(data: PrintableReportCardResponse): TDocumentDefinitions {
    const report = data.report_card;
    const school = data.school_info;
    const C = this.pdfStyling.colors;

    const content: Content[] = [];

    // Header logic: Logo on left, School details centered, Student Image on Right
    // But since PdfStylingService.buildHeader is specific, we can build a custom header here to match the image precisely.
    
    content.push(
      this.pdfStyling.buildHeader(
        {
          name: school.name,
          postal_address: school.postal_address,
          email: school.email,
          phone: school.phone,
          logo: school.logo,
        },
        { title: 'SENIOR SECONDARY END OF TERM REPORT', subtitle: `TERM ${report.term_name}` },
      )
    );

    content.push(
      this.pdfStyling.buildSectionHeader(`END OF TERM ASSESSMENT REPORT - ${report.term_name}`)
    );

    // Student Info Block
    // Wait, let's put the photo if available.
    const infoColumns: any[] = [];
    
    if (report.student_photo) {
      infoColumns.push({
        image: report.student_photo,
        width: 60,
        height: 60,
        fit: [60, 60],
        margin: [0, 0, 15, 0]
      });
    }

    infoColumns.push({
      stack: [
        {
          columns: [
            { text: [{ text: 'ADM. NO: ', bold: true }, report.student_adm_no], width: '*' },
            { text: [{ text: 'Name: ', bold: true }, report.student_name], width: '*' }
          ],
          margin: [0, 0, 0, 4]
        },
        {
          columns: [
            { text: [{ text: 'Date of Birth: ', bold: true }, report.student_dob], width: '*' },
            { text: [{ text: 'Class Teacher: ', bold: true }, 'N/A'], width: '*' }
          ],
          margin: [0, 0, 0, 4]
        },
        {
          text: [{ text: 'Attendance: ', bold: true }, `${report.attendance_present ?? '-'} out of ${report.attendance_out_of ?? '-'}`]
        }
      ]
    });

    content.push({
      columns: infoColumns,
      margin: [0, 0, 0, 16]
    });

    // Subject Performance Table
    const tableRows = report.subject_rows.map(row => {
      const cfaStr = `CFA: ${row.cfa_score ?? '-'} (${row.cfa_grade})`;
      const teeStr = `TEE: ${row.tee_score ?? '-'} (${row.tee_grade})`;
      const avgStr = `AVERAGE: ${row.average_score ?? '-'} (${row.average_grade})`;
      
      return [
        { text: row.subject_name, bold: true },
        { text: row.teacher_name },
        { stack: [ {text: cfaStr}, {text: teeStr}, {text: avgStr, bold: true, margin:[0,4,0,0]} ] },
        { text: row.subject_teacher_remarks || '', fontSize: 8 }
      ];
    });

    content.push(
      this.pdfStyling.buildTable(
        ['SUBJECT', 'TEACHER', 'TEST/100 SCORE PERFORMANCE BAND', 'REMARKS'],
        tableRows,
        { columnWidths: ['auto', 'auto', 'auto', '*'] }
      )
    );

    // Grading Legend
    content.push({
      columns: [
        {
          stack: [
            { text: 'SCORE/ RANGE /GRADING PERCENTAGE', bold: true, fontSize: 8, margin: [0,0,0,4] },
            {
              columns: [
                { stack: [ {text:'A* (90-100%) Exceptional', fontSize: 7}, {text:'A (80-89%) Excellent', fontSize: 7}, {text:'B (70-79%) Good', fontSize: 7}, {text:'C (60-69%) Satisfactory', fontSize: 7}, {text:'D (50-59%) Fair', fontSize: 7} ] },
                { stack: [ {text:'E (40-49%) Sufficient', fontSize: 7}, {text:'F (30-39%) Poor', fontSize: 7}, {text:'G (20-29%) Very poor', fontSize: 7}, {text:'U (0-19%) Ungraded', fontSize: 7} ] }
              ]
            }
          ],
          width: '*'
        },
        {
          stack: [
            { text: 'Assessment Code', bold: true, fontSize: 8, margin: [0,0,0,4] },
            { text: [ {text:'CFA', bold:true}, ' Cumulative Formative Assessment' ], fontSize: 7 },
            { text: [ {text:'TEE', bold:true}, ' Term End Exam' ], fontSize: 7 },
            { text: [ {text:'ABS / X', bold:true}, ' Absent' ], fontSize: 7 },
            { text: [ {text:'CWA', bold:true}, ' Complete Weekly Assignment /Projects' ], fontSize: 7 }
          ],
          width: 'auto'
        },
        {
          stack: [
            { text: 'CWA GRADES/5', bold: true, fontSize: 8, margin: [0,0,0,4] },
            { text: '0 U-E  |  1 D  |  2 C  |  3 B  |  4 A  |  5 A*', fontSize: 7 }
          ],
          width: 'auto'
        }
      ],
      margin: [0, 0, 0, 16]
    });

    // Class Teacher Comment
    content.push(this.pdfStyling.buildSectionHeader('Class Teacher’s Comment'));
    content.push({
      text: report.class_teacher_remarks || 'No remarks available.',
      fontSize: 10,
      margin: [0, 0, 0, 16]
    });

    // Co-curricular Activities
    content.push(this.pdfStyling.buildSectionHeader('Co-curricular Activities'));
    content.push(
      this.pdfStyling.buildTable(
        ['Activity Type', 'Details'],
        [
          ['Sports and Games', report.co_curricular?.sports_and_games || 'N/A'],
          ['Responsibilities Held', report.co_curricular?.responsibilities_held || 'N/A'],
          ['Achievements', report.co_curricular?.achievements || 'N/A'],
          ['Life Skill Club', report.co_curricular?.life_skill_club || 'N/A'],
        ],
        { columnWidths: [150, '*'] }
      )
    );

    // Work Pattern & Social Conduct
    content.push(this.pdfStyling.buildSectionHeader('Work Pattern & Social Conduct'));
    content.push({ text: '1= Excellent ; 2=Good ; 3=Average ; 4=Needs attention', fontSize: 8, italics: true, margin: [0, 0, 0, 8] });
    
    const sc = report.social_conduct;
    content.push({
      columns: [
        {
          stack: [
            { text: `Completes assignments: ${sc?.completes_assignments || '-'}`, fontSize: 9 },
            { text: `Makes good use of time: ${sc?.makes_good_use_of_time || '-'}`, fontSize: 9 },
            { text: `Does work keenly: ${sc?.does_work_keenly || '-'}`, fontSize: 9 }
          ]
        },
        {
          stack: [
            { text: `Follows directions: ${sc?.follows_directions || '-'}`, fontSize: 9 },
            { text: `Pays attention: ${sc?.pays_attention || '-'}`, fontSize: 9 },
            { text: `Shows courtesy: ${sc?.shows_courtesy || '-'}`, fontSize: 9 }
          ]
        },
        {
          stack: [
            { text: `Emotional intelligence: ${sc?.emotional_intelligence || '-'}`, fontSize: 9 },
            { text: `Grooming: ${sc?.grooming || '-'}`, fontSize: 9 }
          ]
        }
      ],
      margin: [0, 0, 0, 16]
    });

    // Footer Dates
    content.push({
      columns: [
        { text: [{ text: 'OPENING: ', bold: true }, report.next_term_opening_date || '-'] },
        { text: [{ text: 'MIDTERM: ', bold: true }, report.next_term_midterm_dates || '-'] },
        { text: [{ text: 'CLOSING: ', bold: true }, report.next_term_closing_date || '-'] }
      ],
      margin: [0, 16, 0, 32],
      alignment: 'center'
    });

    content.push({
      text: 'Principal’s signature: _____________________________',
      alignment: 'right',
      bold: true,
      italics: true
    });

    return this.pdfStyling.buildDocumentDefinition(content, {
      title: `Report Card - ${report.student_name} - ${report.term_name}`,
      subject: 'Report Card',
      schoolName: school.name,
      fileName: `Report_Card_${report.student_name}.pdf`
    });
  }
}
