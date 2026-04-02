interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

interface PdfProps {
  appointmentId: string;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  meds: Medication[];
  notes: string;
}

export async function generatePrescriptionPDF({
  appointmentId,
  patientId,
  patientName,
  doctorName,
  meds,
  notes,
}: PdfProps) {
  // Dynamic import keeps initial bundle clean
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const teal = [13, 148, 136] as [number, number, number];

  // Header Banner
  doc.setFillColor(...teal);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MediConnect', 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Digital Prescription', 14, 24);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${doctorName ?? 'Doctor'}`, 210 - 14, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date Valid: ${today}`, 210 - 14, 24, { align: 'right' });

  // Patient Info Card
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(14, 42, 182, 28, 3, 3, 'S');
  
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, 52);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Name: ${patientName ?? patientId}`, 20, 62);
  doc.text(`Reference ID: ${appointmentId.slice(-8)}`, 110, 62);

  // Medications Table Title
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Clinical Medications', 14, 86);

  autoTable(doc, {
    startY: 92,
    head: [['Medication', 'Dosage', 'Frequency', 'Duration (days)', 'Instructions']],
    body: meds.map((m) => [m.name, m.dosage, m.frequency, String(m.durationDays), m.instructions || '—']),
    headStyles: { fillColor: teal, textColor: 255, fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [240, 253, 252] },
    styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1 },
    theme: 'grid'
  });

  // Doctor Notes Section
  const afterTableY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 120;
  
  if (notes.trim()) {
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(14, afterTableY + 12, 182, 36, 3, 3, 'S');

    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Clinical Remarks', 20, afterTableY + 22);
    
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(notes, 170), 20, afterTableY + 30);
  }

  // Final Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('This is a securely generated digital prescription by the MediConnect unified platform.', 105, 285, { align: 'center' });
  doc.text('Not a substitute for emergency medical advice.', 105, 290, { align: 'center' });

  doc.save(`MediConnect-Prescription-${appointmentId.slice(-8)}.pdf`);
}
