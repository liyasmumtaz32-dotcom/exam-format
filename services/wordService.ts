import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, Header, Footer, PageNumber, PageOrientation } from "docx";
import { ExamData, QuestionType } from "../types";
import saveAs from "file-saver";

// Constants for layout
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE_TEXT = 24; // 12pt (docx uses half-points)
const FONT_SIZE_HEADER = 28; // 14pt

// Simple conversion helpers to replace missing Convert export
// 1 mm = approx 56.7 twips
// 1 cm = approx 567 twips
const mmToTwip = (mm: number) => Math.round(mm * 56.6929);
const cmToTwip = (cm: number) => Math.round(cm * 566.929);

export const generateExamDocument = async (examData: ExamData) => {
  const { header, questions } = examData;

  // --- 1. KOP SURAT (Header Table) ---
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.DOUBLE, size: 6, space: 1, color: "000000" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                text: header.schoolName.toUpperCase(),
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
                style: "HeaderStyle"
              }),
              new Paragraph({
                text: `${header.examType.toUpperCase()}`,
                alignment: AlignmentType.CENTER,
                style: "HeaderSubStyle"
              }),
              new Paragraph({
                text: `TAHUN PELAJARAN ${header.academicYear}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                style: "HeaderSubStyle"
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // --- 2. INFO BAR (Mata Pelajaran, Kelas, etc) ---
  // Using a nested table logic or detailed rows for alignment
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [createSafeText("Mata Pelajaran")], width: { size: 20, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [createSafeText(`: ${header.subject}`)], width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [createSafeText("Hari/Tanggal")], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [createSafeText(": ............................")], width: { size: 25, type: WidthType.PERCENTAGE } }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [createSafeText("Kelas/Semester")] }),
          new TableCell({ children: [createSafeText(`: ${header.grade}`)] }),
          new TableCell({ children: [createSafeText("Waktu")] }),
          new TableCell({ children: [createSafeText(`: ${header.timeAllocated}`)] }),
        ],
      }),
    ],
  });

  // --- 3. QUESTION LIST GENERATION ---
  // We use a MAIN TABLE for the questions to ensure the Numbering column never overlaps with Text
  
  const questionRows: TableRow[] = [];

  const mcqs = questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);
  const essays = questions.filter(q => q.type === QuestionType.ESSAY);

  // --- GENERATING THE TABLE CONTENT ---
  
  const createQuestionRow = (q: any, index: number) => {
    const questionTextParams = [
        new TextRun({ text: q.text, font: FONT_FAMILY, size: FONT_SIZE_TEXT })
    ];

    const cellChildren: Paragraph[] = [
        new Paragraph({
            children: questionTextParams,
            alignment: AlignmentType.BOTH, // Justified
            spacing: { after: 100 }
        })
    ];

    // Options
    if (q.type === QuestionType.MULTIPLE_CHOICE) {
        q.options.forEach((opt: any) => {
            cellChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `${opt.label}. `, bold: false, font: FONT_FAMILY, size: FONT_SIZE_TEXT }),
                        new TextRun({ text: opt.text, font: FONT_FAMILY, size: FONT_SIZE_TEXT })
                    ],
                    indent: { left: 400 }, // Slight indentation for options
                    spacing: { after: 60 } // Tight spacing between options
                })
            );
        });
    } else {
        // Essay Spacer
        cellChildren.push(new Paragraph({ text: "", spacing: { after: 1000 } })); // Space for writing answer
    }

    return new TableRow({
        children: [
            // Column 1: Number
            new TableCell({
                width: { size: 700, type: WidthType.DXA }, // Fixed width approx 1.2cm
                verticalAlign: "top",
                children: [
                    new Paragraph({
                        text: `${index + 1}.`,
                        alignment: AlignmentType.RIGHT,
                        style: "NormalText"
                    })
                ],
                margins: { right: 100 }
            }),
            // Column 2: Content
            new TableCell({
                width: { size: 100, type: WidthType.PERCENTAGE },
                children: cellChildren
            })
        ]
    });
  };

  // Build rows
  // Note: we are not pushing to questionRows anymore in this structure logic, we build separate tables.
  
  const mainSectionChildren: any[] = [
      headerTable,
      new Paragraph({ text: "", spacing: { after: 200 } }),
      infoTable,
      new Paragraph({ text: "", spacing: { after: 200 } }),
      new Paragraph({ 
         text: "PETUNJUK UMUM:",
         style: "BoldText"
      }),
      new Paragraph({ text: "1. Tulislah nama dan nomor peserta pada lembar jawaban yang tersedia.", style: "NormalText" }),
      new Paragraph({ text: "2. Kerjakan soal yang dianggap mudah terlebih dahulu.", style: "NormalText" }),
      new Paragraph({ text: "", spacing: { after: 200 } }),
  ];

  if (mcqs.length > 0) {
      mainSectionChildren.push(
          new Paragraph({
            text: "A. Pilihlah salah satu jawaban yang paling tepat!",
            spacing: { before: 200, after: 100 },
            style: "BoldText"
          })
      );
      
      mainSectionChildren.push(
          new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
              },
              rows: mcqs.map((q, i) => createQuestionRow(q, i))
          })
      );
  }

  if (essays.length > 0) {
      mainSectionChildren.push(
          new Paragraph({
            text: "B. Jawablah pertanyaan-pertanyaan berikut dengan jelas!",
            spacing: { before: 400, after: 100 },
            style: "BoldText"
          })
      );
       mainSectionChildren.push(
          new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
              },
              rows: essays.map((q, i) => createQuestionRow(q, i))
          })
      );
  }

  // --- 4. CONSTRUCT DOCUMENT ---
  const doc = new Document({
    styles: {
        paragraphStyles: [
            {
                id: "NormalText",
                name: "Normal Text",
                run: { font: FONT_FAMILY, size: FONT_SIZE_TEXT },
                paragraph: { spacing: { line: 276 } } // 1.15 spacing
            },
            {
                id: "BoldText",
                name: "Bold Text",
                run: { font: FONT_FAMILY, size: FONT_SIZE_TEXT, bold: true },
            },
            {
                id: "HeaderStyle",
                name: "Header Style",
                run: { font: FONT_FAMILY, size: FONT_SIZE_HEADER, bold: true },
            },
             {
                id: "HeaderSubStyle",
                name: "Header Sub Style",
                run: { font: FONT_FAMILY, size: FONT_SIZE_TEXT, bold: true },
            }
        ]
    },
    sections: [
      {
        properties: {
            page: {
                size: {
                    orientation: PageOrientation.PORTRAIT,
                    width: mmToTwip(210), // A4
                    height: mmToTwip(297), // A4
                },
                margin: {
                    top: cmToTwip(2.54),
                    bottom: cmToTwip(2.54),
                    left: cmToTwip(2.54),
                    right: cmToTwip(2.54),
                }
            }
        },
        headers: {
            default: new Header({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Dokumen Negara - Sangat Rahasia",
                                italics: true,
                                font: FONT_FAMILY,
                                size: 16,
                                color: "666666"
                            })
                        ],
                        alignment: AlignmentType.RIGHT
                    })
                ]
            })
        },
        footers: {
            default: new Footer({
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES],
                                font: FONT_FAMILY,
                            }),
                        ],
                    }),
                ],
            }),
        },
        children: mainSectionChildren,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  const filename = `Soal_${header.subject.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
  saveAs(buffer, filename);
};

// Helper for Info Table Text
const createSafeText = (txt: string) => {
    return new Paragraph({
        children: [new TextRun({ text: txt, font: FONT_FAMILY, size: FONT_SIZE_TEXT })]
    });
};